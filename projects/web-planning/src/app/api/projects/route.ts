import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabaseClient();
  const body = await request.json();
  const { owner_id, industry, brand_name_ko, contact_name, contact_email } = body;

  const { data, error } = await supabase
    .from("projects")
    .insert({ owner_id, industry, brand_name_ko, contact_name, contact_email })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function GET(request: Request) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("owner_id");

  let query = supabase.from("projects").select("*");
  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
