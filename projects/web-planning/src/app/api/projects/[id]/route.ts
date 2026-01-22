import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const ALLOWED_FIELDS = new Set([
  "project_name",
  "industry",
  "desired_launch_date",
  "constraints_text",
  "brand_name_ko",
  "brand_name_en",
  "key_message",
  "target_audience",
  "contact_name",
  "contact_email",
  "contact_phone",
  "existing_site_url",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const updates = Object.fromEntries(
    Object.entries(body ?? {}).filter(
      ([key, value]) => ALLOWED_FIELDS.has(key) && value !== undefined
    )
  );

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
