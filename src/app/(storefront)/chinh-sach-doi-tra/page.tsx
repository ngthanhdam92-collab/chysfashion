import { SimplePage } from "@/components/simple-page";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("chinh-sach-doi-tra", {
    title: "Chính sách đổi trả — CHYS Fashion",
    description: "Chính sách đổi trả trong 30 ngày của CHYS Fashion — đơn giản, nhanh chóng, không rườm rà.",
  });
}

export default function ReturnPolicyPage() {
  return (
    <SimplePage eyebrow="Chính sách" title="Đổi trả & hoàn tiền">
      <p>
        CHYS Fashion hỗ trợ đổi trả trong vòng 30 ngày kể từ ngày nhận hàng
        đối với sản phẩm còn nguyên tem mác, chưa qua sử dụng và còn hóa đơn
        mua hàng.
      </p>
      <p>
        Với sản phẩm lỗi do nhà sản xuất, CHYS Fashion hoàn tiền 100% hoặc đổi
        sản phẩm mới theo yêu cầu của khách hàng, miễn phí vận chuyển hai
        chiều.
      </p>
      <p>
        Để yêu cầu đổi trả, vui lòng liên hệ hotline hoặc email chăm sóc
        khách hàng kèm mã đơn hàng.
      </p>
    </SimplePage>
  );
}
