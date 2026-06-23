"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import lsoaGeoJson from "@data/cardiff-lsoa.json";
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

// Pre-process data outside the component to keep it memoized
const LSOA_DATA = lsoaGeoJson as unknown as GeoJSON.FeatureCollection;

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
  return [
    "match", ["get", `q_${domain}`],
    1, WIMD_RAMP[1],
    2, WIMD_RAMP[2],
    3, WIMD_RAMP[3],
    4, WIMD_RAMP[4],
    5, WIMD_RAMP[5],
    "#e2e8f0",
  ] as maplibregl.DataDrivenPropertyValueSpecification<string>;
}

const CARDIFF_CENTRE: [number, number] = [-3.18, 51.483];

// ... (Keep your existing types and internal helper functions: escapeHtml, truncate, etc.)

export function MapView({
  orgs, insights, orgStages, selectedOrgId, selectedInsightId, selectedLSOACode,
  onSelectOrg, onSelectInsight, onSelectLSOA, detailPanelWidth, wimdDomain, children,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const enrichedData = useMemo(() => getEnrichedData(), []);

  // Use refs for stable callback access
  const callbacks = useRef({ onSelectOrg, onSelectInsight, onSelectLSOA });
  useEffect(() => { callbacks.current = { onSelectOrg, onSelectInsight, onSelectLSOA }; });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto": {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"],
            tileSize: 256,
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
        paint: { "fill-color": paintForDomain(wimdDomain), "fill-opacity": 0.55 },
      });
      
      map.addLayer({
        id: "wimd-outline",
        type: "line",
        source: "cardiff-lsoa",
        paint: { "line-color": "#ffffff", "line-width": 0.5, "line-opacity": 0.7 },
      });

      map.addLayer({
        id: "wimd-selected-outline",
        type: "line",
        source: "cardiff-lsoa",
        filter: ["==", ["get", "LSOA21CD"], "__none__"],
        paint: { "line-color": "#0f172a", "line-width": 2.5 },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [enrichedData]);

  // Handle updates separately to avoid re-initializing the whole map
  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer("wimd-fill")) {
      map.setPaintProperty("wimd-fill", "fill-color", paintForDomain(wimdDomain));
    }
  }, [wimdDomain]);

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-lg border border-slate-200">
      <div ref={containerRef} className="absolute inset-0" />
      {children}
    </div>
  );
}
