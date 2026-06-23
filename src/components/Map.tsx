"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import lsoaGeoJson from "@/data/cardiff-lsoa.json"; 
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

const LSOA_DATA = lsoaGeoJson as any;

const ENRICHED_LSOA_DATA = {
  ...LSOA_DATA,
  features: (LSOA_DATA?.features || []).map((f: any) => {
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

type Props = {
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
};

type PopupTarget =
  | { kind: "org"; id: string }
  | { kind: "insight"; id: string }
  | null;

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
  const orgMarkersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  const insightMarkersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  const clusterMarkersRef = useRef<globalThis.Map<string, maplibregl.Marker>>(new globalThis.Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupTargetRef = useRef<PopupTarget>(null);

  const orgsById = useMemo(() => {
    const m = new globalThis.Map<string, Organisation>();
    for (const o of orgs) m.set(o.id, o);
    return m;
  }, [orgs]);
  const insightsById = useMemo(() => {
    const m = new globalThis.Map<string, CommunityInsight>();
    for (const i of insights) m.set(i.id, i);
    return m;
  }, [insights]);

  const onSelectOrgRef = useRef(onSelectOrg);
  const onSelectInsightRef = useRef(onSelectInsight);
  const onSelectLSOARef = useRef(onSelectLSOA);
  const orgsByIdRef = useRef(orgsById);
  const insightsByIdRef = useRef(insightsById);
  const orgStagesRef = useRef(orgStages);
  const selectedLSOACodeRef = useRef(selectedLSOACode);
  
  useEffect(() => { onSelectOrgRef.current = onSelectOrg; }, [onSelectOrg]);
  useEffect(() => { onSelectInsightRef.current = onSelectInsight; }, [onSelectInsight]);
  useEffect(() => { onSelectLSOARef.current = onSelectLSOA; }, [onSelectLSOA]);
  useEffect(() => { orgsByIdRef.current = orgsById; }, [orgsById]);
  useEffect(() => { insightsByIdRef.current = insightsById; }, [insightsById]);
  useEffect(() => { orgStagesRef.current = orgStages; }, [orgStages]);
  useEffect(() => { selectedLSOACodeRef.current = selectedLSOACode; }, [selectedLSOACode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("wimd-fill")) return;
    map.setPaintProperty("wimd-fill", "fill-color", paintForDomain(wimdDomain));
  }, [wimdDomain]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("maplibre-injected-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-injected-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "osm-basemap": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors"
          }
        },
        layers: [
          {
            id: "bg",
            type: "raster",
            source: "osm-basemap"
          }
        ]
      },
      center: CARDIFF_CENTRE,
      zoom: 10.7,
      minZoom: 9.5,
      maxZoom: 16,
      attributionControl: { compact: true }
    });
    
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const addWimdLayers = () => {
      if (!map.getStyle() || map.getSource("cardiff-lsoa")) return;
      map.addSource("cardiff-lsoa", { type: "geojson", data: ENRICHED_LSOA_DATA as any });
      map.addLayer({
        id: "wimd-fill",
        type: "fill",
        source: "cardiff-lsoa",
        paint: {
          "fill-color": paintForDomain(wimdDomain),
          "fill-opacity": 0.45
        }
      });
      map.addLayer({
        id: "wimd-outline",
        type: "line",
        source: "cardiff-lsoa",
        paint: { "line-color": "#ffffff", "line-width": 0.5, "line-opacity": 0.7 }
      });
      map.addLayer({
        id: "wimd-selected-outline",
        type: "line",
        source: "cardiff-lsoa",
        filter: ["==", ["get", "LSOA21CD"], "__none__"],
        paint: {
          "line-color": "#0f172a",
          "line-width": 2.5,
          "line-opacity": 0.9
        }
      });
    };
    
    map.on("load", addWimdLayers);
    map.on("styledata", addWimdLayers);

    const onLsoaClick = (e: maplibregl.MapLayerMouseEvent) => {
      const f = e.features?.[0];
      if (!f) return;
      const code = f.properties?.LSOA21CD as string | undefined;
      if (!code) return;
      const current = selectedLSOACodeRef.current;
      onSelectLSOARef.current(current === code ? null : code);
    };
    const onLsoaEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const onLsoaLeave = () => { map.getCanvas().style.cursor = ""; };
    map.on("click", "wimd-fill", onLsoaClick);
    map.on("mouseenter", "wimd-fill", onLsoaEnter);
    map.on("mouseleave", "wimd-fill", onLsoaLeave);

    mapRef.current = map;

    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver((entries) => {
      if (!entries[0] || !containerRef.current) return;
      const { width, height } = entries[0].contentRect;
      if (width === lastW && height === lastH) return;
      lastW = width; lastH = height;
      map.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      popupTargetRef.current = null;
      for (const m of clusterMarkersRef.current.values()) m.remove();
      clusterMarkersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);
