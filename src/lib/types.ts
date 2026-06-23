// Shared TypeScript types for the v0.1 prototype.
// Mirrors §3 of BUILD_BRIEF.md.

export type Sector = "VCSE" | "Education" | "Public" | "Private";

export type OrganisationType =
  | "Charity / VCSE"
  | "Community group"
  | "School"
  | "College / FE"
  | "Local authority"
  | "Public sector"
  | "Corporate / employer"
  | "Funder";

export type Organisation = {
  id: string;
  name: string;
  type: OrganisationType;
  sector: Sector;
  categoryTags: string[];
  description: string;
  geographyServed: string;
  location: [number, number]; // [lng, lat]
  contact?: { website?: string; email?: string; phone?: string };
};

export type Stage = "J1" | "J2" | "J3" | "J4" | "J5" | "J6";

export type EngagementType =
  | "Deliverer"
  | "Involved"
  | "Informed"
  | "Funder"
  | "Often overlooked";

export type Provenance = "real" | "illustrative";

export type FrameworkMapping = {
  id: string;
  orgId: string;
  stage: string;          // Stage, but tolerate "J1-J6" and stray values in v0.1 data
  barrier: string;
  stakeholderGroup: string;
  engagementType: string; // EngagementType, but tolerate edge cases
  provenance?: Provenance; // absent = real (from Phase 1 xlsx); "illustrative" = inferred role mapping (v0.2 employer additions)
};

// Human-readable labels for the J1–J6 stages. Drives the journey-stage
// explainer strip in v0.2 and the stage chips in OrgDetailPanel.
export const STAGE_LABELS: Record<Stage, string> = {
  J1: "Home & community",
  J2: "School",
  J3: "Post-16",
  J4: "Entry to work",
  J5: "In-work progression",
  J6: "Re-entry / second chance",
};

// WIMD 2025 domains. "overall" is the composite rank; the seven named domains
// are the contributing axes. Switching the map's choropleth between these is
// the v0.2 deprivation-indicator switcher (Phase 4).
export type WimdDomain =
  | "overall"
  | "income"
  | "employment"
  | "health"
  | "education"
  | "accessToServices"
  | "housing"
  | "communitySafety"
  | "physicalEnvironment";

export const WIMD_DOMAIN_LABELS: Record<WimdDomain, string> = {
  overall: "Overall deprivation",
  income: "Income",
  employment: "Employment",
  health: "Health",
  education: "Education",
  accessToServices: "Access to services",
  housing: "Housing",
  communitySafety: "Community safety",
  physicalEnvironment: "Physical environment",
};

export type Indicator = {
  id: string;
  placeId: string;
  name: string;
  value: number | string;
  unit?: string;
  context?: string;
  source: string;
  asOfDate: string;
};

export type CommunityInsight = {
  id: string;
  placeId: string;
  location?: [number, number];
  theme: string;
  populationGroup: string;
  text: string;
  source: string;
  visibility: "public" | "coalition" | "admin";
  status: "approved" | "pending";
};

export type Gap = {
  id: string;
  title: string;
  body: string;
  basis: "indicator" | "org-density" | "insight" | "filter-derived";
  potentialWorkstream?: string; // v0.2 — short next-step framing rendered as "Could become workstream: …"
};

// v0.2 stubbed-preview entity. Module 2 (Collaboration Engine) is still out
// of scope; these are illustrative cards shown when the user picks the
// "see workstreams" path from the needs-led chooser.
export type Workstream = {
  id: string;
  title: string;
  focus: string;               // one-line frame, e.g. "Splott J5 in-work progression"
  stage: Stage | "Cross-stage";
  participatingOrgIds: string[]; // FK → Organisation.id
  status: "exploring" | "forming" | "active" | "planned";
  summary: string;
  provenance: "illustrative";
};

// v0.2 needs-led chooser. Drives panel emphasis on the page.
// "as" = who the user identifies as; "goal" = what they're trying to do.
// Both are URL-persisted (?as=community&goal=deprivation).
export type UserType = "community" | "employer";
export type UserGoal = "deprivation" | "organisations" | "workstreams";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  community: "Community group",
  employer: "Employer",
};

export const USER_GOAL_LABELS: Record<UserGoal, string> = {
  deprivation: "Understand deprivation in this place",
  organisations: "See active organisations",
  workstreams: "See workstreams",
};

// v0.2 panel data. Drives the Opportunity Snapshot block shown when an LSOA
// is selected (or Cardiff-wide as a fallback). All fields are authored —
// every card must render with an "illustrative" badge.
export type OpportunitySnapshot = {
  id: string;
  scope: "cardiff" | "lsoa";
  lsoa11cd?: string;            // present when scope === "lsoa"
  areaLabel: string;            // human label, e.g. "Splott 3" or "Cardiff (LA-wide)"
  labourMarketHeadline: string;
  topSectors: { sector: string; share: string }[];
  majorEmployerIds: string[];   // FK → Organisation.id
  vacancies: { label: string; count: number | string }[];
  provenance: "illustrative";
};

// Sector colour palette — keep in sync with tailwind.config.ts and
// the MapLibre paint expressions in Map.tsx.
export const SECTOR_COLOURS: Record<Sector, string> = {
  VCSE: "#059669",       // emerald-600
  Education: "#2563eb",  // blue-600
  Public: "#d97706",     // amber-600
  Private: "#e11d48",    // rose-600
};

// WIMD quintile ramp — single-hue red, dark = most deprived.
export const WIMD_RAMP: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "#7f1d1d", // red-900 — most deprived
  2: "#b91c1c", // red-700
  3: "#ef4444", // red-500
  4: "#fca5a5", // red-300
  5: "#fee2e2", // red-100 — least deprived
};
