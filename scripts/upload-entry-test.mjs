/**
 * Import the entry-test prep folder into the Library as entry-test notes
 * (is_entry_test = true) so they appear on /entry-test.
 *
 * RUN: node --env-file=.env.local scripts/upload-entry-test.mjs ["<folder>"]
 * Default folder: C:\Users\Abdullah\Desktop\entry test
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the env.
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error("Missing Supabase env (run with --env-file=.env.local)"); process.exit(1); }

const ROOT = process.argv.slice(2).find(a => !a.startsWith("--")) || "C:\\Users\\Abdullah\\Desktop\\entry test";
const BUCKET = "notes";
const CONCURRENCY = 3; // files are large (up to ~100 MB)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function categoryFor(n) {
  const f = n.toLowerCase();
  if (/past\s*paper|mock|\bnet\b|test\s*\+|test and mock/.test(f)) return "past_paper";
  if (/\bbook\b|material/.test(f)) return "book";
  return "notes";
}
function subjectFor(n) {
  const f = n.toLowerCase();
  if (/computer science|\bcs\b/.test(f)) return "Computer Science";
  if (/math/.test(f)) return "Mathematics";
  return "Entry Test Prep";
}
function uniSlugFor(n) {
  const f = n.toLowerCase();
  if (/fast|nuces/.test(f)) return "fast";
  if (/nust|nustrive|\bnet\b/.test(f)) return "nust";
  if (/giki/.test(f)) return "giki";
  return null;
}

async function resolveUploaderId() {
  if (process.env.UPLOADER_ID) return process.env.UPLOADER_ID;
  const e = await supabase.from("profiles").select("id")
    .in("email", ["abdullah.xf90@gmail.com", "i250014@isb.nu.edu.pk"]).limit(1).maybeSingle();
  if (e.data?.id) return e.data.id;
  const a = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).maybeSingle();
  if (a.data?.id) return a.data.id;
  return (await supabase.from("profiles").select("id").limit(1).maybeSingle()).data?.id ?? null;
}
async function uniMap() {
  const { data } = await supabase.from("universities").select("id, slug, short_name");
  const m = {};
  for (const u of data ?? []) {
    if (u.slug) m[u.slug.toLowerCase()] = u.id;
    if (u.short_name) m[u.short_name.toLowerCase()] = u.id;
  }
  return (slug) => (slug ? (m[slug] ?? null) : null);
}

async function runPool(items, concurrency, worker) {
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx]); }
  }));
}

const stats = { total: 0, uploaded: 0, skipped: 0, errors: 0 };

async function main() {
  console.log(`Source: ${ROOT}`);
  const UPLOADER_ID = await resolveUploaderId();
  const lookupUni = await uniMap();
  if (!UPLOADER_ID) { console.error("No uploader profile found."); process.exit(1); }
  console.log(`Uploader: ${UPLOADER_ID}`);

  let files;
  try { files = await readdir(ROOT); } catch (e) { console.error("Cannot read folder:", e.message); process.exit(1); }
  const pdfs = files.filter(f => f.toLowerCase().endsWith(".pdf"));
  stats.total = pdfs.length;

  // Existing entry-test titles, to skip re-uploads.
  const { data: existing } = await supabase.from("notes").select("title").eq("is_entry_test", true);
  const have = new Set((existing ?? []).map(r => r.title));

  await runPool(pdfs, CONCURRENCY, async (filename) => {
    const title = filename.replace(/\.pdf$/i, "").trim();
    if (have.has(title)) { console.log(`SKIP (dup) ${filename}`); stats.skipped++; return; }

    const category = categoryFor(filename);
    const subject = subjectFor(filename);
    const uniId = lookupUni(uniSlugFor(filename));
    const key = `entry-test/${filename}`.normalize("NFKD").replace(/[^\x20-\x7E/]/g, "_");

    let buf;
    try { buf = await readFile(path.join(ROOT, filename)); }
    catch (e) { console.error(`READ ERR ${filename}: ${e.message}`); stats.errors++; return; }

    const { error: upErr } = await supabase.storage.from(BUCKET)
      .upload(key, buf, { contentType: "application/pdf", upsert: true });
    if (upErr) { console.error(`UPLOAD ERR ${filename}: ${upErr.message}`); stats.errors++; return; }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const { error: dbErr } = await supabase.from("notes").insert({
      uploader_id: UPLOADER_ID,
      title,
      subject,
      university_id: uniId,
      category,
      file_url: publicUrl,
      file_type: "pdf",
      file_size_bytes: buf.length,
      status: "published",
      is_entry_test: true,
      description: `Entry test prep — ${subject} — ${category}`,
    });
    if (dbErr) { console.error(`DB ERR ${filename}: ${dbErr.message}`); await supabase.storage.from(BUCKET).remove([key]); stats.errors++; return; }
    console.log(`OK [${category}] ${filename} (${(buf.length/1048576).toFixed(1)} MB)`);
    stats.uploaded++;
  });

  console.log(`\n=== DONE === Found: ${stats.total}  Uploaded: ${stats.uploaded}  Skipped: ${stats.skipped}  Errors: ${stats.errors}`);
}
main().catch(console.error);
