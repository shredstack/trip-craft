# TripCraft

AI-powered travel planning app that helps users discover destinations, plan excursions, and organize trip logistics.

## Tech Stack

- **Framework**: Next.js 15+ (App Router), React 19, TypeScript 5
- **Database**: PostgreSQL on Neon (serverless), Prisma ORM
- **AI**: Anthropic Claude API (Sonnet) with tool use for structured recommendations
- **APIs**: Google Places API for destination/excursion enrichment
- **Styling**: Tailwind CSS v4 with CSS variables, Framer Motion for animations
- **Icons**: lucide-react
- **Validation**: Zod
- **Deployment**: Vercel

## Quick Reference

```bash
npm run dev        # Start dev server
npm run build      # Production build (also verifies Edge compatibility)
npm run lint       # ESLint
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma migrate dev       # Create and apply migrations
npx prisma db push           # Push schema changes without migration (dev only)
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── plan/page.tsx                     # Trip planning wizard
│   ├── dashboard/page.tsx                # My Trips dashboard
│   ├── results/[tripId]/page.tsx         # AI generation loading screen
│   ├── trip/[tripId]/page.tsx            # Trip detail with tabs
│   ├── layout.tsx                        # Root layout (fonts, Navbar)
│   └── api/
│       ├── trips/                        # CRUD for trips
│       ├── generate/                     # AI destination generation
│       └── places/                       # Google Places enrichment
├── components/
│   ├── ui/          # Reusable primitives (Button, Chip, Counter, StatusBadge, EmptyState)
│   ├── layout/      # Navbar, BackgroundAtmosphere
│   ├── landing/     # Hero, FeatureCards
│   ├── wizard/      # WizardShell, StepTravelers, StepPreferences, StepLogistics
│   ├── results/     # LoadingScreen, DestinationCard, ResultsHeader
│   ├── dashboard/   # TripCard, StatusFilters
│   └── trip-detail/ # TripDetailHeader, DetailTabs, DestinationsTab, ExcursionsTab, LogisticsTab, NotesTab
├── lib/
│   ├── db.ts              # Prisma client singleton
│   ├── claude.ts          # Claude API integration with tool use
│   ├── google-places.ts   # Google Places search and enrichment
│   ├── user.ts            # Client-side user ID (UUID) + apiFetch helper
│   ├── get-user.ts        # Server-side user extraction from x-user-id header
│   └── types.ts           # Shared TypeScript interfaces
└── styles/
    └── globals.css        # Design system (CSS variables, colors, fonts, animations)
```

## Architecture

### User Flow
`/ (landing)` → `/plan (wizard)` → `/results/[tripId] (loading)` → `/trip/[tripId] (detail)` ← `/dashboard`

### Data Flow
1. Client calls `apiFetch()` which adds `x-user-id` header (UUID from localStorage)
2. API routes extract user via `getOrCreateUser()` from the header
3. Prisma handles all database operations
4. Responses returned as JSON to client components

### Authentication
Simple prototype auth: client generates a UUID stored in localStorage, passed as `x-user-id` header on every request. Server auto-creates user records on first request. No OAuth/JWT.

### Database Schema (Prisma)
- **User** - Profiles with departure city and preferences (JSON)
- **Trip** - Core entity with status enum (DREAMING → PLANNING → BOOKED → COMPLETED → ARCHIVED), criteria (JSON), dates, budget
- **Destination** - AI-recommended places with match scores, pricing, Google Places data
- **Excursion** - Activities at destinations with type enum, pricing, kid-friendliness
- **TripItem** - Logistics (flights, hotels, car rentals, etc.) with status tracking

### AI Integration
- Claude Sonnet via `@anthropic-ai/sdk` with tool use
- `recommend_destinations` tool returns structured JSON (destinations with scores, costs, activities)
- System prompt defines travel planning expertise and output expectations
- Responses validated before database insertion

## Coding Conventions

### Components
- Organize by feature area under `src/components/`, generic UI primitives go in `src/components/ui/`
- Named exports: `export function ComponentName()` (not default exports)
- PascalCase file names matching component names
- Use existing UI components (Button, Chip, Counter, StatusBadge, EmptyState) before creating new ones

### Styling
- Tailwind CSS v4 utility classes as the primary approach
- CSS variables defined in `src/styles/globals.css` for the design system
- Color palette: coral, sunset, ocean (light/deep), tropical, sand, purple-voyage
- Dark theme with custom background, text, and border variables
- Custom fonts: Outfit (headings), Sora (body), Space Mono (monospace)

### API Routes
- All routes in `src/app/api/`
- Always extract user with `getOrCreateUser()` from `src/lib/get-user.ts`
- Validate inputs with Zod where possible
- Return proper HTTP status codes
- Scope all data queries to the authenticated user's ID

### Mobile First
- All UI must work on mobile and desktop
- Use `dvh` instead of `vh` for full-height containers
- Ensure touch targets are at least 44x44px
- Use card-on-mobile pattern for tables with 4+ columns

### TypeScript
- Strict mode, avoid `any` types
- Shared interfaces in `src/lib/types.ts`
- Use Prisma-generated types where possible

## Environment Variables

See `.env.example`:
- `DATABASE_URL` - Neon pooled connection string
- `DIRECT_URL` - Neon direct connection (for migrations)
- `ANTHROPIC_API_KEY` - Claude API key
- `GOOGLE_PLACES_API_KEY` - Google Places API key

## Critical Warnings

- **Never import database code into middleware.ts** - it runs in Edge runtime and will crash the entire app
- **Always run `npm run build`** to verify Edge compatibility after middleware changes
- **Always scope data to user** - every query should filter by the requesting user's ID
- **Regenerate Prisma client** (`npx prisma generate`) after any schema changes

