export interface SizeChartRow {
  heightMin: number;
  heightMax: number;
  weightMin: number;
  weightMax: number;
  bodyLength: number;
  chest: number;
  sleeveLength: number;
  bicep: number;
  cuff: number;
  neck: number;
}

// ── Dynamic column format ─────────────────────────────────────────────────────

export interface SizeChartColumn {
  key: string;
  label: string;
  unit?: string;
}

export interface SizeChartData {
  columns: SizeChartColumn[];
  rows: Record<string, Record<string, number>>;
}

export const DEFAULT_COLUMNS: SizeChartColumn[] = [
  { key: "heightMin",    label: "Cao min",     unit: "cm" },
  { key: "heightMax",    label: "Cao max",     unit: "cm" },
  { key: "weightMin",    label: "Nặng min",    unit: "kg" },
  { key: "weightMax",    label: "Nặng max",    unit: "kg" },
  { key: "bodyLength",   label: "Dài thân",    unit: "cm" },
  { key: "chest",        label: "½ Ngực",      unit: "cm" },
  { key: "sleeveLength", label: "Dài tay",     unit: "cm" },
  { key: "bicep",        label: "Bắp tay",     unit: "cm" },
  { key: "cuff",         label: "Cửa tay",     unit: "cm" },
  { key: "neck",         label: "Ngang cổ",    unit: "cm" },
];

export const COLUMN_PRESETS: Record<string, SizeChartColumn[]> = {
  "Áo thun / sơ mi": [
    { key: "heightMin",    label: "Cao min",     unit: "cm" },
    { key: "heightMax",    label: "Cao max",     unit: "cm" },
    { key: "weightMin",    label: "Nặng min",    unit: "kg" },
    { key: "weightMax",    label: "Nặng max",    unit: "kg" },
    { key: "bodyLength",   label: "Dài thân",    unit: "cm" },
    { key: "chest",        label: "½ Ngực",      unit: "cm" },
    { key: "sleeveLength", label: "Dài tay",     unit: "cm" },
    { key: "bicep",        label: "Bắp tay",     unit: "cm" },
    { key: "neck",         label: "Ngang cổ",    unit: "cm" },
  ],
  "Quần / shorts": [
    { key: "heightMin",    label: "Cao min",     unit: "cm" },
    { key: "heightMax",    label: "Cao max",     unit: "cm" },
    { key: "weightMin",    label: "Nặng min",    unit: "kg" },
    { key: "weightMax",    label: "Nặng max",    unit: "kg" },
    { key: "waist",        label: "Vòng eo",     unit: "cm" },
    { key: "hip",          label: "Vòng mông",   unit: "cm" },
    { key: "inseam",       label: "Dài trong",   unit: "cm" },
    { key: "totalLength",  label: "Dài tổng",    unit: "cm" },
  ],
  "Đầm / váy": [
    { key: "heightMin",    label: "Cao min",     unit: "cm" },
    { key: "heightMax",    label: "Cao max",     unit: "cm" },
    { key: "weightMin",    label: "Nặng min",    unit: "kg" },
    { key: "weightMax",    label: "Nặng max",    unit: "kg" },
    { key: "bust",         label: "Vòng ngực",   unit: "cm" },
    { key: "waist",        label: "Vòng eo",     unit: "cm" },
    { key: "hip",          label: "Vòng mông",   unit: "cm" },
    { key: "dressLength",  label: "Dài đầm",     unit: "cm" },
  ],
  "Áo khoác / vest": [
    { key: "heightMin",    label: "Cao min",     unit: "cm" },
    { key: "heightMax",    label: "Cao max",     unit: "cm" },
    { key: "weightMin",    label: "Nặng min",    unit: "kg" },
    { key: "weightMax",    label: "Nặng max",    unit: "kg" },
    { key: "shoulder",     label: "Ngang vai",   unit: "cm" },
    { key: "chest",        label: "½ Ngực",      unit: "cm" },
    { key: "bodyLength",   label: "Dài thân",    unit: "cm" },
    { key: "sleeveLength", label: "Dài tay",     unit: "cm" },
  ],
};

// Parse raw DB data — handles both old fixed format and new dynamic format
export function parseSizeChartData(raw: Record<string, unknown>): SizeChartData {
  if (Array.isArray(raw.columns) && raw.rows && typeof raw.rows === "object") {
    return {
      columns: raw.columns as SizeChartColumn[],
      rows: raw.rows as Record<string, Record<string, number>>,
    };
  }
  // Legacy format: top-level keys are size names
  const rows: Record<string, Record<string, number>> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      rows[k] = v as Record<string, number>;
    }
  }
  return { columns: DEFAULT_COLUMNS, rows };
}

