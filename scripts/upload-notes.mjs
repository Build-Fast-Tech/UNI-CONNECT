import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

// Credentials come from the environment — run with:
//   node --env-file=.env.local scripts/upload-notes.mjs
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local)");
  process.exit(1);
}
const ROOT = "E:\\UPLOADS\\fsc-past-papers-main\\fsc-past-papers-main";
const SEMESTER_LABELS = ["1st","2nd","3rd","4th","5th","6th","7th","8th"];
const BUCKET = "notes";

// Admin user ID to use as uploader (first profile in DB)
const UPLOADER_ID = "5e8aa567-0050-406d-99d7-f7c27dee36eb";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Allowed: 'notes','quiz','assignment','sessional1','sessional2','final','textbook','other'
function deriveCategory(filename) {
  const f = filename.toLowerCase();
  if (f.includes("sessional-ii") || f.includes("sessional-2") || f.includes("sessional ii") || f.includes("sessional#2")) return "sessional2";
  if (f.includes("sessional-i") || f.includes("sessional-1") || f.includes("sessional i") || f.includes("sessional#1")) return "sessional1";
  if (f.includes("sessional")) return "sessional1";
  if (f.includes("final")) return "final";
  if (f.includes("mid")) return "other";       // map mid → other (no mid allowed)
  if (f.includes("textbook") || f.includes("book")) return "textbook";
  if (f.includes("quiz")) return "quiz";
  if (f.includes("assignment")) return "assignment";
  return "other";
}

function extractYear(filename) {
  const m = filename.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}

async function deleteAllExistingNotes() {
  console.log("Fetching existing notes to delete...");
  const { data: notes, error } = await supabase.from("notes").select("id, file_url");
  if (error) { console.error("Error fetching notes:", error.message); return; }
  if (!notes?.length) { console.log("No existing notes to delete."); return; }

  console.log(`Deleting ${notes.length} existing notes from DB...`);
  const { error: delErr } = await supabase.from("notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) { console.error("Error deleting notes:", delErr.message); return; }

  // Delete storage files
  const storageKeys = notes
    .map(n => {
      if (!n.file_url) return null;
      try {
        const url = new URL(n.file_url);
        const parts = url.pathname.split(`/object/public/${BUCKET}/`);
        return parts[1] ? decodeURIComponent(parts[1]) : null;
      } catch { return null; }
    })
    .filter(Boolean);

  if (storageKeys.length) {
    console.log(`Deleting ${storageKeys.length} storage files...`);
    const { error: stErr } = await supabase.storage.from(BUCKET).remove(storageKeys);
    if (stErr) console.warn("Storage delete warning:", stErr.message);
  }

  console.log("All existing notes deleted.");
}

async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    console.log(`Creating '${BUCKET}' bucket...`);
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error && !error.message.includes("already exists")) {
      console.error("Bucket creation error:", error.message);
    }
  }
}

async function uploadNotes() {
  await deleteAllExistingNotes();
  await ensureBucketExists();

  let total = 0;
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let semNum = 1; semNum <= 8; semNum++) {
    const semDir = path.join(ROOT, `semester-${semNum}`);
    let subjects;
    try {
      subjects = await readdir(semDir);
    } catch {
      console.log(`  Skipping semester-${semNum} (not found)`);
      continue;
    }

    for (const subject of subjects) {
      if (subject.toLowerCase() === "readme.md") continue;
      const subjectDir = path.join(semDir, subject);
      const subjectStat = await stat(subjectDir).catch(() => null);
      if (!subjectStat?.isDirectory()) continue;

      let files;
      try {
        files = await readdir(subjectDir);
      } catch {
        continue;
      }

      const pdfs = files.filter(f => f.toLowerCase().endsWith(".pdf"));
      if (!pdfs.length) continue;

      console.log(`\n[Semester ${semNum}] ${subject} — ${pdfs.length} PDFs`);

      for (const filename of pdfs) {
        total++;
        const filepath = path.join(subjectDir, filename);
        const title = filename.replace(/\.pdf$/i, "");
        const category = deriveCategory(filename);
        const year = extractYear(filename);
        const storagePath = `semester-${semNum}/${subject}/${filename}`;

        const semLabel = SEMESTER_LABELS[semNum - 1]; // "1st", "2nd", etc.

        // Check duplicate by title + subject + semester
        const { data: existing } = await supabase
          .from("notes")
          .select("id")
          .eq("title", title)
          .eq("subject", subject)
          .eq("semester", semLabel)
          .maybeSingle();

        if (existing) {
          console.log(`  SKIP (dup): ${filename}`);
          skipped++;
          continue;
        }

        // Upload file
        let fileBuffer;
        try {
          fileBuffer = await readFile(filepath);
        } catch (e) {
          console.error(`  ERROR reading ${filename}:`, e.message);
          errors++;
          continue;
        }

        const fileSizeBytes = fileBuffer.length;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (upErr) {
          console.error(`  ERROR uploading ${filename}:`, upErr.message);
          errors++;
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

        const { error: dbErr } = await supabase.from("notes").insert({
          uploader_id: UPLOADER_ID,
          title,
          subject,
          semester: semLabel,
          category,
          file_url: publicUrl,
          file_type: "pdf",
          file_size_bytes: fileSizeBytes,
          status: "published",
          year: year ?? null,
          tags: [subject, semLabel, category],
          description: `${subject} — ${semLabel} Semester — ${category}`,
        });

        if (dbErr) {
          console.error(`  ERROR inserting ${filename}:`, dbErr.message);
          // Clean up uploaded file
          await supabase.storage.from(BUCKET).remove([storagePath]);
          errors++;
          continue;
        }

        console.log(`  OK [${category}] ${filename}`);
        uploaded++;
      }
    }
  }

  console.log("\n=== DONE ===");
  console.log(`Total PDFs found: ${total}`);
  console.log(`Uploaded:         ${uploaded}`);
  console.log(`Skipped (dups):   ${skipped}`);
  console.log(`Errors:           ${errors}`);
}

uploadNotes().catch(console.error);
