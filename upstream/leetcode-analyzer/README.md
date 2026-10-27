# ⚡ LeetCode Daily Analyzer

An enterprise-grade, full-stack student performance and daily snapshot tracker for LeetCode profiles, styled in a sleek **Obsidian + Electric Lime** visual theme.

Built with **Next.js 14 (App Router)**, **React 18**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, **Tailwind CSS**, and **Recharts**.

---

## ✨ Features

- **⚡ Obsidian + Electric Lime Design System**: High-contrast, dark aesthetic with dynamic micro-animations, glassmorphic cards, and sleek typography.
- **🏫 Multi-Tier Department & Section Hierarchy**:
  - Filter across All Departments or specific branches (`ECE`, `CSE`, `EEE`, `MECH`, `CIVIL`, etc.).
  - Drill down into sections (`Section A`, `B`, `C`, `D`, `E`).
- **📊 Immutable Daily Snapshots**:
  - Timezone-aware snapshot system calibrated for `Asia/Kolkata`.
  - Historical snapshots are preserved permanently and non-destructively.
  - Automatically calculates yesterday-vs-today problem differences and identifies top improvers.
- **⚡ Controlled Concurrency Data Engine**:
  - Server-side modular LeetCode provider with exponential backoff and rate-limit handling.
  - Multi-worker queue processing with live percentage progress modals.
- **📁 Smart Excel Import & Duplicate Detection**:
  - Upload student rosters (`.xlsx` / `.xls`) with automated column matching (`S.NO`, `REG NO`, `NAME`, `LEETCODE URL`).
  - Row-by-row validation with duplicate `regNo` and duplicate LeetCode username detection.
  - Links students directly to selected Department & Section.
- **📥 Enterprise Spreadsheet Export**:
  - One-click export to `.xlsx` or `.csv` formatted with all 20 standard enterprise columns.
- **🏆 Live Leaderboard & Profile History**:
  - Leaderboard sorted by total solved problems with strict tie-breaking (`Total -> Hard -> Medium -> Easy`).
  - Student detail modal featuring complete historical snapshot progression charts.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Recharts
- **Backend / API**: Next.js Server Route Handlers
- **Database**: PostgreSQL (Supabase / Neon / Local PG)
- **ORM**: Prisma 5.22
- **Data Engine**: Modular `ILeetCodeProvider` with GraphQL query fallback
- **File Parsing**: SheetJS (`xlsx`)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/iamvijayvarma/LEETCODE-ANALYZER.git
cd LEETCODE-ANALYZER
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and provide your PostgreSQL connection string:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/leetcode_analyzer?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/leetcode_analyzer?schema=public"
LEETCODE_API_URL=""
LEETCODE_API_KEY=""
```

### 4. Setup Database
```bash
npx prisma db push
npx prisma generate
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
├── prisma/
│   └── schema.prisma              # PostgreSQL schema with Department/Section/Student/Snapshot models
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/           # Batch analysis queue & progress API
│   │   │   ├── dashboard/         # Aggregated metric cards & filtered student lists
│   │   │   ├── departments/       # Department & Section listing API
│   │   │   ├── export/            # Excel & CSV report generator
│   │   │   ├── leaderboard/       # Ranked student leaderboard
│   │   │   ├── seed-sample/       # Multi-day demo dataset generator
│   │   │   ├── snapshots/         # Snapshot retrieval & retry API
│   │   │   ├── students/          # Student directory & Excel import API
│   │   │   └── template/          # Sample Excel template download
│   │   ├── globals.css            # Obsidian + Lime design system tokens
│   │   ├── layout.tsx             # Root layout & Google Inter font
│   │   └── page.tsx               # Main Dashboard application
│   ├── components/                # Modular React UI components
│   └── lib/                       # Core utilities, LeetCode provider, Excel parsers
├── .env.example
├── package.json
└── tailwind.config.ts
```

---

## 📄 License
MIT License
