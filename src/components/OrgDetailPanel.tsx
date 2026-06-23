"use client";

import { useMemo, useState } from "react";
import type { FrameworkMapping, Organisation } from "@/lib/types";
import { SECTOR_COLOURS } from "@/lib/types";

type Props = {
  org: Organisation;
  mappings: FrameworkMapping[];
  onClose: () => void;
};

const STAGE_TITLES: Record<string, string> = {
  J1: "J1 — Home & community",
  J2: "J2 — School",
  J3: "J3 — Post-16 (FE / sixth form / training)",
  J4: "J4 — Entry to work",
  J5: "J5 — In-work progression",
  J6: "J6 — Re-entry / second chance",
  "J1-J6": "Spans the whole journey",
};

const ENGAGEMENT_BADGE: Record<string, string> = {
  Deliverer: "bg-brand-green/10 text-brand-green ring-brand-green/30",
  Involved: "bg-brand-navy/10 text-brand-navy ring-brand-navy/20",
  Informed: "bg-brand-gray/10 text-brand-gray ring-brand-gray/20",
  Funder: "bg-brand-orange/10 text-brand-orange ring-brand-orange/20",
  "Often overlooked": "bg-brand-bronze/10 text-brand-bronze ring-brand-bronze/25",
};

export function OrgDetailPanel({ org, mappings, onClose }: Props) {
  const { stages, byStage } = useMemo(() => {
    const m = new Map<string, FrameworkMapping[]>();
    for (const map of mappings) {
      const key = map.stage || "—";
      const list = m.get(key) ?? [];
      list.push(map);
      m.set(key, list);
    }
    return { stages: Array.from(m.keys()).sort(), byStage: m };
  }, [mappings]);

  // v0.2: barriers are no longer a filter axis. Surface them as a flat chip
  // set at the top of the profile so they read as profile tags, not filters.
  const uniqueBarriers = useMemo(() => {
    const s = new Set<string>();
    for (const m of mappings) if (m.barrier) s.add(m.barrier);
    return Array.from(s).sort();
  }, [mappings]);

  // v0.2: any mapping for this org tagged "illustrative" → show a single
  // badge near the header so coalition viewers know the role is inferred.
  const hasIllustrativeMapping = useMemo(
    () => mappings.some((m) => m.provenance === "illustrative"),
    [mappings]
  );

  // First stage expanded by default for friendliness; rest collapsed.
  const [openStages, setOpenStages] = useState<Set<string>>(
    () => new Set(stages.slice(0, 1))
  );
  const toggleStage = (s: string) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const sectorColour = SECTOR_COLOURS[org.sector];

  return (
    <div className="px-5 py-5 bg-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full ring-2 ring-white"
              style={{ background: sectorColour }}
              aria-hidden
            />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-brand-gray">
              {org.sector} · {org.type}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold leading-tight text-charcoal font-display">{org.name}</h2>
          {org.categoryTags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {org.categoryTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-sand-bg px-2.5 py-0.5 text-xs font-semibold text-charcoal ring-1 ring-brand-border"
                  title="Service type"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-brand-gray hover:bg-brand-border/40 hover:text-charcoal transition cursor-pointer"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-xs sm:text-sm text-charcoal-light font-normal leading-relaxed">{org.description}</p>

      {uniqueBarriers.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
            Barriers addressed
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {uniqueBarriers.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-md bg-brand-bronze/10 px-2 py-0.5 text-xs font-semibold text-brand-bronze ring-1 ring-brand-bronze/20"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 text-sm">
        <div>
          <dt className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">Geography served</dt>
          <dd className="mt-1 text-xs font-medium text-charcoal">{org.geographyServed}</dd>
        </div>
        {org.contact?.website && (
          <div>
            <dt className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">Website</dt>
            <dd className="mt-1 truncate">
              <a
                href={org.contact.website}
                target="_blank"
                rel="noreferrer"
                className="text-brand-navy hover:text-brand-navy/80 hover:underline font-semibold text-xs"
              >
                {org.contact.website.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <hr className="my-5 border-brand-border" />

      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal">
          Framework footprint
        </h3>
        <p className="mt-1 text-xs text-brand-gray font-normal leading-normal">
          How this organisation is mapped in the coalition&rsquo;s J1–J6 framework.
          {mappings.length === 0 && " No mappings recorded."}
        </p>
        <div className="mt-3.5 space-y-2">
          {stages.map((stage) => {
            const stageMappings = byStage.get(stage) ?? [];
            const isOpen = openStages.has(stage);
            return (
              <div key={stage} className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleStage(stage)}
                  className="flex w-full items-center justify-between gap-2 bg-sand-card px-3.5 py-2.5 text-left hover:bg-brand-border/15 transition duration-150"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-charcoal font-display">
                    {STAGE_TITLES[stage] ?? stage}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-brand-gray">
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-mono font-semibold text-charcoal ring-1 ring-brand-border">
                      {stageMappings.length} mapping{stageMappings.length === 1 ? "" : "s"}
                    </span>
                    <svg
                      className={`h-4 w-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <ul className="space-y-2 px-3.5 py-3 bg-white border-t border-brand-border/40">
                    {stageMappings.map((m) => (
                      <li key={m.id} className="flex items-start gap-2.5 text-xs text-charcoal-light">
                        <span
                          className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ring-1 ${
                            ENGAGEMENT_BADGE[m.engagementType] ?? "bg-brand-gray/10 text-brand-gray ring-brand-gray/20"
                          }`}
                        >
                          {m.engagementType}
                        </span>
                        <span className="flex-1 text-[12px] font-normal leading-relaxed text-charcoal">
                          <span className="font-semibold text-charcoal">{m.barrier}</span>
                          {m.stakeholderGroup && (
                            <>
                              <span className="mx-1 text-brand-gray">·</span>
                              <span className="text-charcoal-light">{m.stakeholderGroup}</span>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
