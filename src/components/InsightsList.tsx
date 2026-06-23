"use client";

import { useState, useMemo, useEffect } from "react";
import type { CommunityInsight } from "@/lib/types";

type Props = {
  insights: CommunityInsight[];
  selectedInsightId: string | null;
  onSelectInsight: (id: string | null) => void;
};

const getThemeTagStyle = (theme: string): string => {
  const t = theme.toLowerCase();
  if (t.includes("employ")) return "bg-brand-navy/10 text-brand-navy border border-brand-navy/15";
  if (t.includes("edu") || t.includes("school")) return "bg-brand-teal/10 text-brand-teal border border-brand-teal/15";
  if (t.includes("health") || t.includes("well")) return "bg-brand-green/10 text-brand-green border border-brand-green/15";
  if (t.includes("disabilit") || t.includes("access")) return "bg-brand-bronze/10 text-brand-bronze border border-brand-bronze/20";
  return "bg-brand-gray/10 text-brand-gray border border-brand-gray/15";
};

const getGroupTagStyle = (group: string): string => {
  const g = group.toLowerCase();
  if (g.includes("young") || g.includes("youth") || g.includes("child")) return "bg-brand-teal/10 text-brand-teal border border-brand-teal/15";
  if (g.includes("older") || g.includes("senior")) return "bg-brand-bronze/10 text-brand-bronze border border-brand-bronze/20";
  if (g.includes("disab")) return "bg-brand-green/10 text-brand-green border border-brand-green/15";
  if (g.includes("family") || g.includes("families")) return "bg-brand-navy/10 text-brand-navy border border-brand-navy/15";
  return "bg-brand-gray/10 text-brand-gray border border-brand-gray/15";
};

