import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { recommendSize, DEFAULT_SIZE_CHART, type SizeChartRow } from "@/lib/size-chart";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function groqChat(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  useFallback = false
): Promise<Groq.Chat.ChatCompletion> {
  return groq.chat.completions.create({
    model: useFallback ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile",
    messages,
    tools: TOOLS,
    tool_choice: "auto",
    max_tokens: 800,
  });
}

// Simple in-memory rate limit: 30 messages per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

const SITE_URL = "https://chysfashion.online";

const SYSTEM_PROMPT = `Bạn là trợ lý AI của CHYS Fashion - thương hiệu thời trang cao cấp Việt Nam.
Tên bạn là "CHYS". Hãy trả lời thân thiện, tự nhiên bằng tiếng Việt, xưng "mình" và gọi khách là "bạn".
Giữ câu trả lời ngắn gọn, đúng trọng tâm. Dùng emoji khi phù hợp nhưng đừng lạm dụng.

===THÔNG TIN CHYS===
- Thương hiệu thời trang cao cấp, thiết kế tối giản, tinh tế
- Chất liệu nhập khẩu cao cấp: cotton compact, linen, wool blend
- Phục vụ cả nam và nữ

===CHÍNH SÁCH===
- Đổi trả: trong 7 ngày kể từ ngày nhận, còn nguyên tag, chưa qua sử dụng
- Vận chuyển: miễn phí đơn ≥ 500.000đ, dưới 500.000đ phí 30.000đ toàn quốc
- Giao hàng: 2–5 ngày làm việc, nội thành có thể 1–2 ngày
- Thanh toán: COD (tiền mặt khi nhận) hoặc chuyển khoản ngân hàng

===HƯỚNG DẪN===
- Khi khách hỏi đơn hàng: hỏi số điện thoại hoặc mã đơn rồi dùng tool lookup_order
- Khi khách hỏi về loại sản phẩm (quần, áo, bộ...): dùng tool get_categories để lấy link danh mục phù hợp và gửi cho khách
- Khi khách hỏi sản phẩm cụ thể hoặc tìm theo tên: dùng tool search_products
- Khi khách hỏi về size: hỏi gộp 1 lần duy nhất cả 3 thứ: (1) sản phẩm/loại sản phẩm, (2) chiều cao, (3) cân nặng. Ví dụ: "Bạn đang xem sản phẩm nào vậy, và cho mình biết chiều cao cân nặng của bạn để mình tư vấn nhé!" — KHÔNG hỏi riêng từng thứ
- Khi khách đã cung cấp đủ sản phẩm + chiều cao + cân nặng (dù trong nhiều tin nhắn): gọi ngay tool get_size_recommendation
- Cách đọc số đo tiếng Việt: "1m70" = 170cm, "1m65" = 165cm, "1,70m" = 170cm. "70kg" hoặc "70 kg" = 70. Tự quy đổi trước khi gọi tool
- Khi không chắc hoặc câu hỏi phức tạp: đề nghị khách liên hệ fanpage để được hỗ trợ trực tiếp

===CÁCH GỬI LINK===
Khi muốn gửi link cho khách, dùng định dạng markdown: [Tên hiển thị](URL)
Ví dụ: [👗 Xem Bộ Quần Áo](https://chysfashion.online/san-pham?category=bo_quan_ao)

Quan trọng: KHÔNG bao giờ chỉ gửi link đơn thuần. Luôn kèm lời giới thiệu tự nhiên trước và câu hỏi/gợi ý sau. Ví dụ khi khách hỏi "bộ quần áo":
"Bên mình có nhiều bộ quần áo đẹp lắm bạn ơi! 😊 Bạn tham khảo tại đây nhé:
[👗 Xem Bộ Quần Áo Nam](URL)
[👗 Xem Bộ Quần Áo Nữ](URL)
Bạn đang tìm cho nam hay nữ để mình tư vấn thêm nha?"`;

