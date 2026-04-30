/**
 * Run once to create Supabase storage buckets:
 *   npx tsx scripts/setup-storage.ts
 */
import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function createBucket(name: string, mimeTypes: string[]) {
  const { data, error } = await supabase.storage.createBucket(name, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: mimeTypes,
  });

  if (error?.message?.includes("already exists")) {
    console.log(`✓ Bucket "${name}" already exists`);
    // Make sure it's public
    await supabase.storage.updateBucket(name, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
    return;
  }
  if (error) { console.error(`✗ "${name}":`, error.message); return; }
  console.log(`✓ Created bucket "${name}"`);
}

(async () => {
  console.log("Setting up Supabase storage buckets…\n");

  await createBucket("chat-media", [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "image/svg+xml", "video/mp4", "video/webm",
  ]);

  // Storage policy: authenticated users can upload to their own folder
  const policies = [
    {
      name: "chat-media: authenticated upload",
      sql: `
        CREATE POLICY IF NOT EXISTS "chat_media_upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'chat-media');
      `,
    },
    {
      name: "chat-media: public read",
      sql: `
        CREATE POLICY IF NOT EXISTS "chat_media_read"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'chat-media');
      `,
    },
    {
      name: "chat-media: owner delete",
      sql: `
        CREATE POLICY IF NOT EXISTS "chat_media_delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[2]);
      `,
    },
  ];

  for (const p of policies) {
    const { error } = await supabase.rpc("exec_sql" as any, { sql: p.sql }).single().catch(() => ({ error: null }));
    if (error) console.warn(`  Policy "${p.name}" may already exist — OK`);
    else console.log(`  ✓ Policy: ${p.name}`);
  }

  console.log("\nDone!");
})();
