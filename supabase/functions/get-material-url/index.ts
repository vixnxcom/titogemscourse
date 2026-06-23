import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { materialId } = await req.json();

    if (!materialId || typeof materialId !== "string") {
      return json({ error: "Material ID is required." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server secrets are not configured." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(token);

    if (userError || !userData.user) {
      return json({ error: "You must be logged in to open materials." }, 401);
    }

    const { data: material, error: materialError } = await admin
      .from("materials")
      .select("id, title, kind, storage_path, external_url, course_week_id, access_provider, access_note, allow_download")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError) return json({ error: materialError.message }, 500);
    if (!material) return json({ error: "Material not found." }, 404);

    const { data: isUnlocked, error: unlockError } = await admin.rpc("is_week_unlocked", {
      p_user_id: userData.user.id,
      p_week_id: material.course_week_id,
    });

    if (unlockError) return json({ error: unlockError.message }, 500);
    if (!isUnlocked) return json({ error: "This material is still locked." }, 403);

    if (material.external_url) {
      return json({
        url: material.external_url,
        kind: material.kind,
        title: material.title,
        accessProvider: material.access_provider || "external_url",
        accessNote: material.access_note,
        allowDownload: Boolean(material.allow_download),
      });
    }

    if (!material.storage_path) {
      return json({ error: "This material link is not configured yet." }, 404);
    }

    const { data: signed, error: signedError } = await admin.storage
      .from("course-materials")
      .createSignedUrl(material.storage_path, 60 * 10);

    if (signedError) return json({ error: signedError.message }, 500);

    return json({
      url: signed.signedUrl,
      kind: material.kind,
      title: material.title,
      accessProvider: "supabase_storage",
      accessNote: "This link expires shortly.",
      allowDownload: true,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
