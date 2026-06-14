import pg from "pg";

const { Client } = pg;
const passwords = [
  "uniconnect",
  "UniConnect",
  "UniConnect123",
  "uniconnect123",
  "abdullah",
  "abdullahxf90",
  "mwpuwgoesgvsvknhqmor",
  "postgres"
];

async function tryPassword(password) {
  const client = new Client({
    host: "db.mxlfreenahsqdclabemx.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS! Password is: ${password}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for password: ${password} - ${err.message}`);
    return false;
  }
}

async function run() {
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) return;
  }
  console.log("No passwords matched.");
}

run();
