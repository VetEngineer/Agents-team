import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { notifySlack, notifyTelegram } from "@/lib/notifications";
import { airtableUpsert } from "@/lib/airtable";
import { buildProjectSnapshot } from "@/lib/projectSnapshot";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseClient();
  const { id } = await context.params;
  const { data: project, error } = await supabase
    .from("projects")
    .update({ status: "submitted" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let snapshotId: string | null = null;
  let syncJobId: string | null = null;

  try {
    const { payload } = await buildProjectSnapshot(project.id);
    const { data: snapshot, error: snapshotError } = await supabase
      .from("project_snapshots")
      .insert({
        project_id: project.id,
        payload,
        version: payload.version,
        created_by: project.owner_id,
      })
      .select()
      .single();

    if (snapshotError) {
      throw snapshotError;
    }

    snapshotId = snapshot.id;

    const { data: syncJob } = await supabase
      .from("sync_jobs")
      .insert({
        project_id: project.id,
        snapshot_id: snapshotId,
        target: "airtable",
        status: "running",
      })
      .select()
      .single();

    syncJobId = syncJob?.id ?? null;

    await airtableUpsert("Projects", {
      ProjectId: payload.project_id,
      Brand: payload.basic.brand_name_ko,
      Industry: payload.basic.industry,
      Status: payload.status,
      Contact: payload.owner.name,
    });

    if (syncJobId) {
      await supabase
        .from("sync_jobs")
        .update({ status: "success", updated_at: new Date().toISOString() })
        .eq("id", syncJobId);
    }
  } catch (snapshotError) {
    const errorMessage =
      snapshotError instanceof Error ? snapshotError.message : "Snapshot failed";

    if (syncJobId) {
      await supabase
        .from("sync_jobs")
        .update({
          status: "failed",
          error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", syncJobId);

      await supabase.from("sync_logs").insert({
        sync_job_id: syncJobId,
        message: errorMessage,
      });
    }
  }

  const message = `New submission: ${project.brand_name_ko || project.id}`;
  await Promise.all([notifySlack(message), notifyTelegram(message)]);

  return NextResponse.json({ ok: true, snapshot_id: snapshotId, sync_job_id: syncJobId });
}
