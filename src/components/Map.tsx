"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import lsoaGeoJson from "@/data/cardiff-lsoa.json"; 
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";
import * as H from "./MapHelpers";

const LSOA_DATA = lsoaGeoJson as any;
const CARDIFF_CENTRE: [number, number] = [-3.18, 51.483];

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
    "match", ["get", `q_${targetDomain}`],
    1, WIMD_RAMP[1],
    2, WIMD_RAMP[2],
    3, WIMD_RAMP[3],
    4, WIMD_RAMP[4],
    5, WIMD_RAMP[5],
    "#e2e8f0",
  ] as maplibregl.DataDrivenPropertyValueSpecification<string>;
}

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

type PopupTarget = { kind: "org"; id: string } | { kind: "insight"; id: string } | null;

export function MapView({
  orgs, insights, orgStages, selectedOrgId, selectedInsightId, selectedLSOACode,
  onSelectOrg, onSelectInsight, onSelectLSOA, detailPanelWidth, wimdDomain, children
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
        layers: [{ id: "bg", type: "raster", source: "osm-basemap" }]
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
        paint: { "fill-color": paintForDomain(wimdDomain), "fill-opacity": 0.45 }
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
        paint: { "line-color": "#0f172a", "line-width": 2.5, "line-opacity": 0.9 }
      });
    };
    
    map.on("load", addWimdLayers);
    map.on("styledata", addWimdLayers);

    map.on("click", "wimd-fill", (e) => {
      const code = e.features?.[0]?.properties?.LSOA21CD;
      if (!code) return;
      onSelectLSOARef.current(selectedLSOACodeRef.current === code ? null : code);
    });
    map.on("mouseenter", "wimd-fill", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "wimd-fill", () => { map.getCanvas().style.cursor = ""; });

    mapRef.current = map;

    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      if (width === lastW && height === lastH) return;
      lastW = width; lastH = height;
      map.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (popupRef.current) popupRef.current.remove();
      for (const m of clusterMarkersRef.current.values()) m.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const closePopup = () => {
    if (popupRef.current) popupRef.current.remove();
    popupRef.current = null;
    popupTargetRef.current = null;
  };

  const openOrgPopup = (org: Organisation) => {
    const map = mapRef.current;
    if (!map) return;
    closePopup();

    const stages = orgStagesRef.current.get(org.id) ?? [];
    const stageLine = stages.length ? stages.join(" \u00B7 ") : "No J-stage mappings recorded";
    const el = document.createElement("div");
    el.className = "p-3 max-w-[260px] font-sans";
    el.innerHTML = "<div class=\"flex items-center gap-2\"><span aria-hidden style=\"display:inline-block;width:10px;height:10px;border-radius:9999px;background:" + SECTOR_COLOURS[org.sector] + ";box-shadow:0 0 0 2px #fff;\"></span><span class=\"text-[10px] text-slate-500\">" + H.escapeHtml(org.sector) + "</span></div><h3 class=\"text-sm font-semibold\">" + H.escapeHtml(org.name) + "</h3><div>" + H.escapeHtml(stageLine) + "</div><button data-popup-cta class=\"mt-2 bg-slate-900 text-white p-1 text-xs rounded\">View Details</button>";

    el.querySelector("[data-popup-cta]")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onSelectInsightRef.current(null);
      onSelectOrgRef.current(org.id);
    });

    popupRef.current = new maplibregl.Popup({ offset: 14 }).setLngLat(org.location).setDOMContent(el).addTo(map);
    popupTargetRef.current = { kind: "org", id: org.id };
  };

  const openInsightPopup = (insight: CommunityInsight) => {
    const map = mapRef.current;
    if (!map || !insight.location) return;
    closePopup();

    const el = document.createElement("div");
    el.className = "p-3 max-w-[260px] font-sans";
    el.innerHTML = "<h3 class=\"text-xs text-amber-800\">" + H.escapeHtml(insight.theme) + "</h3><p class=\"text-xs\">" + H.escapeHtml(H.truncate(insight.text, 120)) + "</p><button data-popup-cta class=\"mt-2 bg-amber-600 text-white p-1 text-xs rounded\">Read Insight</button>";

    el.querySelector("[data-popup-cta]")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onSelectOrgRef.current(null);
      onSelectInsightRef.current(insight.id);
    });

    popupRef.current = new maplibregl.Popup({ offset: 12 }).setLngLat(insight.location).setDOMContent(el).addTo(map);
    popupTargetRef.current = { kind: "insight", id: insight.id };
  };

  const recluster = () => {
    const map = mapRef.current;
    if (!map || map.getZoom() >= 12) {
      for (const m of orgMarkersRef.current.values()) m.getElement().style.display = "";
      for (const b of clusterMarkersRef.current.values()) b.remove();
      clusterMarkersRef.current.clear();
      return;
    }
    // Simple spatial grid grouping to prevent rendering overflows
    const cells = new globalThis.Map<string, string[]>();
    for (const [id, marker] of orgMarkersRef.current) {
      const p = map.project(marker.getLngLat());
      const key = Math.floor(p.x / 50) + "," + Math.floor(p.y / 50);
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key)!.push(id);
    }
    // Remove stale groups, place cluster pins
    for (const [key, ids] of cells) {
      if (ids.length < 2) continue;
      const el = H.makeClusterElement(ids.length);
      const firstMarker = orgMarkersRef.current.get(ids[0]);
      if (firstMarker) {
        const marker = new maplibregl.Marker({ element: el }).setLngLat(firstMarker.getLngLat()).addTo(map);
        clusterMarkersRef.current.set(key, marker);
      }
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const org of orgs) {
      if (orgMarkersRef.current.has(org.id)) {
        H.updateOrgMarker(orgMarkersRef.current.get(org.id)!.getElement(), org, selectedOrgId, popupTargetRef.current);
      } else {
        const el = H.makeOrgMarker(org);
        el.addEventListener("click", (e) => { e.stopPropagation(); openOrgPopup(org); });
        const m = new maplibregl.Marker({ element: el }).setLngLat(org.location).addTo(map);
        orgMarkersRef.current.set(org.id, m);
      }
    }
    recluster();
  }, [orgs, selectedOrgId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => recluster();
    map.on("zoomend", run);
    map.on("moveend", run);
    return () => { map.off("zoomend", run); map.off("moveend", run); };
  }, []);

  return (
    <div className="relative h-[560px] w-full rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <MapLegend wimdDomain={wimdDomain} />
      {children}
    </div>
  );
}

function MapLegend({ wimdDomain }: { wimdDomain: WimdDomain }) {
  const ramp: Array<{ q: 1 | 2 | 3 | 4 | 5; label: string }> = [
    { q: 1, label: "Most deprived 20%" }, { q: 2, label: "Quintile 2" },
    { q: 3, label: "Quintile 3" }, { q: 4, label: "Quintile 4" }, { q: 5, label: "Least deprived 20%" }
  ];
  return (
    <div className="absolute bottom-3 left-3 z-10 max-w-[230px] rounded-md bg-white/95 px-3 py-2 text-xs shadow ring-1 ring-slate-200 backdrop-blur">
      <div className="font-medium text-slate-700">WIMD 2025 Map Layers</div>
      <div className="mt-1 space-y-1">
        {ramp.map(({ q, label }) => (
          <div key={q} className="flex items-center gap-2">
            <span className="h-3 w-4 rounded-sm" style={{ background: WIMD_RAMP[q] }} />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
