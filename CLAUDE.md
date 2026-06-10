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

Three route groups control layout and auth guards:

- `app/(auth)/` — Unauthenticated pages (login, signup). No auth check.
- `app/(app)/` — Student-facing app. Layout server-checks session; redirects to `/login` if missing.
- `app/(admin)/admin/` — Admin panel. Layout checks `profile.role === 'admin'`; redirects to `/dashboard` otherwise.

Public homepage is at `app/page.tsx` (outside any group).

### Auth & Supabase

- **`lib/supabase/server.ts`** exports two clients:
  - `createClient()` — uses the publishable key, respects RLS. Use this everywhere.
  - `createAdminClient()` — uses `SUPABASE_SECRET_KEY`, bypasses RLS. Only for privileged server operations.
- **`proxy.ts`** (not `middleware.ts`) handles session refresh — this is Next.js 16's convention. Never create a `middleware.ts`; it conflicts with `proxy.ts`.
- Role system: `profiles.role` is `'student'` or `'admin'`. The DB has an `is_admin()` SQL helper used by RLS policies.
- To make a user admin: `UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';`

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

The API route (`app/api/chat/route.ts`) uses `streamText` from the `ai` package with model `"anthropic/claude-sonnet-4-6"` via Vercel AI Gateway. The `AI_GATEWAY_API_KEY` env var is required.

### Styling

- **Tailwind v4** — uses `oklch()` color space. Never use `hsl()` or `hsl(var(...))`.
- CSS custom properties are accessed as `var(--color-border)`, not `hsl(var(--border))`.
- Primary color: `oklch(0.55 0.22 264)` (blue/indigo). Dark mode bg: `oklch(0.13 0.02 264)`.
- All UI is **RTL/Hebrew**: use `dir="rtl"` on layout containers, `start`/`end` instead of `left`/`right` in Tailwind classes (`ps-`, `pe-`, `ms-`, `me-`).
- 54 shadcn/ui components are pre-installed in `components/ui/`. Check there before installing new UI packages.

### YouTube Integration

`app/api/youtube/route.ts` fetches metadata with no API key:
- Single video: YouTube oEmbed — `https://www.youtube.com/oembed?url=...&format=json`
- Playlist: YouTube RSS — `https://www.youtube.com/feeds/videos.xml?playlist_id={id}`

### Database Tables

`profiles`, `courses`, `lessons`, `enrollments`, `lesson_progress`, `chat_messages`, `badges`, `student_badges`. All have RLS enabled. Supabase project ID: `znsxcxixvjcpdmhbklqi`.

### Key Env Vars

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key (respects RLS) |
| `SUPABASE_SECRET_KEY` | Server-only key (bypasses RLS) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway for Claude |
