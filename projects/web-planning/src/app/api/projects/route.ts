import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabaseClient();
  const body = await request.json().catch(() => ({}));
  const {
    owner_id,
    project_name,
    industry,
    desired_launch_date,
    constraints_text,
    brand_name_ko,
    brand_name_en,
    key_message,
    target_audience,
    contact_name,
    contact_email,
    contact_phone,
    existing_site_url,
  } = body ?? {};

  const payload: Record<string, unknown> = { status: "draft" };
  const fields = {
    owner_id,
    project_name,
    industry,
    desired_launch_date,
    constraints_text,
    brand_name_ko,
    brand_name_en,
    key_message,
    target_audience,
    contact_name,
    contact_email,
    contact_phone,
    existing_site_url,
  };

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[key] = value;
    }
  });

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
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
