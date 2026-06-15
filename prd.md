ZipRace — Product Requirements Document & Implementation Blueprint
Document type: Production-ready PRD + Claude Code execution plan
Product: A competitive, real-time multiplayer path-puzzle game (Zip-style)
Stack: Next.js (App Router) · Supabase (Postgres, Auth, Realtime, Storage) · Vercel · PostHog · Sentry
Status: v1.0 — Approved for build
Owner: Founder / PM-Architect

Legal note: "Zip" and LinkedIn's puzzle games are LinkedIn properties. This document specifies an original game in the same genre (single continuous Hamiltonian-style path connecting ordered checkpoints across a filled grid). Use an original name (working title ZipRace), original branding, and original puzzle content. Do not copy LinkedIn's name, logo, visual identity, or puzzle sets.


1. Executive Summary
Vision
ZipRace turns the satisfying single-path logic puzzle into a fast, social, competitive experience. Where the genre's daily puzzle is a solitary 30-second ritual, ZipRace adds head-to-head racing, live presence, ranked ladders, and a daily meta that gives players a reason to return every day and a reason to invite friends.
Core gameplay loop

Player is presented with a grid containing numbered checkpoints (1…N) and optional wall segments between cells.
Player draws one continuous path that visits the checkpoints in ascending numeric order and fills every cell exactly once (a constrained Hamiltonian path).
The path may not cross itself or pass through walls.
Win condition: valid completed path. Competitive metric: time-to-solve and/or move-efficiency.
In multiplayer, 2–8 players solve the same puzzle simultaneously; finishing order and time determine placement and rating change.

The loop is: see puzzle → solve fast → see result/placement → climb ladder / chase streak → return tomorrow.
Target audience

Primary: 25–45 casual-competitive puzzle players who already play daily word/logic games and share results socially.
Secondary: lunch-break commuters on mobile; office friend groups racing each other; streak-driven completionists.

Monetization opportunities
Cosmetic-only, no pay-to-win: premium subscription (ad-free, extra stats, exclusive themes), cosmetic path skins / trail effects / grid themes, an optional seasonal battle pass, and supporter badges. Detailed in §11.
Competitive advantages

Real-time racing on identical puzzles — the genre is almost entirely single-player; live competition is the differentiator.
Deterministic, verifiable solves — server-side validation makes leaderboards trustworthy and anti-cheat tractable.
Daily meta + streaks + shareable results — the proven retention engine of daily puzzle games, layered with social competition.
Instant, frictionless rooms — invite-link rooms playable in one tap, no install.


2. Complete Feature Specification
Core Gameplay

Single-player mode: unlimited generated puzzles by difficulty tier (Easy 5×5 → Expert 8×8+ with walls). Local timer, retry, hint (limited).
Daily puzzle: one canonical puzzle per day shared by all players; one ranked attempt + practice replays; feeds the streak system.
Multiplayer mode (Phase 1 core): 2–8 players solve an identical puzzle in real time. Live opponent progress (% cells filled, current checkpoint) shown as ambient pressure without revealing solutions.
Public matchmaking: queue by rating band; server forms a room, picks a puzzle of appropriate difficulty, starts a countdown.
Private game rooms: host creates a room, gets an invite link/code, configures difficulty, size, and mode; starts when ready.
Spectator mode: join a room as a non-player; watch live progress bars and a replay of the winner's path post-round.
Practice mode: unranked, no timer pressure, full hints, undo unlimited.
Ranked mode: affects MMR/ELO; stricter rules (limited undo, no hints, abandon penalties).
Casual mode: matchmade but rating-neutral; relaxed rules; for warm-ups and friend play.

Multiplayer Systems

