import { SimplePage } from "@/components/simple-page";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("chinh-sach-bao-mat", {
    title: "Chính sách bảo mật — CHYS Fashion",
    description: "Cam kết bảo mật thông tin khách hàng của CHYS Fashion theo tiêu chuẩn bảo mật cao nhất.",
  });
}

export default function PrivacyPolicyPage() {
  return (
    <SimplePage eyebrow="Chính sách" title="Bảo mật thông tin">
      <p>
        CHYS Fashion cam kết bảo mật mọi thông tin cá nhân của khách hàng.
        Thông tin thu thập (họ tên, số điện thoại, địa chỉ) chỉ được sử dụng
        để xử lý đơn hàng và chăm sóc khách hàng.
      </p>
      <p>
        Chúng tôi không chia sẻ, bán hoặc trao đổi thông tin khách hàng với
        bên thứ ba vì mục đích thương mại, trừ trường hợp cần thiết để hoàn
        tất việc giao hàng (đơn vị vận chuyển).
      </p>
    </SimplePage>
  );
}
