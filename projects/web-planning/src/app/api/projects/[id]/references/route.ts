import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;
  const body = await request.json();
  const { url, reason, avoid } = body;

  const { data, error } = await supabase
    .from("references")
    .insert({ project_id: id, url, reason, avoid })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
