# TripCraft

AI-powered personal travel planner that helps you find the best destinations, excursions, and trip logistics using Claude AI recommendations grounded in real Google Places data.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** Neon PostgreSQL + Prisma ORM
- **AI:** Claude API (Anthropic)
- **Background Jobs:** Inngest (durable workflow execution)
- **Data:** Google Places API
- **Animations:** Framer Motion
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Anthropic](https://console.anthropic.com) API key
- A [Google Places](https://developers.google.com/maps/documentation/places/web-service) API key (optional — enrichment skips gracefully without it)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your values in `.env.local`:
   ```
   DATABASE_URL=          # Neon pooled connection string
   DIRECT_URL=            # Neon direct connection (for migrations)
   ANTHROPIC_API_KEY=     # Claude API key
   GOOGLE_PLACES_API_KEY= # Google Places API key
   ```
   Then copy to `.env` for Prisma CLI:
   ```bash
   cp .env.local .env
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start the Inngest dev server** (in a separate terminal):
   ```bash
   npx inngest-cli@latest dev
   ```
   This opens the Inngest dashboard at [http://localhost:8288](http://localhost:8288) where you can monitor function runs, view step outputs, and replay failed events.

   Or, to specify which app endpoint(s) to discover, use:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:<port>/api/inngest

   # Example:
   npx inngest-cli@latest dev -u http://localhost:3000/api/inngest -u http://localhost:3001/api/inngest
   ```

   If you ever need a separate Inngest server running locally, use the port flag, `-p`. For example,
   ```bash
   npx inngest-cli@latest dev -p 8289 -u http://localhost:3001/api/inngest
   ```

5. **Start the Next.js dev server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

> **Note:** The Inngest dev server must be running alongside the Next.js dev server for trip generation to work. Inngest automatically discovers the `/api/inngest` serve endpoint.

## User Flow

1. **Landing page** — Learn about the app, click "Plan a Trip"
2. **Trip Wizard** (3 steps) — Enter travelers, preferences, and logistics
3. **AI Loading Screen** — Fun facts while Claude + Google Places process
4. **Results Page** — Ranked destination cards with match scores, stats, and excursions
5. **Save & Manage** — Save destinations to a trip, view on dashboard
6. **Trip Detail** — Deep dive into destinations, excursions, logistics, and notes

## Project Structure

```
src/
├── app/
│   ├── page.tsx                # Landing page
│   ├── plan/page.tsx           # Trip wizard
│   ├── results/[tripId]/       # AI results
│   ├── dashboard/page.tsx      # My Trips
│   ├── trip/[tripId]/          # Trip detail
│   └── api/                    # API routes
├── components/
│   ├── layout/                 # Navbar, BackgroundAtmosphere
│   ├── landing/                # Hero, FeatureCards
│   ├── wizard/                 # WizardShell, step components
│   ├── results/                # LoadingScreen, DestinationCard
│   ├── dashboard/              # TripCard, StatusFilters
│   ├── trip-detail/            # Tabs, excursions, logistics, notes
│   └── ui/                     # Button, Chip, Counter, etc.
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── claude.ts               # Claude API integration
│   ├── google-places.ts        # Google Places helpers
│   ├── inngest/                # Inngest client + background functions
│   │   ├── client.ts           # Inngest client instance
│   │   └── generate-destinations.ts  # Durable generation pipeline
│   ├── recommendation/         # Multi-step recommendation pipeline
│   ├── user.ts                 # Client-side user ID + fetch
│   ├── get-user.ts             # Server-side user helpers
│   └── types.ts                # Shared TypeScript types
└── styles/
    └── globals.css             # Design system variables + base styles
```

## Deployment

Built for [Vercel](https://vercel.com). Connect your repo and add the environment variables in your Vercel project settings.

### Inngest Setup

1. Enable the [Inngest Vercel integration](https://vercel.com/integrations/inngest) for this project
2. Set your custom production domain (`trip-craft.shredstack.net`) in the Inngest integration settings
3. Inngest environment variables (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) are added automatically by the integration
