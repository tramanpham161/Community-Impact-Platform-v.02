"use client";

import { useState } from "react";

const EXPORTS = [
  { id: "place-snapshot", label: "Place snapshot", note: "Cardiff-wide PDF — coming in Phase 2." },
  { id: "theme-insight", label: "Theme insight note", note: "Theme-scoped briefing — coming in Phase 2." },
  { id: "map-export", label: "Map export (PNG)", note: "Static PNG of the current view — coming in Phase 2." },
  { id: "funder-briefing", label: "Funder briefing", note: "Funder-facing pack — coming in Phase 2." },
  { id: "working-group-pack", label: "Working group pack", note: "Coalition working-group pack — coming in Phase 2." },
];

export function ExportButtons() {
  const [toast, setToast] = useState<string | null>(null);

  const trigger = (id: string) => {
    const exp = EXPORTS.find((e) => e.id === id);
    if (!exp) return;
    setToast(exp.note);
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <section className="relative">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">Export and share</h2>
      <p className="mt-1 text-sm font-normal text-charcoal-light leading-relaxed">
        Buttons render to make the proposition concrete. v0.1 stubs the export
        flow; the actual generators are scoped for Phase 2. All files will be exported in British English formats.
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {EXPORTS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => trigger(e.id)}
            className="rounded-md border border-brand-border bg-white px-3.5 py-1.5 text-xs font-mono font-bold text-charcoal hover:bg-brand-border/20 transition hover:scale-[1.02] cursor-pointer"
          >
            {e.label}
          </button>
        ))}
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 max-w-xs rounded-xl bg-charcoal px-4 py-3 text-xs font-bold text-sand-bg border border-brand-border shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 font-mono"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
