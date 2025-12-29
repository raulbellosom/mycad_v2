import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "../../../shared/utils/cn";

/**
 * Componente de paginación responsive
 */
export function AuditPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar array de páginas a mostrar
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5; // Páginas visibles a cada lado del current
    const half = Math.floor(showPages / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    // Ajustar si estamos cerca del inicio o final
    if (currentPage <= half) {
      end = Math.min(totalPages, showPages);
    }
    if (currentPage > totalPages - half) {
      start = Math.max(1, totalPages - showPages + 1);
    }

    // Agregar primera página y ellipsis si necesario
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("ellipsis-start");
    }

    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Agregar ellipsis y última página si necesario
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis-end");
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 sm:flex-row",
        className
      )}
    >
      {/* Info de resultados */}
      <p className="text-sm text-(--muted-fg)">
        Mostrando <span className="font-medium text-(--fg)">{startItem}</span> a{" "}
        <span className="font-medium text-(--fg)">{endItem}</span> de{" "}
        <span className="font-medium text-(--fg)">{totalItems}</span> registros
      </p>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            "border border-(--border) transition-colors",
            currentPage === 1
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-(--muted)/50 hover:border-(--brand)/30"
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Números de página - solo en desktop */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, idx) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <span
                  key={page}
                  className="flex h-9 w-9 items-center justify-center text-(--muted-fg)"
                >
                  <MoreHorizontal size={16} />
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  "flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2",
                  "text-sm font-medium transition-colors",
                  page === currentPage
                    ? "bg-(--brand) text-white"
                    : "border border-(--border) hover:bg-(--muted)/50 hover:border-(--brand)/30"
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Indicador de página en mobile */}
        <span className="flex sm:hidden items-center px-3 text-sm text-(--muted-fg)">
          Página{" "}
          <span className="mx-1 font-medium text-(--fg)">{currentPage}</span> de{" "}
          <span className="mx-1 font-medium text-(--fg)">{totalPages}</span>
        </span>

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            "border border-(--border) transition-colors",
            currentPage === totalPages
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-(--muted)/50 hover:border-(--brand)/30"
          )}
          aria-label="Página siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
