import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  Users, 
  Smile, 
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sliders,
  RotateCcw
} from "lucide-react";

interface WardImpact {
  ward: string;
  target: number;
  actual: number;
  deprivationRank: string; // WIMD Context
}

const INITIAL_WARD_IMPACTS: WardImpact[] = [
  { ward: "Splott", target: 400, actual: 362, deprivationRank: "Quintile 1 (High)" },
  { ward: "Butetown", target: 500, actual: 480, deprivationRank: "Quintile 1 (High)" },
  { ward: "Grangetown", target: 450, actual: 412, deprivationRank: "Quintile 2" },
  { ward: "Ely", target: 350, actual: 310, deprivationRank: "Quintile 1 (High)" },
  { ward: "Llanrumney", target: 300, actual: 245, deprivationRank: "Quintile 2" },
  { ward: "Adamsdown", target: 250, actual: 235, deprivationRank: "Quintile 1 (High)" },
];

interface FunnelStep {
  stage: string;
  label: string;
  count: number;
  pct: number;
  description: string;
  outcomes: string[];
}

const FUNNEL_STEPS: FunnelStep[] = [
  { 
    stage: "J1", 
    label: "Engaged & Registered", 
    count: 1540, 
    pct: 100, 
    description: "Initial intake, basic needs assessment, and inclusion in the Cardiff outreach database.",
    outcomes: ["Completed basic profile assessment", "Assigned a regional coach", "Identified primary language/digital barriers"]
  },
  { 
    stage: "J2", 
    label: "Needs Diagnosed & Action Plan", 
    count: 1220, 
    pct: 79, 
    description: "Personalised action plans completed, setting path across child literacy, housing, or confidence goals.",
    outcomes: ["Co-designed multi-week goals map", "Matched with child literacy support groups", "Action protocol logged directly with VCSE portal"]
  },
  { 
    stage: "J3", 
    label: "Confidence & Core Skills", 
    count: 890, 
    pct: 58, 
    description: "Participation in community-led soft skills programs, workplace-behaviours coaching and digital inclusion labs.",
    outcomes: ["Completed 10-hour workplace training pilot", "Participated in 3 group communication workshops", "Attended localized mock HR interview cycles"]
  },
  { 
    stage: "J4", 
    label: "Vocational & Employer Prep", 
    count: 670, 
    pct: 44, 
    description: "Formal training and workshops led directly by opportunity employers, focusing on regional employment needs.",
    outcomes: ["Certified in entry-level vocational modules", "Vouched for by local trade coalition members", "1-on-1 resume alignment mapping with corporate mentors"]
  },
  { 
    stage: "J5", 
    label: "Supported Placements", 
    count: 490, 
    pct: 32, 
    description: "Placed into real work contexts with opportunity employers or formal apprentice tracks.",
    outcomes: ["Commenced formal 12-week supported internship", "Assigned internal company buddy", "Secured initial wage structures at or above Real Living Wage"]
  },
  { 
    stage: "J6", 
    label: "Sustained Career Track (6M+)", 
    count: 360, 
    pct: 23, 
    description: "Maintained retention and continuous progression beyond the six-month employer support threshold.",
    outcomes: ["Logged continuous employment at 180-day milestone", "Participated in exit peer-review tracking interviews", "Enrolled in higher-tier local professional growth frameworks"]
  }
];

