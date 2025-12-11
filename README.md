# Multi-Store Customer Feedback & Task Management System

A comprehensive system for managing customer feedback across multiple retail stores, automatically converting negative reviews into actionable tasks for Team Leaders.

![ReviewTrack Dashboard](docs/dashboard-preview.png)

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 with React, TypeScript
- **Styling**: Custom CSS with dark theme and premium design
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Cron Jobs**: node-cron for scheduled task assignment

### Core Features
1. **Webhook Integration**: Receives reviews from Tally.so
2. **Automated Task Assignment**: Daily cron job at 9:00 AM
3. **SLA Tracking**: Color-coded status (Green/Red/Black)
4. **Role-Based Dashboards**: Superadmin, Shop Admin, Section TL

## 📊 Database Schema (ER Diagram)

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│   SHOPS     │       │     USERS       │       │   SECTIONS   │
├─────────────┤       ├─────────────────┤       ├──────────────┤
│ id (PK)     │       │ id (PK)         │       │ id (PK)      │
│ name        │───┐   │ name            │       │ name         │
│ address     │   │   │ email           │       │ displayOrder │
│ city        │   │   │ password        │       └──────────────┘
│ isActive    │   │   │ role            │              │
│ createdAt   │   └──>│ shopId (FK)     │              │
│ updatedAt   │       │ createdAt       │              │
└─────────────┘       │ updatedAt       │              │
       │              └─────────────────┘              │
       │                      │                        │
       │              ┌───────┴───────┐                │
       │              │               │                │
       │      ┌───────────────┐       │                │
       │      │ USER_SECTIONS │       │                │
       │      ├───────────────┤       │                │
       │      │ userId (FK)   │<──────┘                │
       │      │ sectionId (FK)│<───────────────────────┘
       │      │ shopId (FK)   │<──────┐
       │      └───────────────┘       │
       │                              │
       │      ┌─────────────────────┐ │
       └─────>│      REVIEWS        │ │
              ├─────────────────────┤ │
              │ id (PK)             │ │
              │ shopId (FK)         │<┘
              │ sectionId (FK)      │
              │ customerName        │
              │ rating (1-5)        │
              │ comment             │
              │ tallySubmissionId   │
              │ isProcessed         │
              └─────────────────────┘
                       │
                       │ (1:1 for ratings < 4)
                       ▼
              ┌─────────────────────┐
              │       TASKS         │
              ├─────────────────────┤
              │ id (PK)             │
              │ reviewId (FK)       │
              │ assignedToId (FK)   │──> USER
              │ shopId (FK)         │──> SHOP
              │ sectionId (FK)      │──> SECTION
              │ status              │ (PENDING/ON_TIME/DELAYED)
              │ slaStatus           │ (SLA color coding)
              │ assignedAt          │ (Timer starts here)
              │ resolvedAt          │
              │ remarks             │
              └─────────────────────┘
```

### SLA Status Logic (Color Coding)

| Status | Color | Condition |
|--------|-------|-----------|
| **ON_TIME** | 🟢 Green | Task resolved within 0-24 hours of assignment |
| **DELAYED** | 🔴 Red | Task resolved between 24-48 hours |
| **PENDING** | ⚫ Black | Task open for > 48 hours OR no action taken yet |

## 🔄 Business Logic Flow

```
Tally.so Form Submit
        │
        ▼
┌───────────────────┐
│  Webhook Handler  │──> POST /api/webhooks/tally
│  Parse & Validate │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Store Review in  │
│  Database         │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Rating < 4?      │───── No ──> Done (Positive review stored)
└────────┬──────────┘
         │ Yes
         ▼
┌───────────────────┐
│  Mark for         │
│  Processing       │
└────────┬──────────┘
         │
         ▼ (Daily at 9:00 AM via Cron Job)
┌───────────────────────────┐
│  CRON JOB                 │──> POST /api/cron/tasks
│  - Fetch unprocessed      │
│    negative reviews       │
│  - Find TL for section    │
│  - Create Task            │
│  - Set assignedAt = now() │
└───────────────────────────┘
         │
         ▼
┌───────────────────────────┐
│  SLA Timer Starts         │
│  TL can resolve task via  │
│  Dashboard                │
└───────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+**
- **PostgreSQL 14+** (or use a cloud provider like Supabase, Neon, etc.)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd review-management-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Copy env.template to .env and update with your values
# Update DATABASE_URL with your PostgreSQL connection string

# 4. Generate Prisma client
npm run db:generate

# 5. Run database migrations
npm run db:migrate

# 6. Seed the database with sample data
npm run db:seed

# 7. Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/review_management"

# NextAuth (for future authentication)
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Tally.so Webhook Secret (optional, for signature verification)
TALLY_WEBHOOK_SECRET="your-tally-webhook-secret"

