import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string>;
}

function buildUrl(basePath: string, searchParams: Record<string, string>, page: number): string {
  const params = new URLSearchParams(searchParams);
  if (page === 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export function Pagination({ currentPage, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const paramsWithoutPage = Object.fromEntries(
    Object.entries(searchParams).filter(([k]) => k !== "page")
  );

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(basePath, paramsWithoutPage, currentPage - 1)}
          className="flex h-9 w-9 items-center justify-center border border-line text-ink hover:border-ink transition-colors"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center border border-line text-muted/40 cursor-not-allowed">
          <ChevronLeft size={16} />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted">
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="flex h-9 w-9 items-center justify-center bg-ink text-sm text-paper"
            aria-current="page"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(basePath, paramsWithoutPage, p)}
            className="flex h-9 w-9 items-center justify-center border border-line text-sm text-ink hover:border-ink transition-colors"
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(basePath, paramsWithoutPage, currentPage + 1)}
          className="flex h-9 w-9 items-center justify-center border border-line text-ink hover:border-ink transition-colors"
          aria-label="Trang sau"
        >
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center border border-line text-muted/40 cursor-not-allowed">
          <ChevronRight size={16} />
        </span>
      )}
    </div>
  );
}
