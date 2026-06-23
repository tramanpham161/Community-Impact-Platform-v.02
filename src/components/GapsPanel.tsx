// v0.2 (BUILD_BRIEF.md §0.6) — renamed from "Possible gaps and opportunities"
// to "Emerging gaps and potential workstreams". Each gap card now ends with
// a "Could become workstream:" line where one is authored. When the user is
// on the workstreams path, the parent passes an optional list of stubbed
// workstream cards that surface above the gaps. Now features hover-interactive
// opportunity workstreams with direct touchpoints for user inquiry.

import { useState } from "react";
import type { Gap, Stage, Workstream } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { Sparkles, ArrowRight, Activity, MessageSquare, MapPin, ListFilter, Send, X } from "lucide-react";

const BASIS_LABEL: Record<Gap["basis"], string> = {
  indicator: "From indicator data",
  "org-density": "From org-density",
  insight: "From community insight",
  "filter-derived": "From filter-derived view",
};

const BASIS_ICON = {
  indicator: Activity,
  "org-density": MapPin,
  insight: MessageSquare,
  "filter-derived": ListFilter,
};

const STATUS_LABEL: Record<Workstream["status"], string> = {
  exploring: "Exploring",
  forming: "Forming",
  active: "Active",
  planned: "Planned",
};

const STATUS_STYLE: Record<Workstream["status"], string> = {
  exploring: "bg-brand-gray/10 text-brand-gray ring-brand-gray/20",
  forming: "bg-brand-teal/10 text-brand-teal ring-brand-teal/20",
  active: "bg-brand-green/10 text-brand-green ring-brand-green/30",
  planned: "bg-brand-bronze/10 text-brand-bronze ring-brand-bronze/25",
};

type ColorPreset = {
  hoverBorder: string;
  gradientTo: string;
  sparkles: string;
  badgeBg: string;
  badgeRing: string;
  btnBg: string;
};

const COLOR_PRESETS: ColorPreset[] = [
  {
    hoverBorder: "hover:border-brand-navy",
    gradientTo: "to-brand-navy/[0.08]",
    sparkles: "text-brand-navy",
    badgeBg: "bg-brand-navy/10 text-brand-navy",
    badgeRing: "ring-brand-navy/20",
    btnBg: "bg-brand-navy text-sand-bg hover:bg-brand-navy/90",
  },
  {
    hoverBorder: "hover:border-brand-teal",
    gradientTo: "to-brand-teal/[0.08]",
    sparkles: "text-brand-teal",
    badgeBg: "bg-brand-teal/10 text-brand-teal",
    badgeRing: "ring-brand-teal/20",
    btnBg: "bg-brand-teal text-sand-bg hover:bg-brand-teal/90",
  },
  {
    hoverBorder: "hover:border-brand-bronze",
    gradientTo: "to-brand-bronze/[0.08]",
    sparkles: "text-brand-bronze",
    badgeBg: "bg-brand-bronze/10 text-brand-bronze",
    badgeRing: "ring-brand-bronze/20",
    btnBg: "bg-brand-bronze text-sand-bg hover:bg-brand-bronze/90",
  },
  {
    hoverBorder: "hover:border-brand-green",
    gradientTo: "to-brand-green/[0.08]",
    sparkles: "text-brand-green",
    badgeBg: "bg-brand-green/10 text-brand-green",
    badgeRing: "ring-brand-green/30",
    btnBg: "bg-brand-green text-sand-bg hover:bg-brand-green/90",
  },
  {
    hoverBorder: "hover:border-brand-orange",
    gradientTo: "to-brand-orange/[0.08]",
    sparkles: "text-brand-orange",
    badgeBg: "bg-brand-orange/10 text-brand-orange",
    badgeRing: "ring-brand-orange/20",
    btnBg: "bg-brand-orange text-sand-bg hover:bg-brand-orange/90",
  },
];

type Props = {
  gaps: Gap[];
  /** When provided, renders the workstream cards above the gap cards. */
  workstreams?: Workstream[];
};