export function InsightsList({ insights, selectedInsightId, onSelectInsight }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter and sort states
  const [themeFilter, setThemeFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Pagination limit state
  const [visibleCount, setVisibleCount] = useState(3);

  // Helper to parse dates from the "source" property (e.g. "Coalition partner, Apr 2026")
  const parseDateFromSource = (sourceStr: string): number => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const match = sourceStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/);
    if (match) {
      const monthIndex = months.indexOf(match[1]);
      const year = parseInt(match[2], 10);
      return new Date(year, monthIndex).getTime();
    }
    return 0; // fallback chronological value
  };

  // Derive filtered and sorted list
  const filteredAndSortedInsights = useMemo(() => {
    return insights
      .filter((insight) => {
        const matchTheme =
          themeFilter === "all" ||
          insight.theme.toLowerCase() === themeFilter.toLowerCase();

        const matchGroup =
          groupFilter === "all" ||
          insight.populationGroup.toLowerCase() === groupFilter.toLowerCase();

        return matchTheme && matchGroup;
      })
      .sort((a, b) => {
        const dateA = parseDateFromSource(a.source);
        const dateB = parseDateFromSource(b.source);
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [insights, themeFilter, groupFilter, sortOrder]);

  // Reset pagination when filter settings change
  useEffect(() => {
    setVisibleCount(3);
  }, [themeFilter, groupFilter]);

  // Get currently page-sliced items
  const paginatedInsights = useMemo(() => {
    return filteredAndSortedInsights.slice(0, visibleCount);
  }, [filteredAndSortedInsights, visibleCount]);

  return (
    <section className="mt-12">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
          Community intelligence
        </h2>
        <p className="mt-1 text-sm text-charcoal-light font-normal">
          Frontline observations from the coalition, pinned to where they were seen. All records are processed in British English.
        </p>
      </div>

      {/* Selector and Action row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pb-4 border-b border-brand-border/60">
        <div className="flex flex-wrap items-center gap-4">
          {/* Theme Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="theme-filter" className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
              Theme:
            </label>
            <select
              id="theme-filter"
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="rounded-md border border-brand-border bg-white px-2.5 py-1 text-xs font-normal text-charcoal focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy transition hover:bg-sand-bg/60"
            >
              <option value="all">All</option>
              <option value="education">Education</option>
              <option value="employment">Employment</option>
              <option value="employability">Employability</option>
              <option value="health & wellbeing">Health & Wellbeing</option>
              <option value="disability">Disability</option>
              <option value="housing">Housing</option>
              <option value="youth">Youth</option>
              <option value="poverty">Poverty</option>
              <option value="digital inclusion">Digital Inclusion</option>
            </select>
          </div>

          {/* Demographic Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="group-filter" className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
              Group:
            </label>
            <select
              id="group-filter"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-md border border-brand-border bg-white px-2.5 py-1 text-xs font-normal text-charcoal focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy transition hover:bg-sand-bg/60"
            >
              <option value="all">All</option>
              <option value="young people">Young People</option>
              <option value="families">Families</option>
              <option value="older people">Older People</option>
              <option value="disabled people">Disabled People</option>
              <option value="minoritised communities">Minoritised Communities</option>
              <option value="carers">Carers</option>
            </select>
          </div>

          {/* Toggle Sort order */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy mr-1.5">Sort:</span>
            <button
              type="button"
              onClick={() => setSortOrder((o) => (o === "newest" ? "oldest" : "newest"))}
              className="inline-flex items-center gap-1 rounded-md border border-brand-border bg-white px-2.5 py-1 text-xs font-mono font-normal text-charcoal hover:bg-brand-border/20 hover:scale-[1.02] transition cursor-pointer"
            >
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>
        </div>

        {/* Form Toggle Button sitting neatly on the far right */}
        <button
          type="button"
          onClick={() => {
            setFormOpen((o) => !o);
            setSubmitted(false);
          }}
          className="inline-flex items-center justify-center rounded-md border border-brand-navy/30 bg-brand-navy/10 px-3.5 py-1.5 text-xs font-mono font-bold text-brand-navy hover:bg-brand-navy hover:text-sand-bg transition duration-300 hover:scale-[1.02] cursor-pointer self-start md:self-auto"
        >
          {formOpen ? "Cancel" : "+ Add insight"}
        </button>
      </div>

      {formOpen && (
        <div className="mt-4 rounded-xl border border-brand-navy/20 bg-brand-navy/[0.03] p-5 shadow-sm">
          {submitted ? (
            <div className="text-sm">
              <p className="font-bold text-brand-green">Submitted for review.</p>
              <p className="mt-1 text-charcoal-light font-normal leading-relaxed">
                In a real build, this would queue for admin moderation before being
                visible on the public map. Here it&rsquo;s a UI demonstration only.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormOpen(false);
                }}
                className="mt-3 text-xs font-bold text-brand-navy hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Theme">
                  <select className={inputCls} defaultValue="Employment">
                    {["Education", "Employment", "Employability", "Health & wellbeing", "Disability", "Housing", "Youth", "Poverty", "Digital inclusion"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Population group">
                  <select className={inputCls} defaultValue="Young people">
                    {["Young people", "Families", "Older people", "Disabled people", "Minoritised communities", "Carers"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Observation">
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  placeholder="A specific frontline observation — what was seen, where, when, what it cost."
                  required
                />
              </Field>
              <Field label="Source (organisation, role, date)">
                <input className={inputCls} placeholder="e.g. Coalition partner, May 2026" required />
              </Field>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-md bg-brand-navy px-4 py-2 text-xs font-mono font-bold text-sand-bg hover:bg-brand-navy/90 transition hover:scale-[1.02] cursor-pointer"
                >
                  Submit for review
                </button>
              </div>
              <p className="text-[11px] text-brand-gray font-semibold font-mono">
                Prototype demonstration. Nothing is stored.
              </p>
            </form>
          )}
        </div>
      )}

      {/* Grid container with 2 columns on tablet and 3 columns on desktop */}
      {paginatedInsights.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedInsights.map((i) => {
            const isSelected = i.id === selectedInsightId;
            return (
              <li key={i.id} className="h-full">
                <button
                  type="button"
                  onClick={() => onSelectInsight(isSelected ? null : i.id)}
                  className={`w-full flex flex-col justify-between rounded-xl border p-4 text-left transition h-[178px] cursor-pointer ${
                    isSelected
                      ? "border-brand-orange bg-brand-orange/5 shadow-md ring-1 ring-brand-orange/30 min-h-[178px] h-auto scale-[1.01]"
                      : "border-brand-border bg-white hover:border-brand-border hover:bg-brand-border/10 hover:shadow-sm"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 mb-1">
                    <span className={`px-2 py-0.5 rounded-md ${getThemeTagStyle(i.theme)}`}>
                      {i.theme}
                    </span>
                    <span className="text-brand-gray/30 text-[10px] select-none">·</span>
                    <span className={`px-2 py-0.5 rounded-md ${getGroupTagStyle(i.populationGroup)}`}>
                      {i.populationGroup}
                    </span>
                  </div>
                  
                  <p className={`mt-2 text-xs text-charcoal-light leading-relaxed overflow-hidden flex-grow font-normal ${isSelected ? "" : "line-clamp-4"}`}>
                    {i.text}
                  </p>
                  
                  <p className="mt-2 text-[10px] text-brand-gray font-bold font-mono uppercase tracking-wider truncate shrink-0">
                    {i.source}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-brand-border border-dashed p-8 text-center bg-sand-card/60">
          <p className="text-sm text-charcoal-light font-medium">No intelligence entries match your current filters.</p>
          <button
            type="button"
            onClick={() => {
              setThemeFilter("all");
              setGroupFilter("all");
            }}
            className="mt-2 text-xs font-bold text-brand-orange hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredAndSortedInsights.length > visibleCount && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 3)}
            className="inline-flex items-center justify-center rounded-md border border-brand-border bg-white px-4 py-2 text-xs font-mono font-normal text-charcoal shadow-sm hover:bg-brand-border/20 transition hover:scale-[1.02] cursor-pointer"
          >
            Show more ({filteredAndSortedInsights.length - visibleCount} remaining)
          </button>
        </div>
      )}
      {filteredAndSortedInsights.length <= visibleCount && filteredAndSortedInsights.length > 3 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(3)}
            className="inline-flex items-center justify-center rounded-md border border-brand-border bg-white px-4 py-2 text-xs font-mono font-normal text-charcoal shadow-sm hover:bg-brand-border/20 transition hover:scale-[1.02] cursor-pointer"
          >
            Show less
          </button>
        </div>
      )}
    </section>
  );
}

const inputCls =
  "block w-full rounded-md border border-brand-border bg-white px-2.5 py-1.5 text-xs text-charcoal placeholder-brand-gray focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy font-normal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block bg-transparent">
      <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">{label}</span>
      {children}
    </label>
  );
}
