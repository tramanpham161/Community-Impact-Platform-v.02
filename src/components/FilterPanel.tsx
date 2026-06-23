"use client";

// v0.2 simplified filter (BUILD_BRIEF.md §0.2). Three controls — organisation
// type, geography (driven by LSOA click), service type. Journey stage is the
// fourth filter axis but is set via the JourneyStageStrip component (it gets
// its own visual treatment to double as the explainer), not a dropdown here.

import type { OrganisationType } from "@/lib/types";
import { EMPTY_FILTERS, type FilterState, hasAnyFilter } from "@/lib/filters";

type Props = {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  options: {
    organisationTypes: OrganisationType[];
    serviceTypes: string[];
  };
  visibleCount: number;
  totalCount: number;
  /** Human label of the currently selected geography (e.g. "Splott 3"), or null. */
  selectedGeographyLabel?: string | null;
  /** Clear the geography filter (LSOA selection lives in page.tsx). */
  onClearGeography?: () => void;
};

export function FilterPanel({
  filters,
  onChange,
  options,
  visibleCount,
  totalCount,
  selectedGeographyLabel,
  onClearGeography,
}: Props) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    onChange({ ...filters, [k]: v });

  const activeCount =
    Object.values(filters).filter((v) => v !== null).length +
    (selectedGeographyLabel ? 1 : 0);
  const hasActive = activeCount > 0;

  return (
    <div className="rounded-xl border border-brand-border bg-sand-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
            Organisation filters
          </span>
          {hasActive && (
            <span className="inline-flex items-center rounded-full bg-brand-navy/10 px-2 py-0.5 text-[10px] font-bold text-brand-navy ring-1 ring-brand-navy/20">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3 text-xs text-charcoal-light font-normal">
          <span>
            Showing <span className="font-semibold text-charcoal">{visibleCount}</span> of {totalCount} organisations
          </span>
          {(hasAnyFilter(filters) || selectedGeographyLabel) && (
            <button
              type="button"
              onClick={() => {
                onChange(EMPTY_FILTERS);
                if (selectedGeographyLabel && onClearGeography) onClearGeography();
              }}
              className="font-semibold text-brand-orange hover:text-brand-orange/80 hover:underline cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-3">
        <Select
          label="Organisation type"
          value={filters.organisationType}
          onChange={(v) => set("organisationType", v as OrganisationType | null)}
          options={options.organisationTypes.map((t) => ({ value: t, label: t }))}
        />
        <GeographyField
          selectedLabel={selectedGeographyLabel ?? null}
          onClear={onClearGeography}
        />
        <Select
          label="Service type"
          value={filters.serviceType}
          onChange={(v) => set("serviceType", v)}
          options={options.serviceTypes.map((t) => ({ value: t, label: t }))}
        />
      </div>
    </div>
  );
}

function GeographyField({
  selectedLabel,
  onClear,
}: {
  selectedLabel: string | null;
  onClear?: () => void;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">Geography</span>
      {selectedLabel ? (
        <div className="flex items-center gap-2 rounded-md border border-brand-navy bg-brand-navy/5 px-2.5 py-1.5 text-xs text-charcoal">
          <span className="truncate font-semibold text-brand-navy">{selectedLabel}</span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="ml-auto rounded p-0.5 text-brand-gray hover:bg-brand-navy/10 hover:text-brand-navy transition cursor-pointer"
              aria-label="Clear geography filter"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-brand-border bg-sand-bg/60 px-2.5 py-1.5 text-xs text-brand-gray">
          <svg className="h-3.5 w-3.5 flex-none text-brand-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-8 3 8M5 21l7-18 7 18M3 17h18" />
          </svg>
          <span className="truncate text-[11px] font-mono font-semibold">Click an LSOA on map</span>
        </div>
      )}
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | null;
  onChange: (v: T | null) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="block bg-transparent">
      <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">{label}</span>
      <select
        className="block w-full rounded-md border border-brand-border bg-white px-2.5 py-1.5 text-xs text-charcoal focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : (e.target.value as T))}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
