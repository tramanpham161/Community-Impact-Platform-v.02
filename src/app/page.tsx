"use client";

import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Briefcase, BarChart3 } from "lucide-react";
import { MapView } from "@/components/Map";
import { FilterPanel } from "@/components/FilterPanel";
import { DetailSidePanel } from "@/components/DetailSidePanel";
import { DashboardCards } from "@/components/DashboardCards";
import { GapsPanel } from "@/components/GapsPanel";
import { InsightsList } from "@/components/InsightsList";
import { ExportButtons } from "@/components/ExportButtons";
import { PlaceIdentityStrip } from "@/components/PlaceIdentityStrip";
import { ModeChooser } from "@/components/ModeChooser";
import { JourneyStageStrip } from "@/components/JourneyStageStrip";
import { OpportunitySnapshotPanel } from "@/components/OpportunitySnapshotPanel";
import { Logo } from "@/components/Logo";
import { TransformationPanel } from "@/components/TransformationPanel";
import { ImpactPanel } from "@/components/ImpactPanel";
import { EMPTY_FILTERS, type FilterState, filterOrgs } from "@/lib/filters";
import { pointInFeature } from "@/lib/spatial";
import { wimdScoreFor } from "@/lib/wimd";
import { WIMD_RAMP } from "@/lib/types";
import type {
  CommunityInsight,
  FrameworkMapping,
  Gap,
  Indicator,
  OpportunitySnapshot,
  Organisation,
  OrganisationType,
  UserGoal,
  UserType,
  WimdDomain,
  Workstream,
} from "@/lib/types";
import { USER_GOAL_LABELS, USER_TYPE_LABELS, WIMD_DOMAIN_LABELS } from "@/lib/types";

import orgsData from "@data/organisations.json";
import mappingsData from "@data/framework-mappings.json";
import indicatorsData from "@data/indicators.json";
import insightsData from "@data/community-insights.json";
import gapsData from "@data/gaps.json";
import lsoaGeoJson from "@data/cardiff-lsoa.json";
import snapshotsData from "@data/opportunity-snapshots.json";
import workstreamsData from "@data/workstreams.json";

const ORGS = orgsData as unknown as Organisation[];
const MAPPINGS = mappingsData as unknown as FrameworkMapping[];
const INDICATORS = indicatorsData as unknown as Indicator[];
const INSIGHTS = insightsData as unknown as CommunityInsight[];
const GAPS = gapsData as unknown as Gap[];
const LSOA_FC = lsoaGeoJson as unknown as GeoJSON.FeatureCollection;
const SNAPSHOTS = snapshotsData as unknown as OpportunitySnapshot[];
const SNAPSHOT_CARDIFF = SNAPSHOTS.find((s) => s.scope === "cardiff") ?? null;
const SNAPSHOT_BY_LSOA = new Map<string, OpportunitySnapshot>();
for (const s of SNAPSHOTS) {
  if (s.scope === "lsoa" && s.lsoa11cd) SNAPSHOT_BY_LSOA.set(s.lsoa11cd, s);
}
const WORKSTREAMS = workstreamsData as unknown as Workstream[];

const ORG_TYPE_VALUES: OrganisationType[] = [
  "Charity / VCSE", "Community group", "School", "College / FE",
  "Local authority", "Public sector", "Corporate / employer", "Funder",
];

const STAGE_ORDER = ["J1", "J2", "J3", "J4", "J5", "J6", "J1-J6"];
const DETAIL_PANEL_WIDTH = 420;
const QUINTILE_LABELS: Record<number, string> = {
  1: "most deprived 20%",
  2: "quintile 2",
  3: "quintile 3",
  4: "quintile 4",
  5: "least deprived 20%",
};

const LSOA_BY_CODE = new Map<string, GeoJSON.Feature>();
for (const f of LSOA_FC.features) {
  const code = f.properties?.LSOA21CD as string | undefined;
  if (code) LSOA_BY_CODE.set(code, f);
}

