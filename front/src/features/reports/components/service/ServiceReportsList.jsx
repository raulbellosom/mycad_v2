import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Wrench,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";
import { Select } from "../../../../shared/ui/Select";
import { ReportCardList } from "../common/ReportCard";
import {
  SERVICE_TYPE_OPTIONS,
  REPORT_STATUS,
  REPORT_STATUS_LABELS,
} from "../../constants/report.constants";

/**
 * Lista de reportes de servicio con filtros
 */
export function ServiceReportsList({
  reports = [],
  vehicles = [],
  isLoading = false,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onDownloadPDF,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    serviceType: "",
    vehicleId: "",
    dateRange: "",
  });

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = report.title?.toLowerCase().includes(query);
        const matchesDescription = report.description
          ?.toLowerCase()
          .includes(query);
        const matchesVendor = report.vendorName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesVendor) {
          return false;
        }
      }

      // Status filter
      if (filters.status && report.status !== filters.status) {
        return false;
      }

      // Service type filter
      if (filters.serviceType && report.serviceType !== filters.serviceType) {
        return false;
      }

      // Vehicle filter
      if (filters.vehicleId && report.vehicleId !== filters.vehicleId) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const reportDate = new Date(report.serviceDate);
        const now = new Date();
        switch (filters.dateRange) {
          case "today":
            if (reportDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            if (reportDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            if (reportDate < monthAgo) return false;
            break;
          case "year":
            const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
            if (reportDate < yearAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [reports, searchQuery, filters]);

  const clearFilters = () => {
    setFilters({
      status: "",
      serviceType: "",
      vehicleId: "",
      dateRange: "",
    });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.status ||
    filters.serviceType ||
    filters.vehicleId ||
    filters.dateRange ||
    searchQuery;

  // Vehicle options for filter
  const vehicleOptions = vehicles.map((v) => ({
    value: v.$id,
    label: [v.brand?.name || v.brandId, v.model?.name || v.modelId, v.plate]
      .filter(Boolean)
      .join(" - "),
  }));

  const statusOptions = [
    {
      value: REPORT_STATUS.DRAFT,
      label: REPORT_STATUS_LABELS[REPORT_STATUS.DRAFT],
    },
    {
      value: REPORT_STATUS.FINALIZED,
      label: REPORT_STATUS_LABELS[REPORT_STATUS.FINALIZED],
    },
  ];

  const dateRangeOptions = [
    { value: "today", label: "Hoy" },
    { value: "week", label: "Última semana" },
    { value: "month", label: "Último mes" },
    { value: "year", label: "Último año" },
  ];

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-fg)" />
          <Input
            placeholder="Buscar por título, descripción, taller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? "secondary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-(--brand)" />
          )}
        </Button>

        {/* Create new */}
        {canCreate && (
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Reporte</span>
          </Button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-(--card) rounded-xl border border-(--border)"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-(--fg)">Filtros</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-(--muted-fg) hover:text-(--fg)"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Estado"
              placeholder="Todos los estados"
              options={statusOptions}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            />
            <Select
              label="Tipo de Servicio"
              placeholder="Todos los tipos"
              options={SERVICE_TYPE_OPTIONS}
              value={filters.serviceType}
              onChange={(value) =>
                setFilters({ ...filters, serviceType: value })
              }
            />
            <Select
              label="Vehículo"
              placeholder="Todos los vehículos"
              options={vehicleOptions}
              value={filters.vehicleId}
              onChange={(value) => setFilters({ ...filters, vehicleId: value })}
            />
            <Select
              label="Período"
              placeholder="Cualquier fecha"
              options={dateRangeOptions}
              value={filters.dateRange}
              onChange={(value) => setFilters({ ...filters, dateRange: value })}
            />
          </div>
        </motion.div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-(--muted-fg)">
        <span>
          {filteredReports.length} de {reports.length} reportes
        </span>
        {hasActiveFilters && (
          <span className="text-(--brand)">Filtros activos</span>
        )}
      </div>

      {/* Reports list */}
      <ReportCardList
        reports={filteredReports}
        type="service"
        vehicles={vehicles}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onDownloadPDF={onDownloadPDF}
        canEdit={canEdit}
        canDelete={canDelete}
        isLoading={isLoading}
        emptyMessage={
          hasActiveFilters
            ? "No hay reportes que coincidan con los filtros"
            : "No hay reportes de servicio"
        }
      />
    </div>
  );
}
