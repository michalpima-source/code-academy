# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (default port 3000)
npx next dev --port 3002  # Use alternate port if 3000/3001 are taken
npm run build        # Production build
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint
npm run format       # Prettier (formats all .ts/.tsx)
```

No test suite is configured — typecheck is the primary correctness gate.

## Architecture

### Route Groups

Four route groups control layout and auth guards:

- `app/(auth)/` — Unauthenticated pages (login, signup). No auth check.
- `app/(app)/` — Student-facing app. Layout server-checks session; redirects to `/login` if missing. Renders `<CourseAiPanel />` globally (floating AI button on every page).
- `app/(app)/learn/` — Nested inside `(app)`. Has its own layout that constrains height for the lesson player's split-pane view.
- `app/(admin)/admin/` — Admin panel. Layout checks `profile.role === 'admin'`; redirects to `/dashboard` otherwise.

Public homepage is at `app/page.tsx` (outside any group).

### Auth & Supabase

- **`lib/supabase/server.ts`** exports two clients:
  - `createClient()` — uses the publishable key, respects RLS. Use this everywhere.
  - `createAdminClient()` — uses `SUPABASE_SECRET_KEY`, bypasses RLS. Required for any server operation that writes on behalf of another user (e.g. admin enrollment API routes).
- **`proxy.ts`** (not `middleware.ts`) handles session refresh — this is Next.js 16's convention. Never create a `middleware.ts`; it conflicts with `proxy.ts`.
- Role system: `profiles.role` is `'student'` or `'admin'`. The DB has an `is_admin()` SQL helper used by RLS policies.
- To make a user admin: `UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';`
- Admin API routes (`app/api/admin/`) must use `createAdminClient` for writes — RLS blocks cross-user inserts even for admins.

### AI Chat (`@ai-sdk/react` v3)

The SDK v3 API differs from older versions. The correct pattern used throughout this codebase:

```tsx
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat",
    body: { lessonId, courseId, lessonTitle, courseTitle },
  }),
})

// Manual input state — do NOT use input/handleInputChange/handleSubmit from useChat
const [input, setInput] = useState("")
sendMessage({ role: "user", parts: [{ type: "text", text: input }] })

// Message content lives in parts, not .content:
msg.parts.map(p => p.type === "text" ? p.text : "")
```

The API route (`app/api/chat/route.ts`) uses `streamText` from the `ai` package with `anthropic("claude-sonnet-4-5")` from `@ai-sdk/anthropic`. The `ANTHROPIC_API_KEY` env var is required. When a `lessonId` is provided the route fetches the lesson's `transcript` column and includes the first 4000 chars in the system prompt.

### Mobile Responsiveness

- **Breakpoint**: `md` (768px) is the desktop/mobile boundary throughout the app.
- **App sidebar** (`components/app-sidebar.tsx`): `hidden md:flex` on desktop; on mobile renders a fixed top bar (h-14) with a hamburger that opens a `Sheet` drawer. `<main>` has `pt-14 md:pt-0` to clear the fixed bar.
- **Admin sidebar** (`components/admin/admin-mobile-nav.tsx`): same pattern — fixed top bar + Sheet on mobile, `hidden md:flex` aside on desktop.
- **Lesson player** (`components/lesson-player.tsx`): lesson list sidebar is `hidden md:flex`; on mobile a "שיעורים" tab in the tab bar opens a Sheet drawer with the lesson list.
- **Page padding**: all page wrappers use `px-4 py-6 md:p-6` — never fixed `p-6` alone.
- **`Sheet` component** is built on `@base-ui/react/dialog`, not Radix UI. It does **not** support `asChild` on `SheetTrigger` — style the trigger directly with `className`.

### Styling

- **Tailwind v4** — uses `oklch()` color space. Never use `hsl()` or `hsl(var(...))`.
- CSS custom properties are accessed as `var(--color-border)`, not `hsl(var(--border))`.
- Primary color: `oklch(0.55 0.22 264)` (blue/indigo). Dark mode bg: `oklch(0.13 0.02 264)`. Default theme is **dark**.
- All UI is **RTL/Hebrew**: use `dir="rtl"` on layout containers, `start`/`end` instead of `left`/`right` in Tailwind classes (`ps-`, `pe-`, `ms-`, `me-`).
- 54 shadcn/ui components are pre-installed in `components/ui/`. Check there before installing new UI packages.
- `html, body` background is `transparent` — the animated `<StarBackground />` (fixed, `z-index: -10`) renders behind all content via `app/layout.tsx`. Cards use semi-transparent `--card` with `backdrop-blur-xl` for glass effect.
- `components/ui/sparkles.tsx` is a custom canvas-based particle animation — it does NOT use `@tsparticles` APIs despite the packages being installed. Do not import `initParticlesEngine` from any tsparticles package (v4 removed it).

### Background & Theming

`components/star-background.tsx` renders differently per theme:
- **Dark**: deep navy base + nebula blobs + `SparklesCore` canvas particles
- **Light**: warm off-white gradient + indigo dot grid + soft color blobs

`components/theme-toggle.tsx` toggles between modes. `defaultTheme="dark"` with `enableSystem={false}` in `ThemeProvider`.

### YouTube Integration

`app/api/youtube/route.ts` fetches metadata with no API key:
- Single video: YouTube oEmbed — `https://www.youtube.com/oembed?url=...&format=json`
- Playlist: YouTube RSS — `https://www.youtube.com/feeds/videos.xml?playlist_id={id}`

`app/api/youtube/transcript/route.ts` uses the `youtube-transcript` npm package. Called from the admin course editor to populate `lessons.transcript`. Tries Hebrew captions first, then English, then default.

### Database Tables

`profiles`, `courses`, `lessons`, `enrollments`, `lesson_progress`, `lesson_notes`, `chat_messages`, `badges`, `student_badges`. All have RLS enabled. Supabase project ID: `znsxcxixvjcpdmhbklqi`.

`lessons` has two extra columns added by migration: `transcript TEXT` and `transcript_fetched_at TIMESTAMPTZ`.

### Key Env Vars

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key (respects RLS) |
| `SUPABASE_SECRET_KEY` | Server-only key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Direct Anthropic API for AI chat |
