import { WishlistView } from "@/components/wishlist-view";

export const metadata = {
  title: "Sản phẩm yêu thích — CHYS Fashion",
  description: "Danh sách sản phẩm bạn đã lưu yêu thích.",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-serif text-3xl text-ink">Yêu thích</h1>
      <WishlistView />
    </div>
  );
}
