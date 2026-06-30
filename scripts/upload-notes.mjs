/**
 * Bulk-import the FAST past-papers archive into the UniConnect Library (`notes`).
 *
 * Walks semester-1…8 subject folders (past papers) AND "Course Outlines",
 * uploads every file to the `notes` storage bucket, and inserts a matching
 * `notes` row — sorted by semester / subject / exam type, tagged to FAST.
 *
 * RUN:
 *   node --env-file=.env.local scripts/upload-notes.mjs
 *   node --env-file=.env.local scripts/upload-notes.mjs "C:\\Users\\Abdullah\\Desktop\\past papers\\fsc-past-papers-main"
 *
 * Flags / env:
 *   --reset            DELETE all existing notes + storage first (destructive!).
 *   PAPERS_DIR=...      override the source folder (else arg #1, else default).
 *   UPLOADER_ID=...     profile id to attribute uploads to (else auto-detects an admin).
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the env.
 */
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local)");
  process.exit(1);
}

const args     = process.argv.slice(2);
const DO_RESET = args.includes("--reset");
const ROOT =
  args.find(a => !a.startsWith("--")) ||
  process.env.PAPERS_DIR ||
  "C:\\Users\\Abdullah\\Desktop\\past papers\\fsc-past-papers-main";

const BUCKET = "notes";
const SEMESTER_LABELS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

// What we import. The app previews PDFs; other types are still listed + downloadable.
const ALLOWED_EXT = {
  ".pdf":  "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc":  "application/msword",
  ".txt":  "text/plain",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt":  "application/vnd.ms-powerpoint",
};

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// category check constraint: notes,quiz,assignment,sessional1,sessional2,final,textbook,other
function deriveCategory(name) {
  const f = name.toLowerCase();
  if (/sessional[\s\-_#]*(ii|2)/.test(f)) return "sessional2";
  if (/sessional[\s\-_#]*(i|1)/.test(f))  return "sessional1";
  if (f.includes("sessional"))            return "sessional1";
  if (f.includes("final"))                return "final";
  if (f.includes("quiz"))                 return "quiz";
  if (f.includes("assignment"))           return "assignment";
  if (f.includes("outline"))              return "other";
  if (f.includes("textbook") || f.includes("book")) return "textbook";
  // "mid" exams have no dedicated category
  return "other";
}

function extractYear(name) {
  const m = name.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1], 10) : null;
}

function extractCourseCode(name) {
  // e.g. "NS-1001", "CS-1002", "CL-1002", "MT-1003"
  const m = name.match(/\b([A-Z]{2,3}[\s\-]?\d{3,4})\b/);
  return m ? m[1].replace(/\s/, "-") : null;
}

async function resolveUploaderId() {
  if (process.env.UPLOADER_ID) return process.env.UPLOADER_ID;
  // Prefer the platform owners, then any admin, then any profile.
  const byEmail = await supabase.from("profiles").select("id")
    .in("email", ["abdullah.xf90@gmail.com", "i250014@isb.nu.edu.pk"]).limit(1).maybeSingle();
  if (byEmail.data?.id) return byEmail.data.id;
  const byRole = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).maybeSingle();
  if (byRole.data?.id) return byRole.data.id;
  const any = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  return any.data?.id ?? null;
}

async function resolveFastUniversityId() {
  const { data } = await supabase.from("universities").select("id").eq("slug", "fast").maybeSingle();
  return data?.id ?? null;
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !error.message.includes("already exists")) console.error("Bucket error:", error.message);
  }
}

async function resetAll() {
  console.log("--reset: deleting ALL existing notes + storage files…");
  const { data: notes } = await supabase.from("notes").select("id, file_url");
  await supabase.from("notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const keys = (notes ?? []).map(n => {
    try { return decodeURIComponent(new URL(n.file_url).pathname.split(`/object/public/${BUCKET}/`)[1] ?? ""); }
    catch { return ""; }
  }).filter(Boolean);
  if (keys.length) await supabase.storage.from(BUCKET).remove(keys);
  console.log(`  removed ${notes?.length ?? 0} notes.`);
}

const stats = { total: 0, uploaded: 0, skipped: 0, errors: 0 };
const TASKS = [];                 // flat task list, processed with a concurrency pool
let existingKeys = new Set();     // already-imported (title|subject|semester) keys
const CONCURRENCY = 12;

const keyOf = (title, subject, semester) => `${title}|||${subject}|||${semester ?? ""}`;

// Collect every importable file in a dir as a task — no network here.
async function collectDir(absDir, { subject, semesterLabel, storagePrefix }) {
  let files;
  try { files = await readdir(absDir); } catch { return; }
  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXT[ext]) continue;
    TASKS.push({
      absPath: path.join(absDir, filename),
      filename, ext, subject, semesterLabel,
      title: filename.slice(0, -ext.length),
      // Storage keys must be ASCII — normalise (²⁶ → 26) and replace anything
      // else non-printable-ASCII so files with odd characters still upload.
      storagePath: `${storagePrefix}/${filename}`.normalize("NFKD").replace(/[^\x20-\x7E/]/g, "_"),
    });
  }
}

