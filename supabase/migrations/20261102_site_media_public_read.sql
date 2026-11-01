-- Public portfolio and landing-page media must be readable by anonymous visitors.
-- Some existing site-media buckets were created as private, and a prior migration
-- removed the read policy. Keep uploads restricted to the service role while
-- explicitly allowing public reads for this intentionally public bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Site media is publicly readable" ON storage.objects;
CREATE POLICY "Site media is publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-media');
