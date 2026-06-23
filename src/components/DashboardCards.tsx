import type { Indicator } from "@/lib/types";

export function DashboardCards({ indicators }: { indicators: Indicator[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {indicators.map((i) => (
        <Card key={i.id} indicator={i} />
      ))}
    </div>
  );
}

function Card({ indicator }: { indicator: Indicator }) {
  return (
    <article className="rounded-xl border border-brand-border bg-sand-card p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
          {indicator.name}
        </h3>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-2xl font-semibold text-charcoal">{indicator.value}</span>
        {indicator.unit && (
          <span className="font-mono text-xs text-brand-gray font-semibold">{indicator.unit}</span>
        )}
      </div>
      {indicator.context && (
        <div className="mt-3 flex items-start justify-between gap-1.5 border-t border-brand-border/60 pt-2.5">
          <p className="text-xs text-charcoal-light flex-grow leading-relaxed font-normal">
            {indicator.context}
          </p>
          <div className="relative group flex-shrink-0 mt-0.5">
            <span
              className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand-border/40 text-[10px] font-mono font-bold text-charcoal-light hover:bg-brand-border hover:text-charcoal cursor-help transition select-none"
              title={`${indicator.source} · ${indicator.asOfDate}`}
            >
              i
            </span>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-48">
              <div className="relative rounded-md bg-charcoal px-2.5 py-1.5 text-[10px] text-sand-bg font-mono shadow-lg leading-normal">
                {indicator.source} · {indicator.asOfDate}
                <div className="absolute top-full right-1.5 -mt-1 w-2 h-2 bg-charcoal transform rotate-45" />
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
