import { SimplePage } from "@/components/simple-page";

export const metadata = { title: "Hướng dẫn mua hàng — CHYS Fashion" };

export default function GuidePage() {
  return (
    <SimplePage eyebrow="Hỗ trợ khách hàng" title="Hướng dẫn mua hàng">
      <p>1. Chọn sản phẩm, màu sắc và kích thước phù hợp, sau đó nhấn “Thêm vào giỏ hàng”.</p>
      <p>2. Vào giỏ hàng để kiểm tra lại sản phẩm, số lượng trước khi thanh toán.</p>
      <p>3. Điền đầy đủ thông tin giao hàng và chọn phương thức thanh toán.</p>
      <p>4. Xác nhận đặt hàng — CHYS Fashion sẽ liên hệ để xác nhận đơn trước khi giao.</p>
    </SimplePage>
  );
}
