import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { CtaButton } from "@/components/cta-button";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("ve-chung-toi", {
    title: "Về chúng tôi — CHYS Fashion",
    description: "CHYS Fashion — thương hiệu thời trang cao cấp với thiết kế tối giản, tinh tế, bền vững.",
  });
}

export default function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-white via-white to-cream py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[12px] tracking-label uppercase text-gold-dark">
            Câu chuyện thương hiệu
          </p>
          <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">
            CHYS Fashion
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
            Thời trang cao cấp cho những người theo đuổi sự tối giản, tinh tế
            và bền vững trong từng lựa chọn.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <ProductImagePlaceholder seed="about-1" />
        <div className="flex flex-col justify-center">
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">
            Khởi nguồn từ sự tận tâm
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            CHYS Fashion được thành lập với mong muốn mang đến những sản phẩm
            thời trang chất lượng cao, thiết kế tinh giản nhưng không kém
            phần đẳng cấp. Chúng tôi tin rằng một tủ đồ đẹp không cần quá
            nhiều món, mà cần những món đồ thật sự chất lượng, có thể đồng
            hành cùng bạn qua nhiều năm tháng.
          </p>
        </div>
      </section>

      <section className="bg-cream/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col justify-center lg:order-1">
            <h2 className="font-serif text-2xl text-ink sm:text-3xl">
              Cam kết chất lượng
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              Mỗi sản phẩm của CHYS Fashion đều trải qua quy trình kiểm định
              nghiêm ngặt về chất liệu và đường may. Chúng tôi làm việc trực
              tiếp với các xưởng may uy tín trong nước để đảm bảo mỗi sản
              phẩm khi đến tay khách hàng đều đạt tiêu chuẩn cao cấp.
            </p>
          </div>
          <ProductImagePlaceholder seed="about-2" className="lg:order-2" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl text-ink sm:text-3xl">
          Khám phá bộ sưu tập mới nhất
        </h2>
        <div className="mt-6">
          <CtaButton href="/san-pham" variant="primary">
            Mua sắm ngay
          </CtaButton>
        </div>
      </section>
    </div>
  );
}
