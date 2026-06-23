"use client";

// v0.2 Opportunity Snapshot (BUILD_BRIEF.md §0.6). Authored panel that shows
// a place-aware view of the labour market — sector mix, named major employers
// (linked to org pins where they appear in the dataset), and illustrative
// vacancy / apprenticeship counts. Every card carries an `illustrative`
// badge; v0.3 would wire to real sources (StatsWales, Find an Apprenticeship,
// Adzuna, etc.).

import type { OpportunitySnapshot, Organisation } from "@/lib/types";

type Props = {
  snapshot: OpportunitySnapshot;
  orgsById: Map<string, Organisation>;
  /** Human label of the LSOA the user has selected, if any. Lets the panel
   *  acknowledge a selection when no place-specific snapshot exists for it. */
  selectedLsoaLabel?: string | null;
  /** If provided, clicking an employer name opens its detail panel. */
  onSelectEmployer?: (orgId: string) => void;
};

export function OpportunitySnapshotPanel({
  snapshot,
  orgsById,
  selectedLsoaLabel,
  onSelectEmployer,
}: Props) {
  const isLsoa = snapshot.scope === "lsoa";
  // Three possible states for the hint:
  //   1. LSOA-specific snapshot shown → no hint needed (LSOA name is the heading).
  //   2. Cardiff fallback because user clicked an LSOA we don't have data for.
  //   3. Cardiff fallback because user hasn't clicked anything yet.
  const hint =
    !isLsoa && selectedLsoaLabel
      ? `No place-specific snapshot for ${selectedLsoaLabel} yet — showing the Cardiff-wide view.`
      : !isLsoa
        ? "Click an LSOA on the map for a place-specific snapshot."
        : null;
  return (
    <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
              Opportunity Snapshot
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-charcoal font-display">
            {snapshot.areaLabel}
          </h3>
          {hint && (
            <p className="mt-0.5 text-[11px] text-charcoal-light font-normal">{hint}</p>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-charcoal-light font-normal leading-relaxed">{snapshot.labourMarketHeadline}</p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Sector strengths">
          <ul className="space-y-1.5 text-[12px]">
            {snapshot.topSectors.map((s) => (
              <li key={s.sector} className="flex items-baseline justify-between gap-3 font-normal text-charcoal-light">
                <span>{s.sector}</span>
                <span className="font-normal text-charcoal">{s.share}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Major employers">
          <ul className="space-y-1.5 text-[12px]">
            {snapshot.majorEmployerIds.map((id) => {
              const org = orgsById.get(id);
              const name = org?.name ?? id;
              const sectorLabel = org?.sector ?? "—";
              return (
                <li key={id} className="flex items-baseline justify-between gap-3 font-normal text-charcoal-light">
                  {org && onSelectEmployer ? (
                    <button
                      type="button"
                      onClick={() => onSelectEmployer(id)}
                      className="truncate text-left text-charcoal font-normal hover:text-brand-navy hover:underline cursor-pointer"
                    >
                      {name}
                    </button>
                  ) : (
                    <span className="truncate text-charcoal font-normal">{name}</span>
                  )}
                  <span className="flex-none text-[10px] font-mono font-normal uppercase tracking-wider text-brand-gray">
                    {sectorLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Vacancies & apprenticeships">
          <ul className="space-y-1.5 text-[12px]">
            {snapshot.vacancies.map((v) => (
              <li key={v.label} className="flex items-baseline justify-between gap-3 font-normal text-charcoal-light">
                <span>{v.label}</span>
                <span className="font-normal text-charcoal">{v.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-3.5 shadow-sm">
      <div className="mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
        {title}
      </div>
      {children}
    </div>
  );
}

function IllustrativeBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-orange ring-1 ring-brand-orange/20">
      <span aria-hidden>✦</span> Illustrative
    </span>
  );
}
