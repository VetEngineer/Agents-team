import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { airtableUpsert } from "@/lib/airtable";

export async function POST(request: Request) {
  const supabase = getSupabaseClient();
  const { project_id, snapshot_id, sync_job_id } = await request.json();

  let payloadProjectId: string | null = null;
  let payloadBrand: string | null = null;
  let payloadIndustry: string | null = null;
  let payloadStatus: string | null = null;
  let payloadContact: string | null = null;

  if (snapshot_id) {
    const { data: snapshot, error: snapshotError } = await supabase
      .from("project_snapshots")
      .select("payload")
      .eq("id", snapshot_id)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const payload = snapshot.payload as {
      project_id?: string;
      status?: string;
      owner?: { name?: string };
      basic?: { brand_name_ko?: string; industry?: string };
    };

    payloadProjectId = payload.project_id ?? null;
    payloadBrand = payload.basic?.brand_name_ko ?? null;
    payloadIndustry = payload.basic?.industry ?? null;
    payloadStatus = payload.status ?? null;
    payloadContact = payload.owner?.name ?? null;
  } else if (project_id) {
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    payloadProjectId = project.id;
    payloadBrand = project.brand_name_ko;
    payloadIndustry = project.industry;
    payloadStatus = project.status;
    payloadContact = project.contact_name;
  } else {
    return NextResponse.json({ error: "Missing project_id or snapshot_id" }, { status: 400 });
  }

  try {
    if (sync_job_id) {
      await supabase
        .from("sync_jobs")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", sync_job_id);
    }

    await airtableUpsert("Projects", {
      ProjectId: payloadProjectId,
      Brand: payloadBrand,
      Industry: payloadIndustry,
      Status: payloadStatus,
      Contact: payloadContact,
    });

    if (sync_job_id) {
      await supabase
        .from("sync_jobs")
        .update({ status: "success", updated_at: new Date().toISOString() })
        .eq("id", sync_job_id);
    }
  } catch (syncError) {
    if (sync_job_id) {
      const errorMessage =
        syncError instanceof Error ? syncError.message : "Sync failed";
      await supabase
        .from("sync_jobs")
        .update({
          status: "failed",
          error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sync_job_id);
      await supabase.from("sync_logs").insert({
        sync_job_id,
        message: errorMessage,
      });
    }
    return NextResponse.json(
      { error: syncError instanceof Error ? syncError.message : "Sync failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