const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "lookup_order",
      description: "Tra cứu thông tin đơn hàng theo số điện thoại hoặc mã đơn.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Số điện thoại hoặc mã đơn hàng của khách" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Tìm kiếm sản phẩm cụ thể theo tên. Dùng khi khách hỏi về sản phẩm cụ thể, không dùng để tìm danh mục.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Tên sản phẩm cụ thể cần tìm" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_size_recommendation",
      description: "Tư vấn size cho khách dựa trên chiều cao, cân nặng và sản phẩm/loại sản phẩm. Chỉ gọi khi có đủ cả 3 thông tin: sản phẩm hoặc loại sản phẩm, chiều cao (cm), cân nặng (kg).",
      parameters: {
        type: "object",
        properties: {
          product_query: { type: "string", description: "Tên hoặc loại sản phẩm khách muốn mua (ví dụ: áo thun basic nam, quần tây, bộ quần áo)" },
          height: { type: "number", description: "Chiều cao khách (cm)" },
          weight: { type: "number", description: "Cân nặng khách (kg)" },
        },
        required: ["product_query", "height", "weight"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description: "Lấy danh sách danh mục sản phẩm kèm link. Dùng khi khách hỏi về loại sản phẩm (quần, áo, bộ, váy...) để gửi link danh mục cho khách chọn.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Từ khóa loại sản phẩm khách hỏi (ví dụ: quần, áo, bộ quần áo)" },
        },
        required: ["query"],
      },
    },
  },
];

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    moi: "🆕 Mới đặt",
    dang_xu_ly: "📦 Đang xử lý / giao hàng",
    da_giao: "✅ Đã giao thành công",
    da_huy: "❌ Đã hủy",
  };
  return map[status] ?? status;
}

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  const supabase = createPublicClient();

  if (name === "lookup_order") {
    const q = args.query.trim().replace(/\s/g, "");
    const isPhone = /^\d{9,11}$/.test(q);
    const { data } = await supabase
      .from("orders")
      .select("order_code, full_name, status, total, created_at, city")
      .or(isPhone ? `phone.eq.${q}` : `order_code.ilike.${q}`)
      .limit(5);

    if (!data || data.length === 0) {
      return "Không tìm thấy đơn hàng nào. Vui lòng kiểm tra lại số điện thoại hoặc mã đơn.";
    }
    return data
      .map(
        (o) =>
          `Mã đơn: ${o.order_code}\nTên: ${o.full_name}\nTrạng thái: ${statusLabel(o.status)}\nTổng tiền: ${Number(o.total).toLocaleString("vi-VN")}đ\nNgày đặt: ${new Date(o.created_at).toLocaleDateString("vi-VN")}`
      )
      .join("\n\n");
  }

  if (name === "search_products") {
    const { data } = await supabase
      .from("products")
      .select("name, price, colors, sizes, stock, category_label, slug")
      .ilike("name", `%${args.query}%`)
      .gt("stock", 0)
      .limit(5);

    if (!data || data.length === 0) {
      return "Không tìm thấy sản phẩm phù hợp.";
    }
    return data
      .map(
        (p) =>
          `${p.name} (${p.category_label})\nGiá: ${Number(p.price).toLocaleString("vi-VN")}đ\nMàu: ${(p.colors as string[])?.join(", ") || "Xem trên web"}\nSize: ${(p.sizes as string[])?.join(", ") || "Xem trên web"}\nLink: ${SITE_URL}/san-pham/${p.slug}`
      )
      .join("\n\n");
  }

  if (name === "get_size_recommendation") {
    const height = Number(args.height);
    const weight = Number(args.weight);
    const query = args.product_query;

    // Find product matching name or category label
    const { data: products } = await supabase
      .from("products")
      .select("name, sizes, size_chart_id, slug, category_label")
      .or(`name.ilike.%${query}%,category_label.ilike.%${query}%`)
      .gt("stock", 0)
      .limit(1);

    const product = products?.[0];
    if (!product) {
      return `Không tìm thấy sản phẩm phù hợp với "${query}". Bạn có thể xem tất cả sản phẩm tại ${SITE_URL}/san-pham`;
    }

    // Fetch size chart if assigned, otherwise use defaults
    let productChart: Record<string, Partial<SizeChartRow>> = {};
    let chartSource = "bảng size chung";

    if (product.size_chart_id) {
      const { data: chartData } = await supabase
        .from("size_charts")
        .select("name, data")
        .eq("id", product.size_chart_id)
        .single();
      if (chartData?.data) {
        productChart = chartData.data as Record<string, Partial<SizeChartRow>>;
        chartSource = `bảng size "${chartData.name}"`;
      }
    }

    const availableSizes = (product.sizes as string[]) ?? Object.keys(DEFAULT_SIZE_CHART);
    const recommended = recommendSize(height, weight, availableSizes, productChart);

    if (!recommended) {
      return `Không thể xác định size phù hợp cho sản phẩm "${product.name}". Vui lòng liên hệ fanpage để được tư vấn trực tiếp.`;
    }

    // Find adjacent size up for "if prefer looser" suggestion
    const idx = availableSizes.indexOf(recommended);
    const sizeUp = idx < availableSizes.length - 1 ? availableSizes[idx + 1] : null;

    const lines = [
      `Sản phẩm: ${product.name} (${product.category_label})`,
      `Chiều cao: ${height}cm | Cân nặng: ${weight}kg`,
      `Size gợi ý: ${recommended}`,
      sizeUp ? `Size lớn hơn (nếu thích rộng): ${sizeUp}` : null,
      `Link sản phẩm: ${SITE_URL}/san-pham/${product.slug}`,
      `Nguồn: ${chartSource}`,
    ].filter(Boolean);

    return lines.join("\n");
  }

  if (name === "get_categories") {
    const { data } = await supabase
      .from("categories")
      .select("value, label, gender")
      .or(`label.ilike.%${args.query}%,value.ilike.%${args.query}%`)
      .limit(6);

    // Fallback: nếu không tìm thấy khớp, trả về tất cả danh mục
    const { data: allCats } = !data || data.length === 0
      ? await supabase.from("categories").select("value, label, gender").limit(10)
      : { data: null };

    const cats = (data && data.length > 0 ? data : allCats) ?? [];

    if (cats.length === 0) {
      return `Bạn xem tất cả sản phẩm tại: ${SITE_URL}/san-pham`;
    }

    return cats
      .map((c) => {
        const genderLabel = c.gender === "nam" ? " (Nam)" : c.gender === "nu" ? " (Nữ)" : "";
        return `${c.label}${genderLabel}: ${SITE_URL}/san-pham?category=${c.value}`;
      })
      .join("\n");
  }

  return "Không thể thực hiện yêu cầu này.";
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json(
      { message: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 1 tiếng nhé!" },
      { status: 429 }
    );
  }

  let history: { role: string; content: string }[];
  try {
    const body = await req.json();
    history = body.messages;
    if (!Array.isArray(history) || history.length === 0) throw new Error();
  } catch {
    return Response.json({ message: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Agentic loop — max 5 iterations for tool use
  let current = messages;

  try {
    for (let i = 0; i < 5; i++) {
      // Try 70B first; fall back to fast 8B if unavailable/rate-limited
      const response = await groqChat(current).catch(() => groqChat(current, true));

      const msg = response.choices[0].message;
      const toolCalls = msg.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        const content = msg.content ?? "";
        // Guard: model printed tool call as text instead of executing it
        if (content.includes("<function=") || content.includes("</function>")) {
          return Response.json({ message: "Mình cần xử lý lại, bạn thử hỏi lại nhé! 🙏" });
        }
        return Response.json({
          message: content || "Xin lỗi bạn, mình không hiểu câu hỏi. Bạn thử hỏi lại nhé!",
        });
      }

      // Execute tools
      const toolResults: Groq.Chat.ChatCompletionMessageParam[] = await Promise.all(
        toolCalls.map(async (call) => {
          const args = JSON.parse(call.function.arguments) as Record<string, string>;
          const result = await executeTool(call.function.name, args);
          return {
            role: "tool" as const,
            tool_call_id: call.id,
            content: result,
          };
        })
      );

      current = [...current, msg, ...toolResults];
    }
  } catch (err) {
    console.error("[chat/route] error:", err);
    return Response.json(
      { message: "Mình đang bận tí, bạn thử lại sau vài giây nhé! 🙏" },
      { status: 200 }
    );
  }

  return Response.json({ message: "Xin lỗi bạn, mình gặp sự cố kỹ thuật. Vui lòng thử lại nhé!" });
}
