"use client";

import type { CommunityInsight, FrameworkMapping, Organisation } from "@/lib/types";
import { OrgDetailPanel } from "./OrgDetailPanel";
import { InsightDetailPanel } from "./InsightDetailPanel";

type Props =
  | {
      kind: "org";
      org: Organisation;
      mappings: FrameworkMapping[];
      onClose: () => void;
    }
  | {
      kind: "insight";
      insight: CommunityInsight;
      onClose: () => void;
    };

export function DetailSidePanel(props: Props) {
  return (
    <aside
      className="absolute inset-y-0 right-0 z-20 flex w-full flex-col bg-white shadow-2xl ring-1 ring-slate-200 sm:w-[420px]"
      role="dialog"
      aria-label={props.kind === "org" ? "Organisation detail" : "Community insight detail"}
    >
      <div className="flex-1 overflow-y-auto">
        {props.kind === "org" ? (
          <OrgDetailPanel
            org={props.org}
            mappings={props.mappings}
            onClose={props.onClose}
          />
        ) : (
          <InsightDetailPanel insight={props.insight} onClose={props.onClose} />
        )}
      </div>
    </aside>
  );
}
