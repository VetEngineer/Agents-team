import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;
  const body = await request.json();
  const { answers } = body;

  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const payload = answers.map((answer) => ({
    project_id: id,
    question_id: answer.question_id,
    value: answer.value,
  }));

  const { data, error } = await supabase
    .from("project_answers")
    .insert(payload)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ saved: data.length });
}
