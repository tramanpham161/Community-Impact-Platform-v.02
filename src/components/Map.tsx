"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import lsoaGeoJson from "@data/cardiff-lsoa.json";
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

const LSOA_DATA = lsoaGeoJson as unknown as GeoJSON.FeatureCollection;

// v0.2 deprivation domain switcher: each LSOA feature is enriched once with
// `q_<domain>` properties for all 8 indicators. The fill-color paint
// expression reads `q_${activeDomain}`, so switching domains is a single
// setPaintProperty call — no source replacement.
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

function paintForDomain(domain: WimdDomain): maplibregl.DataDrivenPropertyValueSpecification<string> {
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

type Props = {
  orgs: Organisation[];
  insights: CommunityInsight[];
  /** distinct J-stages each org touches, e.g. ["J4","J5"] — shown in popups */
  orgStages: Map<string, string[]>;
  selectedOrgId: string | null;
  selectedInsightId: string | null;
  selectedLSOACode: string | null;
  onSelectOrg: (id: string | null) => void;
  onSelectInsight: (id: string | null) => void;
  /** Toggle LSOA selection (call with same code to clear). */
  onSelectLSOA: (code: string | null) => void;
  /** Detail-panel width in px, used as easeTo padding so the focused pin
   *  stays visible alongside the open panel. */
  detailPanelWidth: number;
  /** v0.2 deprivation indicator switcher — drives the choropleth colour. */
  wimdDomain: WimdDomain;
  /** Overlays rendered inside the map's relative frame (e.g. the detail side panel). */
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

  // Latest callbacks/data via refs so marker click handlers stay stable.
  const onSelectOrgRef = useRef(onSelectOrg);
  const onSelectInsightRef = useRef(onSelectInsight);
  const onSelectLSOARef = useRef(onSelectLSOA);
  const orgsByIdRef = useRef(orgsById);
  const insightsByIdRef = useRef(insightsById);
  const orgStagesRef = useRef(orgStages);
  const selectedLSOACodeRef = useRef(selectedLSOACode);
  const wimdDomainRef = useRef(wimdDomain);
  useEffect(() => { onSelectOrgRef.current = onSelectOrg; }, [onSelectOrg]);
  useEffect(() => { onSelectInsightRef.current = onSelectInsight; }, [onSelectInsight]);
  useEffect(() => { onSelectLSOARef.current = onSelectLSOA; }, [onSelectLSOA]);
  useEffect(() => { orgsByIdRef.current = orgsById; }, [orgsById]);
  useEffect(() => { insightsByIdRef.current = insightsById; }, [insightsById]);
  useEffect(() => { orgStagesRef.current = orgStages; }, [orgStages]);
  useEffect(() => { selectedLSOACodeRef.current = selectedLSOACode; }, [selectedLSOACode]);
  useEffect(() => { wimdDomainRef.current = wimdDomain; }, [wimdDomain]);

  // v0.2 deprivation switcher — repaint the choropleth when the active domain
  // changes. Setting paint property alone is enough; source data is unchanged.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("wimd-fill")) return;
    map.setPaintProperty("wimd-fill", "fill-color", paintForDomain(wimdDomain));
  }, [wimdDomain]);

  // ── 1. Initialise map and WIMD layers (once). ─────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Self-contained light raster map style that avoids external styles, fonts, or glyph downloads.
    const rasterStyle: any = {
      version: 8,
      sources: {
        "carto-raster": {
          type: "raster",
          tiles: [
            "https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
            "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>"
        }
      },
      layers: [
        {
          id: "carto-raster-layer",
          type: "raster",
          source: "carto-raster",
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: rasterStyle,
      center: CARDIFF_CENTRE,
      zoom: 10.7,
      minZoom: 9.5,
      maxZoom: 16,
      attributionControl: { compact: true },
    });
    map.on("load", () => {
    console.log("MAP LOADED");
    });

    map.on("styledata", () => {
    console.log("STYLE DATA");
    });

    map.on("error", (e) => {
    console.error("MAP ERROR", e);
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // The `load` event requires every source to be fully loaded — under React
    // StrictMode double-mount the basemap tile source can stay "not loaded"
    // indefinitely, so `load` never fires. `styledata` fires as soon as style
    // metadata is parsed (which is what addSource/addLayer actually require),
    // and the source-exists guard makes it safe to run on every styledata tick.
    const addWimdLayers = () => {
      if (!map.getStyle() || map.getSource("cardiff-lsoa")) return;
      map.addSource("cardiff-lsoa", { type: "geojson", data: ENRICHED_LSOA_DATA });
      map.addLayer({
        id: "wimd-fill",
        type: "fill",
        source: "cardiff-lsoa",
        paint: {
          "fill-color": paintForDomain(wimdDomainRef.current),
          "fill-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "wimd-outline",
        type: "line",
        source: "cardiff-lsoa",
        paint: { "line-color": "#ffffff", "line-width": 0.5, "line-opacity": 0.7 },
      });
      // Highlight for the currently selected LSOA. Filter starts as "match
      // nothing" — page.tsx flips it via setFilter when selection changes.
      map.addLayer({
        id: "wimd-selected-outline",
        type: "line",
        source: "cardiff-lsoa",
        filter: ["==", ["get", "LSOA21CD"], "__none__"],
        paint: {
          "line-color": "#0f172a", // slate-900
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
      });
    };
    addWimdLayers();
    map.on("load", addWimdLayers);
    map.on("styledata", addWimdLayers);

    // ── LSOA interaction ───────────────────────────────────────────────
    // Click toggles selection. Hover changes the cursor to a pointer so the
    // affordance is discoverable.
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

    // MapLibre's built-in trackResize only watches window — it misses container
    // size changes from hydration races (container measures ~0 on mount then
    // grows) and from layout shifts that don't trigger a window resize.
    // Diff-check the size so a no-op observation during animation doesn't
    // trigger a redundant resize() that can cancel in-progress easeTo.
    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver((entries) => {
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

  // ── Popup helpers ─────────────────────────────────────────────────────
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
    const stageLine = stages.length
      ? stages.join(" · ")
      : "No J-stage mappings recorded";

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
      <button data-popup-cta type="button"
        class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
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
      // Only null these out if this popup is still the active one — guards
      // against races where openOrgPopup has just replaced it.
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
      <button data-popup-cta type="button"
        class="mt-3 inline-flex w-full items-center justify-center rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
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

  // Pin clustering. At zoom < CLUSTER_THRESHOLD, group org pins by a
  // CLUSTER_CELL-px grid; cells with ≥ 2 pins collapse into a bubble. The
  // member pins are hidden via display:none rather than removed, so the
  // existing marker state (sector colour, selected ring) stays intact for
  // when we zoom back in.
  const CLUSTER_THRESHOLD = 12;
  const CLUSTER_CELL = 50;

  const recluster = () => {
    const map = mapRef.current;
    if (!map) return;
    const orgMarkers = orgMarkersRef.current;
    const clusterMarkers = clusterMarkersRef.current;
    const zoom = map.getZoom();

    // High zoom: no clustering. Show every individual pin, drop bubbles.
    if (zoom >= CLUSTER_THRESHOLD) {
      for (const m of orgMarkers.values()) m.getElement().style.display = "";
      for (const [id, b] of clusterMarkers) { b.remove(); clusterMarkers.delete(id); }
      return;
    }

    // Low zoom: bucket by screen-space grid.
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

    // Identify which pins are members of multi-pin clusters.
    const inCluster = new Set<string>();
    type Cluster = { key: string; ids: string[]; centre: [number, number]; count: number };
    const clusters: Cluster[] = [];
    for (const [, entry] of cells) {
      if (entry.ids.length < 2) continue;
      for (const id of entry.ids) inCluster.add(id);
      const cLng = entry.xs.reduce((s, v) => s + v, 0) / entry.xs.length;
      const cLat = entry.ys.reduce((s, v) => s + v, 0) / entry.ys.length;
      // Stable id keyed on sorted membership — same composition keeps the
      // same bubble element across pans, so we never re-create mid-pan.
      const k = entry.ids.slice().sort().join("|");
      clusters.push({ key: k, ids: entry.ids, centre: [cLng, cLat], count: entry.ids.length });
    }

    // Show or hide individual pins.
    for (const [id, marker] of orgMarkers) {
      marker.getElement().style.display = inCluster.has(id) ? "none" : "";
    }

    // Diff cluster bubbles.
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

  // ── 2. Sync org markers. ──────────────────────────────────────────────
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
      // Stop pointer events from reaching MapLibre. Without this, mousedown
      // on the marker starts a potential drag-pan (which can leave the
      // following easeTo with an inconsistent transform), and bubbling click
      // can also fire the map's background click → clear-selection handler.
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
    // Membership of clusters depends on which pins are currently visible —
    // recluster whenever the visible set changes.
    recluster();
  }, [orgs, selectedOrgId]);

  // ── 2b. Recluster on zoom and pan. ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => reclusterRef.current();
    map.on("zoomend", run);
    map.on("moveend", run);
    return () => {
      map.off("zoomend", run);
      map.off("moveend", run);
    };
  }, []);

  // ── 3. Sync insight markers. ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = insightMarkersRef.current;
    const placed = insights.filter((i) => i.location);
    const wanted = new Set(placed.map((i) => i.id));
    for (const [id, marker] of current) {
      if (!wanted.has(id)) { marker.remove(); current.delete(id); }
    }
    for (const insight of placed) {
      const existing = current.get(insight.id);
      if (existing) {
        updateInsightMarker(existing.getElement(), insight, selectedInsightId, popupTargetRef.current);
        continue;
      }
      const el = makeInsightMarker(insight, selectedInsightId, popupTargetRef.current);
      const stopPointer = (ev: Event) => ev.stopPropagation();
      el.addEventListener("mousedown", stopPointer);
      el.addEventListener("touchstart", stopPointer, { passive: true });
      el.addEventListener("dblclick", stopPointer);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const id = (ev.currentTarget as HTMLElement).dataset.insightId!;
        const i = insightsByIdRef.current.get(id);
        if (!i) return;
        openInsightPopupRef.current(i);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(insight.location!)
        .addTo(map);
      current.set(insight.id, marker);
    }
  }, [insights, selectedInsightId]);

  // ── 4. Background click clears everything. ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onBg = () => {
      closePopup();
      onSelectOrgRef.current(null);
      onSelectInsightRef.current(null);
    };
    map.on("click", onBg);
    return () => { map.off("click", onBg); };
  }, []);

  // ── 4b. Sync the selected-LSOA outline filter. ───────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer("wimd-selected-outline")) return;
      const targetFilter: any = [
        "==",
        ["get", "LSOA21CD"],
        selectedLSOACode ?? "__none__",
      ];
      const currentFilter = map.getFilter("wimd-selected-outline");
      if (JSON.stringify(currentFilter) === JSON.stringify(targetFilter)) return;
      map.setFilter("wimd-selected-outline", targetFilter);
    };
    apply();
    // The layer may not exist on the first effect run (style still loading);
    // re-apply on styledata until it does. Only triggers setFilter if value actually changed.
    map.on("styledata", apply);
    return () => { map.off("styledata", apply); };
  }, [selectedLSOACode]);

  // ── 5. When the side panel opens (from popup CTA or list), close popup
  //       and ease to focus the selected feature alongside the panel. ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selectedOrgId && !selectedInsightId) return;

    // Side panel takes over — the popup would now redundantly point at the
    // same pin, so dismiss it.
    closePopup();

    let target: [number, number] | null = null;
    if (selectedOrgId) target = orgsById.get(selectedOrgId)?.location ?? null;
    else if (selectedInsightId) target = insightsById.get(selectedInsightId)?.location ?? null;
    if (target) {
      // Pad the camera by the panel width so the selected pin stays visible.
      // On mobile (panel covers the whole map) we omit padding entirely —
      // MapLibre crashes if `padding` is explicitly `undefined`, so build
      // the options object conditionally.
      const isMobilePanel = window.matchMedia("(max-width: 640px)").matches;
      const opts: maplibregl.EaseToOptions = {
        center: target,
        zoom: Math.max(map.getZoom(), 12.5),
        duration: 600,
      };
      if (!isMobilePanel) {
        opts.padding = { right: detailPanelWidth, top: 0, bottom: 0, left: 0 };
      }
      map.easeTo(opts);
    }
  }, [selectedOrgId, selectedInsightId, orgsById, insightsById, detailPanelWidth]);

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <div ref={containerRef} className="absolute inset-0" />
      <MapLegend wimdDomain={wimdDomain} />
      {children}
    </div>
  );
}

