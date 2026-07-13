import { SimplePage } from "@/components/simple-page";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("chinh-sach-van-chuyen", {
    title: "Chính sách vận chuyển — CHYS Fashion",
    description: "Thông tin phí vận chuyển, thời gian giao hàng và các đối tác giao nhận của CHYS Fashion.",
  });
}

export default function ShippingPolicyPage() {
  return (
    <SimplePage eyebrow="Chính sách" title="Vận chuyển">
      <p>Miễn phí vận chuyển cho đơn hàng từ 500.000đ trên toàn quốc.</p>
      <p>
        Đơn hàng dưới 500.000đ áp dụng phí vận chuyển đồng giá 30.000đ.
      </p>
      <p>
        Thời gian giao hàng dự kiến từ 2-5 ngày làm việc tùy khu vực. Khách
        hàng sẽ nhận được thông báo qua điện thoại/email khi đơn hàng được
        giao cho đơn vị vận chuyển.
      </p>
    </SimplePage>
  );
}
