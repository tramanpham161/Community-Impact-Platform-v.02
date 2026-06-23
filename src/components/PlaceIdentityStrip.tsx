export function PlaceIdentityStrip({
  name,
  geographyType,
  population,
  lastUpdated,
}: {
  name: string;
  geographyType: string;
  population: number;
  lastUpdated: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-sand-card px-4 py-3 text-sm border border-brand-border shadow-sm">
      <span className="font-display font-semibold text-charcoal">{name}</span>
      <span className="text-brand-border font-semibold">·</span>
      <span className="text-charcoal-light font-medium">{geographyType}</span>
      <span className="text-brand-border font-semibold">·</span>
      <span className="text-charcoal-light">
        Population <span className="font-mono font-semibold text-brand-navy">{population.toLocaleString()}</span>
      </span>
      <span className="ml-auto text-xs font-mono font-semibold text-brand-gray">Last updated {lastUpdated}</span>
    </div>
  );
}
