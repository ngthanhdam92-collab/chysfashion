import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { getAllStories } from "@/lib/stories";
import { DeleteStoryButton } from "@/components/admin/delete-story-button";

export default async function StoriesPage() {
  const stories = await getAllStories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Stories / Feedback khách hàng</h1>
          <p className="mt-0.5 text-sm text-muted">
            Ảnh feedback có liên kết sản phẩm — hiển thị như Instagram Stories trên trang chủ
          </p>
        </div>
        <Link
          href="/admin/stories/new"
          className="flex items-center gap-1.5 bg-ink px-4 py-2 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85"
        >
          <Plus size={14} /> Thêm story
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="rounded border border-dashed border-line bg-surface py-16 text-center">
          <p className="text-sm text-muted">Chưa có story nào.</p>
          <Link
            href="/admin/stories/new"
            className="mt-4 inline-block bg-ink px-5 py-2 text-[12px] tracking-label uppercase text-paper"
          >
            Tạo story đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="relative flex flex-col overflow-hidden rounded-xl border border-line bg-white"
            >
              {/* Story image */}
              <div className="relative aspect-[9/16] bg-gray-100">
                <Image
                  src={story.imageUrl}
                  alt={story.customerName || "Story"}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
                {/* Status badge */}
                <div className="absolute right-2 top-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      story.isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {story.isActive ? "Hiện" : "Ẩn"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="truncate text-[11px] font-medium text-ink">
                  {story.customerName || "Khách hàng"}
                </p>
                <p className="text-[10px] text-muted">
                  {story.productLinks.length} sản phẩm · vị trí {story.position}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <Link
                    href={`/admin/stories/${story.id}/edit`}
                    className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                  >
                    <Pencil size={10} /> Sửa
                  </Link>
                  <DeleteStoryButton id={story.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SQL hint */}
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        <p className="font-semibold">Lưu ý:</p>
        <p className="mt-1">
          Nếu trang báo lỗi, bạn cần tạo bảng <code>customer_stories</code> trong Supabase trước.
          Chạy SQL bên dưới trong Supabase → SQL Editor.
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-amber-100 p-2 text-[10px] leading-relaxed">
{`CREATE TABLE customer_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  customer_name TEXT DEFAULT '',
  product_links JSONB DEFAULT '[]',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE customer_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON customer_stories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read" ON customer_stories
  FOR SELECT TO anon USING (true);`}
        </pre>
      </div>
    </div>
  );
}
