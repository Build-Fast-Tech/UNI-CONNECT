import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.meta ? import.meta.url : import.meta.url));

// Read .env.local to get Supabase URL/Project Ref
const envPath = path.join(__dirname, "..", ".env.local");
let envText = "";
try {
  envText = fs.readFileSync(envPath, "utf8");
} catch (e) {
  console.error("Failed to read .env.local");
}

const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
  console.error("ERROR: Please provide the Supabase Database Password as an argument or set SUPABASE_DB_PASSWORD.");
  console.log("Usage: node scripts/apply-migration.mjs <your-db-password>");
  process.exit(1);
}

// Extract project ref from NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectRefMatch ? projectRefMatch[1] : "mwpuwgoesgvsvknhqmor";

const connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

console.log(`Connecting to database pooler for project: ${projectRef}...`);

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully!");

    const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "036_society_and_friends.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Applying migration 036_society_and_friends.sql...");
    await client.query(sql);
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

run();
