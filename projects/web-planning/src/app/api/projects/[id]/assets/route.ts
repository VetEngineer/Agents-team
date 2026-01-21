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
    asset_type,
    file_name,
    file_url,
    file_ext,
    width,
    height,
    size_bytes,
  } = body;

  const { data, error } = await supabase
    .from("assets")
    .insert({
      project_id: id,
      asset_type,
      file_name,
      file_url,
      file_ext,
      width,
      height,
      size_bytes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
