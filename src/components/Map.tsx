"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import maplibregl from "maplibre-gl";
import lsoaGeoJson from "@data/cardiff-lsoa.json";
import type { CommunityInsight, Organisation, WimdDomain } from "@/lib/types";
import { SECTOR_COLOURS, WIMD_DOMAIN_LABELS, WIMD_RAMP } from "@/lib/types";
import { wimdScoresFor } from "@/lib/wimd";

const LSOA_DATA = lsoaGeoJson as unknown as GeoJSON.FeatureCollection;

// Enrich LSOA data once with indicator values
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
  const wimdDomainRef = useRef(wimdDomain);
  
  useEffect(() => { onSelectOrgRef.current = onSelectOrg; }, [onSelectOrg]);
