import { SimplePage } from "@/components/simple-page";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("cau-hoi-thuong-gap", {
    title: "Câu hỏi thường gặp — CHYS Fashion",
    description: "Giải đáp các thắc mắc về đặt hàng, thanh toán, vận chuyển và đổi trả của CHYS Fashion.",
  });
}

const FAQS = [
  {
    q: "CHYS Fashion có cửa hàng offline không?",
    a: "Hiện tại CHYS Fashion tập trung phát triển kênh bán hàng trực tuyến để mang đến giá tốt nhất cho khách hàng.",
  },
  {
    q: "Thời gian giao hàng là bao lâu?",
    a: "Đơn hàng thường được giao trong 2-5 ngày làm việc tùy khu vực.",
  },
  {
    q: "Tôi có thể đổi trả sản phẩm không?",
    a: "Có, bạn có thể đổi trả trong vòng 30 ngày kể từ ngày nhận hàng đối với sản phẩm còn nguyên tem mác.",
  },
  {
    q: "CHYS Fashion hỗ trợ thanh toán những hình thức nào?",
    a: "Hiện tại chúng tôi hỗ trợ thanh toán khi nhận hàng (COD). Các cổng thanh toán online sẽ sớm được cập nhật.",
  },
];

export default function FaqPage() {
  return (
    <SimplePage eyebrow="Hỗ trợ khách hàng" title="Câu hỏi thường gặp">
      <div className="divide-y divide-line">
        {FAQS.map((item) => (
          <div key={item.q} className="py-4">
            <p className="font-medium text-ink">{item.q}</p>
            <p className="mt-1.5">{item.a}</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
