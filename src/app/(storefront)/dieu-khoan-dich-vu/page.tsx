import { SimplePage } from "@/components/simple-page";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("dieu-khoan-dich-vu", {
    title: "Điều khoản dịch vụ — CHYS Fashion",
    description: "Điều khoản và điều kiện sử dụng dịch vụ mua sắm tại CHYS Fashion.",
  });
}

export default function TermsPage() {
  return (
    <SimplePage eyebrow="Chính sách" title="Điều khoản dịch vụ">
      <p>
        Khi truy cập và sử dụng website CHYS Fashion, bạn đồng ý tuân thủ các
        điều khoản và điều kiện được nêu tại đây. Nội dung, hình ảnh và
        thương hiệu trên website thuộc quyền sở hữu của CHYS Fashion.
      </p>
      <p>
        Giá sản phẩm có thể thay đổi mà không cần báo trước. Đơn hàng chỉ
        được xác nhận sau khi CHYS Fashion liên hệ xác nhận với khách hàng.
      </p>
    </SimplePage>
  );
}
