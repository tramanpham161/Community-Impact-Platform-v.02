import React, { useState } from "react";
import { 
  Briefcase, 
  Layers, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Play, 
  Clock, 
  TrendingUp, 
  UserCheck,
  Search,
  CheckCircle,
  FileCheck2,
  Trash2,
  Info
} from "lucide-react";

interface Initiative {
  id: string;
  title: string;
  leadPartner: string;
  stageRange: string;
  status: "In Progress" | "Planning" | "Completed" | "At Risk";
  budget: number;
  progress: number;
  cohortSize: number;
  description: string;
  peopleInCharge?: string;
  sponsor?: string;
  location?: string;
  target?: string;
  activities?: string[];
}

const INITIAL_INITIATIVES: Initiative[] = [
  {
    id: "p1",
    title: "Cardiff Youth Employability Hub",
    leadPartner: "Cardiff Youth Coalition",
    stageRange: "J1-J2",
    status: "In Progress",
    budget: 450000,
    progress: 68,
    cohortSize: 320,
    description: "Multi-agency hub delivering direct outreach, initial assessments (J1), and action planning (J2) for young people NEET.",
    peopleInCharge: "Eleni Vaughan (Programme Director), Gethin Davies (Outreach Coordinator)",
    sponsor: "Welsh Government Social Mobility Grant",
    location: "Central Cardiff (Splott, Butetown & Adamsdown Hubs)",
    target: "NEET Youth aged 16-24",
    activities: [
      "Intake & Multi-Agency Diagnostics",
      "Personalised Action Planning Sessions",
      "Mental Well-being & Confidence Coaching",
      "Direct Local Bus Stop Outreach Campaigns"
    ]
  },
  {
    id: "p2",
    title: "Butetown & Grangetown Digital Skills Lab",
    leadPartner: "Oasis Cardiff & Tech Coalition",
    stageRange: "J3-J4",
    status: "In Progress",
    budget: 310000,
    progress: 45,
    cohortSize: 180,
    description: "Targeted digital bootcamp and confidence-building workspace for ethnically diverse communities in high-deprivation areas.",
    peopleInCharge: "Amir Al-Hasan (Digital Inclusion Lead), Sarah Jenkins (Volunteer Trainer Coordinator)",
    sponsor: "National Lottery Community Fund",
    location: "Butetown Community Centre & Grangetown Hub Labs",
    target: "Ethnically Diverse Cohorts",
    activities: [
      "10-week Basic Digital Literacy Courses",
      "Intro to Web Design & Cloud Workflows",
      "CV Workshops & Technical Interview Prep",
      "Language-supported Technical Labs"
    ]
  },
  {
    id: "p3",
    title: "Inclusive Employer Mentorship Initiative",
    leadPartner: "Business in the Community (BITC)",
    stageRange: "J5-J6",
    status: "Planning",
    budget: 150000,
    progress: 15,
    cohortSize: 120,
    description: "Pairing regional employers with jobseekers from underrepresented wards, establishing supportive pathways to work transition.",
    peopleInCharge: "Rachel Sterling (Employer Engagement Board), Mark Thomas (SME Partnership Liaison)",
    sponsor: "South Wales Chamber of Commerce",
    location: "Cardiff-wide Partner Workspaces",
    target: "Local Priority Jobseekers",
    activities: [
      "Corporate Mentor Matching Workshops",
      "Real Living Wage Employer Commitments Registry",
      "Mock HR Assessment Days",
      "Industry Exposure Site Visits"
    ]
  },
  {
    id: "p4",
    title: "Ely Literacy & Early Mentorship Club",
    leadPartner: "Splott Community Volunteers & Schools",
    stageRange: "J1",
    status: "Completed",
    budget: 85000,
    progress: 100,
    cohortSize: 240,
    description: "After-school family engagement sessions focused on developing fundamental reading skills and building confidence in childhood.",
    peopleInCharge: "Megan Owens (Schools Liaison), Father David Evans (Community Hub Administrator)",
    sponsor: "Cardiff Council Literacy Fund",
    location: "Ely Community Library & Local Primary Schools",
    target: "Primary Pupils & Local Families",
    activities: [
      "Dual-generational Reading Circles",
      "Interactive Book-gifting Festivals",
      "Volunteer Student-Tutor Homework Help",
      "Early Speech & Language Therapy Sessions"
    ]
  },
  {
    id: "p5",
    title: "Sustained Career Retention Framework",
    leadPartner: "Wales TUC & Cardiff Council",
    stageRange: "J6",
    status: "At Risk",
    budget: 200000,
    progress: 80,
    cohortSize: 150,
    description: "Comprehensive coaching and regular checks to support workers during their critical first six months of post-entry retention.",
    peopleInCharge: "Sian Rowland (Framework Lead), Gwynfor Evans (Trade Union Representative)",
    sponsor: "Cardiff Capital Region City Deal",
    location: "East Cardiff Outreach & In-Work Coached Hubs",
    target: "Employed Cohort Graduates",
    activities: [
      "30-Day / 90-Day / 180-Day Employer Checks",
      "Mediation & Dispute Resolution Panels",
      "Advanced Career Upskilling Clinics",
      "Sustained-wage Peer Forums"
    ]
  }
];

