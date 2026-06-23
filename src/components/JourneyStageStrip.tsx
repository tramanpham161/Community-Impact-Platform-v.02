"use client";

// v0.2 journey-stage explainer (BUILD_BRIEF.md §0.5).
// A six-chip strip that doubles as the stage filter. Replaces the v0.1
// J1/J2/J3 dropdown so a coalition viewer can see the whole arc at a glance
// and click straight into the stage they want.

import type { Stage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";

type Props = {
  selected: Stage | null;
  onSelect: (s: Stage | null) => void;
};

const STAGE_ORDER: Stage[] = ["J1", "J2", "J3", "J4", "J5", "J6"];

export function JourneyStageStrip({ selected, onSelect }: Props) {
  return (
    <div className="rounded-xl border border-brand-border bg-sand-card px-3.5 py-3 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-navy">
            Journey stage
          </span>
          <span className="text-[11px] text-charcoal-light font-normal">
            The arc of someone&rsquo;s working life
          </span>
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[11px] font-bold text-brand-orange hover:text-brand-orange/80 hover:underline cursor-pointer"
          >
            Clear stage
          </button>
        )}
      </div>
      <ol className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_ORDER.map((s, i) => {
          const isActive = selected === s;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onSelect(isActive ? null : s)}
                aria-pressed={isActive}
                className={
                  "group flex w-full flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition duration-300 cursor-pointer " +
                  (isActive
                    ? "border-brand-navy bg-brand-navy/5 shadow-sm hover:scale-[1.02]"
                    : "border-brand-border bg-white hover:border-brand-border hover:bg-brand-border/10 hover:scale-[1.02]")
                }
              >
                <span
                  className={
                    "text-[10px] font-mono font-bold uppercase tracking-wider " +
                    (isActive ? "text-brand-navy" : "text-brand-gray")
                  }
                >
                  {`Stage ${i + 1} · ${s}`}
                </span>
                <span
                  className={
                    "text-[12px] font-bold leading-tight " +
                    (isActive ? "text-charcoal" : "text-charcoal-light group-hover:text-charcoal")
                  }
                >
                  {STAGE_LABELS[s]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
