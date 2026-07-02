import Link from "next/link";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./social-icons";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <span className="font-serif text-2xl tracking-[0.12em] text-paper">
              CHYS
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone">
              CHYS Fashion — thời trang cao cấp dành cho những người theo
              đuổi sự tối giản và tinh tế trong từng thiết kế.
            </p>
            <div className="mt-5 flex gap-4">
              <a href="#" aria-label="Facebook" className="text-stone hover:text-gold">
                <FacebookIcon size={18} />
              </a>
              <a href="#" aria-label="Instagram" className="text-stone hover:text-gold">
                <InstagramIcon size={18} />
              </a>
              <a href="#" aria-label="Youtube" className="text-stone hover:text-gold">
                <YoutubeIcon size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[12px] tracking-label uppercase text-paper">
              Hỗ trợ khách hàng
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-stone">
              <li><Link href="/lien-he" className="hover:text-gold">Liên hệ</Link></li>
              <li><Link href="/huong-dan-mua-hang" className="hover:text-gold">Hướng dẫn mua hàng</Link></li>
              <li><Link href="/huong-dan-chon-size" className="hover:text-gold">Hướng dẫn chọn size</Link></li>
              <li><Link href="/cau-hoi-thuong-gap" className="hover:text-gold">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] tracking-label uppercase text-paper">
              Chính sách
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-stone">
              <li><Link href="/chinh-sach-doi-tra" className="hover:text-gold">Đổi trả & hoàn tiền</Link></li>
              <li><Link href="/chinh-sach-van-chuyen" className="hover:text-gold">Vận chuyển</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="hover:text-gold">Bảo mật thông tin</Link></li>
              <li><Link href="/dieu-khoan-dich-vu" className="hover:text-gold">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] tracking-label uppercase text-paper">
              Nhận ưu đãi
            </h4>
            <p className="mt-4 text-sm text-stone">
              Đăng ký để nhận thông tin bộ sưu tập mới và ưu đãi độc quyền.
            </p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-stone/20 pt-6 text-xs text-stone sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CHYS Fashion. Đã đăng ký bản quyền.</p>
          <p>Thiết kế & phát triển bởi CHYS Fashion</p>
        </div>
      </div>
    </footer>
  );
}