Realtime synchronization: authoritative server state for room lifecycle (lobby → countdown → in-round → results). Per-player progress broadcast via Supabase Realtime broadcast channels at a throttled cadence (e.g., ≤5 updates/sec/player). Solutions are never broadcast; only coarse progress and completion events.
Lobby creation: host config (mode, grid size, difficulty, max players, public/private, ranked/casual).
Invite links: /{room}/join?code=XXXX; short codes for verbal sharing; deep links open directly into the lobby.
Friend system: requests, accept/decline, friends list, online presence, "invite to room."
Presence indicators: online/in-lobby/in-round states via Supabase Presence.
Matchmaking queues: rating-banded queues per mode; expanding band over wait time; backfill for dropped players in casual.
Reconnect after disconnect: grace window (e.g., 30s) preserves the player's slot and current progress; client rehydrates from server state on rejoin.
Anti-cheat considerations: server-side solve validation; plausibility checks on solve time vs. input event stream; rate limits; signed round tokens; see §9.

User Accounts

Email/password sign up & login (Supabase Auth).
Social login: Google, Apple, GitHub (OAuth via Supabase).
Guest play: anonymous session that can be upgraded to a full account without losing stats.
User profiles: display name, avatar, bio, country flag (optional), pinned stats.
Avatars: uploaded image (Supabase Storage) or generated default; moderation on upload.
Statistics: solves, win rate, average solve time by difficulty, best times, current/longest streak.
Match history: per-match result, placement, opponents, puzzle id, replay link.
Achievement system: badges for milestones (first win, 7-day streak, sub-10s solve, 100 ranked wins, etc.).

Leaderboards

Global, weekly, monthly, seasonal, regional, and friends-only boards.
Boards by metric: daily-puzzle time, ranked MMR, total wins.
ELO/MMR system: per-mode rating; placement matches; rating decay for inactivity in ranked; tiered ranks (Bronze→…→Master) with cosmetic flair.

Social Features

Friend requests, game invitations, activity feed (friends' achievements/PBs/rank-ups), one-tap share of results (image card + link), in-app + push notifications.


3. Premium User Experience Requirements

Onboarding: 3-step interactive tutorial that teaches the single-path rule by doing, not reading; first solve guaranteed to succeed; immediate "race a bot" taste of multiplayer.
Animations: path-drawing trail with easing, satisfying cell-fill snap, victory burst, smooth lobby/round transitions. Use Framer Motion; respect prefers-reduced-motion.
Loading & skeletons: skeleton grids and lobby cards; optimistic UI for joins.
Sound & music: subtle draw ticks, checkpoint chime, victory sting; ambient lobby music; full mute + per-channel volume.
Haptics: light taps on checkpoint hit and on win (mobile, via the Vibration API where supported).
Mobile-first responsiveness: touch-drag path drawing is the primary input; pointer events unify mouse/touch/stylus.
Dark mode: system-driven with manual override; theming via CSS variables / design tokens.
Accessibility: WCAG 2.1 AA target — keyboard-navigable grid, ARIA roles, focus management, sufficient contrast, color-blind-safe checkpoint/wall encodings (shape + number, not color alone).
Keyboard shortcuts: arrow keys to extend path, backspace to retract, R to reset, Enter to submit, Esc to leave.
Offline support: single-player and daily-archive practice playable offline via PWA + service worker; sync results when back online.


4. Retention & Engagement Systems

Daily challenge: one canonical puzzle; ranked daily leaderboard; share card.
Weekly challenge: themed puzzle set; cumulative score.
Streak tracking: consecutive days with a completed daily; streak freeze item; streak milestones grant XP/cosmetics.
XP, levels, progression: XP from solves, wins, dailies; levels unlock cosmetic slots and titles.
Achievement badges: tiered (bronze/silver/gold) with progress meters.
Unlockable cosmetics: path trails, grid themes, victory effects, avatar frames.
Seasonal events: ~6–8 week seasons with themed cosmetics, a fresh ranked ladder, and limited-time modifiers.
Missions: rotating daily/weekly objectives ("win 3 ranked," "solve an 8×8 under 60s").
Reward system: soft currency from missions/levels spendable on cosmetics (earnable only — see monetization).
Notifications: streak-at-risk, friend invited you, daily available, season ending — all user-configurable.
Referral system: invite link grants both parties a cosmetic + XP on the invitee's first ranked match.


5. Database Architecture
Postgres via Supabase. All tables use uuid PKs (gen_random_uuid()), created_at timestamptz default now(), and Row Level Security enabled on every table. Below is the core schema (representative SQL — the build agent will expand into migrations).
sql-- ===== PROFILES =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24),
  display_name text,
  avatar_url text,
  country text,
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles are readable by all"
  on public.profiles for select using (true);
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ===== PUZZLES =====
-- A puzzle stores grid size, checkpoints, walls, and a canonical solved flag.
create table public.puzzles (
  id uuid primary key default gen_random_uuid(),
  grid_size smallint not null check (grid_size between 4 and 10),
  -- checkpoints: ordered list [{n:1,r:0,c:0}, ...]; walls: [{r,c,side}]
  checkpoints jsonb not null,
  walls jsonb not null default '[]'::jsonb,
  difficulty smallint not null check (difficulty between 1 and 5),
  is_daily boolean not null default false,
  daily_date date,
  solution jsonb,           -- canonical solution path (server-only)
  created_at timestamptz not null default now()
);
create unique index puzzles_daily_date_idx on public.puzzles(daily_date) where is_daily;
alter table public.puzzles enable row level security;
-- Clients may read puzzle prompt fields but NOT the solution column.
create policy "puzzles readable" on public.puzzles for select using (true);
-- (solution exposure is prevented by selecting explicit columns in API / a view)

