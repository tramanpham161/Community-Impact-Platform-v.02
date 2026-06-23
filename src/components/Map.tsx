"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import lsoaGeoJson from "@data/cardiff-lsoa.json";
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

const LSOA_DATA = lsoaGeoJson as unknown as GeoJSON.FeatureCollection;

interface Props {
  orgs: Organisation[];
  insights: CommunityInsight[];
  orgStages: Record<string, string>;
  selectedOrgId: string | null;
  selectedInsightId: string | null;
  selectedLSOACode: string | null;
  onSelectOrg: (id: string | null) => void;
  onSelectInsight: (id: string | null) => void;
  onSelectLSOA: (code: string | null) => void;
  detailPanelWidth: number;
  wimdDomain: WimdDomain;
  children?: ReactNode;
}

function getEnrichedData() {
  return {
    ...LSOA_DATA,
    features: LSOA_DATA.features.map((f) => {
      const code = (f.properties?.LSOA21CD as string | undefined) ?? "";
      const scores = wimdScoresFor(code);
      if (!scores) return f;
      return {
        ...f,
        properties: {
          ...f.properties,
          q_overall: scores.overall.quintile,
          q_income: scores.income.quintile,
          q_employment: scores.employment.quintile,
          q_health: scores.health.quintile,
          q_education: scores.education.quintile,
          q_accessToServices: scores.accessToServices.quintile,
          q_housing: scores.housing.quintile,
          q_communitySafety: scores.communitySafety.quintile,
          q_physicalEnvironment: scores.physicalEnvironment.quintile,
        },
      };
    }),
  };
}

function paintForDomain(domain: WimdDomain): maplibregl.DataDrivenPropertyValueSpecification<string> {
  const targetDomain = domain === ("deprivation" as unknown as WimdDomain) ? "overall" : domain;
  return [
    "match",
    ["get", `q_${targetDomain}`],
    1, WIMD_RAMP[1],
    2, WIMD_RAMP[2],
    3, WIMD_RAMP[3],
    4, WIMD_RAMP[4],
    5, WIMD_RAMP[5],
    "#e2e8f0",
  ] as maplibregl.DataDrivenPropertyValueSpecification<string>;
}

const CARDIFF_CENTRE: [number, number] = [-3.18, 51.483];

export function MapView({
  orgs,
  insights,
  orgStages,
  selectedOrgId,
  selectedInsightId,
  selectedLSOACode,
  onSelectOrg,
  onSelectInsight,
  onSelectLSOA,
  detailPanelWidth,
  wimdDomain,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const enrichedData = useMemo(() => getEnrichedData(), []);
  
  // Track hovered/clicked area locally for the instant info panel popover
  const [hoveredArea, setHoveredArea] = useState<{ name: string; code: string; rank: number | string } | null>(null);

  const callbacks = useRef({ onSelectOrg, onSelectInsight, onSelectLSOA });
  useEffect(() => {
    callbacks.current = { onSelectOrg, onSelectInsight, onSelectLSOA };
  });

  const targetDomainLabel = useMemo(() => {
    const targetKey = wimdDomain === ("deprivation" as unknown as WimdDomain) ? "overall" : wimdDomain;
    return WIMD_DOMAIN_LABELS[targetKey] || "Deprivation";
  }, [wimdDomain]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap &copy; CARTO"
          }
        },
        layers: [{ id: "bg", type: "raster", source: "carto" }]
      },
      center: CARDIFF_CENTRE,
      zoom: 10.7,
    });

    map.once("load", () => {
      map.addSource("cardiff-lsoa", { type: "geojson", data: enrichedData });
      
      map.addLayer({
        id: "wimd-fill",
        type: "fill",
        source: "cardiff-lsoa",
        paint: { "fill-color": paintForDomain(wimdDomain), "fill-opacity": 0.6 },
      });
      
      map.addLayer({
        id: "wimd-outline",
        type: "line",
        source: "cardiff-lsoa",
        paint: { "line-color": "#ffffff", "line-width": 0.5, "line-opacity": 0.5 },
      });

      map.addLayer({
        id: "wimd-selected-outline",
        type: "line",
        source: "cardiff-lsoa",
        filter: ["==", ["get", "LSOA21CD"], selectedLSOACode ?? "__none__"],
        paint: { "line-color": "#0f172a", "line-width": 2.5 },
      });

      // --- Interactive Layer Event Hooks ---
      map.on("click", "wimd-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const feat = e.features[0];
          const code = feat.properties?.LSOA21CD || null;
          callbacks.current.onSelectLSOA(code);
        }
      });

      map.on("mousemove", "wimd-fill", (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = "pointer";
          const props = e.features[0].properties;
          const targetKey = wimdDomain === ("deprivation" as unknown as WimdDomain) ? "overall" : wimdDomain;
          
          setHoveredArea({
            name: props?.LSOA21NM || "Unknown Area",
            code: props?.LSOA21CD || "",
            rank: props?.[`q_${targetKey}`] || "N/A",
          });
        }
      });

      map.on("mouseleave", "wimd-fill", () => {
        map.getCanvas().style.cursor = "";
        setHoveredArea(null);
      });
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [enrichedData]);

  // Sync color adjustments when filters change
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded() && map.getLayer("wimd-fill")) {
      map.setPaintProperty("wimd-fill", "fill-color", paintForDomain(wimdDomain));
    }
  }, [wimdDomain]);

  // Sync border outlines on select
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded() && map.getLayer("wimd-selected-outline")) {
      map.setFilter("wimd-selected-outline", ["==", ["get", "LSOA21CD"], selectedLSOACode ?? "__none__"]);
    }
  }, [selectedLSOACode]);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      {/* Target canvas container rendering base map layers */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* --- FLOATING MAP LEGEND BOX --- */}
      <div className="absolute bottom-4 left-4 z-10 w-64 rounded-lg border border-slate-200/80 bg-white/95 p-3 shadow-md backdrop-blur-sm transition-all">
        <h4 className="text-xs font-semibold text-slate-800 mb-1.5 uppercase tracking-wider">
          {targetDomainLabel} Index
        </h4>
        <p className="text-[10px] text-slate-500 mb-2.5">Divided by Welsh Index of Multiple Deprivation (WIMD) Quintiles</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: WIMD_RAMP[1] }} />
            <span>1 - Most Deprived 10%</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: WIMD_RAMP[2] }} />
            <span>2 - Next Most Deprived</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: WIMD_RAMP[3] }} />
            <span>3 - Middle Deprivation</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: WIMD_RAMP[4] }} />
            <span>4 - Less Deprived</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: WIMD_RAMP[5] }} />
            <span>5 - Least Deprived 10%</span>
          </div>
        </div>
      </div>

      {/* --- FLOATING AREA CONTEXT TOOLTIP --- */}
      {hoveredArea && (
        <div className="absolute top-4 left-4 z-10 max-w-sm rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-sm animate-in fade-in duration-150">
          <p className="text-[10px] font-medium uppercase tracking-tight text-indigo-600">{hoveredArea.code}</p>
          <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">{hoveredArea.name}</h3>
          <div className="mt-1.5 flex items-center gap-2 border-t border-slate-100 pt-1.5">
            <span className="text-xs text-slate-500">Quintile score:</span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: WIMD_RAMP[hoveredArea.rank as number] || '#94a3b8' }}>
              {hoveredArea.rank}
            </span>
          </div>
        </div>
      )}

      {/* Renders overlay UI slots like customized layout controls passed via parents */}
      {children}
    </div>
  );
}
