import { Mail, Phone, MapPin } from "lucide-react";
import { SimplePage } from "@/components/simple-page";

export const metadata = { title: "Liên hệ — CHYS Fashion" };

export default function ContactPage() {
  return (
    <SimplePage eyebrow="Hỗ trợ khách hàng" title="Liên hệ với chúng tôi">
      <p>
        CHYS Fashion luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với
        chúng tôi qua các kênh dưới đây, đội ngũ chăm sóc khách hàng sẽ phản
        hồi trong vòng 24 giờ làm việc.
      </p>
      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Phone size={18} className="text-gold-dark" />
          <span>1900 xxxx (7:30 – 21:30, tất cả các ngày trong tuần)</span>
        </div>
        <div className="flex items-center gap-3">
          <Mail size={18} className="text-gold-dark" />
          <span>hotro@chysfashion.vn</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-gold-dark" />
          <span>TP. Hồ Chí Minh, Việt Nam</span>
        </div>
      </div>
    </SimplePage>
  );
}
