# Project memory

## Product intent & audience

- **StepWise AI**: app for creating and following step-by-step visual guides (e.g. tire change, pasta, repotting, bookshelf assembly).
- Users create guides with a task name, description, and optional reference uploads; then follow guides step-by-step, marking steps complete and capturing progress images.
- Dashboard surfaces stats, in-progress guides, and completed history.
- Current phase: **Phase 2 — Backend & Database Integration** (Supabase). A read-only audit was completed; no implementation yet.

## Brand personality & voice

- Production-quality, polished, non-cookie-cutter UI.
- Friendly, task-oriented, beginner-empowering tone (guides should feel approachable).
- Lucide icons used throughout for logos and UI iconography.

## Visual design & UX direction

- Tailwind CSS utility-class styling; components: `Navbar`, `Footer`, `GuideCard`, `ProgressBar`.
- Hand-rolled state-based router (`Route` union: `home | create | guide | dashboard`) — no URL routing, no deep links, refresh returns to home.
- `GuidePage` remounts via `key={route.guideId}` so state resets between guides.
- Progress bars derive percentage inline in multiple places; no shared helper yet.
- Inline amber validation notices (Create Guide); fake loading spinner via `setTimeout`.
- Dashed placeholder boxes for reference images; capture/upload buttons are counter-only stubs.
- No loading, empty, or error states exist anywhere — all data renders synchronously.

## Decisions, constraints & rationale

- **No rewrites**: Phase 2 is a data-source swap — keep router, pages, components, styling; replace `sampleData.ts` imports with a data layer.
- **Supabase client library already installed** (`@supabase/supabase-js`) but never imported; credentials pre-provisioned in env config.
- **Recommended new files**: `src/lib/supabase.ts` (client), `src/lib/guides.ts` (data-access functions matching `Guide`/`Step` shapes).
- **Proposed schema**: `guides` (title, description, category, status, user_id, timestamps), `guide_steps` (guide_id, position, title, instruction, reference image URL, completed_at), Storage bucket for uploads. RLS enabled, ownership via `auth.uid()`.
- **AI generation stays out of scope this phase** — "Generate" should first create an empty/manual guide; edge function + LLM deferred.
- **Auth deferred** but schema anticipates it via `user_id`.
- **Seed `sampleData.ts` content into DB** to preserve demo look.
- Path alias `@/` → `src/`; use lucide-react only; no extra UI/icon packages unless explicitly requested.

## Open questions & assumptions

- **Creator vs follower model unresolved**: current UI conflates "guides I created" with "guides I'm following." Recommend simple `status` + `user_id` now; split later only if needed.
- **Data-shape drift to fix before DB mapping**: `updatedAt` is display text ("Today", "2 days ago"), not a timestamp; `CompletedGuide` is a separate type with orphaned ids (`g5`/`g6` — no matching `Guide` records) that will break completed links if seeded as-is.
- **Progress math duplication**: percentage computed inline in `GuidePage`, `GuideCard`, `DashboardPage` — needs a single shared helper before integration.
- **File uploads discarded**: `CreateGuidePage.addFiles` stores only name/kind, drops `File` objects; must hold real files before Storage upload works.
- **Local progress state**: `GuidePage` initializes completed-step `Set` once on mount; after persistence needs refetch / optimistic-update logic.
- **State-based routing**: acceptable for demo, but DB-backed guides should move to URL routing for deep links and refresh persistence.
- **XP/streaks hardcoded** (`+50 XP earned` in `CompletionScreen`); no progression system exists.