// Upload one file to storage + insert its notes row.
async function processTask(t) {
  if (existingKeys.has(keyOf(t.title, t.subject, t.semesterLabel))) { stats.skipped++; return; }

  let buf;
  try { buf = await readFile(t.absPath); }
  catch (e) { console.error(`READ ERR ${t.filename}: ${e.message}`); stats.errors++; return; }

  const { error: upErr } = await supabase.storage.from(BUCKET)
    .upload(t.storagePath, buf, { contentType: ALLOWED_EXT[t.ext], upsert: true });
  if (upErr) { console.error(`UPLOAD ERR ${t.filename}: ${upErr.message}`); stats.errors++; return; }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(t.storagePath);
  const category = deriveCategory(t.filename);
  const year = extractYear(t.filename);

  const { error: dbErr } = await supabase.from("notes").insert({
    uploader_id: UPLOADER_ID,
    title: t.title,
    subject: t.subject,
    semester: t.semesterLabel,
    university_id: FAST_ID,
    department: "Computing",
    course_code: extractCourseCode(t.filename),
    file_url: publicUrl,
    file_type: t.ext.slice(1),
    file_size_bytes: buf.length,
    category,
    year,
    status: "published",
    description: `${t.subject}${t.semesterLabel ? ` — ${t.semesterLabel} semester` : ""} — ${category}${year ? ` (${year})` : ""}`,
  });
  if (dbErr) {
    console.error(`DB ERR ${t.filename}: ${dbErr.message}`);
    await supabase.storage.from(BUCKET).remove([t.storagePath]);
    stats.errors++; return;
  }
  stats.uploaded++;
  if (stats.uploaded % 25 === 0) console.log(`  …${stats.uploaded} uploaded`);
}

// Fixed-size concurrency pool.
async function runPool(items, concurrency, worker) {
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx]); }
  }));
}

// Pull every existing (title|subject|semester) key once, so we skip in-memory
// instead of a round-trip per file (handles re-runs + the earlier partial run).
async function loadExistingKeys() {
  const keys = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("notes")
      .select("title, subject, semester").range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    for (const r of data) keys.add(keyOf(r.title, r.subject, r.semester));
    if (data.length < PAGE) break;
  }
  return keys;
}

let UPLOADER_ID, FAST_ID;

async function main() {
  console.log(`Source: ${ROOT}`);
  UPLOADER_ID = await resolveUploaderId();
  FAST_ID     = await resolveFastUniversityId();
  if (!UPLOADER_ID) { console.error("No uploader profile found (set UPLOADER_ID)."); process.exit(1); }
  console.log(`Uploader: ${UPLOADER_ID}  ·  FAST university: ${FAST_ID ?? "(not found)"}`);

  if (DO_RESET) await resetAll();
  await ensureBucket();

  // 1. Past papers: semester-1 … semester-8 / <Subject> / <files>
  for (let n = 1; n <= 8; n++) {
    const semDir = path.join(ROOT, `semester-${n}`);
    let subjects;
    try { subjects = await readdir(semDir); } catch { continue; }
    for (const subject of subjects) {
      const subjectDir = path.join(semDir, subject);
      if (!(await stat(subjectDir).catch(() => null))?.isDirectory()) continue;
      await collectDir(subjectDir, {
        subject,
        semesterLabel: SEMESTER_LABELS[n - 1],
        storagePrefix: `semester-${n}/${subject}`,
      });
    }
  }

  // 2. Course outlines: Course Outlines / Semester-N / <Subject> / <files>
  const outlinesRoot = path.join(ROOT, "Course Outlines");
  let semFolders;
  try { semFolders = await readdir(outlinesRoot); } catch { semFolders = []; }
  for (const semFolder of semFolders) {
    const m = semFolder.match(/(\d)/);
    const semIdx = m ? parseInt(m[1], 10) : null;
    const semDir = path.join(outlinesRoot, semFolder);
    if (!(await stat(semDir).catch(() => null))?.isDirectory()) continue;
    let subjects;
    try { subjects = await readdir(semDir); } catch { continue; }
    for (const subject of subjects) {
      const subjectDir = path.join(semDir, subject);
      if (!(await stat(subjectDir).catch(() => null))?.isDirectory()) continue;
      await collectDir(subjectDir, {
        subject: `${subject} (Course Outline)`,
        semesterLabel: semIdx ? SEMESTER_LABELS[semIdx - 1] : null,
        storagePrefix: `course-outlines/${semFolder}/${subject}`,
      });
    }
  }

  stats.total = TASKS.length;
  existingKeys = await loadExistingKeys();
  console.log(`Collected ${TASKS.length} files · ${existingKeys.size} already imported · uploading with concurrency ${CONCURRENCY}…`);

  await runPool(TASKS, CONCURRENCY, processTask);

  console.log("\n=== DONE ===");
  console.log(`Found: ${stats.total}  Uploaded: ${stats.uploaded}  Skipped: ${stats.skipped}  Errors: ${stats.errors}`);
}

main().catch(console.error);
