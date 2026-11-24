/*
# Phase 2 — Privilege hardening (grants & revocations)

1. Purpose
- Captures the verified privilege state from the Phase 2 schema migration so a
  fresh database replay reproduces it exactly. Supabase applies platform-default
  grants (all privileges to anon, authenticated, postgres, service_role) when a
  table is created; this migration revokes what the app must not have and grants
  only the minimum the Data API needs.

2. Tables affected (no structural changes — privileges only)
- `guides`
- `guide_steps`
- `guide_step_progress`

3. Security changes
- anon: ALL privileges revoked on all three tables. The app only talks to the
  database as `authenticated` (sign-in required); anon must have zero reach.
- authenticated: TRUNCATE revoked on all three tables — TRUNCATE bypasses RLS
  and would allow mass deletion that row policies forbid.
- authenticated: REFERENCES and TRIGGER revoked on all three tables — not
  needed by the app; least privilege.
- authenticated: table-level UPDATE revoked on `guides`, then re-granted as a
  COLUMN-restricted UPDATE on (title, description, category, status,
  updated_at) only. This prevents a client from ever changing user_id or
  created_at on a guide. RLS still enforces ownership on top.
- authenticated keeps: SELECT/INSERT/UPDATE/DELETE on guide_steps;
  SELECT/INSERT/DELETE on guide_step_progress (progress rows are immutable —
  unique (user_id, step_id) makes UPDATE meaningless, so no UPDATE grant);
  SELECT/INSERT/DELETE on guides.
- service_role and postgres platform grants are left untouched; no
  service_role key is used or exposed anywhere in frontend code.

4. Important Notes
- Fully idempotent: GRANT and REVOKE statements are safe to re-run.
- Must run AFTER the phase2_guides_schema migration (tables must exist).
- RLS policies are unaffected — this changes reachability (grants), not row
  visibility (policies).
*/

-- 1. anon: no access whatsoever (sign-in app)
REVOKE ALL ON guides FROM anon;
REVOKE ALL ON guide_steps FROM anon;
REVOKE ALL ON guide_step_progress FROM anon;

-- 2. authenticated: revoke privileges that bypass or exceed the app's needs
REVOKE TRUNCATE ON guides FROM authenticated;
REVOKE TRUNCATE ON guide_steps FROM authenticated;
REVOKE TRUNCATE ON guide_step_progress FROM authenticated;

REVOKE REFERENCES ON guides FROM authenticated;
REVOKE REFERENCES ON guide_steps FROM authenticated;
REVOKE REFERENCES ON guide_step_progress FROM authenticated;

REVOKE TRIGGER ON guides FROM authenticated;
REVOKE TRIGGER ON guide_steps FROM authenticated;
REVOKE TRIGGER ON guide_step_progress FROM authenticated;

-- 3. guides: restrict UPDATE to safe columns (owner column user_id and
--    created_at are immutable through the Data API)
REVOKE UPDATE ON guides FROM authenticated;
GRANT UPDATE (title, description, category, status, updated_at)
ON guides TO authenticated;
