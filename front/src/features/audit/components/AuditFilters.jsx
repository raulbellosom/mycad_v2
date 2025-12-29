import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  X,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
} from "../services/audit.service";
import { cn } from "../../../shared/utils/cn";

/**
 * Barra de filtros para los logs de auditoría
 */
export function AuditFilters({
  filters,
  onFiltersChange,
  users = [],
  className,
}) {
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Actualizar filtros locales cuando cambian los props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setShowFiltersPanel(false);
  };

  const handleClearFilters = () => {
    const cleared = {
      action: "all",
      entityType: "all",
      profileId: "",
      startDate: "",
      endDate: "",
      search: "",
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setShowFiltersPanel(false);
  };

  const activeFiltersCount = [
    filters.action !== "all" && filters.action,
    filters.entityType !== "all" && filters.entityType,
    filters.profileId,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Barra principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por descripción..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className={cn(
              "h-10 w-full rounded-xl border border-(--border) bg-(--bg)",
              "pl-10 pr-4 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20",
              "outline-none transition-all placeholder:text-(--muted-fg)"
            )}
          />
        </div>

        {/* Botón de filtros */}
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl border px-4",
            "text-sm font-medium transition-all",
            showFiltersPanel || activeFiltersCount > 0
              ? "border-(--brand) bg-(--brand)/10 text-(--brand)"
              : "border-(--border) bg-(--bg) text-(--fg) hover:border-(--brand)/50"
          )}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--brand) text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel de filtros expandible */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-(--border) bg-(--card) p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Filtro por acción */}
                <FilterSelect
                  label="Acción"
                  value={localFilters.action || "all"}
                  onChange={(v) =>
                    setLocalFilters({ ...localFilters, action: v })
                  }
                  options={[
                    { value: "all", label: "Todas las acciones" },
                    ...Object.entries(AUDIT_ACTIONS).map(([key, value]) => ({
                      value,
                      label: ACTION_LABELS[value] || key,
                    })),
                  ]}
                />

                {/* Filtro por tipo de entidad */}
                <FilterSelect
                  label="Tipo de recurso"
                  value={localFilters.entityType || "all"}
                  onChange={(v) =>
                    setLocalFilters({ ...localFilters, entityType: v })
                  }
                  options={[
                    { value: "all", label: "Todos los tipos" },
                    ...Object.entries(ENTITY_TYPES).map(([key, value]) => ({
                      value,
                      label: ENTITY_TYPE_LABELS[value] || key,
                    })),
                  ]}
                />

                {/* Fecha inicio */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--muted-fg)">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={localFilters.startDate || ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        startDate: e.target.value,
                      })
                    }
                    className={cn(
                      "h-10 w-full rounded-xl border border-(--border) bg-(--bg)",
                      "px-3 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20",
                      "outline-none transition-all"
                    )}
                  />
                </div>

                {/* Fecha fin */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--muted-fg)">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={localFilters.endDate || ""}
                    onChange={(e) =>
                      setLocalFilters({
                        ...localFilters,
                        endDate: e.target.value,
                      })
                    }
                    className={cn(
                      "h-10 w-full rounded-xl border border-(--border) bg-(--bg)",
                      "px-3 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20",
                      "outline-none transition-all"
                    )}
                  />
                </div>
              </div>

              {/* Acciones del panel */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-(--border) pt-4">
                <button
                  onClick={handleClearFilters}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium",
                    "text-(--muted-fg) transition-colors hover:text-(--fg)"
                  )}
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={handleApplyFilters}
                  className={cn(
                    "rounded-lg bg-(--brand) px-4 py-2 text-sm font-medium text-white",
                    "transition-colors hover:bg-(--brand-hover)"
                  )}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chips de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-(--muted-fg)">Filtros activos:</span>

          {filters.action && filters.action !== "all" && (
            <FilterChip
              label={`Acción: ${ACTION_LABELS[filters.action]}`}
              onRemove={() => onFiltersChange({ ...filters, action: "all" })}
            />
          )}

          {filters.entityType && filters.entityType !== "all" && (
            <FilterChip
              label={`Tipo: ${ENTITY_TYPE_LABELS[filters.entityType]}`}
              onRemove={() =>
                onFiltersChange({ ...filters, entityType: "all" })
              }
            />
          )}

          {filters.startDate && (
            <FilterChip
              label={`Desde: ${filters.startDate}`}
              onRemove={() => onFiltersChange({ ...filters, startDate: "" })}
            />
          )}

          {filters.endDate && (
            <FilterChip
              label={`Hasta: ${filters.endDate}`}
              onRemove={() => onFiltersChange({ ...filters, endDate: "" })}
            />
          )}

          <button
            onClick={handleClearFilters}
            className="text-xs text-(--brand) hover:underline"
          >
            Limpiar todos
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Componentes auxiliares
// ============================================

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-(--muted-fg)">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full rounded-xl border border-(--border) bg-(--bg)",
          "px-3 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20",
          "outline-none transition-all"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full",
        "bg-(--brand)/10 px-3 py-1 text-xs font-medium text-(--brand)"
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-(--brand)/20"
      >
        <X size={12} />
      </button>
    </span>
  );
}