export function ImpactPanel() {
  const [selectedFunnelIndex, setSelectedFunnelIndex] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.0); // Interactive scale factor
  const [activeWimdDomain, setActiveWimdDomain] = useState<string>("overall");
  const [wardImpacts, setWardImpacts] = useState<WardImpact[]>(INITIAL_WARD_IMPACTS);

  // Interactive qualitative statement state
  const [cohortSelect, setCohortSelect] = useState("all");
  const [timeScope, setTimeScope] = useState("ytd");

  const computedWardImpacts = useMemo(() => {
    return wardImpacts.map(w => ({
      ...w,
      actual: Math.round(w.actual * multiplier),
      percentage: Math.round(((w.actual * multiplier) / w.target) * 100)
    }));
  }, [wardImpacts, multiplier]);

  const activeStep = FUNNEL_STEPS[selectedFunnelIndex];

  // Dynamic WIMD Matrix engagement indexes based on selected indices
  const wimdEngagementScores: Record<string, Record<number, number>> = {
    overall: { 1: 82, 2: 74, 3: 56, 4: 42, 5: 28 },
    income: { 1: 88, 2: 78, 3: 51, 4: 38, 5: 24 },
    education: { 1: 85, 2: 71, 3: 59, 4: 45, 5: 31 },
    health: { 1: 79, 2: 75, 3: 54, 4: 40, 5: 29 },
    housing: { 1: 91, 2: 81, 3: 48, 4: 35, 5: 19 }
  };

  const currentWimdMatrix = wimdEngagementScores[activeWimdDomain] || wimdEngagementScores.overall;

  const handleResetFilters = () => {
    setMultiplier(1.0);
    setActiveWimdDomain("overall");
    setSelectedFunnelIndex(0);
    setCohortSelect("all");
    setTimeScope("ytd");
  };

  return (
    <div className="space-y-10">
      {/* Overview */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
            Impact Measurement Layer
          </h2>
          <p className="mt-2 text-sm font-normal text-charcoal-light leading-relaxed max-w-4xl">
            Evaluate quantitative and qualitative outcomes across the cohort lifecycle. Cross-reference participant journey conversions with Wales Index of Multiple Deprivation (WIMD) datasets to ensure we reach the most structurally excluded communities.
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-white px-3.5 py-1.5 text-xs font-mono font-normal text-charcoal hover:bg-brand-border/20 transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 text-brand-gray" />
          Reset Metrics
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-green" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-green">
              Retention Rate (J6)
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-semibold text-charcoal">
              {(73.4 * multiplier).toFixed(1)}%
            </span>
            <span className="ml-2 text-xs text-brand-green font-semibold">+4.2% vs baseline</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-navy" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
              Average engagement index
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-semibold text-charcoal">
              {Math.min(100, Math.round(78 * multiplier))}/100
            </span>
            <span className="ml-2 text-xs text-charcoal-light font-medium">high target fidelity</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-brand-teal" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-teal">
              Support Satisfaction
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-semibold text-charcoal">
              92.4%
            </span>
            <span className="ml-2 text-xs text-charcoal-light font-medium">942 surveys</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-brand-bronze" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-bronze">
              Accreditation Rate
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl font-semibold text-charcoal">
              {Math.min(100, Math.round(62 * multiplier))}%
            </span>
            <span className="ml-2 text-xs text-charcoal-light font-medium">vocational modules</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Interactive Funnel (Col 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
                  Cardiff Employment Journey Conversion Funnel (J1-J6)
                </h3>
                <p className="text-[11px] text-charcoal-light mt-0.5">Click any stage block in the pipeline to explore deep-dive outcomes and micro-measurements.</p>
              </div>
              <span className="rounded bg-brand-navy/10 px-2 py-0.5 font-mono text-[10px] font-bold text-brand-navy uppercase">
                COHORT-WIDE
              </span>
            </div>

            {/* Funnel Layout */}
            <div className="mt-6 space-y-3">
              {FUNNEL_STEPS.map((step, idx) => {
                const isActive = selectedFunnelIndex === idx;
                const adjustedCount = Math.round(step.count * multiplier);
                
                return (
                  <div
                    key={step.stage}
                    onClick={() => setSelectedFunnelIndex(idx)}
                    className={`relative flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition duration-200 hover:scale-[1.01] ${
                      isActive 
                        ? "border-brand-navy bg-brand-navy/5 shadow-sm" 
                        : "border-brand-border bg-sand-card/40 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-10 items-center justify-center rounded-md text-xs font-mono font-bold ${
                        isActive ? "bg-brand-navy text-sand-bg" : "bg-brand-border/60 text-charcoal-light"
                      }`}>
                        {step.stage}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-charcoal leading-snug truncate">
                          {step.label}
                        </div>
                        <div className="text-[10px] text-brand-gray font-normal truncate max-w-sm sm:max-w-md">
                          {step.description}
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-3">
                      <div className="text-xs font-bold text-charcoal font-mono">
                        {adjustedCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-brand-gray font-mono">
                        {step.pct}% conversion
                      </div>
                    </div>

                    {/* Progress Fill Background bar inside node */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-border/20 rounded-b-lg overflow-hidden">
                      <div 
                        className="h-full bg-brand-navy/40 transition-all duration-300" 
                        style={{ width: `${step.pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Funnel Stage Insights */}
            <div className="mt-6 rounded-xl border border-brand-border bg-sand-card p-5">
              <div className="flex items-center gap-2 text-brand-navy border-b border-brand-border/60 pb-2">
                <ShieldCheck className="h-4 w-4" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                  Stage {activeStep.stage} Key Deliverables & Measurement Protocols
                </h4>
              </div>

              <p className="mt-3 text-xs text-charcoal-light leading-relaxed">
                {activeStep.description} Below are the certified milestones required to transition participants to the subsequent tier:
              </p>

              <ul className="mt-3 space-y-2">
                {activeStep.outcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-charcoal-light">
                    <span className="mt-1 flex h-1.5 w-1.5 flex-none rounded-full bg-brand-orange" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sliders & Local Geographic Analysis (Col 3) */}
        <div className="space-y-6">
          {/* Metrics Adjuster Widget */}
          <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-brand-navy" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
                Interactive Multiplier
              </h3>
            </div>
            <p className="text-[11px] text-charcoal-light leading-snug">
              Adjust this slider to project outcome changes across Cardiff wards based on increased funding efficiency or mentor density.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-charcoal-light">Cohort Volume Impact:</span>
                <span className="font-bold text-brand-navy">{(multiplier * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-navy"
              />
              <div className="flex justify-between text-[9px] font-mono text-brand-gray">
                <span>0.5x Scale</span>
                <span>Normal (1.0x)</span>
                <span>1.5x Boost</span>
              </div>
            </div>
          </div>

          {/* WIMD Deprivation Engagement Matrix */}
          <div className="rounded-xl border border-brand-border bg-white p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-brand-navy">
                Deprivation Targeting Matrix
              </h3>
              <p className="text-[11px] text-charcoal-light">WIMD engagement index across local quintiles.</p>
            </div>

            <div className="flex items-center gap-2 border-b border-brand-border pb-2.5">
              <label className="text-[10px] font-sans font-bold text-brand-gray uppercase" htmlFor="metric-wimd-domain">
                Domain Layer
              </label>
              <select
                id="metric-wimd-domain"
                value={activeWimdDomain}
                onChange={(e) => setActiveWimdDomain(e.target.value)}
                className="flex-1 rounded border border-brand-border bg-white px-2 py-0.5 text-xs text-charcoal focus:outline-none"
              >
                <option value="overall">Overall Indicators</option>
                <option value="income">Income domain</option>
                <option value="education">Education/Skills domain</option>
                <option value="health">Health domain</option>
                <option value="housing">Housing domain</option>
              </select>
            </div>

            <div className="space-y-4 pt-1">
              {[1, 2, 3, 4, 5].map((q) => {
                const score = currentWimdMatrix[q] || 50;
                const isHighDeprivation = q <= 2;
                
                return (
                  <div key={q} className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-charcoal-light font-medium min-w-[130px]">
                      Quintile {q} {q === 1 ? "(Most Deprived)" : q === 5 ? "(Least)" : ""}
                    </span>
                    <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isHighDeprivation ? "bg-[#FF9900]" : "bg-brand-navy"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="font-mono font-semibold text-charcoal w-12 text-right">{score}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Target vs Actual (Wards Comparison) */}
      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm space-y-6">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
            Ward-Level Delivery Performance Matrix (Target vs Actual)
          </h3>
          <p className="text-[11px] text-charcoal-light mt-0.5">Monitoring active placement engagement directly within targeted Cardiff wards.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {computedWardImpacts.map((w) => {
            return (
              <div key={w.ward} className="group rounded-lg border border-brand-border/40 bg-sand-card/30 p-4 transition duration-200 hover:bg-white hover:border-brand-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <h5 className="text-xs font-bold text-charcoal">{w.ward}</h5>
                    <span className="font-mono text-[9px] text-brand-gray uppercase tracking-wider">{w.deprivationRank}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-charcoal">
                    {w.actual} / <span className="text-brand-gray">{w.target} actual</span>
                  </span>
                </div>

                {/* Grid Visual Bar */}
                <div className="mt-3 relative h-6 rounded-md bg-brand-border/30 overflow-hidden flex items-center px-2">
                  <div 
                    className="absolute inset-y-0 left-0 bg-brand-navy/15 rounded-l-md transition-all duration-300"
                    style={{ width: `${Math.min(100, w.percentage)}%` }}
                  />
                  <div className="relative flex justify-between w-full text-[10px] font-mono">
                    <span className="text-brand-navy font-semibold">T: {w.target}</span>
                    <span className="text-charcoal font-semibold">{w.percentage}% achieved</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Qualitative Outcome Generator / Interactive Narrative Workspace */}
      <div className="rounded-xl border border-brand-border bg-sand-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-brand-navy border-b border-brand-border pb-2">
          <Sparkles className="h-4 w-4" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
            Coalition Outcome Statement Generator
          </h3>
        </div>
        <p className="text-xs text-charcoal-light leading-relaxed">
          Configure parameters below to synthesise a formal, evidence-backed narrative on Cardiff social mobility outputs. This combines our actual LSOA metrics and active partner registries into a professional outcome statement.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy" htmlFor="cohort-select">
              Focus Cohort
            </label>
            <select
              id="cohort-select"
              value={cohortSelect}
              onChange={(e) => setCohortSelect(e.target.value)}
              className="block w-full rounded-md border border-brand-border bg-white px-2.5 py-1.5 text-xs text-charcoal focus:border-brand-navy focus:outline-none"
            >
              <option value="all">All Cardiff Cohorts</option>
              <option value="neet">NEET Youth (under 25)</option>
              <option value="refugee">Refugee & Integration Groups</option>
              <option value="retention">6-Month Retained Employees</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy" htmlFor="time-select">
              Reporting Window
            </label>
            <select
              id="time-select"
              value={timeScope}
              onChange={(e) => setTimeScope(e.target.value)}
              className="block w-full rounded-md border border-brand-border bg-white px-2.5 py-1.5 text-xs text-charcoal focus:border-brand-navy"
            >
              <option value="ytd">Year-to-Date (Jan - June 2026)</option>
              <option value="q2">Quarter 2 (April - June 2026)</option>
              <option value="annual">Projected Full Year 2026</option>
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <label className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy" htmlFor="qual-factor">
              Scale Context
            </label>
            <div className="text-xs px-2.5 py-2 rounded-md border border-brand-border bg-white font-mono flex items-center justify-between">
              <span className="text-brand-gray">Multiplier coefficient:</span>
              <span className="font-semibold text-brand-navy">{multiplier.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Generated outcomes string */}
        <div className="rounded-xl border border-brand-border bg-white p-5 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/40 text-[10px] font-mono text-brand-gray uppercase">
            <span>Synthesised Coalition Narrative (British English)</span>
            <span className="text-brand-navy font-semibold">VALIDATED PRESET</span>
          </div>

          <div className="mt-4 text-xs text-charcoal leading-relaxed space-y-3 font-normal">
            <p>
              As of the conclusion of the <strong>{timeScope === "ytd" ? "Year-to-Date (Jan-Jun 2026)" : timeScope === "q2" ? "Quarter 2 (Apr-Jun 2026)" : "Projected Annual 2026"} period</strong>, the Cardiff Social Mobility Alliance has successfully mapped <strong>{Math.round(1540 * multiplier)} active participants</strong> across the strategic J1 to J6 transition pathway. Focusing on <strong>{cohortSelect === "all" ? "All Cardiff Cohorts" : cohortSelect === "neet" ? "NEET Youth under 25" : cohortSelect === "refugee" ? "Refugee & Integration Groups" : "6-Month Retained Employees"}</strong>, targeting was concentrated in high-deprivation areas corresponding to <strong>WIMD Quintiles 1 & 2</strong>, registering a strong fidelity rate.
            </p>
            <p>
              Operational conversions demonstrate that <strong>{Math.round(1220 * multiplier)} participants</strong> successfully completed diagnostic intakes (J2), leading directly to <strong>{Math.round(490 * multiplier)} supported placements (J5)</strong> with opportunity employers. Continuous coaching post-entry enabled <strong>{Math.round(360 * multiplier)} individuals</strong> to sustain their career tracks beyond the 180-day milestone (J6). To scale these outcomes further, resource density in wards such as Splott and Butetown should remain a first-tier priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
