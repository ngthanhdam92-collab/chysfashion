import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Verify admin session
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Không đọc được form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const path = formData.get("path") as string | null;

  if (!file || !path) {
    return NextResponse.json({ error: "Thiếu file hoặc đường dẫn" }, { status: 400 });
  }

  // Server-side MIME type allowlist
  const ALLOWED_TYPES = new Set([
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
    "video/mp4", "video/webm", "video/quicktime",
  ]);
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Định dạng file không được phép" }, { status: 400 });
  }

  // Magic-byte verification for images
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (file.type.startsWith("image/")) {
    const sig = buffer.subarray(0, 12);
    const isJpeg = sig[0] === 0xff && sig[1] === 0xd8 && sig[2] === 0xff;
    const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47;
    const isGif = sig[0] === 0x47 && sig[1] === 0x49 && sig[2] === 0x46;
    const isWebP = sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46
      && sig[8] === 0x57 && sig[9] === 0x45 && sig[10] === 0x42 && sig[11] === 0x50;
    // AVIF is ISOBMFF-based, just check ftyp box
    const isAvif = sig[4] === 0x66 && sig[5] === 0x74 && sig[6] === 0x79 && sig[7] === 0x70;
    if (!isJpeg && !isPng && !isGif && !isWebP && !isAvif) {
      return NextResponse.json({ error: "Nội dung file không hợp lệ" }, { status: 400 });
    }
  }

  // Use service role key to bypass storage RLS; fall back to user session
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = serviceKey
    ? createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
    : serverClient;

  const { error: uploadError } = await supabase.storage
    .from("product-media")
    .upload(path, buffer, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("product-media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
