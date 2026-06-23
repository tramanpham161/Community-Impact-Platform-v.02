// Filter state and predicate helpers used by FilterPanel + page composition.
//
// v0.2 simplification (BUILD_BRIEF.md §0.2): the dual-filter (flat + framework
// axes, 6 controls) collapsed into a single set of 3 controls — organisation
// type, journey stage, service type. The fourth axis the feedback names —
// geography — is driven by clicking an LSOA on the map and lives in page.tsx
// as `selectedLSOACode`, not in this FilterState (it composes with the panel
// filters at render time in page.tsx).
//
// Removed: categoryTag (renamed to serviceType), sector, barrier, engagementType.
// `serviceType` reads from Organisation.categoryTags — same values, new name in
// the UI to match the feedback's vocabulary.

import type {
  FrameworkMapping,
  Organisation,
  OrganisationType,
  Stage,
} from "@/lib/types";

export type FilterState = {
  organisationType: OrganisationType | null;
  stage: Stage | null;
  serviceType: string | null; // a single value from Organisation.categoryTags
};

export const EMPTY_FILTERS: FilterState = {
  organisationType: null,
  stage: null,
  serviceType: null,
};

export function hasAnyFilter(f: FilterState): boolean {
  return Object.values(f).some((v) => v !== null);
}

/** True if the org matches the org-level filters (type, service type). */
function matchesOrg(org: Organisation, f: FilterState): boolean {
  if (f.organisationType && org.type !== f.organisationType) return false;
  if (f.serviceType && !org.categoryTags.includes(f.serviceType)) return false;
  return true;
}

/** True if the mapping satisfies the stage filter. "J1-J6" spans all stages. */
function matchesMapping(m: FrameworkMapping, f: FilterState): boolean {
  if (f.stage && m.stage !== f.stage && m.stage !== "J1-J6") return false;
  return true;
}

/**
 * An organisation is visible iff:
 *   - it satisfies the org-level filters, AND
 *   - if a stage filter is set, at least one of its framework mappings matches.
 */
export function filterOrgs(
  orgs: Organisation[],
  mappings: FrameworkMapping[],
  f: FilterState
): Organisation[] {
  const mappingsByOrg = new Map<string, FrameworkMapping[]>();
  for (const m of mappings) {
    const list = mappingsByOrg.get(m.orgId) ?? [];
    list.push(m);
    mappingsByOrg.set(m.orgId, list);
  }
  const stageActive = !!f.stage;
  return orgs.filter((org) => {
    if (!matchesOrg(org, f)) return false;
    if (!stageActive) return true;
    const orgMappings = mappingsByOrg.get(org.id) ?? [];
    return orgMappings.some((m) => matchesMapping(m, f));
  });
}
