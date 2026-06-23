"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import lsoaGeoJson from "@data/cardiff-lsoa.json";
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

const LSOA_DATA = lsoaGeoJson as unknown as GeoJSON.FeatureCollection;

type PopupTarget =
  | { kind: "org"; id: string }
  | { kind: "insight"; id: string }
  | null;

const ENRICHED_LSOA_DATA: GeoJSON.FeatureCollection = {
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

function paintForDomain(domain: WimdDomain) {
  return [
    "match",
    ["get", `q_${domain}`],
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
}: {
  orgs: Organisation[];
  insights: CommunityInsight[];
  orgStages: Map<string, string[]>;
  selectedOrgId: string | null;
  selectedInsightId: string | null;
  selectedLSOACode: string | null;
  onSelectOrg: (id: string | null) => void;
  onSelectInsight: (id: string | null) => void;
  onSelectLSOA: (code: string | null) => void;
  detailPanelWidth: number;
  wimdDomain: WimdDomain;
  children?: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const orgMarkersRef = useRef(new Map<string, maplibregl.Marker>());
  const insightMarkersRef = useRef(new Map<string, maplibregl.Marker>());
  const clusterMarkersRef = useRef(new Map<string, maplibregl.Marker>());

  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupTargetRef = useRef<PopupTarget>(null);

  const selectedLSOACodeRef = useRef(selectedLSOACode);
  const wimdDomainRef = useRef(wimdDomain);

  useEffect(() => { selectedLSOACodeRef.current = selectedLSOACode; }, [selectedLSOACode]);
  useEffect(() => { wimdDomainRef.current = wimdDomain; }, [wimdDomain]);

  const closePopup = () => {
    popupRef.current?.remove();
    popupRef.current = null;
    popupTargetRef.current = null;
  };

  // ── INIT MAP ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          { id: "base", type: "raster", source: "carto" },
        ],
      },
      center: CARDIFF_CENTRE,
      zoom: 10.7,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (map.getSource("lsoa")) return;

      map.addSource("lsoa", {
        type: "geojson",
        data: ENRICHED_LSOA_DATA,
      });

      map.addLayer({
        id: "wimd-fill",
        type: "fill",
        source: "lsoa",
        paint: {
          "fill-color": paintForDomain(wimdDomainRef.current),
          "fill-opacity": 0.55,
        },
      });

      map.addLayer({
        id: "wimd-outline",
        type: "line",
        source: "lsoa",
        paint: {
          "line-color": "#fff",
          "line-width": 0.6,
        },
      });

      map.addLayer({
        id: "wimd-selected",
        type: "line",
        source: "lsoa",
        filter: ["==", "LSOA21CD", ""],
        paint: {
          "line-color": "#0f172a",
          "line-width": 2,
        },
      });
    });

    return () => {
      closePopup();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── DOMAIN UPDATE ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer("wimd-fill")) {
      map.setPaintProperty("wimd-fill", "fill-color", paintForDomain(wimdDomain));
    }
  }, [wimdDomain]);

  // ── LSOA SELECTION ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("wimd-selected")) return;

    map.setFilter("wimd-selected", [
      "==",
      "LSOA21CD",
      selectedLSOACode ?? "",
    ]);
  }, [selectedLSOACode]);

  // ── CLEAR ON BACKGROUND CLICK ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = () => {
      closePopup();
      onSelectOrg(null);
      onSelectInsight(null);
    };

    map.on("click", handler);
    return () => map.off("click", handler);
  }, []);

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-lg border">
      <div ref={containerRef} className="absolute inset-0" />
      {children}
    </div>
  );
}