interface Milestone {
  id: string;
  phase: string;
  title: string;
  targetDate: string;
  status: "Completed" | "Active" | "Upcoming";
  owner: string;
}

export function TransformationPanel() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(INITIAL_INITIATIVES);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<Initiative | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "m1", phase: "Phase 1: Diagnosis", title: "LSOA Needs Mapping Alignment", targetDate: "Completed (Jan 2026)", status: "Completed", owner: "Cardiff Council" },
    { id: "m2", phase: "Phase 2: Onboarding", title: "Employer Covenant Commitments", targetDate: "In Progress (Jul 2026)", status: "Active", owner: "BITC Cluster" },
    { id: "m3", phase: "Phase 3: Activation", title: "NEET Cohort Multi-Hub Launch", targetDate: "Target Oct 2026", status: "Upcoming", owner: "Youth Coalition" },
    { id: "m4", phase: "Phase 4: Synthesis", title: "Mid-Term Impact Evaluation", targetDate: "Target Dec 2026", status: "Upcoming", owner: "Evaluating Partner" },
  ]);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newLead, setNewLead] = useState("");
  const [newStage, setNewStage] = useState("J1-J2");
  const [newStatus, setNewStatus] = useState<Initiative["status"]>("In Progress");
  const [newBudget, setNewBudget] = useState("120000");
  const [newCohort, setNewCohort] = useState("100");
  const [newDesc, setNewDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Request Information states
  const [requestName, setRequestName] = useState("");
  const [requestWho, setRequestWho] = useState("Community Group");
  const [requestContact, setRequestContact] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleCreateInitiative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLead) return;

    const added: Initiative = {
      id: "p_" + Date.now(),
      title: newTitle,
      leadPartner: newLead,
      stageRange: newStage,
      status: newStatus,
      budget: Number(newBudget) || 0,
      progress: newStatus === "Completed" ? 100 : newStatus === "Planning" ? 0 : 25,
      cohortSize: Number(newCohort) || 0,
      description: newDesc || "Custom registered partner initiative under the Community Impact Framework."
    };

    setInitiatives([added, ...initiatives]);
    // reset
    setNewTitle("");
    setNewLead("");
    setNewDesc("");
    setNewCohort("100");
    setNewBudget("120000");
    setShowAddForm(false);
  };

  const handleDeleteInitiative = (id: string) => {
    setInitiatives(initiatives.filter(p => p.id !== id));
  };

  const handleIncrementProgress = (id: string) => {
    setInitiatives(initiatives.map(p => {
      if (p.id === id) {
        const nextProgress = Math.min(p.progress + 5, 100);
        return {
          ...p,
          progress: nextProgress,
          status: nextProgress === 100 ? "Completed" : p.status === "Planning" ? "In Progress" : p.status
        };
      }
      return p;
    }));
  };

  const filteredInitiatives = initiatives.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.leadPartner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Financial Stats
  const totalBudget = initiatives.reduce((sum, p) => sum + p.budget, 0);
  const totalCohort = initiatives.reduce((sum, p) => sum + p.cohortSize, 0);
  const completedCount = initiatives.filter(p => p.status === "Completed").length;

  return (
    <div className="space-y-10">
      {/* Overview Block */}
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
          Transformation Programme Management
        </h2>
        <p className="mt-2 text-sm font-normal text-charcoal-light leading-relaxed max-w-4xl">
          Track and coordinate active projects, pilot pipelines, and resources aligned to the J1–J6 Cardiff Social Mobility Framework. Manage partner responsibilities, monitor budgets, and report operational delivery progress in real time.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm transition hover:shadow-md duration-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-navy/10 p-2 text-brand-navy">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
              Active Projects
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold text-charcoal">
              {initiatives.length}
            </span>
            <span className="text-xs text-charcoal-light font-medium">initiatives</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm transition hover:shadow-md duration-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-green/10 p-2 text-brand-green">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-green">
              Financial Resources
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-3xl font-semibold text-charcoal">
              £{(totalBudget / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-charcoal-light font-medium">allocated</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm transition hover:shadow-md duration-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-teal/10 p-2 text-brand-teal">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-teal">
              Cohort Outreach
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-3xl font-semibold text-charcoal">
              {totalCohort.toLocaleString()}
            </span>
            <span className="text-xs text-charcoal-light font-medium">participants</span>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm transition hover:shadow-md duration-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-orange/10 p-2 text-brand-orange">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-orange">
              Delivery Completion
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-semibold text-charcoal">
              {completedCount}
            </span>
            <span className="text-xs text-charcoal-light font-medium">
              ({Math.round((completedCount / (initiatives.length || 1)) * 100)}% of total)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Project Registry (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-gray pointer-events-none">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search initiatives, partners, or J-stages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-brand-border bg-white pl-9 pr-3 py-1.5 text-xs text-charcoal placeholder-brand-gray focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy"
              />
            </div>
          </div>

          {/* Project Cards List */}
          <div className="space-y-4">
            {filteredInitiatives.length === 0 ? (
              <div className="rounded-xl border border-brand-border bg-white p-8 text-center text-xs text-brand-gray">
                No initiatives found matching "{searchQuery}". Try editing the filter keywords.
              </div>
            ) : (
              filteredInitiatives.map((p) => {
                const statusColors = {
                  "In Progress": "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
                  "Planning": "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
                  "Completed": "bg-brand-green/10 text-brand-green border-brand-green/20",
                  "At Risk": "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
                };

                return (
                  <div
                    key={p.id}
                    className="group relative rounded-xl border border-brand-border bg-white p-5 shadow-sm hover:shadow transition duration-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-brand-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase ${statusColors[p.status]}`}>
                            {p.status}
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-bronze/10 border border-brand-bronze/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-brand-bronze">
                            {p.stageRange}
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-charcoal leading-snug">
                          {p.title}
                        </h4>
                      </div>

                      {/* Detailed dialog opener & Delete triggers */}
                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectForDetails(p)}
                          className="inline-flex h-7 items-center justify-center rounded-md border border-brand-navy/30 bg-brand-navy/5 px-2.5 text-[10px] font-mono font-bold text-brand-navy hover:bg-brand-navy hover:text-white transition duration-200 cursor-pointer"
                        >
                          <Info className="mr-1 h-3 w-3" />
                          More details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInitiative(p.id)}
                          title="Remove registry item"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-border bg-sand-card text-brand-orange hover:bg-brand-orange/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-charcoal-light leading-relaxed">
                      {p.description}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-brand-border/40 pt-4 sm:grid-cols-4">
                      <div>
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                          Lead partner
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-charcoal-light truncate">
                          {p.leadPartner}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                          Budget Allocated
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-charcoal-light font-mono">
                          £{p.budget.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                          Target Cohort
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-charcoal-light font-mono">
                          {p.cohortSize} people
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                          Operational Completion
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-brand-border">
                            <div
                              className="h-full rounded-full bg-brand-navy transition-all duration-300"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-charcoal">
                            {p.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Milestone Timeline Panel (Right 1/3) */}
        {/* Milestone Timeline Panel (Right 1/3) - Kanban Style Board */}
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-sand-card p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-navy">
                What's in the pipeline
              </h3>
              <p className="text-[11px] text-charcoal-light">Sequential tracks in the 2026 transformation lifecycle.</p>
            </div>

            {/* Kanban Columns */}
            <div className="space-y-5">
              
              {/* Lane 1: Completed */}
              <div className="rounded-lg border border-brand-border/60 bg-white/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-1.5">
                  <span className="font-mono text-[9px] font-bold text-brand-green uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand-green" />
                    Completed Target
                  </span>
                  <span className="rounded bg-brand-green/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-brand-green">
                    1 Node
                  </span>
                </div>
                
                {milestones.filter(m => m.status === "Completed").map(m => (
                  <div key={m.id} className="rounded-lg border border-brand-border bg-sand-card/70 p-3 shadow-none hover:border-brand-green/40 transition">
                    <div className="text-[9px] font-mono font-bold text-brand-gray uppercase tracking-wider">
                      {m.phase}
                    </div>
                    <h5 className="text-xs font-bold text-charcoal mt-1 leading-snug">
                      {m.title}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-charcoal-light">
                      <span className="font-medium truncate max-w-[120px]">By: {m.owner}</span>
                      <span className="font-mono bg-brand-green/10 text-brand-green px-1.5 py-0.5 rounded font-bold text-[9px]">{m.targetDate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lane 2: Active */}
              <div className="rounded-lg border border-brand-border/60 bg-white/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-1.5">
                  <span className="font-mono text-[9px] font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand-navy animate-pulse" />
                    Active Pipeline
                  </span>
                  <span className="rounded bg-brand-navy/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-brand-navy">
                    1 Running
                  </span>
                </div>
                
                {milestones.filter(m => m.status === "Active").map(m => (
                  <div key={m.id} className="rounded-lg border border-brand-navy/30 bg-brand-navy/5 p-3 shadow-sm hover:border-brand-navy/60 transition relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-brand-navy rounded-bl-full" />
                    <div className="text-[9px] font-mono font-bold text-brand-navy uppercase tracking-wider">
                      {m.phase}
                    </div>
                    <h5 className="text-xs font-bold text-charcoal mt-1 leading-snug">
                      {m.title}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-charcoal-light">
                      <span className="font-medium truncate max-w-[120px]">By: {m.owner}</span>
                      <span className="font-mono bg-brand-navy px-1.5 py-0.5 rounded text-white font-bold text-[9px]">{m.targetDate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lane 3: Upcoming */}
              <div className="rounded-lg border border-brand-border/60 bg-white/50 p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-1.5">
                  <span className="font-mono text-[9px] font-bold text-brand-gray uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand-gray" />
                    Upcoming Pipeline
                  </span>
                  <span className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[9px] font-bold text-neutral-600">
                    2 Queued
                  </span>
                </div>
                
                {milestones.filter(m => m.status === "Upcoming").map(m => (
                  <div key={m.id} className="rounded-lg border border-brand-border bg-white p-3 shadow-none hover:border-brand-navy/30 transition">
                    <div className="text-[9px] font-mono font-bold text-brand-gray uppercase tracking-wider">
                      {m.phase}
                    </div>
                    <h5 className="text-xs font-semibold text-charcoal mt-1 leading-snug">
                      {m.title}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-charcoal-light">
                      <span className="font-medium truncate max-w-[120px]">By: {m.owner}</span>
                      <span className="font-mono bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium text-[9px]">{m.targetDate}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="rounded-xl border border-brand-navy/20 bg-[#F9FBFC] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1 md:max-w-[70%]">
              <div className="flex items-center gap-2 text-brand-navy">
                <UserCheck className="h-4 w-4" />
                <h4 className="text-xs font-sans font-bold uppercase tracking-wider">
                  Partner Collaboration
                </h4>
              </div>
              <p className="text-xs text-charcoal-light leading-relaxed font-normal">
                Cannot find the project you are looking for or want to launch a new community project? Start a conversation with our operations team.
              </p>
            </div>
            <a
              href="mailto:info@oaha.uk"
              className="inline-flex items-center justify-center rounded-lg bg-brand-navy px-4 py-2.5 text-xs font-sans font-semibold text-white hover:bg-[#2BB7BA] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm whitespace-nowrap text-center"
            >
              Talk to us
            </a>
          </div>
        </div>
      </div>

      {/* Detailed Initiative Modal */}
      {selectedProjectForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-brand-border bg-[#FAF9F6] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-brand-navy text-white px-6 py-5 flex items-start justify-between">
              <div>
                <span className="rounded bg-brand-navy/30 border border-white/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                  {selectedProjectForDetails.stageRange} Focus
                </span>
                <h3 className="mt-2 text-lg font-bold tracking-tight">
                  {selectedProjectForDetails.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectForDetails(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-brand-border bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                    Lead Partner
                  </div>
                  <div className="mt-1 text-xs font-semibold text-charcoal">
                    {selectedProjectForDetails.leadPartner}
                  </div>
                </div>

                <div className="rounded-lg border border-brand-border bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                    Sponsoring Entity / Fund
                  </div>
                  <div className="mt-1 text-xs font-semibold text-charcoal">
                    {selectedProjectForDetails.sponsor || "Cardiff Social Development Coalition"}
                  </div>
                </div>

                <div className="rounded-lg border border-brand-border bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                    People in Charge
                  </div>
                  <div className="mt-1 text-xs font-semibold text-charcoal">
                    {selectedProjectForDetails.peopleInCharge || "Programme Co-directors Alliance"}
                  </div>
                </div>

                <div className="rounded-lg border border-brand-border bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                    Location / Reach Wards
                  </div>
                  <div className="mt-1 text-xs font-semibold text-charcoal">
                    {selectedProjectForDetails.location || "Cardiff Central (High Deprivation Index)"}
                  </div>
                </div>

                <div className="rounded-lg border border-brand-border bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                    Target Outreach Cohort
                  </div>
                  <div className="mt-1 text-xs font-semibold text-charcoal font-mono">
                    {selectedProjectForDetails.cohortSize} participants ({selectedProjectForDetails.target || "High deprivation target"})
                  </div>
                </div>

                <div className="rounded-lg border border-brand-border bg-white p-3.5 shadow-sm">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-gray">
                    Allocated Resources
                  </div>
                  <div className="mt-1 text-xs font-semibold text-charcoal font-mono">
                    £{selectedProjectForDetails.budget.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl border border-brand-border bg-white p-4">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy border-b border-brand-border pb-1.5">
                  Project Mission & Overview
                </h4>
                <p className="mt-2 text-xs text-charcoal-light leading-relaxed font-normal">
                  {selectedProjectForDetails.description}
                </p>
              </div>

              {/* Key Deliverables & Activities */}
              {selectedProjectForDetails.activities && selectedProjectForDetails.activities.length > 0 && (
                <div className="rounded-xl border border-brand-border bg-white p-4">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy border-b border-brand-border pb-1.5">
                    Strategic Activities & Delivery Phases
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {selectedProjectForDetails.activities.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-charcoal-light">
                        <span className="mt-1.5 flex h-1.5 w-1.5 flex-none rounded-full bg-[#FF9900]" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Progress & Verification */}
              <div className="rounded-xl border border-brand-border bg-white p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-brand-navy">Completion Framework Validation</span>
                  <span className="font-mono font-semibold text-charcoal">{selectedProjectForDetails.progress}% Finished</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-brand-border overflow-hidden">
                  <div 
                    className="h-full bg-brand-navy rounded-full transition-all duration-300" 
                    style={{ width: `${selectedProjectForDetails.progress}%` }}
                  />
                </div>
              </div>

              {/* Request More Information Section */}
              <div className="rounded-xl border border-brand-border bg-brand-navy/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-navy">
                    Need more information about this project?
                  </h4>
                  {!showRequestForm && (
                     <button
                       type="button"
                       onClick={() => {
                         setShowRequestForm(true);
                         setRequestSubmitted(false);
                       }}
                       className="rounded bg-brand-navy px-3 py-1 text-[10px] font-sans font-semibold text-white hover:bg-brand-navy/90 transition cursor-pointer"
                     >
                       Request details
                     </button>
                  )}
                </div>

                {showRequestForm ? (
                  requestSubmitted ? (
                    <div className="rounded border border-brand-green/30 bg-brand-green/10 p-3 text-center">
                      <p className="text-xs font-semibold text-brand-green">
                        ✓ Request submitted successfully
                      </p>
                      <p className="text-[10px] text-charcoal-light mt-1">
                        We will get back to you with more information on {selectedProjectForDetails.title}.
                      </p>
                    </div>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (requestName && requestContact) {
                          setRequestSubmitted(true);
                        }
                      }}
                      className="space-y-3 pt-1"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-[9px] font-sans font-bold uppercase tracking-wider text-brand-gray">
                            Your Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            placeholder="e.g. Alex Davies"
                            className="block w-full rounded border border-brand-border bg-white px-2 py-1 text-[11px] text-charcoal focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-sans font-bold uppercase tracking-wider text-brand-gray">
                            Who are you?
                          </label>
                          <select
                            value={requestWho}
                            onChange={(e) => setRequestWho(e.target.value)}
                            className="block w-full rounded border border-brand-border bg-white px-2 py-1 text-[11px] text-charcoal focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          >
                            <option value="Community Group">Community Group</option>
                            <option value="Employer">Employer</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[9px] font-sans font-bold uppercase tracking-wider text-brand-gray">
                            Contact Info (Email/Phone) *
                          </label>
                          <input
                            type="text"
                            required
                            value={requestContact}
                            onChange={(e) => setRequestContact(e.target.value)}
                            placeholder="e.g. alex@example.com"
                            className="block w-full rounded border border-brand-border bg-white px-2 py-1 text-[11px] text-charcoal focus:outline-none focus:ring-1 focus:ring-brand-navy"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1 border-t border-brand-border/40">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRequestForm(false);
                            setRequestName("");
                            setRequestContact("");
                          }}
                          className="rounded border border-brand-border bg-white px-2.5 py-1 text-[10px] font-semibold text-charcoal hover:bg-brand-border/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded bg-brand-navy px-3 py-1 text-[10px] font-semibold text-white hover:bg-brand-navy/90 transition cursor-pointer"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  )
                ) : null}
              </div>

            </div>

            {/* Footer */}
            <div className="bg-[#FAF9F6] border-t border-brand-border px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectForDetails(null);
                  setShowRequestForm(false);
                  setRequestSubmitted(false);
                  setRequestName("");
                  setRequestContact("");
                }}
                className="rounded-lg bg-brand-navy px-5 py-2 text-xs font-mono font-bold text-white hover:bg-brand-navy/90 transition hover:scale-[1.01] cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
