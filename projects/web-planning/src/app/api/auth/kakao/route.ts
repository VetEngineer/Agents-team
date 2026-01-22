import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const scopes = "profile_nickname profile_image";
  const prompt = "login";

  if (!baseUrl || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing auth config" }, { status: 500 });
  }

  const redirectTo = `${baseUrl}/auth/callback`;
  const url = `${supabaseUrl}/auth/v1/authorize?provider=kakao&redirect_to=${encodeURIComponent(
    redirectTo
  )}&scopes=${encodeURIComponent(scopes)}&prompt=${encodeURIComponent(prompt)}`;

  return NextResponse.redirect(url);
}
