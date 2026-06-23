"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
// Adjusted map alias path to properly catch Next.js/Vercel standard source routing
import lsoaGeoJson from "@/data/cardiff-lsoa.json"; 
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

// Safe fallback parsing for strict build setups
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
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "bg",
            type: "raster",
            source: "osm-basemap",
          },
        ],
      },
      center: CARDIFF_CENTRE,
      zoom: 10.7,
      minZoom: 9.5,
      maxZoom: 16,
      attributionControl: { compact: true },
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
          "fill-opacity": 0.45,
        },
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
        paint: {
          "line-color": "#0f172a",
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
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

  const closePopup = () => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    popupTargetRef.current = null;
  };

  const openOrgPopup = (org: Organisation) => {
    const map = mapRef.current;
    if (!map) return;
    closePopup();

    const stages = orgStagesRef.current.get(org.id) ?? [];
    const colour = SECTOR_COLOURS[org.sector];
    const stageLine = stages.length ? stages.join(" · ") : "No J-stage mappings recorded";

    const el = document.createElement("div");
    el.className = "p-3 max-w-[260px] font-sans";
    el.innerHTML = `
      <div class="flex items-center gap-2">
        <span aria-hidden style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:${colour};box-shadow:0 0 0 2px #fff,0 0 0 3px rgba(15,23,42,.08);"></span>
        <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(org.sector)} · ${escapeHtml(org.type)}</span>
      </div>
      <h3 class="mt-1.5 text-sm font-semibold leading-snug text-slate-900">${escapeHtml(org.name)}</h3>
      <div class="mt-2 text-[11px] text-slate-600">
        <div><span class="font-medium text-slate-700">Framework:</span> ${escapeHtml(stageLine)}</div>
        <div class="mt-0.5"><span class="font-medium text-slate-700">Serves:</span> ${escapeHtml(org.geographyServed)}</div>
      </div>
      <button data-popup-cta type="button" class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
        View full detail →
      </button>
    `;
    el.querySelector<HTMLButtonElement>("[data-popup-cta]")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onSelectInsightRef.current(null);
      onSelectOrgRef.current(org.id);
    });

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 14,
      maxWidth: "280px",
      anchor: "bottom",
    })
      .setLngLat(org.location)
      .setDOMContent(el)
      .addTo(map);

    popup.on("close", () => {
      if (popupRef.current === popup) {
        popupRef.current = null;
        popupTargetRef.current = null;
      }
    });

    popupRef.current = popup;
    popupTargetRef.current = { kind: "org", id: org.id };
  };

  const openInsightPopup = (insight: CommunityInsight) => {
    const map = mapRef.current;
    if (!map || !insight.location) return;
    closePopup();

    const excerpt = truncate(insight.text, 140);

    const el = document.createElement("div");
    el.className = "p-3 max-w-[260px] font-sans";
    el.innerHTML = `
      <div class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
        <span aria-hidden style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:#f59e0b;"></span>
        ${escapeHtml(insight.theme)} · ${escapeHtml(insight.populationGroup)}
      </div>
      <p class="mt-2 text-xs leading-snug text-slate-800">${escapeHtml(excerpt)}</p>
      <p class="mt-2 text-[10px] text-slate-500">${escapeHtml(insight.source)}</p>
      <button data-popup-cta type="button" class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
        Read full insight →
      </button>
    `;
    el.querySelector<HTMLButtonElement>("[data-popup-cta]")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onSelectOrgRef.current(null);
      onSelectInsightRef.current(insight.id);
    });

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 12,
      maxWidth: "280px",
      anchor: "bottom",
    })
      .setLngLat(insight.location)
      .setDOMContent(el)
      .addTo(map);

    popup.on("close", () => {
      if (popupRef.current === popup) {
        popupRef.current = null;
        popupTargetRef.current = null;
      }
    });

    popupRef.current = popup;
    popupTargetRef.current = { kind: "insight", id: insight.id };
  };

  const openOrgPopupRef = useRef(openOrgPopup);
  const openInsightPopupRef = useRef(openInsightPopup);
  openOrgPopupRef.current = openOrgPopup;
  openInsightPopupRef.current = openInsightPopup;

  const CLUSTER_THRESHOLD = 12;
  const CLUSTER_CELL = 50;

  const recluster = () => {
    const map = mapRef.current;
    if (!map) return;
    const orgMarkers = orgMarkersRef.current;
    const clusterMarkers = clusterMarkersRef.current;
    const zoom = map.getZoom();

    if (zoom >= CLUSTER_THRESHOLD) {
      for (const m of orgMarkers.values()) m.getElement().style.display = "";
      for (const [id, b] of clusterMarkers) { b.remove(); clusterMarkers.delete(id); }
      return;
    }

    const cells = new globalThis.Map<string, { ids: string[]; xs: number[]; ys: number[] }>();
    for (const [id, marker] of orgMarkers) {
      const { lng, lat } = marker.getLngLat();
      const p = map.project([lng, lat]);
      const key = Math.floor(p.x / CLUSTER_CELL) + "," + Math.floor(p.y / CLUSTER_CELL);
      let entry = cells.get(key);
      if (!entry) { entry = { ids: [], xs: [], ys: [] }; cells.set(key, entry); }
      entry.ids.push(id);
      entry.xs.push(lng);
      entry.ys.push(lat);
    }

    const inCluster = new Set<string>();
    type Cluster = { key: string; ids: string[]; centre: [number, number]; count: number };
    const clusters: Cluster[] = [];
    for (const [, entry] of cells) {
      if (entry.ids.length < 2) continue;
      for (const id of entry.ids) inCluster.add(id);
      const cLng = entry.xs.reduce((s, v) => s + v, 0) / entry.xs.length;
      const cLat = entry.ys.reduce((s, v) => s + v, 0) / entry.ys.length;
      const k = entry.ids.slice().sort().join("|");
      clusters.push({ key: k, ids: entry.ids, centre: [cLng, cLat], count: entry.ids.length });
    }

    for (const [id, marker] of orgMarkers) {
      marker.getElement().style.display = inCluster.has(id) ? "none" : "";
    }

    const wantedKeys = new Set(clusters.map((c) => c.key));
    for (const [key, bubble] of clusterMarkers) {
      if (!wantedKeys.has(key)) { bubble.remove(); clusterMarkers.delete(key); }
    }
    for (const c of clusters) {
      const existing = clusterMarkers.get(c.key);
      if (existing) {
        existing.setLngLat(c.centre);
        const countEl = existing.getElement().querySelector(".cluster-count");
        if (countEl) countEl.textContent = String(c.count);
        continue;
      }
      const el = makeClusterElement(c.count);
      const ids = c.ids.slice();
      el.addEventListener("mousedown", (ev) => ev.stopPropagation());
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const bounds = new maplibregl.LngLatBounds();
        for (const id of ids) {
          const m = orgMarkers.get(id);
          if (m) bounds.extend(m.getLngLat());
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, duration: 600, maxZoom: 14 });
        }
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(c.centre)
        .addTo(map);
      clusterMarkers.set(c.key, marker);
    }
  };

  const reclusterRef = useRef(recluster);
  reclusterRef.current = recluster;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = orgMarkersRef.current;
    const wanted = new Set(orgs.map((o) => o.id));
    for (const [id, marker] of current) {
      if (!wanted.has(id)) { marker.remove(); current.delete(id); }
    }
    for (const org of orgs) {
      const existing = current.get(org.id);
      if (existing) {
        updateOrgMarker(existing.getElement(), org, selectedOrgId, popupTargetRef.current);
        continue;
      }
      const el = makeOrgMarker(org, selectedOrgId, popupTargetRef.current);
      const stopPointer = (ev: Event) => ev.stopPropagation();
      el.addEventListener("mousedown", stopPointer);
      el.addEventListener("touchstart", stopPointer, { passive: true });
      el.addEventListener("dblclick", stopPointer);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const id = (ev.currentTarget as HTMLElement).dataset.orgId!;
        const o = orgsByIdRef.current.get(id);
        if (!o) return;
        openOrgPopupRef.current(o);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(org.location)
        .addTo(map);
      current.set(org.id, marker);
    }
    recluster();
  }, [orgs, selectedOrgId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => reclusterRef.current();
    map.on("zoomend", run);
    map.on("moveend", run);
    return () => {
      map.off("zoomend", run);
      map.off("moveend",
