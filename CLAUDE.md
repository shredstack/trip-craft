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
│   ├── auth.ts             # NextAuth configuration
│   ├── user.ts            # Client-side apiFetch helper (sets Content-Type, cookies handle auth)
│   ├── get-user.ts        # Server-side user extraction from NextAuth session
│   └── types.ts           # Shared TypeScript interfaces
└── styles/
    └── globals.css        # Design system (CSS variables, colors, fonts, animations)
```

## Architecture

### User Flow
`/ (landing)` → `/plan (wizard)` → `/results/[tripId] (loading)` → `/trip/[tripId] (detail)` ← `/dashboard`

### Data Flow
1. Client calls `apiFetch()` which sets `Content-Type: application/json`; authentication is handled automatically via NextAuth session cookies
2. API routes extract user via `getAuthenticatedUserId()` from the NextAuth session
3. Prisma handles all database operations
4. Responses returned as JSON to client components

### Authentication
NextAuth with session cookies. The `apiFetch()` helper in `src/lib/user.ts` is a thin wrapper around `fetch` that sets JSON content-type; it does **not** add custom auth headers. For non-JSON requests (e.g., FormData uploads), raw `fetch()` is fine since session cookies are sent automatically by the browser. Server-side, `getAuthenticatedUserId()` in `src/lib/get-user.ts` reads the user ID from the NextAuth session.

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
- Always extract user with `getAuthenticatedUserId()` from `src/lib/get-user.ts`
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

## Database Migrations

**Every schema change must have a corresponding migration.** The CI workflow (`.github/workflows/migrate.yml`) runs `prisma migrate deploy` on pushes to `main` that touch `prisma/migrations/**`. If a migration file doesn't exist, the change will never reach production.

### Standard workflow (new schema changes)
After modifying `prisma/schema.prisma`:
1. Run `npx prisma migrate dev --name <descriptive_name>` to generate and apply a migration
2. Verify the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` includes **all** your schema changes
3. Commit the migration file alongside the schema change

### Fixing drift (local DB out of sync from `db push`)
If `migrate dev` reports drift (tables exist in DB but not in migration history), **do not reset the database**. Instead, create the migration manually and mark it as already applied:
1. Write the migration SQL by hand based on the schema diff (create the missing tables, enums, indexes, and foreign keys)
2. Place it in `prisma/migrations/<timestamp>_<name>/migration.sql`
3. Run `npx prisma migrate resolve --applied <timestamp>_<name>` to tell Prisma the local DB already has these changes
4. Verify with `npx prisma migrate status` — it should report "Database schema is up to date!"

### Rules
- **Do not use `prisma db push` as a substitute for migrations.** It syncs the local database without creating a migration file, so the change will not be deployed to production. Only use `db push` for throwaway local prototyping, and always follow up with a proper migration before committing.
- **Never reset the database to fix drift** — use the manual migration + `migrate resolve` workflow above instead.

## Critical Warnings

- **Never import database code into middleware.ts** - it runs in Edge runtime and will crash the entire app
- **Always run `npm run build`** to verify Edge compatibility after middleware changes
- **Always scope data to user** - every query should filter by the requesting user's ID
- **Regenerate Prisma client** (`npx prisma generate`) after any schema changes
