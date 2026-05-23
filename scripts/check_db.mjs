import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple env file parser
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing supabase credentials", { url, serviceRoleKey });
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function run() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role");

  if (error) {
    console.error("Error reading profiles:", error);
    return;
  }

  console.log("Current Profiles:");
  console.log(profiles);

  // If any profile has email containing abdullah or is full_name Abdullah and role is employer, let's restore it to admin
  for (const p of profiles) {
    if (
      (p.email && p.email.toLowerCase().includes("abdullah")) ||
      (p.full_name && p.full_name.toLowerCase().includes("abdullah"))
    ) {
      if (p.role !== "admin") {
        console.log(`Updating ${p.full_name} (${p.email}) to role 'admin'...`);
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", p.id);
        if (updateErr) {
          console.error("Failed to update role:", updateErr);
        } else {
          console.log("Successfully restored role to 'admin'!");
        }
      }
    }
  }
}

run();
