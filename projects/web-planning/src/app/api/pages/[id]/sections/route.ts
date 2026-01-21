import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;
  const body = await request.json();
  const {
    section_type,
    title,
    body: sectionBody,
    highlights,
    cta_text,
    cta_link_type,
    cta_link_value,
    media_required,
    order_no,
  } = body;

  const { data, error } = await supabase
    .from("page_sections")
    .insert({
      page_id: id,
      section_type,
      title,
      body: sectionBody,
      highlights,
      cta_text,
      cta_link_type,
      cta_link_value,
      media_required,
      order_no,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;
  const { data, error } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
