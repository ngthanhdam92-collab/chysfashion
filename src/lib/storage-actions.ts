"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "./supabase/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(url, serviceKey);
  }
  return null;
}

export async function uploadToStorage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file") as File | null;
  const path = formData.get("path") as string | null;

  if (!file || !path) return { error: "Thiếu file hoặc đường dẫn" };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const adminClient = getAdminClient();
    const supabase = adminClient ?? (await createServerClient());

    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(path, buffer, { upsert: true, contentType: file.type });

    if (uploadError) return { error: uploadError.message };

    const { data } = supabase.storage
      .from("product-media")
      .getPublicUrl(path);

    return { url: data.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload thất bại" };
  }
}