// ── Marker element builders ─────────────────────────────────────────────

function makeOrgMarker(
  org: Organisation,
  selectedOrgId: string | null,
  popupTarget: PopupTarget
) {
  const el = document.createElement("div");
  el.className = "org-pin";
  // No `position` here — MapLibre adds `position: absolute` via the
  // `.maplibregl-marker` class on this element. Setting position:relative
  // would override that, causing markers to take vertical space in normal
  // flow and stack down the page (drift grows by ~24px per DOM index).
  el.style.cssText = "width:24px;height:24px;cursor:pointer;";
  el.dataset.orgId = org.id;
  el.title = org.name;
  el.innerHTML = `
    <span class="org-pin-dot" aria-hidden style="position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:9999px;pointer-events:none;box-shadow:0 0 0 2px #ffffff,0 1px 2px rgba(0,0,0,.25);"></span>
  `;
  updateOrgMarker(el, org, selectedOrgId, popupTarget);
  return el;
}

function updateOrgMarker(
  el: HTMLElement,
  org: Organisation,
  selectedOrgId: string | null,
  popupTarget: PopupTarget
) {
  const colour = SECTOR_COLOURS[org.sector];
  const dot = el.querySelector(".org-pin-dot") as HTMLElement | null;
  const isSelected =
    selectedOrgId === org.id ||
    (popupTarget?.kind === "org" && popupTarget.id === org.id);
  if (dot) {
    dot.style.background = colour;
    dot.style.boxShadow = isSelected
      ? `0 0 0 3px #ffffff, 0 0 0 5px ${colour}, 0 2px 6px rgba(0,0,0,.3)`
      : `0 0 0 2px #ffffff, 0 1px 2px rgba(0,0,0,.25)`;
    dot.style.transform = isSelected ? "scale(1.25)" : "scale(1)";
    dot.style.transition = "transform .15s ease, box-shadow .15s ease";
  }
}

