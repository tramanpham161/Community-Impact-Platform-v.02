# OAHA Community Impact Platform (Operational Update Initiative)

This interactive microsite serves as a progress space and analytical dashboard for **OAHA UK**. It is designed to map spatial deprivation across high-priority local wards, track the current status of community-led transformation pathways, and coordinate operational interventions with partners.

By integration of local data indicators and the Wales Index of Multiple Deprivation (WIMD), the platform enables a targeted approach to social mobility and employment transition.

---

## 🌎 Live Links
* **Main Website:** [oaha.uk](https://oaha.uk)
* **LinkedIn Updates:** [OAHA UK LinkedIn](https://linkedin.com)

---

## 🔍 Key Capabilities & Screen Features

### 1. **Needs-Led Audience Chooser (`ModeChooser`)**
Tailors page content, visual notifications, and focus parameters according to the active demographic query:
* **Community Groups:** Emphasizes local support structures, lived-experience insights, and community-led initiatives.
* **Employers:** Focuses on apprentice pipelines, vacancy alignment, career-ready pathways, and training collaboration.
* **Policymakers:** Visualizes strategic deprivation matrices, WIMD indices, and system metrics.

### 2. **Interactive Deprivation Maps (`Map`)**
A rich visualizer rendering geographical boundaries, partner pin locations, and demographic attributes:
* **Thematic Choropleth Repainting:** Toggle between critical WIMD domains (Overall Index, Income, Education & Skills, Health, Housing).
* **Partner Overlays:** Filter and select specific registered partner organizations (schools, non-profits, housing groups) directly from the map space.

### 3. **The Work-Life Journey Stage Strip (`JourneyStageStrip`)**
Visualizes the transition timeline of program participants across six core stages of transformation:
* **J1: Initial Needs Identification** — Outreach and primary welfare connection.
* **J2: Direct Engagement & Assessment** — Custom profile scoping.
* **J3: Workplace Behaviours & Skillsets** — Confidence-building workshops.
* **J4: Core Confidence & Learning** — Targeted skill qualifications.
* **J5: Placement & Employment Entry** — Immediate employment onboarding.
* **J6: Sustained Employment (6 Months+)** — Retention support and stabilization.

Clicking any stage narrows down the maps and lists to show active pins matching that specific lifecycle milestone.

### 4. **Transformation & Pipeline Hub (`TransformationPanel`)**
The nerve center of active operational workflows:
* **"What’s in the Pipeline" Board:** A clean Kanban lifecycle visual tracking projects through conceptualizing, planning, active delivery, and completed phases.
* **Detailed Snapshot Overlays:** Inspect project leaders, target participant cohorts, geographic regions, and precise local resource allocations.
* **Information Request Form:** Embedded inside project details, allowing users to select who they are (Employer/Community Group), enter their name and contact info, and submit requests for more granular operational data.
* **Partner Collaboration Call-To-Action (CTA):** A highly visible, professional block prompting partners to begin conversations to launch or propose new community initiatives.

### 5. **Deprivation Targeting Matrix (`ImpactPanel`)**
A clean, visual distribution matrix mapping real-time pathway engagement counts against WIMD Quintiles:
* High-deprivation targeting is represented clearly using distinct color-coded indices (Quintiles 1 & 2 mark primary focus).
* Supports filtering by domains (e.g., Overall Index vs. Income or Education context).

---

## 🛠️ Tech Stack & Architecture

* **Framework:** React 18+ paired with Vite
* **Language:** TypeScript
* **Styling & Theme:** Tailwind CSS. Engineered with a white, clean, and high-contrast professional design system.
* **Animations:** Framer Motion (`motion/react`) for spatial micro-interactions, subtle transitions, and card layouts.
* **Iconography:** Lucide Icons (`lucide-react`) exclusively.

---

## 🚀 Native Local Development

Follow these simple steps to run the microsite on your local machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### 2. Installation
Clone the repository, navigate to the directory, and install dependencies:
```bash
npm install
```

### 3. Run Development Server
Boot the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build
Compile the static application assets:
```bash
npm run build
```
The compiled, production-ready static outputs will be generated inside the `/dist` directory.

---

## ✉️ Operational Contact & Contributions
For corrections, pipeline registrations, or data queries, contact the operations team directly at **info@oaha.uk**.

*© 2026 OAHA UK. OPERATIONAL UPDATE INITIATIVE.*