# Cron Job Secret (for protected cron endpoints)
CRON_SECRET="your-cron-secret"

# Cron Schedule (9:00 AM daily)
CRON_SCHEDULE="0 9 * * *"
```

## 📁 Project Structure

```
review-management-system/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhooks/tally/   # Tally.so webhook handler
│   │   │   ├── cron/             # Cron job endpoints
│   │   │   ├── tasks/            # Task management APIs
│   │   │   ├── reviews/          # Review APIs
│   │   │   ├── shops/            # Shop management APIs
│   │   │   ├── sections/         # Section APIs
│   │   │   ├── users/            # User management APIs
│   │   │   └── analytics/        # Analytics APIs
│   │   ├── dashboard/
│   │   │   ├── superadmin/       # Superadmin dashboard
│   │   │   ├── admin/            # Shop Admin dashboard
│   │   │   └── tl/               # Team Leader dashboard
│   │   ├── login/                # Login page
│   │   └── page.tsx              # Landing page
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   ├── dashboard/            # Dashboard widgets
│   │   └── layout/               # Layout components
│   ├── lib/
│   │   ├── prisma.ts             # Prisma client
│   │   └── cron.ts               # Cron job logic
│   ├── services/
│   │   ├── task.service.ts       # Task business logic
│   │   ├── review.service.ts     # Review processing
│   │   └── analytics.service.ts  # Analytics calculations
│   └── types/
│       └── index.ts              # TypeScript types
├── env.template                  # Environment variables template
└── package.json
```

## 🔐 API Endpoints

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/tally` | Receive reviews from Tally.so |
| GET | `/api/webhooks/tally` | Health check |

### Cron Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cron/tasks` | Trigger daily task assignment |
| GET | `/api/cron/tasks` | Get cron job logs |
| POST | `/api/cron/sla` | Update SLA status for open tasks |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks with filters |
| GET | `/api/tasks/:id` | Get task details |
| PATCH | `/api/tasks/:id` | Resolve task with remarks |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | List reviews with filters |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics?scope=global` | Superadmin metrics |
| GET | `/api/analytics?scope=shop&shopId=X` | Shop-level metrics |
| GET | `/api/analytics/tl/:userId` | TL-level metrics |

### Shops & Sections
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shops` | List all shops |
| POST | `/api/shops` | Create a shop |
| GET | `/api/sections` | List all sections |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |

## 🎨 Dashboard Features

### Superadmin Dashboard
- Global map/list of all shops
- Aggregate SLA performance metrics
- Shop-by-shop performance comparison
- Recent activity feed

### Shop Admin Dashboard
- Shop-specific metrics
- Section-wise performance breakdown
- Team Leader performance table
- Trend visualization

### TL Dashboard
- "My Tasks" view with pending and resolved tasks
- Filter by: Date, Status, Section
- "Mark Issue Resolved" action with required remarks
- Personal performance metrics

## 📧 Tally.so Webhook Setup

1. Go to your Tally.so form settings
2. Navigate to "Integrations" → "Webhooks"
3. Add a new webhook with URL: `https://your-domain.com/api/webhooks/tally`
4. Your form should have fields for:
   - **Shop** (Dropdown) - Store location
   - **Section** (Dropdown) - One of the 10 fixed sections
   - **Rating** (Rating) - 1-5 stars
   - **Comment** (Long Text) - Customer feedback
   - **Name** (Text) - Optional customer name
   - **Phone** (Phone) - Optional contact

## ⏰ Cron Job Setup

### Option 1: External Service (Recommended for Serverless)
Use services like:
- **Vercel Cron** (if deploying on Vercel)
- **cron-job.org** (free)
- **AWS EventBridge**

Set up a daily call to `POST /api/cron/tasks` with:
```bash
curl -X POST https://your-domain.com/api/cron/tasks \
  -H "Authorization: Bearer your-cron-secret"
```

### Option 2: Server-side Cron (Traditional Node.js Server)
If running on a traditional server, the cron can be initialized in a separate process.

## 🔑 Demo Credentials

After running the seed script, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Superadmin** | superadmin@example.com | password123 |
| **Admin (Store 1)** | admin1@example.com | password123 |
| **Admin (Store 2)** | admin2@example.com | password123 |
| **TL (Store 1)** | tl1@example.com | password123 |
| **TL (Store 2)** | tl4@example.com | password123 |

## 🛠️ Fixed Sections

The system uses these 10 fixed sections as per requirements:
1. Men Casual
2. Men's Formal and Party wear
3. Men's Ethnic
4. Bridal Section
5. Regular and smart saree
6. Silk saree
7. Gown
8. SKD
9. Teens section
10. Kids section

## 📄 License

MIT License
