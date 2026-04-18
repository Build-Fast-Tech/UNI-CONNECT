export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Response.json({
    url_set: !!url,
    url_prefix: url ? url.slice(0, 30) : null,
    key_set: !!key,
    key_prefix: key ? key.slice(0, 10) : null,
  });
}
