"use client";

// Persistent, two-row chip selector that sits above the dashboard and
// drives the v0.2 needs-led flow (BUILD_BRIEF.md §0.4). One row is
// "who are you" (Community group / Employer), the other is "what are you
// trying to do" (Deprivation / Organisations / Workstreams). Switching
// mode does NOT hide other panels — it just nudges visual emphasis (a soft
// ring + a note above the active panel). Both axes are URL-persisted by
// the parent (page.tsx) so a share-link lands on the same view.

import type { UserGoal, UserType } from "@/lib/types";
import { USER_GOAL_LABELS, USER_TYPE_LABELS } from "@/lib/types";

type Props = {
  userType: UserType;
  goal: UserGoal;
  onChange: (next: { userType?: UserType; goal?: UserGoal }) => void;
};

const USER_TYPES: UserType[] = ["community", "employer"];
const GOALS: UserGoal[] = ["deprivation", "organisations", "workstreams"];

export function ModeChooser({ userType, goal, onChange }: Props) {
  return (
    <div className="rounded-xl border border-brand-border bg-gradient-to-br from-sand-card to-sand-bg p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-navy">
          Start here
        </span>
        <span className="text-xs text-charcoal-light font-normal">
          Pick who you are and what you&rsquo;re looking for
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
        <ChipRow
          label="I&rsquo;m a"
          values={USER_TYPES}
          current={userType}
          getLabel={(v) => USER_TYPE_LABELS[v]}
          onPick={(v) => onChange({ userType: v })}
        />
        <span className="hidden h-10 w-px self-end bg-brand-border sm:block" aria-hidden />
        <ChipRow
          label="I want to"
          values={GOALS}
          current={goal}
          getLabel={(v) => USER_GOAL_LABELS[v]}
          onPick={(v) => onChange({ goal: v })}
        />
      </div>
    </div>
  );
}

function ChipRow<T extends string>({
  label,
  values,
  current,
  getLabel,
  onPick,
}: {
  label: string;
  values: T[];
  current: T;
  getLabel: (v: T) => string;
  onPick: (v: T) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div
        className="mb-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label.replace(/&rsquo;/g, "'")}>
        {values.map((v) => {
          const isActive = v === current;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onPick(v)}
              className={
                "rounded-full px-4 py-1.5 text-xs font-mono font-bold tracking-wide border transition duration-350 cursor-pointer " +
                (isActive
                  ? "bg-brand-navy text-sand-bg border-brand-navy shadow-md hover:scale-[1.02]"
                  : "bg-sand-card text-charcoal border-brand-border hover:bg-brand-border/30 hover:scale-[1.02]")
              }
            >
              {getLabel(v)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
