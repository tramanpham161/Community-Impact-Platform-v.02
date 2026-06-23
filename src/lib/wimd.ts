// WIMD 2025 lookup helpers used by the map (paint expressions) and by
// page-level UI like the LSOAChip (to show the per-domain rank and quintile
// for whichever indicator the user has switched to).

import wimdData from "@data/wimd-cardiff.json";
import type { WimdDomain } from "@/lib/types";

type WimdLsoaRow = {
  lsoa21cd: string;
  lsoa21nm: string;
  overallRank: number;
  overallQuintile: 1 | 2 | 3 | 4 | 5;
  domainRanks: {
    income: number;
    employment: number;
    health: number;
    education: number;
    accessToServices: number;
    housing: number;
    communitySafety: number;
    physicalEnvironment: number;
  };
};

const META = wimdData as unknown as {
  totalWelshLsoas: number;
  lsoas: WimdLsoaRow[];
};

export const TOTAL_WELSH_LSOAS = META.totalWelshLsoas;
const QUINTILE_SIZE = TOTAL_WELSH_LSOAS / 5;

export function rankToQuintile(rank: number): 1 | 2 | 3 | 4 | 5 {
  const q = Math.ceil(rank / QUINTILE_SIZE);
  return Math.min(Math.max(q, 1), 5) as 1 | 2 | 3 | 4 | 5;
}

type DomainScores = Record<WimdDomain, { rank: number; quintile: 1 | 2 | 3 | 4 | 5 }>;

const BY_CODE = new Map<string, DomainScores>();
for (const row of META.lsoas) {
  const scores: DomainScores = {
    overall: { rank: row.overallRank, quintile: row.overallQuintile },
    income: { rank: row.domainRanks.income, quintile: rankToQuintile(row.domainRanks.income) },
    employment: { rank: row.domainRanks.employment, quintile: rankToQuintile(row.domainRanks.employment) },
    health: { rank: row.domainRanks.health, quintile: rankToQuintile(row.domainRanks.health) },
    education: { rank: row.domainRanks.education, quintile: rankToQuintile(row.domainRanks.education) },
    accessToServices: { rank: row.domainRanks.accessToServices, quintile: rankToQuintile(row.domainRanks.accessToServices) },
    housing: { rank: row.domainRanks.housing, quintile: rankToQuintile(row.domainRanks.housing) },
    communitySafety: { rank: row.domainRanks.communitySafety, quintile: rankToQuintile(row.domainRanks.communitySafety) },
    physicalEnvironment: { rank: row.domainRanks.physicalEnvironment, quintile: rankToQuintile(row.domainRanks.physicalEnvironment) },
  };
  BY_CODE.set(row.lsoa21cd, scores);
}

/** All WIMD domain scores for a single LSOA, or null if the code is unknown. */
export function wimdScoresFor(lsoa11cd: string): DomainScores | null {
  return BY_CODE.get(lsoa11cd) ?? null;
}

/** Convenience: rank + quintile for one LSOA on one domain. */
export function wimdScoreFor(
  lsoa11cd: string,
  domain: WimdDomain
): { rank: number; quintile: 1 | 2 | 3 | 4 | 5 } | null {
  const all = BY_CODE.get(lsoa11cd);
  return all ? all[domain] : null;
}