function makeInsightMarker(
  insight: CommunityInsight,
  selectedInsightId: string | null,
  popupTarget: PopupTarget
) {
  const el = document.createElement("div");
  el.className = "insight-pin";
  // See note in makeOrgMarker — never override MapLibre's position:absolute.
  el.style.cssText = "width:20px;height:20px;cursor:pointer;";
  el.dataset.insightId = insight.id;
  el.title = `Community insight — ${insight.theme}`;
  el.innerHTML = `
    <span aria-hidden style="position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:2px;background:#f59e0b;pointer-events:none;box-shadow:0 0 0 2px #ffffff,0 1px 2px rgba(0,0,0,.3);transform:rotate(45deg);"></span>
  `;
  updateInsightMarker(el, insight, selectedInsightId, popupTarget);
  return el;
}

function makeClusterElement(count: number) {
  const el = document.createElement("div");
  el.className = "org-cluster";
  // No `position` — MapLibre's .maplibregl-marker class sets position:absolute.
  // z-index lifts the bubble over insight diamond markers, which sync into the
  // DOM after org markers and would otherwise paint on top by default.
  const size = count >= 10 ? 40 : 34;
  el.style.cssText = `width:${size}px;height:${size}px;cursor:pointer;z-index:5;`;
  el.title = `${count} organisations here — click to zoom in`;
  el.innerHTML = `
    <span aria-hidden style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:#0f172a;color:#ffffff;font-size:13px;font-weight:600;box-shadow:0 0 0 3px rgba(255,255,255,.92),0 2px 8px rgba(15,23,42,.3);">
      <span class="cluster-count">${count}</span>
    </span>
  `;
  return el;
}

