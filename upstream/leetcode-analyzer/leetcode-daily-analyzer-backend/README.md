# ⚡ LeetCode Daily Analyzer — Backend API Service

Independent REST API and data ingestion backend for the **LeetCode Daily Analyzer**.

Built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **SheetJS (XLSX)**.

---

## 🛠️ Architecture

- **PostgreSQL Database**: Relational schema with `Department`, `Section`, `Student` (keyed on unique `regNo`), `DailySnapshot`, and `DailyStat`.
- **Modular LeetCode Engine**: Server-side GraphQL data provider with rate-limit awareness and exponential backoff retry.
- **Controlled Worker Queue**: Concurrent background queue (5 workers) with non-destructive upserts and live progress tracking.
- **Excel Roster Parser**: Fast `.xlsx` / `.xls` ingestion with automated header detection, duplicate registration number detection, and row-by-row validation.
- **Enterprise Reporting**: Excel & CSV exports formatted with 20 columns.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd leetcode-daily-analyzer-backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/leetcode_analyzer?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/leetcode_analyzer?schema=public"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

### 3. Setup Database Schema
```bash
npm run db:push
npm run db:generate
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start on [http://localhost:4000](http://localhost:4000).

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health and server timezone check. |
| `GET` | `/api/departments` | List all departments and section hierarchies. |
| `GET` | `/api/departments/:id/sections` | List sections for a specific department. |
| `POST` | `/api/students/import` | Validate and import student Excel roster (`.xlsx`/`.xls`) with department/section linking. |
| `GET` | `/api/students` | Search and filter student profiles by department & section. |
| `GET` | `/api/students/:id` | Get individual student profile and metrics. |
| `GET` | `/api/students/:id/history` | Get full historical timeline of student stats. |
| `POST` | `/api/analyze` | Start batch analysis for students on today's snapshot (`Asia/Kolkata`). |
| `GET` | `/api/analyze/progress` | Poll real-time batch processing progress. |
| `POST` | `/api/analyze/retry` | Retry failed or rate-limited student profiles. |
| `POST` | `/api/analyze/cancel` | Cancel active analysis queue. |
| `GET` | `/api/dashboard` | Aggregated metrics, rankings, and yesterday-vs-today diffs. |
| `GET` | `/api/leaderboard` | Ranked student leaderboard with tie-breakers. |
| `GET` | `/api/snapshots` | List all historical snapshots. |
| `GET` | `/api/snapshots/:date` | Snapshot detail with filtered student roster. |
| `GET` | `/api/export/:date` | Export snapshot report as `.xlsx` or `.csv` (20 enterprise columns). |
| `POST` | `/api/seed-sample` | Generate 3 multi-day snapshots with ECE, CSE, MECH students. |
| `GET` | `/api/template` | Download empty student template Excel file. |