create view public.puzzles_public as
  select id, grid_size, checkpoints, walls, difficulty, is_daily, daily_date, created_at
  from public.puzzles;

-- ===== ROOMS =====
create type room_status as enum ('lobby','countdown','in_round','results','closed');
create type room_mode as enum ('ranked','casual','private','practice');
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references public.profiles(id),
  mode room_mode not null,
  status room_status not null default 'lobby',
  puzzle_id uuid references public.puzzles(id),
  max_players smallint not null default 8 check (max_players between 2 and 8),
  difficulty smallint not null default 2,
  round_started_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
create policy "rooms readable by all" on public.rooms for select using (true);
create policy "host manages room" on public.rooms for all
  using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- ===== ROOM PLAYERS =====
create table public.room_players (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  progress smallint not null default 0,     -- coarse % cells filled
  finished_at timestamptz,
  solve_ms integer,
  placement smallint,
  primary key (room_id, user_id)
);
alter table public.room_players enable row level security;
create policy "room players readable" on public.room_players for select using (true);
create policy "user manages own row" on public.room_players for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== MATCHES (immutable results) =====
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id),
  puzzle_id uuid references public.puzzles(id),
  mode room_mode not null,
  finished_at timestamptz not null default now()
);
create table public.match_results (
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid references public.profiles(id),
  placement smallint not null,
  solve_ms integer,
  rating_before integer,
  rating_after integer,
  primary key (match_id, user_id)
);
alter table public.matches enable row level security;
alter table public.match_results enable row level security;
create policy "matches readable" on public.matches for select using (true);
create policy "results readable" on public.match_results for select using (true);

-- ===== RATINGS =====
create table public.ratings (
  user_id uuid references public.profiles(id) on delete cascade,
  mode room_mode not null,
  rating integer not null default 1000,
  games_played integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);
alter table public.ratings enable row level security;
create policy "ratings readable" on public.ratings for select using (true);

-- ===== FRIENDS =====
create type friend_status as enum ('pending','accepted','blocked');
create table public.friendships (
  requester_id uuid references public.profiles(id) on delete cascade,
  addressee_id uuid references public.profiles(id) on delete cascade,
  status friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
alter table public.friendships enable row level security;
create policy "see own friendships" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "manage own requests" on public.friendships for all
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ===== STREAKS / DAILY =====
create table public.daily_results (
  user_id uuid references public.profiles(id) on delete cascade,
  daily_date date not null,
  solve_ms integer,
  completed boolean not null default false,
  primary key (user_id, daily_date)
);
alter table public.daily_results enable row level security;
create policy "own daily readable+writable" on public.daily_results for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed date
);
alter table public.streaks enable row level security;
create policy "own streak readable" on public.streaks for select using (auth.uid() = user_id);

