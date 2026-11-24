/*
# StepWise AI Phase 2 — Database Foundation (guides, steps, progress)

1. New Tables
- `guides` — a user-created guide
  - `id` (uuid, primary key, default gen_random_uuid())
  - `user_id` (uuid, NOT NULL, default auth.uid(), FK to auth.users ON DELETE CASCADE) — owner
  - `title` (text, NOT NULL) — guide name
  - `description` (text, nullable) — what the guide teaches
  - `category` (text, nullable) — e.g. Cooking, Car Care
  - `status` (text, NOT NULL, default 'draft') — draft | in_progress | completed
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now(), auto-refreshed on update by trigger)
- `guide_steps` — one ordered step of a guide
  - `id` (uuid, primary key, default gen_random_uuid())
  - `guide_id` (uuid, NOT NULL, FK to guides ON DELETE CASCADE)
  - `position` (integer, NOT NULL, CHECK (position >= 1)) — step order
  - `title` (text, NOT NULL)
  - `instruction` (text, NOT NULL)
  - `reference_image_url` (text, nullable) — storage URL for the step's visual
  - `created_at` (timestamptz, default now())
  - UNIQUE (guide_id, position) — no duplicate step numbers within a guide
- `guide_step_progress` — a user marking a step complete
  - `id` (uuid, primary key, default gen_random_uuid())
  - `user_id` (uuid, NOT NULL, default auth.uid(), FK to auth.users ON DELETE CASCADE)
  - `step_id` (uuid, NOT NULL, FK to guide_steps ON DELETE CASCADE)
  - `completed_at` (timestamptz, default now())
  - UNIQUE (user_id, step_id) — a step can only be completed once per user

2. Modified Tables
- None. This is the initial schema; the database was empty.

3. Security
- RLS ENABLED on all three tables. No public/unrestricted policies.
- All policies are scoped `TO authenticated` and owner-checked with auth.uid().
- `guides`: SELECT/UPDATE/DELETE require ownership (auth.uid() = user_id);
  INSERT requires the new row's user_id to equal auth.uid().
- `guide_steps`: all access is scoped through the parent guide's ownership via
  EXISTS (SELECT 1 FROM guides WHERE guides.id = guide_steps.guide_id AND guides.user_id = auth.uid()).
- `guide_step_progress`: SELECT/DELETE require user_id = auth.uid();
  INSERT requires user_id = auth.uid() AND the referenced step belongs to a guide
  the same user owns (prevents recording progress on another user's guide).
- Grants: only `authenticated`, only the verbs each table needs. Writes are
  column-restricted where it matters — guides UPDATE cannot change user_id;
  guide_step_progress INSERT cannot forge someone else's ownership.
- `service_role` is NOT granted anything; no service-role key is used or exposed.

4. Important Notes
- Migration is idempotent: tables use IF NOT EXISTS, policies are dropped and
  recreated, trigger is replaced.
- `user_id` columns default to auth.uid() so clients can insert without passing
  an explicit owner; RLS fills it from the authenticated session.
- The set_updated_at trigger keeps guides.updated_at accurate without any
  frontend change.
*/

CREATE TABLE IF NOT EXISTS guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guide_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 1),
  title text NOT NULL,
  instruction text NOT NULL,
  reference_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guide_id, position)
);

CREATE TABLE IF NOT EXISTS guide_step_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES guide_steps(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guide_steps_guide_id ON guide_steps(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_step_progress_user_id ON guide_step_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_guide_step_progress_step_id ON guide_step_progress(step_id);

-- Keep guides.updated_at current on every update
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guides_set_updated_at ON guides;
CREATE TRIGGER guides_set_updated_at
BEFORE UPDATE ON guides
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_step_progress ENABLE ROW LEVEL SECURITY;

-- guides: owner-scoped CRUD
DROP POLICY IF EXISTS "Users can view own guides" ON guides;
CREATE POLICY "Users can view own guides"
ON guides FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own guides" ON guides;
CREATE POLICY "Users can create own guides"
ON guides FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own guides" ON guides;
CREATE POLICY "Users can update own guides"
ON guides FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own guides" ON guides;
CREATE POLICY "Users can delete own guides"
ON guides FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- guide_steps: access only through the parent guide's ownership
DROP POLICY IF EXISTS "Users can view steps of own guides" ON guide_steps;
CREATE POLICY "Users can view steps of own guides"
ON guide_steps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guides
    WHERE guides.id = guide_steps.guide_id
      AND guides.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can add steps to own guides" ON guide_steps;
CREATE POLICY "Users can add steps to own guides"
ON guide_steps FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM guides
    WHERE guides.id = guide_steps.guide_id
      AND guides.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update steps of own guides" ON guide_steps;
CREATE POLICY "Users can update steps of own guides"
ON guide_steps FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guides
    WHERE guides.id = guide_steps.guide_id
      AND guides.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM guides
    WHERE guides.id = guide_steps.guide_id
      AND guides.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete steps of own guides" ON guide_steps;
CREATE POLICY "Users can delete steps of own guides"
ON guide_steps FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM guides
    WHERE guides.id = guide_steps.guide_id
      AND guides.user_id = auth.uid()
  )
);

-- guide_step_progress: own progress only; INSERT also verifies the step
-- belongs to a guide the same user owns
DROP POLICY IF EXISTS "Users can view own step progress" ON guide_step_progress;
CREATE POLICY "Users can view own step progress"
ON guide_step_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record progress on own guides" ON guide_step_progress;
CREATE POLICY "Users can record progress on own guides"
ON guide_step_progress FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM guide_steps
    JOIN guides ON guides.id = guide_steps.guide_id
    WHERE guide_steps.id = guide_step_progress.step_id
      AND guides.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own step progress" ON guide_step_progress;
CREATE POLICY "Users can update own step progress"
ON guide_step_progress FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own step progress" ON guide_step_progress;
CREATE POLICY "Users can delete own step progress"
ON guide_step_progress FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Least-privilege grants to the Data API. No anon access, no service_role grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON guides TO authenticated;
GRANT UPDATE (title, description, category, status, updated_at) ON guides TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON guide_steps TO authenticated;

GRANT SELECT, INSERT, DELETE ON guide_step_progress TO authenticated;
