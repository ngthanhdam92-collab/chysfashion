import { SimplePage } from "@/components/simple-page";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("huong-dan-chon-size", {
    title: "Hướng dẫn chọn size — CHYS Fashion",
    description: "Bảng hướng dẫn chọn size quần áo CHYS Fashion chính xác theo số đo cơ thể.",
  });
}

const SIZES = [
  { size: "S", chest: "88-92", waist: "72-76", height: "160-165" },
  { size: "M", chest: "93-97", waist: "77-81", height: "165-170" },
  { size: "L", chest: "98-102", waist: "82-86", height: "170-175" },
  { size: "XL", chest: "103-107", waist: "87-91", height: "175-180" },
];

export default function SizeGuidePage() {
  return (
    <SimplePage eyebrow="Hỗ trợ khách hàng" title="Hướng dẫn chọn size">
      <p>
        Bảng số đo tham khảo dưới đây (đơn vị: cm) giúp bạn chọn size phù hợp
        nhất. Nếu số đo của bạn nằm giữa hai size, chúng tôi khuyên nên chọn
        size lớn hơn để có form thoải mái.
      </p>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink">
            <th className="py-2">Size</th>
            <th className="py-2">Vòng ngực</th>
            <th className="py-2">Vòng eo</th>
            <th className="py-2">Chiều cao</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((row) => (
            <tr key={row.size} className="border-b border-line">
              <td className="py-2 font-medium text-ink">{row.size}</td>
              <td className="py-2">{row.chest}</td>
              <td className="py-2">{row.waist}</td>
              <td className="py-2">{row.height}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SimplePage>
  );
}
