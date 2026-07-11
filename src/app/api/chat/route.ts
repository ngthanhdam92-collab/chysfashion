import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
- Khi khách hỏi sản phẩm/size/màu sắc: dùng tool search_products
- Khi tư vấn size: hỏi chiều cao và cân nặng để gợi ý chính xác hơn
- Khi không chắc hoặc câu hỏi phức tạp: đề nghị khách liên hệ fanpage để được hỗ trợ trực tiếp`;

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
      description: "Tìm kiếm sản phẩm theo tên, loại hoặc từ khóa.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Từ khóa tìm kiếm sản phẩm" },
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
      .select("name, price, colors, sizes, stock, category_label")
      .or(`name.ilike.%${args.query}%,category_label.ilike.%${args.query}%`)
      .gt("stock", 0)
      .limit(5);

    if (!data || data.length === 0) {
      return "Không tìm thấy sản phẩm phù hợp. Bạn có thể xem toàn bộ sản phẩm tại trang chủ nhé!";
    }
    return data
      .map(
        (p) =>
          `${p.name} (${p.category_label})\nGiá: ${Number(p.price).toLocaleString("vi-VN")}đ\nMàu: ${(p.colors as string[])?.join(", ") || "Xem trên web"}\nSize: ${(p.sizes as string[])?.join(", ") || "Xem trên web"}`
      )
      .join("\n\n");
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

  for (let i = 0; i < 5; i++) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: current,
      tools: TOOLS,
      tool_choice: "auto",
      max_tokens: 1024,
    });

    const msg = response.choices[0].message;
    const toolCalls = msg.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return Response.json({
        message: msg.content || "Xin lỗi bạn, mình không hiểu câu hỏi. Bạn thử hỏi lại nhé!",
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

  return Response.json({ message: "Xin lỗi bạn, mình gặp sự cố kỹ thuật. Vui lòng thử lại nhé!" });
}
