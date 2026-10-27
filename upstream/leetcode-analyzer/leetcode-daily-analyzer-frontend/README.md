# ⚡ LeetCode Daily Analyzer — Frontend Web Application

The frontend user interface for the **LeetCode Daily Analyzer**, styled in a premium **Obsidian + Electric Lime** aesthetic.

Built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Lucide Icons**.

---

## ✨ Features

- **⚡ Obsidian + Electric Lime Theme**: High-contrast, dark UI with subtle micro-animations, glassmorphic surfaces, and bespoke typography.
- **🏫 Multi-Department & Section Hierarchies**: Dynamic filtering by Department (`ECE`, `CSE`, `MECH`, `EEE`) and Section (`A`, `B`, `C`).
- **📊 Comprehensive Performance Dashboard**: Summary metric counters, student directory, problem difficulty breakdowns, and yesterday-vs-today growth badges.
- **🏆 Live Classroom Leaderboard**: Podium view for top 3 champions with difficulty filtering (`Total`, `Hard`, `Medium`, `Easy`) and strict tie-breaking.
- **📈 Analytics & Visualizations**: Interactive Recharts for problem milestone tiers, difficulty distributions, and historical timeline progression.
- **📁 Client-Side Preview & Roster Upload**: Excel upload modal with immediate client-side row validation and target department/section assignment.
- **📥 Institutional Spreadsheet Exports**: Direct generation and download of 20-column `.xlsx` and `.csv` snapshot reports.
- **🔒 Pure Frontend Architecture**: Communicates strictly via HTTP REST endpoints through `lib/api.ts` with `NEXT_PUBLIC_API_URL`. Zero direct database connections or leaked secrets.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Client Parsing**: SheetJS (`xlsx`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd leetcode-daily-analyzer-frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Set your backend server URL:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── globals.css            # Obsidian + Lime design system tokens
│   │   ├── layout.tsx             # Root layout & typography
│   │   └── page.tsx               # Main Dashboard application & tab router
│   ├── components/                # Modular React UI components
│   │   ├── AnalyticsView.tsx      # Charts & performance metrics
│   │   ├── ExportView.tsx         # Report download manager
│   │   ├── HistoryView.tsx        # Snapshot date timeline
│   │   ├── LeaderboardView.tsx    # Podium & ranked standings
│   │   ├── Navbar.tsx             # Department/Section filters & actions
│   │   ├── ProgressModal.tsx      # Real-time batch progress modal
│   │   ├── SettingsView.tsx       # System architecture & demo seeder
│   │   ├── Sidebar.tsx            # Primary navigation sidebar
│   │   ├── StudentDetailModal.tsx # Student progress history modal
│   │   ├── StudentTable.tsx       # Interactive student directory table
│   │   ├── SummaryCards.tsx       # KPI metric cards
│   │   └── UploadModal.tsx        # Excel upload & preview modal
│   └── lib/
│       ├── api.ts                 # Centralized API client (NEXT_PUBLIC_API_URL)
│       ├── date.ts                # Timezone & date format utilities
│       ├── excel.ts               # Client preview parser & template generator
│       ├── types.ts               # Shared TypeScript types
│       └── utils.ts               # CSS and number format helpers
├── .env.example
├── package.json
└── tailwind.config.ts
```
