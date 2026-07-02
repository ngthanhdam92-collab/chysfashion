import { createPublicClient } from "./supabase/public";

export interface NavLink {
  id: string;
  label: string;
  href: string;
  position: number;
  parentId: string | null;
  children: NavLink[];
}

interface NavLinkRow {
  id: string;
  label: string;
  href: string;
  position: number;
  parent_id: string | null;
}

export async function getNavLinks(): Promise<NavLink[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("nav_links")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data) {
    console.error("getNavLinks error:", error?.message);
    return [];
  }

  const rows = data as NavLinkRow[];
  const nodes = new Map<string, NavLink>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        label: row.label,
        href: row.href,
        position: row.position,
        parentId: row.parent_id,
        children: [],
      },
    ])
  );

  const roots: NavLink[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    if (row.parent_id && nodes.has(row.parent_id)) {
      nodes.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
