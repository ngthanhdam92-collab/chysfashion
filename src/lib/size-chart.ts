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

  // Priority: height match
  let matched = effective.find(
    ({ row }) => height >= row.heightMin && height < row.heightMax
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
