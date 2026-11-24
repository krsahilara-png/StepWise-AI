/*
# Guide step images — private storage bucket and owner-scoped policies

1. New Storage objects
- Bucket `guide-images` (private): holds one user-uploaded photo per guide step.
  - Not public: files are reachable only through short-lived signed URLs
    generated for the owner.
  - 3 MB maximum file size; images only (jpeg, png, webp).
- Object path convention: `{user_id}/{guide_id}/{step_id}/{uuid}.{ext}`
  - The leading `{user_id}` folder is what every policy below checks, mirroring
    the ownership pattern used on the `guides` / `guide_steps` tables.

2. Modified Tables
- None. `guide_steps.reference_image_url` already exists and is reused to store
  each step's image path (and the public URL is derived via signed URLs at read
  time, since the bucket is private).

3. Security changes
- `storage.objects` policies on the `guide-images` bucket only, all scoped
  `TO authenticated`:
  - SELECT: owner only — the path's first folder must equal auth.uid().
  - INSERT: owner only — same path check, enforced on upload (WITH CHECK).
  - UPDATE: owner only.
  - DELETE: owner only.
- No anon policies: the app requires sign-in and images stay fully private.
- service_role: no policy, no grant — nothing server-side reads these files
  (the generate-guide edge function does not touch images).

4. Important Notes
- Policies are dropped and recreated so the migration is idempotent.
- Bucket creation uses a DO block so re-running the migration is safe.
- The user-side restriction (first path folder = owner) is the storage
  equivalent of an RLS ownership check: a client cannot upload into, read, or
  delete another user's folder even with a valid session.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'guide-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'guide-images',
      'guide-images',
      false,
      3145728, -- 3 MB
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "Owner can read own step images" ON storage.objects;
CREATE POLICY "Owner can read own step images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'guide-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owner can upload own step images" ON storage.objects;
CREATE POLICY "Owner can upload own step images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guide-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owner can update own step images" ON storage.objects;
CREATE POLICY "Owner can update own step images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'guide-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'guide-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Owner can delete own step images" ON storage.objects;
CREATE POLICY "Owner can delete own step images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'guide-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
