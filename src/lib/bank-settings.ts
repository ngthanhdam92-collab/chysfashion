import { createPublicClient } from "./supabase/public";

export interface BankSettings {
  enabled: boolean;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

const DEFAULT: BankSettings = {
  enabled: false,
  bankCode: "MB",
  accountNumber: "",
  accountName: "",
};

function parse(raw: unknown): BankSettings {
  if (!raw || typeof raw !== "object") return DEFAULT;
  const d = raw as Record<string, unknown>;
  return {
    enabled: d.enabled === true,
    bankCode: typeof d.bankCode === "string" && d.bankCode ? d.bankCode : "MB",
    accountNumber: typeof d.accountNumber === "string" ? d.accountNumber : "",
    accountName: typeof d.accountName === "string" ? d.accountName : "",
  };
}

export async function getBankSettings(): Promise<BankSettings> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("homepage_settings")
    .select("value")
    .eq("key", "bank_settings")
    .maybeSingle();
  return parse(data?.value);
}

export function buildVietQrUrl(
  settings: BankSettings,
  amount: number,
  addInfo: string
): string {
  const base = `https://img.vietqr.io/image/${settings.bankCode}-${settings.accountNumber}-compact2.png`;
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo,
    accountName: settings.accountName,
  });
  return `${base}?${params.toString()}`;
}