const VALID_USER_TYPES: UserType[] = ["community", "employer"];
const VALID_GOALS: UserGoal[] = ["deprivation", "organisations", "workstreams"];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"needs-map" | "programme" | "impact">("needs-map");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [selectedLSOACode, setSelectedLSOACode] = useState<string | null>(null);

  // v0.2 needs-led chooser. Defaults to community/deprivation — most common
  // entry context for a coalition stakeholder opening the link. URL state is
  // read once on mount and written back on change via history.replaceState,
  // which avoids the Suspense boundary that useSearchParams would require.
  const [userType, setUserType] = useState<UserType>("community");
  const [goal, setGoal] = useState<UserGoal>("deprivation");

  // v0.2 deprivation indicator switcher. Drives the choropleth — see Map.tsx.
  const [wimdDomain, setWimdDomain] = useState<WimdDomain>("overall");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const as = params.get("as");
    const g = params.get("goal");
    if (as && VALID_USER_TYPES.includes(as as UserType)) setUserType(as as UserType);
    if (g && VALID_GOALS.includes(g as UserGoal)) setGoal(g as UserGoal);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("as", userType);
    params.set("goal", goal);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [userType, goal]);

  const onModeChange = (next: { userType?: UserType; goal?: UserGoal }) => {
    if (next.userType) setUserType(next.userType);
    if (next.goal) setGoal(next.goal);
  };

  // Panel-filter pass first; then optional spatial cut by selected LSOA.
  const visibleOrgs = useMemo(() => {
    const fromPanel = filterOrgs(ORGS, MAPPINGS, filters);
    if (!selectedLSOACode) return fromPanel;
    const feature = LSOA_BY_CODE.get(selectedLSOACode);
    if (!feature) return fromPanel;
    return fromPanel.filter((o) => pointInFeature(o.location, feature));
  }, [filters, selectedLSOACode]);

  // Distinct J-stages each org touches — used in map popups.
  const orgStages = useMemo(() => {
    const m = new Map<string, string[]>();
    const sets = new Map<string, Set<string>>();
    for (const map of MAPPINGS) {
      if (!map.stage) continue;
      let s = sets.get(map.orgId);
      if (!s) { s = new Set(); sets.set(map.orgId, s); }
      s.add(map.stage);
    }
    for (const [id, s] of sets) {
      const sorted = Array.from(s).sort(
        (a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b)
      );
      m.set(id, sorted);
    }
    return m;
  }, []);

  const selectedOrg = useMemo(
    () => (selectedOrgId ? ORGS.find((o) => o.id === selectedOrgId) ?? null : null),
    [selectedOrgId]
  );
  const selectedOrgMappings = useMemo(
    () => (selectedOrgId ? MAPPINGS.filter((m) => m.orgId === selectedOrgId) : []),
    [selectedOrgId]
  );
  const selectedInsight = useMemo(
    () => (selectedInsightId ? INSIGHTS.find((i) => i.id === selectedInsightId) ?? null : null),
    [selectedInsightId]
  );
  const selectedLSOA = selectedLSOACode ? LSOA_BY_CODE.get(selectedLSOACode) : null;

  const closePanel = () => {
    setSelectedOrgId(null);
    setSelectedInsightId(null);
  };

  // v0.2: the old categoryTags taxonomy is surfaced as "service type" in the
  // simplified filter row. Same values, new label.
  const serviceTypes = useMemo(() => {
    const s = new Set<string>();
    for (const o of ORGS) for (const t of o.categoryTags) s.add(t);
    return Array.from(s).sort();
  }, []);

  const selectedGeographyLabel = useMemo(() => {
    if (!selectedLSOA) return null;
    const p = selectedLSOA.properties ?? {};
    return (p.displayName as string) || (p.LSOA21NM as string) || "Selected LSOA";
  }, [selectedLSOA]);

  // v0.2 Opportunity Snapshot: LSOA-specific if we have one for the selected
  // code, otherwise the Cardiff-wide default.
  const activeSnapshot = useMemo<OpportunitySnapshot | null>(() => {
    if (selectedLSOACode) {
      const match = SNAPSHOT_BY_LSOA.get(selectedLSOACode);
      if (match) return match;
    }
    return SNAPSHOT_CARDIFF;
  }, [selectedLSOACode]);

  const orgsById = useMemo(() => {
    const m = new Map<string, Organisation>();
    for (const o of ORGS) m.set(o.id, o);
    return m;
  }, []);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="border-b border-brand-border pb-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="font-display font-semibold text-xs tracking-widest text-charcoal uppercase">
              Community Impact Platform
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider text-brand-orange uppercase ring-1 ring-brand-orange/20">
              v0.2 PROTOTYPE
            </span>
          </div>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-charcoal max-w-4xl">
          Community Impact Platform
        </h1>
        <p className="mt-4 max-w-3xl text-sm font-normal text-charcoal-light leading-relaxed">
          An integrated intelligence, programme management, and quantitative outcomes environment for social mobility coalitions. Select an aspect of the platform below to access targeted workspaces.
        </p>

        {/* 3 Prominent Layers Buttons */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            id="tab-needs-map"
            onClick={() => setActiveTab("needs-map")}
            className={`group relative rounded-xl border p-5 text-left transition duration-300 hover:scale-[1.01] cursor-pointer ${
              activeTab === "needs-map"
                ? "border-brand-navy bg-sky-50/80 text-brand-navy shadow-md ring-2 ring-brand-navy/10"
                : "border-brand-border bg-white text-charcoal hover:bg-sand-card hover:border-brand-navy/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight">Cardiff Social Needs Map</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold font-mono transition ${
                activeTab === "needs-map" ? "bg-brand-navy text-white" : "bg-neutral-100 text-neutral-500"
              }`}>
                01
              </span>
            </div>
            <p className={`mt-3 text-xs leading-normal font-normal ${
              activeTab === "needs-map" ? "text-brand-navy/90" : "text-charcoal-light"
            }`}>
              Choropleth mapping & local Wales WIMD indicators layer
            </p>
            {activeTab === "needs-map" && (
              <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-brand-navy rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            id="tab-programme"
            onClick={() => setActiveTab("programme")}
            className={`group relative rounded-xl border p-5 text-left transition duration-300 hover:scale-[1.01] cursor-pointer ${
              activeTab === "programme"
                ? "border-brand-teal bg-emerald-50/80 text-brand-teal shadow-md ring-2 ring-brand-teal/10"
                : "border-brand-border bg-white text-charcoal hover:bg-sand-card hover:border-brand-teal/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight">Transformation Programme</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold font-mono transition ${
                activeTab === "programme" ? "bg-brand-teal text-white" : "bg-neutral-100 text-neutral-500"
              }`}>
                02
              </span>
            </div>
            <p className={`mt-3 text-xs leading-normal font-normal ${
              activeTab === "programme" ? "text-brand-teal/90" : "text-charcoal-light"
            }`}>
              Initiatives workflow, milestones & partner alignment
            </p>
            {activeTab === "programme" && (
              <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-brand-teal rounded-t-full" />
            )}
          </button>

          <button
            type="button"
            id="tab-impact"
            onClick={() => setActiveTab("impact")}
            className={`group relative rounded-xl border p-5 text-left transition duration-300 hover:scale-[1.01] cursor-pointer ${
              activeTab === "impact"
                ? "border-brand-orange bg-orange-50/80 text-brand-orange shadow-md ring-2 ring-brand-orange/10"
                : "border-brand-border bg-white text-charcoal hover:bg-sand-card hover:border-brand-orange/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-tight">Impact Measurement Layer</span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold font-mono transition ${
                activeTab === "impact" ? "bg-brand-orange text-white" : "bg-neutral-100 text-neutral-500"
              }`}>
                03
              </span>
            </div>
            <p className={`mt-3 text-xs leading-normal font-normal ${
              activeTab === "impact" ? "text-brand-orange/90" : "text-charcoal-light"
            }`}>
              Pathway conversions & deprivation targeting performance
            </p>
            {activeTab === "impact" && (
              <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-brand-orange rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      {activeTab === "needs-map" && (
        <>
          <section className="mt-6">
            <ModeChooser
              userType={userType}
              goal={goal}
              onChange={onModeChange}
            />
          </section>

          <section className="mt-6">
            <PlaceIdentityStrip
              name="Cardiff"
              geographyType="Local authority"
              population={362400}
              lastUpdated="May 2026"
            />
          </section>

          <section className="mt-6">
            <DashboardCards indicators={INDICATORS} />
          </section>

          <section className={"mt-6 " + emphasisWrap(goal === "organisations")}>
            {goal === "organisations" && (
              <ModeEmphasisLabel userType={userType} goal={goal} reason="Filters and pins are the centre of this view." />
            )}
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              options={{
                organisationTypes: ORG_TYPE_VALUES,
                serviceTypes,
              }}
              visibleCount={visibleOrgs.length}
              totalCount={ORGS.length}
              selectedGeographyLabel={selectedGeographyLabel}
              onClearGeography={() => setSelectedLSOACode(null)}
            />
          </section>

          <section className="mt-4">
            <JourneyStageStrip
              selected={filters.stage}
              onSelect={(s) => setFilters({ ...filters, stage: s })}
            />
          </section>

          <section className={"mt-4 " + emphasisWrap(goal === "deprivation")}>
            {goal === "deprivation" && (
              <ModeEmphasisLabel userType={userType} goal={goal} reason="The choropleth is the centre of this view." />
            )}
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-brand-border bg-sand-card/75 px-3.5 py-2.5 text-xs shadow-sm">
              <label className="font-semibold text-charcoal" htmlFor="wimd-domain-switcher">
                Deprivation indicator:
              </label>
              <select
                id="wimd-domain-switcher"
                value={wimdDomain}
                onChange={(e) => setWimdDomain(e.target.value as WimdDomain)}
                className="rounded-md border border-brand-border bg-white px-2.5 py-1 text-xs text-charcoal font-normal focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
              >
                {(Object.keys(WIMD_DOMAIN_LABELS) as WimdDomain[]).map((d) => (
                  <option key={d} value={d}>
                    {WIMD_DOMAIN_LABELS[d]}
                  </option>
                ))}
              </select>
              <span className="text-charcoal-light font-normal">
                Quintiles are Wales-wide (1 = most deprived 20% across all 1,917 LSOAs).
              </span>
            </div>
            <MapView
              orgs={visibleOrgs}
              insights={INSIGHTS}
              orgStages={orgStages}
              selectedOrgId={selectedOrgId}
              selectedInsightId={selectedInsightId}
              selectedLSOACode={selectedLSOACode}
              onSelectOrg={setSelectedOrgId}
              onSelectInsight={setSelectedInsightId}
              onSelectLSOA={setSelectedLSOACode}
              detailPanelWidth={DETAIL_PANEL_WIDTH}
              wimdDomain={wimdDomain}
            >
              {selectedLSOA && (
                <LSOAChip
                  feature={selectedLSOA}
                  wimdDomain={wimdDomain}
                  onClear={() => setSelectedLSOACode(null)}
                />
              )}
              {selectedOrg && (
                <DetailSidePanel
                  kind="org"
                  org={selectedOrg}
                  mappings={selectedOrgMappings}
                  onClose={closePanel}
                />
              )}
              {selectedInsight && !selectedOrg && (
                <DetailSidePanel
                  kind="insight"
                  insight={selectedInsight}
                  onClose={closePanel}
                />
              )}
            </MapView>
            <p className="mt-2 text-xs text-slate-500">
              Pins show each organisation&rsquo;s registered HQ, not its service
              area — several Wales-wide and UK-wide bodies have Cardiff offices.
              Click an LSOA polygon to filter to organisations HQ&rsquo;d inside it.
              The empty space in the outer wards next to the dark-red WIMD polygons
              is itself a finding: deprivation lives outside the centre, provision
              concentrates in it.
            </p>
          </section>

          {activeSnapshot && (
            <section className={"mt-10 " + emphasisWrap(userType === "employer")}>
              {userType === "employer" && (
                <ModeEmphasisLabel
                  userType={userType}
                  goal={goal}
                  reason="The opportunity view is the one most employers ask for first."
                />
              )}
              <OpportunitySnapshotPanel
                snapshot={activeSnapshot}
                orgsById={orgsById}
                selectedLsoaLabel={selectedGeographyLabel}
                onSelectEmployer={(id) => {
                  setSelectedInsightId(null);
                  setSelectedOrgId(id);
                }}
              />
            </section>
          )}

          <section className={"mt-10 " + emphasisWrap(goal === "workstreams")}>
            {goal === "workstreams" && (
              <ModeEmphasisLabel userType={userType} goal={goal} reason="This is where emerging gaps and potential workstreams surface." />
            )}
            <GapsPanel
              gaps={GAPS}
              workstreams={goal === "workstreams" ? WORKSTREAMS : undefined}
            />
          </section>

          <section className="mt-10">
            <InsightsList
              insights={INSIGHTS}
              selectedInsightId={selectedInsightId}
              onSelectInsight={(id) => {
                setSelectedOrgId(null);
                setSelectedInsightId(id);
              }}
            />
          </section>

          <section className="mt-10">
            <ExportButtons />
          </section>
        </>
      )}

      {activeTab === "programme" && (
        <section className="mt-8">
          <TransformationPanel />
        </section>
      )}

      {activeTab === "impact" && (
        <section className="mt-8">
          <ImpactPanel />
        </section>
      )}

      <footer className="mt-16 w-full bg-white border-t border-[#969696]/30 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
          <p className="font-sans text-xs leading-relaxed text-[#51615a] max-w-lg mx-auto font-normal">
            This microsite is a simple progress space for OAHA. Return to our main site at{" "}
            <a
              href="https://oaha.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline text-[#2E536B] transition-colors hover:text-[#2BB7BA]"
            >
              oaha.uk
            </a>{" "}
            or connect with us on LinkedIn:{" "}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline text-[#2E536B] transition-colors hover:text-[#2BB7BA]"
            >
              LinkedIn
            </a>
            .
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-[#818e87] font-semibold">
            <span className="opacity-85 transition-opacity duration-300 hover:opacity-100 flex items-center justify-center h-5 w-5">
              <Logo size="sm" className="max-h-5 max-w-5" />
            </span>
            <span>© 2026 OAHA UK. OPERATIONAL UPDATE INITIATIVE.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

// v0.2 emphasis helpers — applied to the section that matches the user's
// goal. Deliberately soft: a 1px ring + a small note above the panel, not a
// reflow or panel-hiding treatment. The other panels stay fully usable.
function emphasisWrap(isActive: boolean): string {
  return isActive
    ? "rounded-xl ring-2 ring-brand-orange/60 ring-offset-4 ring-offset-[#faf9f6]"
    : "";
}

function ModeEmphasisLabel({
  userType,
  goal,
  reason,
}: {
  userType: UserType;
  goal: UserGoal;
  reason: string;
}) {
  return (
    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-3 py-1 text-[11px] font-bold text-brand-orange ring-1 ring-brand-orange/20">
      <svg className="h-2 w-2 text-brand-orange animate-pulse" fill="currentColor" viewBox="0 0 8 8" aria-hidden>
        <circle cx="4" cy="4" r="3" />
      </svg>
      <span className="font-mono uppercase tracking-wider text-[10px]">
        {USER_TYPE_LABELS[userType]} · {USER_GOAL_LABELS[goal]}
      </span>
      <span className="hidden text-brand-orange/90 font-medium sm:inline">— {reason}</span>
    </div>
  );
}

function LSOAChip({
  feature,
  wimdDomain,
  onClear,
}: {
  feature: GeoJSON.Feature;
  wimdDomain: WimdDomain;
  onClear: () => void;
}) {
  const p = feature.properties ?? {};
  const display = (p.displayName as string) || (p.LSOA21NM as string) || "Selected LSOA";
  const code = p.LSOA21CD as string | undefined;
  const score = code ? wimdScoreFor(code, wimdDomain) : null;
  const swatch = score ? WIMD_RAMP[score.quintile] : "#cbd5e1";
  const qLabel = score ? QUINTILE_LABELS[score.quintile] : null;
  const domainLabel = WIMD_DOMAIN_LABELS[wimdDomain];
  return (
    <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl bg-sand-card/95 border border-brand-border px-3.5 py-2.5 text-xs shadow-md backdrop-blur sm:max-w-[340px]">
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 inline-block h-3 w-4 flex-none rounded-sm ring-1 ring-black/10"
          style={{ background: swatch }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-brand-navy">
            Filtering by LSOA
          </div>
          <div className="truncate text-sm font-bold text-charcoal">{display}</div>
          {score && (
            <div className="mt-0.5 text-[11px] text-charcoal-light font-normal">
              <span className="text-brand-gray font-semibold">{domainLabel}:</span> rank {score.rank}
              {qLabel && <span className="text-brand-gray"> · {qLabel}</span>}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex-none rounded-md p-1 text-brand-gray hover:bg-brand-border/40 hover:text-charcoal cursor-pointer"
          aria-label="Clear LSOA filter"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