function updateInsightMarker(
  el: HTMLElement,
  insight: CommunityInsight,
  selectedInsightId: string | null,
  popupTarget: PopupTarget
) {
  const dot = el.querySelector("span") as HTMLElement | null;
  if (!dot) return;
  const isSelected =
    selectedInsightId === insight.id ||
    (popupTarget?.kind === "insight" && popupTarget.id === insight.id);
  dot.style.boxShadow = isSelected
    ? `0 0 0 3px #ffffff, 0 0 0 5px #f59e0b, 0 2px 6px rgba(0,0,0,.3)`
    : `0 0 0 2px #ffffff, 0 1px 2px rgba(0,0,0,.3)`;
  dot.style.transform = isSelected ? "rotate(45deg) scale(1.25)" : "rotate(45deg)";
  dot.style.transition = "transform .15s ease, box-shadow .15s ease";
}

// ── Small helpers ───────────────────────────────────────────────────────

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  // try to cut on a word boundary
  const slice = s.slice(0, max);
  const cut = slice.lastIndexOf(" ");
  return (cut > max * 0.6 ? slice.slice(0, cut) : slice).trimEnd() + "…";
}

function MapLegend({ wimdDomain }: { wimdDomain: WimdDomain }) {
  const ramp: Array<{ q: 1 | 2 | 3 | 4 | 5; label: string }> = [
    { q: 1, label: "Most deprived 20%" },
    { q: 2, label: "Quintile 2" },
    { q: 3, label: "Quintile 3" },
    { q: 4, label: "Quintile 4" },
    { q: 5, label: "Least deprived 20%" },
  ];
  const sectors: Array<[keyof typeof SECTOR_COLOURS, string]> = [
    ["VCSE", "VCSE"],
    ["Education", "Education"],
    ["Public", "Public"],
    ["Private", "Private / employer"],
  ];
  const domainLabel = WIMD_DOMAIN_LABELS[wimdDomain];
  return (
    <div className="absolute bottom-3 left-3 z-10 max-w-[230px] space-y-3 rounded-md bg-white/95 px-3 py-2 text-xs shadow ring-1 ring-slate-200 backdrop-blur">
      <div>
        <div className="mb-1 font-medium text-slate-700">
          WIMD 2025 — <span className="text-slate-900">{domainLabel}</span>
        </div>
        <div className="space-y-1">
          {ramp.map(({ q, label }) => (
            <div key={q} className="flex items-center gap-2">
              <span className="inline-block h-3 w-4 rounded-sm ring-1 ring-black/5" style={{ background: WIMD_RAMP[q] }} />
              <span className="text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-2">
        <div className="mb-1 font-medium text-slate-700">Organisation sector</div>
        <div className="space-y-1">
          {sectors.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full ring-1 ring-white" style={{ background: SECTOR_COLOURS[key] }} />
              <span className="text-slate-600">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-block h-2.5 w-2.5 ring-1 ring-white" style={{ background: "#f59e0b", transform: "rotate(45deg)" }} />
            <span className="text-slate-600">Community insight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
