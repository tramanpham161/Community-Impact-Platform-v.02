"use client";

import type { CommunityInsight } from "@/lib/types";

export function InsightDetailPanel({
  insight,
  onClose,
}: {
  insight: CommunityInsight;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />
            Community insight · {insight.theme} · {insight.populationGroup}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">A pinned observation</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="mt-4 text-slate-800">{insight.text}</p>
      <p className="mt-3 text-xs text-slate-500">{insight.source}</p>
    </div>
  );
}
