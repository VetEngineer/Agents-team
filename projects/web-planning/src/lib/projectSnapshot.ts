import type { Json } from "@/lib/database.types";
import { getSupabaseClient } from "@/lib/supabase";

type SnapshotPayload = {
  project_id: string;
  status: string | null;
  owner: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  basic: {
    industry: string | null;
    brand_name_ko: string | null;
    brand_name_en: string | null;
    existing_site_url: string | null;
    desired_launch_date: string | null;
    constraints_text: string | null;
  };
  sitemap: Array<{
    id: string;
    title: string | null;
    purpose: string | null;
    priority: number | null;
    order_no: number | null;
    sections: Array<{
      id: string;
      section_type: string | null;
      title: string | null;
      body: string | null;
      highlights: string | null;
      cta: {
        text: string | null;
        link_type: string | null;
        link_value: string | null;
      };
      media_required: boolean | null;
      order_no: number | null;
    }>;
  }>;
  functions: {
    required_features: string[] | null;
    responsive_notes: string | null;
    mobile_priority: boolean | null;
    multilingual: boolean | null;
    ops_plan: string | null;
  } | null;
  style: {
    mood_keywords: string[] | null;
    avoid_keywords: string[] | null;
    brand_colors: string[] | null;
    font_pref: string | null;
    photo_style: string | null;
    illustration_use: boolean | null;
  } | null;
  references: Array<{
    url: string | null;
    reason: string | null;
    avoid: boolean | null;
  }>;
  assets: Array<{
    asset_type: string | null;
    file_name: string | null;
    file_url: string | null;
    file_ext: string | null;
    width: number | null;
    height: number | null;
    size_bytes: number | null;
    required: boolean | null;
    spec_check_pass: boolean | null;
    notes: string | null;
  }>;
  answers: Array<{
    question_id: string;
    value: Json;
  }>;
  version: number;
  created_at: string;
};

export async function buildProjectSnapshot(projectId: string) {
  const supabase = getSupabaseClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message || "Project not found");
  }

  const ownerId = project.owner_id;
  const { data: owner } = ownerId
    ? await supabase.from("users").select("*").eq("id", ownerId).single()
    : { data: null };

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("project_id", projectId)
    .order("order_no", { ascending: true });

  const pagesList = (pages || []) as Array<{
    id: string;
    title?: string | null;
    purpose?: string | null;
    priority?: number | null;
    order_no?: number | null;
  }>;
  const pageIds = pagesList.map((page) => page.id);
  const { data: pageSections } = await supabase
    .from("page_sections")
    .select("*")
    .in("page_id", pageIds.length ? pageIds : ["00000000-0000-0000-0000-000000000000"])
    .order("order_no", { ascending: true });

  const pageSectionsList = (pageSections || []) as Array<{
    id: string;
    page_id: string;
    section_type?: string | null;
    title?: string | null;
    body?: string | null;
    highlights?: string | null;
    cta_text?: string | null;
    cta_link_type?: string | null;
    cta_link_value?: string | null;
    media_required?: boolean | null;
    order_no?: number | null;
  }>;
  const sectionsByPage = new Map<string, typeof pageSectionsList>();
  pageSectionsList.forEach((section) => {
    if (!sectionsByPage.has(section.page_id)) {
      sectionsByPage.set(section.page_id, []);
    }
    sectionsByPage.get(section.page_id)?.push(section);
  });

  const { data: functions } = await supabase
    .from("functions")
    .select("*")
    .eq("project_id", projectId)
    .single();

  const { data: styles } = await supabase
    .from("styles")
    .select("*")
    .eq("project_id", projectId)
    .single();

  const { data: references } = await supabase
    .from("references")
    .select("*")
    .eq("project_id", projectId);

  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .eq("project_id", projectId);

  const { data: answers } = await supabase
    .from("project_answers")
    .select("*")
    .eq("project_id", projectId);

  const referencesList = (references || []) as Array<{
    url?: string | null;
    reason?: string | null;
    avoid?: boolean | null;
  }>;
  const assetsList = (assets || []) as Array<{
    asset_type?: string | null;
    file_name?: string | null;
    file_url?: string | null;
    file_ext?: string | null;
    width?: number | null;
    height?: number | null;
    size_bytes?: number | null;
    required?: boolean | null;
    spec_check_pass?: boolean | null;
    notes?: string | null;
  }>;
  const answersList = (answers || []) as Array<{
    question_id: string;
    value: Json;
  }>;

  const payload: SnapshotPayload = {
    project_id: project.id,
    status: project.status ?? null,
    owner: {
      name: owner?.name ?? project.contact_name ?? null,
      email: project.contact_email ?? null,
      phone: owner?.phone ?? project.contact_phone ?? null,
    },
    basic: {
      industry: project.industry ?? null,
      brand_name_ko: project.brand_name_ko ?? null,
      brand_name_en: project.brand_name_en ?? null,
      existing_site_url: project.existing_site_url ?? null,
      desired_launch_date: project.desired_launch_date ?? null,
      constraints_text: project.constraints_text ?? null,
    },
    sitemap: pagesList.map((page) => ({
      id: page.id,
      title: page.title ?? null,
      purpose: page.purpose ?? null,
      priority: page.priority ?? null,
      order_no: page.order_no ?? null,
      sections: (sectionsByPage.get(page.id) || []).map((section) => ({
        id: section.id,
        section_type: section.section_type ?? null,
        title: section.title ?? null,
        body: section.body ?? null,
        highlights: section.highlights ?? null,
        cta: {
          text: section.cta_text ?? null,
          link_type: section.cta_link_type ?? null,
          link_value: section.cta_link_value ?? null,
        },
        media_required: section.media_required ?? null,
        order_no: section.order_no ?? null,
      })),
    })),
    functions: functions
      ? {
          required_features: functions.required_features ?? null,
          responsive_notes: functions.responsive_notes ?? null,
          mobile_priority: functions.mobile_priority ?? null,
          multilingual: functions.multilingual ?? null,
          ops_plan: functions["운영_계획"] ?? null,
        }
      : null,
    style: styles
      ? {
          mood_keywords: styles.mood_keywords ?? null,
          avoid_keywords: styles.avoid_keywords ?? null,
          brand_colors: styles.brand_colors ?? null,
          font_pref: styles.font_pref ?? null,
          photo_style: styles.photo_style ?? null,
          illustration_use: styles.illustration_use ?? null,
        }
      : null,
    references: referencesList.map((reference) => ({
      url: reference.url ?? null,
      reason: reference.reason ?? null,
      avoid: reference.avoid ?? null,
    })),
    assets: assetsList.map((asset) => ({
      asset_type: asset.asset_type ?? null,
      file_name: asset.file_name ?? null,
      file_url: asset.file_url ?? null,
      file_ext: asset.file_ext ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
      size_bytes: asset.size_bytes ?? null,
      required: asset.required ?? null,
      spec_check_pass: asset.spec_check_pass ?? null,
      notes: asset.notes ?? null,
    })),
    answers: answersList.map((answer) => ({
      question_id: answer.question_id,
      value: answer.value,
    })),
    version: 1,
    created_at: new Date().toISOString(),
  };

  return { project, payload };
}
