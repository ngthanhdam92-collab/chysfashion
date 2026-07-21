import Link from "next/link";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./social-icons";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">

          {/* Cột 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-serif text-2xl tracking-[0.12em] text-paper">CHYS</span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone">
              Thương hiệu thời trang Việt Nam — thiết kế tối giản, chất liệu cao cấp,
              bền vững qua thời gian.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="#" aria-label="Facebook" className="text-stone hover:text-gold transition-colors">
                <FacebookIcon size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="text-stone hover:text-gold transition-colors">
                <InstagramIcon size={18} />
              </a>
              <a href="#" aria-label="Youtube" className="text-stone hover:text-gold transition-colors">
                <YoutubeIcon size={18} />
              </a>
            </div>
          </div>

          {/* Cột 2 — Hỗ trợ */}
          <div>
            <h4 className="text-[11px] tracking-label uppercase text-paper">Hỗ trợ</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/tra-cuu-don-hang" className="text-sm text-stone hover:text-gold transition-colors">Tra cứu đơn hàng</Link></li>
              <li><Link href="/lien-he" className="text-sm text-stone hover:text-gold transition-colors">Liên hệ</Link></li>
              <li><Link href="/huong-dan-mua-hang" className="text-sm text-stone hover:text-gold transition-colors">Hướng dẫn mua hàng</Link></li>
              <li><Link href="/huong-dan-chon-size" className="text-sm text-stone hover:text-gold transition-colors">Hướng dẫn chọn size</Link></li>
              <li><Link href="/cau-hoi-thuong-gap" className="text-sm text-stone hover:text-gold transition-colors">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          {/* Cột 3 — Chính sách */}
          <div>
            <h4 className="text-[11px] tracking-label uppercase text-paper">Chính sách</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/chinh-sach-doi-tra" className="text-sm text-stone hover:text-gold transition-colors">Đổi trả &amp; hoàn tiền</Link></li>
              <li><Link href="/chinh-sach-van-chuyen" className="text-sm text-stone hover:text-gold transition-colors">Vận chuyển</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="text-sm text-stone hover:text-gold transition-colors">Bảo mật thông tin</Link></li>
              <li><Link href="/dieu-khoan-dich-vu" className="text-sm text-stone hover:text-gold transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="/chinh-sach-khuyen-mai" className="text-sm text-stone hover:text-gold transition-colors">Khuyến mãi</Link></li>
            </ul>
          </div>

          {/* Cột 4 — Về CHYS */}
          <div>
            <h4 className="text-[11px] tracking-label uppercase text-paper">Về CHYS</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/ve-chung-toi" className="text-sm text-stone hover:text-gold transition-colors">Câu chuyện thương hiệu</Link></li>
              <li><Link href="/san-pham" className="text-sm text-stone hover:text-gold transition-colors">Bộ sưu tập</Link></li>
              <li><Link href="#" className="text-sm text-stone hover:text-gold transition-colors">Blog thời trang</Link></li>
              <li><Link href="#" className="text-sm text-stone hover:text-gold transition-colors">Tuyển dụng</Link></li>
              <li><Link href="#" className="text-sm text-stone hover:text-gold transition-colors">ESG &amp; Bền vững</Link></li>
            </ul>
          </div>

          {/* Cột 5 — Newsletter */}
          <div>
            <h4 className="text-[11px] tracking-label uppercase text-paper">Nhận ưu đãi</h4>
            <p className="mt-4 text-sm text-stone">
              Đăng ký nhận thông tin bộ sưu tập mới và ưu đãi độc quyền.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
            <div className="mt-5">
              <p className="text-[11px] tracking-label uppercase text-paper mb-2">Hotline</p>
              <p className="text-sm text-stone">0986 959 980</p>
              <p className="text-xs text-stone/60 mt-0.5">T2–T7 · 8:00–21:00</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-stone/20 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone">
            © {new Date().getFullYear()} CHYS Fashion. Đã đăng ký bản quyền.
          </p>
          <p className="text-xs text-stone/50">
            Mã số doanh nghiệp: 0000000000 · Sở KHĐT TP.HCM cấp
          </p>
        </div>
      </div>
    </footer>
  );
}
