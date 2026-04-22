# SRA - Smart Resource Allocation

**Data-Driven Volunteer Coordination for Social Impact**

> Built by **Taskforce 141**

---

## The Problem

Local social groups and NGOs collect critical community data through paper surveys and field reports. This data -- scattered across CSV files, spreadsheets, and paper forms -- holds the key to understanding where help is needed most. But without a system to consolidate, analyze, and act on it, the most urgent needs go unnoticed, and volunteers are deployed inefficiently.

## Our Solution

**SRA** is an intelligent platform that transforms raw survey data into actionable insights using AI-powered analysis. Volunteers upload CSV files from the field, and our system:

1. **Ingests any CSV format** -- no matter how many columns or how different the headers are across surveys
2. **AI-analyzes every entry** -- DeepSeek AI reads each survey response and assigns a severity level (1-5) based on unmet needs, access obstacles, and safety concerns
3. **Generates actionable summaries** -- identifies patterns like "Water shortage reported in 3 nearby regions" or "Military interference reducing aid in Mandalay"
4. **Visualizes the data** -- admin dashboard with severity distribution charts, regional breakdowns, needs radar, and timeline trends
5. **Enables smart coordination** -- the most critical cases surface first, helping organizations allocate volunteers where they matter most

---

## Key Features

| Feature | Description |
|---|---|
| **Universal CSV Ingestion** | Upload any survey CSV -- the system auto-detects and normalizes headers, handling 10 columns or 70+ seamlessly |
| **AI Severity Analysis** | DeepSeek AI evaluates each survey entry on a 1-5 severity scale with explicit humanitarian criteria |
| **Background Processing** | Large CSVs are processed in batches without API timeouts -- real-time progress polling keeps users informed |
| **Role-Based Access** | Admin manages volunteers and has full control; Volunteers can upload and view data but cannot delete |
| **Interactive Dashboard** | Severity distribution, regional breakdown, needs radar, and upload timeline -- all with live data |
| **Dynamic Data Tables** | Survey entries render with their original column headers regardless of CSV structure |
| **Skeleton Loading States** | Every page loads gracefully with animated skeleton screens |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma ORM |
| Authentication | NextAuth.js v5 with Credentials provider |
| AI Engine | DeepSeek API (chat completions) |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts (Pie, Bar, Area, Radar) |
| CSV Parsing | PapaParse |

---

## Architecture

```
                    +------------------+
                    |   Landing Page   |
                    |   (Public NGO)   |
                    +--------+---------+
                             |
                        [Login]
                             |
                    +--------+---------+
                    |   Auth (JWT)     |
                    |   NextAuth.js    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |  Admin Dashboard |          | Volunteer View  |
     |  - Charts        |          | - Upload CSV    |
     |  - Manage Vols   |          | - View Entries  |
     |  - All Uploads   |          | - Track Status  |
     +--------+---------+          +--------+--------+
              |                             |
              +--------------+--------------+
                             |
                    +--------+---------+
                    |    API Routes    |
                    | /api/uploads     |
                    | /api/volunteers  |
                    | /api/stats       |
                    | /api/analyze     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |  Prisma ORM     |          |  DeepSeek AI    |
     |  SQLite / PG    |          |  Severity 1-5   |
     |                  |          |  Summary Gen    |
     +------------------+          +-----------------+
```

### Data Flow

```
CSV Upload --> PapaParse (parse + normalize headers)
          --> Store entries in DB (raw_data as JSON)
          --> Queue AI analysis (fire-and-forget)
          --> DeepSeek processes batches of 30 rows
          --> Each entry gets severity_level + status
          --> Upload gets ai_summary + ai_tags
          --> Frontend polls until complete
          --> Dashboard charts update in real-time
```

---

## Database Schema

Three tables powering the entire system:

- **users** -- Admin (hardcoded) and volunteers (created by admin)
- **uploads** -- Each CSV upload with metadata, header schema, and AI insights
- **survey_entries** -- Individual survey rows stored as flexible JSON with severity and status

The `raw_data` JSON field allows any CSV structure to be stored without schema changes -- a 10-column food survey and a 70-column humanitarian assessment coexist in the same table.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd sra

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DEEPSEEK_API_KEY

# Initialize the database
npx prisma db push
npx prisma generate

# Seed the admin user
npm run seed

# Start the development server
npm run dev
```

### Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskforce141.com | admin@141 |

The admin can create volunteer accounts from the dashboard.

---

## Project Structure

```
sra/
├── prisma/
│   ├── schema.prisma          # Database schema (3 tables)
│   └── seed.ts                # Seeds admin user
├── src/
│   ├── app/
│   │   ├── page.tsx           # Public NGO landing page
│   │   ├── login/             # Authentication
│   │   ├── dashboard/
│   │   │   ├── admin/         # Admin dashboard + volunteer mgmt
│   │   │   ├── uploads/       # Upload list, new upload, entry detail
│   │   │   └── settings/      # Account settings
│   │   └── api/               # REST API routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── dashboard/         # Sidebar, Header
│   │   └── skeletons/         # Loading state components
│   └── lib/
│       ├── prisma.ts          # Database client
│       ├── auth.ts            # NextAuth configuration
│       ├── csv-parser.ts      # CSV parsing + header normalization
│       └── ai-analyzer.ts     # DeepSeek integration + batch processing
├── .env.example
└── package.json
```

---

## AI Analysis Details

### Severity Criteria

| Level | Label | Criteria |
|---|---|---|
| 5 | Critical | Needs aid, did NOT receive it, multiple access obstacles, unsafe conditions |
| 4 | High | Needs aid, received some but doesn't cover basic needs, significant obstacles |
| 3 | Moderate | Received aid, partially covers needs, some difficulties |
| 2 | Low | Received aid, mostly covers needs, minor issues |
| 1 | Minimal | Received aid, needs fully covered, no issues |

### Processing Strategy

- Large CSVs are split into batches of 30 entries per AI call
- Processing happens in the background -- the API responds immediately
- Frontend polls every 3 seconds to show real-time progress
- If a batch fails, entries default to severity 3 (moderate) so no data is lost
- After all entries are scored, a summary prompt generates the overall AI insight

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/uploads | Upload CSV file | All |
| GET | /api/uploads | List all uploads | All |
| GET | /api/uploads/:id | Get upload details | All |
| DELETE | /api/uploads/:id | Delete upload | Admin |
| GET | /api/uploads/:id/entries | Paginated entries | All |
| POST | /api/analyze | Re-trigger AI analysis | All |
| GET | /api/volunteers | List volunteers | All |
| POST | /api/volunteers | Create volunteer | Admin |
| PATCH | /api/volunteers/:id | Update volunteer | Admin |
| DELETE | /api/volunteers/:id | Delete volunteer | Admin |
| GET | /api/stats | Dashboard statistics | All |

---

## Team

**Taskforce 141** -- Building technology for social impact.

---

## License

MIT
