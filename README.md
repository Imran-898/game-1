# ZipRace

A competitive, real-time multiplayer path-puzzle game built using Next.js (App Router), Supabase (Auth, Realtime, Database), Tailwind CSS v4, and Vercel.

## The Game

ZipRace is a single-path logic puzzle where players compete in real time to solve the same grid puzzle.
- **Rule 1**: Draw a single continuous path connecting numbered checkpoints in ascending order (1 to N).
- **Rule 2**: The path must visit every cell in the grid exactly once (a constrained Hamiltonian path).
- **Rule 3**: The path cannot cross itself or cross any wall boundaries.
- **Rule 4**: Compete against other players to finish the fastest!

## Technologies
- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Framer Motion
- **Backend/Database**: Supabase (Postgres, Auth, Realtime)
- **Monitoring & Analytics**: PostHog, Sentry
- **Testing**: Vitest (Unit), Playwright (E2E)

## Getting Started

### Prerequisites
- Node.js v18 or higher
- NPM (or Yarn/PNPM if configured)

### Setup
1. Clone the repository (if applicable) or enter the directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Copy `.env.example` to `.env.local` and populate it with your Supabase, PostHog, and Sentry keys.
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Database Setup
1. Create a project in Supabase.
2. Open the SQL Editor in the Supabase Dashboard.
3. Paste the contents of `supabase/migrations/20260613000000_init_schema.sql` into the SQL Editor and execute them.