-- ===== ACHIEVEMENTS / COSMETICS =====
create table public.achievements (
  id text primary key,             -- 'first_win', 'streak_7', ...
  name text not null, description text, tier smallint default 1
);
create table public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id),
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
alter table public.user_achievements enable row level security;
create policy "achievements readable" on public.user_achievements for select using (true);

-- ===== INDEXES =====
create index room_players_room_idx on public.room_players(room_id);
create index match_results_user_idx on public.match_results(user_id);
create index ratings_mode_rating_idx on public.ratings(mode, rating desc);
create index daily_results_date_idx on public.daily_results(daily_date);
Triggers / functions (representative):
sql-- Auto-create profile + rating rows on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'player_' || substr(new.id::text,1,8), 'Player');
  insert into public.ratings (user_id, mode) values
    (new.id,'ranked'),(new.id,'casual');
  insert into public.streaks (user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
Server-authoritative solve submission is handled by a Supabase Edge Function / Postgres RPC (submit_solve) that validates the path server-side, writes room_players/match_results, and updates ratings atomically — clients never write placement or rating directly.
Realtime subscriptions: clients subscribe to a per-room Realtime channel (Postgres Changes on room_players and rooms, plus a broadcast channel for high-frequency progress and a presence channel for online state).

6. API Architecture
Next.js Route Handlers (app/api/**) for request/response endpoints; Supabase Edge Functions for security-sensitive logic; Supabase Realtime for live channels.
REST-ish routes (representative):

POST /api/rooms → create room (returns {id, code}).
POST /api/rooms/:code/join → join lobby.
POST /api/rooms/:id/start → host starts; server assigns puzzle, sets countdown.
POST /api/solve → submit solve {roundToken, path[]}; server validates → result.
GET /api/puzzles/daily → today's puzzle prompt (no solution).
GET /api/leaderboards?scope=global|weekly|friends&mode=ranked.
POST /api/matchmaking/enqueue / DELETE /api/matchmaking → join/leave queue.
POST /api/friends / PATCH /api/friends/:id → request/accept.

Request/response: JSON; Zod-validated input on every handler; standardized error envelope { error: { code, message } }.
Auth flow: Supabase Auth issues JWT; middleware attaches session; RLS enforces row access; sensitive mutations go through Edge Functions with service_role only on the server.
WebSocket / Realtime architecture:

room:{id} Postgres-changes channel → lobby roster, status transitions, final results.
room:{id}:progress broadcast channel → throttled {userId, progress, checkpoint}; never the path.
room:{id} presence channel → join/leave/online.
Round lifecycle events: countdown_started, round_started, player_finished, round_ended.


7. GitHub Repository Structure
ziprace/
├─ app/                      # Next.js App Router
│  ├─ (marketing)/           # landing, about
│  ├─ (game)/                # play, room/[code], daily, practice
│  ├─ (account)/             # profile, settings, friends
│  ├─ api/                   # route handlers
│  └─ layout.tsx
├─ components/               # UI (grid, lobby, leaderboard, ...)
├─ lib/                      # supabase client, game-engine, validators, elo
│  ├─ game/                  # path validation, puzzle generation (shared)
│  ├─ supabase/              # browser + server clients
│  └─ analytics/             # posthog wrapper
├─ supabase/
│  ├─ migrations/            # SQL migrations
│  └─ functions/             # edge functions (submit_solve, matchmaking)
├─ public/                   # icons, sounds, PWA assets
├─ tests/                    # unit + e2e
├─ .github/workflows/        # CI
└─ package.json
Naming conventions: kebab-case files, PascalCase components, camelCase functions; colocate tests as *.test.ts.
Branching: trunk-based — short-lived feat/*, fix/* branches off main; squash-merge via PR.
CI/CD: GitHub Actions — lint (ESLint) → typecheck (tsc) → unit (Vitest) → e2e (Playwright) → build; required to pass before merge; Vercel auto-deploys previews on PR and production on main.
PR workflow: template with description/screenshots/test notes; min 1 review; no direct pushes to main (branch protection).
Code review standards: small PRs, typed boundaries, no any, RLS reviewed for any new table, no secrets in client bundles.

8. Vercel Deployment Plan

Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (client); SUPABASE_SERVICE_ROLE_KEY, POSTHOG_KEY, SENTRY_DSN, SENTRY_AUTH_TOKEN (server-only). Scoped per environment.
Preview deployments: every PR gets an isolated preview URL pointed at a staging Supabase project.
Production: main → production; promotes only after CI green.
Domain: custom domain via Vercel DNS; force HTTPS; www→apex redirect.
Monitoring: Vercel Analytics + Sentry for errors/performance; PostHog for product analytics; uptime check on /api/health.
Rollback: Vercel instant rollback to prior deployment; DB migrations are forward-only with reversible scripts kept for emergencies.


9. Security Requirements

Authentication: Supabase Auth (JWT), OAuth providers, secure cookie session handling in Next middleware.
Authorization: RLS on every table; server-only service_role key; least-privilege policies; explicit column selection so puzzles.solution is never client-exposed.
Rate limiting: per-IP + per-user limits on solve submission, room creation, matchmaking, and auth endpoints (Upstash/Vercel KV or Supabase-side).
Bot protection: Turnstile/hCaptcha on signup and room creation; anomaly detection on signup velocity.
Anti-cheat: server-authoritative solve validation (path legality, checkpoint order, full coverage, no wall crossings); plausibility check of solve_ms against per-move timestamp stream; signed single-use roundToken; reject solves faster than a generation-derived theoretical floor; shadow-flag suspicious accounts for review; ranked replays stored for audit.
Data validation & sanitization: Zod on all inputs; server-side validation mirrors client; sanitize profile text + uploaded filenames; image upload type/size limits + moderation hook.
Session management: short-lived access tokens with refresh; revoke on password change; device/session list in settings.


10. Analytics & Metrics
Track via PostHog (product) + DB-derived dashboards: DAU/WAU/MAU, D1/D7/D30 retention, churn, daily-puzzle completion rate, match completion vs. abandon rate, average solve time by difficulty, queue time, progression (XP/level/rank distribution), funnel (visit → signup → first solve → first multiplayer → D1 return), referral conversion, and (post-monetization) trial→paid conversion, ARPU, MRR. Instrument key events: signup, first_solve, match_start, match_finish, daily_complete, streak_milestone, invite_sent, purchase.

11. Monetization (Optional, Cosmetic-Only)

Premium subscription: ad-free, advanced stats, exclusive themes, extra streak freezes.
Cosmetic purchases: path trails, grid themes, victory effects, avatar frames.
Battle pass / season pass: free + premium tracks of cosmetic rewards earned by play.
Seasonal content: limited-time cosmetic sets.
Supporter badges: profile flair.
Strict rule: nothing purchasable affects puzzles, time, hints in ranked, or rating. No pay-to-win.


12. Development Roadmap

Complexity scale: S (≤1d), M (2–4d), L (1–2wk), XL (2wk+). Multiplayer is Phase 1 core per scope.

Phase 1 — MVP + Core Multiplayer
Tasks: repo + Next.js scaffold; Supabase project + auth; puzzle generator + shared path-validation engine; playable grid (touch/keyboard); single-player + daily; real-time private rooms (2–8) with countdown, live progress, server-validated solve, results; basic profiles.
Dependencies: Supabase project; game engine before rooms.
Complexity: XL.
Acceptance: two devices solve the same puzzle in a room; finishing order + times correct; solve validated server-side; reconnect within grace window works; daily puzzle completes and records streak.
Phase 2 — Multiplayer hardening + Matchmaking
Tasks: public matchmaking queues with rating bands; spectator mode; reconnect/backfill polish; presence; anti-cheat plausibility checks.
Complexity: L. Acceptance: queue forms balanced rooms; spectators see live progress; disconnect/rejoin stable under load test.
Phase 3 — Social systems
Tasks: friends, invites, activity feed, share cards, notifications (in-app + web push).
Complexity: L. Acceptance: full friend lifecycle; invite link launches lobby; share card renders correct result; notifications respect preferences.
Phase 4 — Competitive systems
Tasks: ELO/MMR + ranked ladder; tiers/ranks; leaderboards (global/weekly/monthly/seasonal/regional/friends); seasons; achievements; XP/levels/missions.
Complexity: L. Acceptance: ratings update atomically post-match; leaderboards paginate and refresh; season rollover resets ladder without data loss.
Phase 5 — Monetization
Tasks: Stripe subscription; cosmetic store + inventory; battle pass; entitlement checks.
Complexity: M. Acceptance: purchase grants entitlement; cosmetics apply; no gameplay advantage exists; webhooks reconcile state.
Phase 6 — Launch readiness
Tasks: accessibility audit; performance budget; load testing; Sentry/PostHog dashboards; PWA/offline; legal pages; rollback rehearsal.
Complexity: M. Acceptance: WCAG AA pass; p95 interaction <100ms; survives target concurrency; clean error budget.

13. Claude Code Execution Plan
A linear, validate-as-you-go sequence. Each step lists deliverables, files, commands, risks, and validation. The build agent should commit after each step and never store service_role keys in client code.
Step 1 — Initialize repository

Deliverables: git repo, README, license, .gitignore, CI skeleton.
Files: README.md, .github/workflows/ci.yml, .gitignore.
Commands: git init; create GitHub repo; first commit/push.
Risks: committing secrets. Validation: CI runs on push; no secrets tracked.

Step 2 — Create Next.js app

Deliverables: App Router project, TypeScript, Tailwind, ESLint/Prettier, Vitest, Playwright.
Commands: npx create-next-app@latest ziprace --ts --app --tailwind --eslint; add Vitest + Playwright + Framer Motion.
Risks: version drift. Validation: pnpm build + pnpm test pass; dev server renders.

Step 3 — Configure Supabase

Deliverables: Supabase project (staging + prod), CLI linked, browser/server clients, env wiring.
Files: lib/supabase/{browser,server}.ts, .env.example, supabase/config.toml.
Commands: supabase init; supabase link; set Vercel env vars.
Risks: anon vs service-role misuse. Validation: client connects; service-role used only server-side.

Step 4 — Create database schema

Deliverables: migrations for all §5 tables, RLS, triggers, puzzles_public view, submit_solve RPC stub.
Files: supabase/migrations/*.sql.
Commands: supabase db push (staging).
Risks: missing RLS / solution leak. Validation: RLS on every table; anon cannot read puzzles.solution; signup trigger creates profile/rating/streak rows.

Step 5 — Implement authentication

Deliverables: email + OAuth (Google/Apple/GitHub), guest sessions, session middleware, account upgrade.
Files: app/(account)/**, middleware.ts, auth components.
Risks: session leaks. Validation: full login/logout/refresh; guest→account preserves stats; protected routes guarded.

Step 6 — Implement gameplay systems (shared engine first)

Deliverables: puzzle generator, path-validation engine (pure, shared client+server), interactive grid (touch/pointer/keyboard), single-player + daily + practice, timer, hints.
Files: lib/game/{generate,validate,types}.ts, components/Grid.tsx, app/(game)/{daily,practice}/**.
Risks: client/server validation divergence. Validation: engine unit tests (legal/illegal paths, walls, coverage, order); same module imported on both sides; a11y keyboard play works.

Step 7 — Implement multiplayer architecture

Deliverables: rooms (create/join/start), Realtime roster + presence + throttled progress broadcast, server submit_solve (atomic results + placements), reconnect grace window.
Files: app/(game)/room/[code]/**, app/api/rooms/**, app/api/solve/route.ts, supabase/functions/submit_solve.
Risks: solution broadcast leak; race conditions on placement. Validation: two clients race identical puzzle; only coarse progress on the wire (inspect payloads); placements/times correct; reconnect restores slot+progress.

Step 8 — Build leaderboards + rating

Deliverables: ELO/MMR update in submit_solve; ranked/casual ratings; global/weekly/monthly/friends boards.
Files: lib/game/elo.ts, app/(game)/leaderboards/**, app/api/leaderboards/route.ts.
Risks: non-atomic rating updates. Validation: ratings update transactionally; boards paginate; friends board filters correctly.

Step 9 — Build social systems

Deliverables: friends, invites, activity feed, share cards, notifications.
Files: app/(account)/friends/**, app/api/friends/**, share-card route, notification prefs.
Risks: notification spam / privacy. Validation: friend lifecycle works; invite link opens lobby; prefs honored.

Step 10 — Add analytics & error tracking

Deliverables: PostHog events, Sentry (client+server), /api/health.
Files: lib/analytics/posthog.ts, sentry.*.config.ts.
Risks: PII capture. Validation: key events fire; errors reach Sentry; no PII in events.

Step 11 — Deploy to Vercel

Deliverables: preview + prod, env scoping, custom domain, prod Supabase + migrations.
Risks: staging keys in prod. Validation: preview per PR; prod loads; migrations applied; health check green.

Step 12 — QA testing

Deliverables: unit + e2e (auth, solve, full multiplayer race), load test on rooms, a11y + perf audit.
Commands: pnpm test; pnpm e2e.
Risks: flaky realtime tests. Validation: suites green; target concurrency stable; WCAG AA; p95 interaction <100ms.

Step 13 — Launch

Deliverables: legal pages, PWA/offline, monitoring dashboards, rollback rehearsal, launch checklist sign-off.
Validation: rollback rehearsed; dashboards live; checklist complete.


Appendix A — Claude Code Build Prompt (paste-ready)

Use this as the single kickoff instruction for an agentic build. It assumes the agent has shell, git, and the Supabase + Vercel CLIs available, and that the human will supply secrets when prompted.

You are building "ZipRace," a real-time multiplayer path-puzzle web game, from the
PRD provided. Genre: draw one continuous path connecting numbered checkpoints in
order while filling every cell exactly once, never crossing walls or itself. This is
an ORIGINAL game in the genre — do not use LinkedIn's name, branding, or puzzle content.

Stack: Next.js (App Router, TypeScript, Tailwind) · Supabase (Postgres, Auth,
Realtime, Storage, Edge Functions) · Vercel · PostHog · Sentry · pnpm.

Execute the 13-step plan in PRD §13 strictly in order. After EACH step:
  1) run lint + typecheck + tests, 2) commit with a conventional-commit message,
  3) print a short validation report against that step's acceptance criteria,
  4) STOP and wait for any secret/credential the next step needs.

Hard requirements (never violate):
  - Server-authoritative solve validation. The puzzle SOLUTION is never sent to the
    client and never broadcast over Realtime. Realtime carries only coarse progress
    (% filled + current checkpoint index) and lifecycle events.
  - RLS enabled on every table; service_role key used ONLY in server/edge code,
    never imported into client bundles.
  - The path-validation engine is a single pure module shared by client and server.
  - Zod-validate every API input. Rate-limit solve/room/matchmaking/auth endpoints.
  - No pay-to-win: monetization is cosmetic-only.
  - Accessibility: keyboard-playable grid, prefers-reduced-motion, color-blind-safe
    encodings (number + shape, not color alone).

Phase 1 is the priority: a working real-time room where 2–8 players race the SAME
puzzle, with correct server-validated placements/times, reconnect within a 30s grace
window, plus single-player and a daily puzzle with streak tracking. Build the shared
game engine and its unit tests BEFORE rooms.

Start with Step 1. Ask me for the GitHub repo target and Supabase/Vercel
credentials when you reach the steps that need them. Proceed now.
Appendix B — Path-validation engine contract (shared module)
A valid solve must satisfy all: (1) path is a sequence of orthogonally adjacent cells; (2) it visits every cell exactly once (full coverage, no repeats); (3) it passes through checkpoints in strictly ascending numeric order; (4) no segment crosses a wall; (5) endpoints are unconstrained unless the puzzle pins start/end. The same function returns { valid: boolean, reason?: string } and is the only authority — the client uses it for instant UX feedback, the server uses it as the source of truth in submit_solve.