export function recommendSizeFromData(
  height: number,
  weight: number,
  availableSizes: string[],
  data: SizeChartData
): string | null {
  const { columns, rows } = data;
  const hasHeightMin = columns.some((c) => c.key === "heightMin");
  const hasHeightMax = columns.some((c) => c.key === "heightMax");
  if (!hasHeightMin || !hasHeightMax) return null;

  const available = availableSizes.filter((s) => rows[s]);
  if (available.length === 0) return null;

  let matched = available.find((s) => {
    const r = rows[s];
    return height >= (r.heightMin ?? 0) && height <= (r.heightMax ?? 9999);
  });

  if (!matched) {
    matched =
      height < (rows[available[0]]?.heightMin ?? 0)
        ? available[0]
        : available[available.length - 1];
  }

  const hasWeightMax = columns.some((c) => c.key === "weightMax");
  if (matched && hasWeightMax) {
    const row = rows[matched];
    if (weight > (row?.weightMax ?? 9999)) {
      const idx = available.indexOf(matched);
      if (idx < available.length - 1) matched = available[idx + 1];
    }
  }

  return matched ?? null;
}

// Default chart — used as fallback when product has no custom chart
export const DEFAULT_SIZE_CHART: Record<string, SizeChartRow> = {
  XS:    { heightMin: 145, heightMax: 155, weightMin: 40, weightMax: 48,  bodyLength: 63, chest: 45, sleeveLength: 33,   bicep: 18.2, cuff: 15,   neck: 14.5 },
  S:     { heightMin: 155, heightMax: 160, weightMin: 48, weightMax: 55,  bodyLength: 65, chest: 47, sleeveLength: 34.5, bicep: 19.6, cuff: 16,   neck: 16   },
  M:     { heightMin: 160, heightMax: 165, weightMin: 55, weightMax: 62,  bodyLength: 67, chest: 49, sleeveLength: 36,   bicep: 20.4, cuff: 16.5, neck: 15.5 },
  L:     { heightMin: 165, heightMax: 172, weightMin: 62, weightMax: 69,  bodyLength: 69, chest: 51, sleeveLength: 37,   bicep: 21.2, cuff: 17,   neck: 15   },
  XL:    { heightMin: 172, heightMax: 177, weightMin: 69, weightMax: 76,  bodyLength: 71, chest: 53, sleeveLength: 39,   bicep: 22,   cuff: 17,   neck: 16.5 },
  "2XL": { heightMin: 177, heightMax: 183, weightMin: 76, weightMax: 85,  bodyLength: 73, chest: 55, sleeveLength: 40.5, bicep: 22.8, cuff: 18,   neck: 17   },
  "3XL": { heightMin: 183, heightMax: 195, weightMin: 85, weightMax: 100, bodyLength: 75, chest: 57, sleeveLength: 42,   bicep: 24,   cuff: 19,   neck: 17.5 },
};

export function mergeWithDefault(
  productChart: Record<string, Partial<SizeChartRow>>,
  size: string
): SizeChartRow {
  const def = DEFAULT_SIZE_CHART[size] ?? DEFAULT_SIZE_CHART["M"];
  return { ...def, ...(productChart[size] ?? {}) };
}

export function recommendSize(
  height: number,
  weight: number,
  availableSizes: string[],
  productChart: Record<string, Partial<SizeChartRow>>
): string | null {
  const available = availableSizes.filter(
    (s) => DEFAULT_SIZE_CHART[s] || productChart[s]
  );
  if (available.length === 0) return null;

  // Build effective chart for available sizes
  const effective = available.map((s) => ({
    size: s,
    row: mergeWithDefault(productChart, s),
  }));

  // Priority: height match (inclusive upper bound so boundary values like 165 match M not fall through)
  let matched = effective.find(
    ({ row }) => height >= row.heightMin && height <= row.heightMax
  );

  // Clamp to edges if outside all ranges
  if (!matched) {
    matched =
      height < effective[0].row.heightMin
        ? effective[0]
        : effective[effective.length - 1];
  }

  // If weight exceeds matched size's max, go up one size
  if (weight > matched.row.weightMax) {
    const idx = effective.indexOf(matched);
    if (idx < effective.length - 1) matched = effective[idx + 1];
  }

  return matched.size;
}