export function GapsPanel({ gaps, workstreams }: Props) {
  const [activeInquiry, setActiveInquiry] = useState<{ id: string; title: string } | null>(null);
  const [inquiryText, setInquiryText] = useState("");
  const [submittedInquiry, setSubmittedInquiry] = useState(false);

  return (
    <section className="relative">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
        Emerging gaps and potential workstreams
      </h2>
      <p className="mt-2 text-sm font-normal text-charcoal-light leading-relaxed max-w-4xl">
        Surfaced from the data and community insights. Authored gap cards plus next-step workstreams show how
        the picture could turn into action. All content is tailored to the Cardiff local context.
      </p>

      {workstreams && workstreams.length > 0 && (
        <div className="mt-6">
          <div className="mb-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
            Proposed workstreams
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {workstreams.map((w) => (
              <WorkstreamCard key={w.id} workstream={w} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
          Gaps emerging from the data
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {gaps.map((g, index) => {
            const IconComponent = BASIS_ICON[g.basis] || Activity;
            const preset = COLOR_PRESETS[index % COLOR_PRESETS.length];
            return (
              <article
                key={g.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm hover:shadow-md ${preset.hoverBorder} hover:scale-[1.01] transition-all duration-300 min-h-[170px]`}
              >
                {/* Main Content Info */}
                <div className="transition-all duration-300 group-hover:opacity-20 md:group-hover:opacity-10">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-sand-bg px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy ring-1 ring-brand-border">
                    <IconComponent className="h-3 w-3 text-brand-navy" />
                    {BASIS_LABEL[g.basis]}
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-charcoal leading-snug font-display">
                    {g.title}
                  </h3>
                  <p className="mt-2 text-xs text-charcoal-light leading-relaxed">
                    {g.body}
                  </p>
                </div>

                {/* Hover Reveal Opportunity Workstream Banner */}
                {g.potentialWorkstream && (
                  <div className={`absolute inset-x-0 bottom-0 top-0 z-10 flex flex-col justify-between p-5 bg-gradient-to-br from-sand-card ${preset.gradientTo} border-t border-brand-border/40 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className={`h-3.5 w-3.5 ${preset.sparkles} animate-pulse`} />
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${preset.sparkles}`}>
                            Opportunity Workstream
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ring-1 ${preset.badgeBg} ${preset.badgeRing}`}>
                          Active Lead
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-light leading-relaxed max-h-[84px] overflow-y-auto pr-1">
                        {g.potentialWorkstream}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-brand-border/60">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveInquiry({ id: g.id, title: g.title });
                          setSubmittedInquiry(false);
                          setInquiryText("");
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ${preset.btnBg} text-[11px] font-bold shadow-sm transition hover:scale-[1.02] cursor-pointer`}
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Talk to us about this</span>
                      </button>
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-navy hover:text-brand-navy/80 hover:scale-[1.02] transition cursor-pointer">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Inquiry Dialog / Modal structure */}
      {activeInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a2521]/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-sand-card p-6 shadow-2xl border border-brand-border animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setActiveInquiry(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-brand-gray hover:bg-brand-border/40 hover:text-charcoal transition cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {submittedInquiry ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10">
                  <Send className="h-5 w-5 text-brand-green" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-charcoal">Enquiry Sent Successfully</h3>
                <p className="mt-2 text-xs text-charcoal-light leading-relaxed px-2">
                  We&rsquo;ve received your interest regarding the opportunity workstream: <br />
                  <strong className="text-charcoal font-semibold">&ldquo;{activeInquiry.title}&rdquo;</strong>.
                  Our partnership coordinator will be in touch with you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveInquiry(null)}
                  className="mt-6 w-full rounded-md bg-brand-navy py-2 text-xs font-bold text-sand-bg hover:bg-brand-navy/90 transition hover:scale-[1.02] cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmittedInquiry(true);
                }}
                className="space-y-4"
              >
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">Direct Message</span>
                  <h3 className="text-sm font-bold text-charcoal mt-1 leading-snug">
                    Enquire: &ldquo;{activeInquiry.title}&rdquo;
                  </h3>
                  <p className="mt-1 text-xs text-charcoal-light">
                    Enter your proposal, questions, or contact options. We will route it directly to co-leads.
                  </p>
                </div>

                <div>
                  <label htmlFor="inquiry-message" className="sr-only">Message Description</label>
                  <textarea
                    id="inquiry-message"
                    required
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    className="block w-full rounded-md border border-brand-border bg-white px-3 py-2 text-xs text-charcoal placeholder-brand-gray focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy min-h-[100px] leading-relaxed"
                    placeholder="e.g. Hi, our organisation handles local recruitment pathways and we'd love to partner on this workstream. Let's schedule a brief discussion."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveInquiry(null)}
                    className="rounded-md border border-brand-border bg-white px-4 py-2 text-xs font-mono font-bold text-charcoal hover:bg-brand-border/20 transition hover:scale-[1.02] cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-brand-navy px-4 py-2 text-xs font-mono font-bold text-sand-bg hover:bg-brand-navy/90 transition hover:scale-[1.02] cursor-pointer"
                  >
                    Send message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function WorkstreamCard({ workstream }: { workstream: Workstream }) {
  const stageLabel =
    workstream.stage === "Cross-stage"
      ? "Cross-stage"
      : STAGE_LABELS[workstream.stage as Stage] ?? workstream.stage;
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-brand-border bg-gradient-to-br from-sand-card to-brand-navy/5 p-4 shadow-sm transition hover:scale-[1.02] hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span
          className={
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 " +
            STATUS_STYLE[workstream.status]
          }
        >
          {STATUS_LABEL[workstream.status]}
        </span>
      </div>
      <h3 className="text-sm font-bold leading-tight text-charcoal font-display">
        {workstream.title}
      </h3>
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
        {stageLabel} · {workstream.participatingOrgIds.length} participating orgs
      </div>
      <p className="text-[12px] leading-relaxed text-charcoal-light font-normal">{workstream.summary}</p>
      <div className="text-[10px] font-mono font-semibold text-brand-gray">{workstream.focus}</div>
    </article>
  );
}
