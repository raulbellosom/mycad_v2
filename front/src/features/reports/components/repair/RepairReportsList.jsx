import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  ChevronDown,
  X,
  Calendar,
  Hammer,
} from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { Select } from "../../../../shared/ui/Select";
import { EmptyState } from "../../../../shared/ui/EmptyState";
import { ReportCard } from "../common/ReportCard";
import {
  REPAIR_STATUS,
  REPAIR_STATUS_OPTIONS,
  REPAIR_STATUS_LABELS,
  REPAIR_PRIORITY,
  REPAIR_PRIORITY_OPTIONS,
  DAMAGE_TYPE_OPTIONS,
} from "../../constants/report.constants";

/**
 * Lista de reportes de reparación con búsqueda y filtros
 */
export function RepairReportsList({
  reports = [],
  vehicles = [],
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onDownloadPdf,
  isLoading = false,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    damageType: "",
    vehicleId: "",
    dateFrom: "",
    dateTo: "",
  });

  // Crear opciones de vehículos para el filtro
  const vehicleOptions = useMemo(() => {
    return [
      { value: "", label: "Todos los vehículos" },
      ...vehicles.map((v) => ({
        value: v.$id,
        label: `${v.brand || ""} ${v.model || ""} - ${
          v.licensePlate || v.serialNumber || ""
        }`.trim(),
      })),
    ];
  }, [vehicles]);

  // Reportes filtrados
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Búsqueda por texto
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const vehicle = vehicles.find((v) => v.$id === report.vehicleId);
        const vehicleStr = vehicle
          ? `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`.toLowerCase()
          : "";
        const titleStr = (report.title || "").toLowerCase();
        const workshopStr = (report.workshopName || "").toLowerCase();

        if (
          !titleStr.includes(search) &&
          !vehicleStr.includes(search) &&
          !workshopStr.includes(search)
        ) {
          return false;
        }
      }

      // Filtro por estado
      if (filters.status && report.status !== filters.status) {
        return false;
      }

      // Filtro por prioridad
      if (filters.priority && report.priority !== filters.priority) {
        return false;
      }

      // Filtro por tipo de daño
      if (filters.damageType && report.damageType !== filters.damageType) {
        return false;
      }

      // Filtro por vehículo
      if (filters.vehicleId && report.vehicleId !== filters.vehicleId) {
        return false;
      }

      // Filtro por fecha
      if (filters.dateFrom) {
        const reportDate = new Date(report.reportDate);
        const fromDate = new Date(filters.dateFrom);
        if (reportDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const reportDate = new Date(report.reportDate);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (reportDate > toDate) return false;
      }

      return true;
    });
  }, [reports, searchTerm, filters, vehicles]);

  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      damageType: "",
      vehicleId: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchTerm("");
  };

  const hasActiveFilters =
    searchTerm || Object.values(filters).some((v) => v !== "");

  // Agrupar por estado para mostrar contadores
  const statusCounts = useMemo(() => {
    return reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});
  }, [reports]);

  return (
    <div className="space-y-4">
      {/* Header con búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-fg)" />
          <input
            type="text"
            placeholder="Buscar por título, vehículo o taller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-(--border) bg-(--card) text-(--fg) placeholder:text-(--muted-fg) focus:outline-none focus:ring-2 focus:ring-(--brand)"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-(--brand) text-white rounded-full">
                !
              </span>
            )}
          </Button>
          {canCreate && (
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Reporte</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-(--fg)">Filtros avanzados</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Select
                label="Estado"
                options={[
                  { value: "", label: "Todos" },
                  ...REPAIR_STATUS_OPTIONS,
                ]}
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
              />
              <Select
                label="Prioridad"
                options={[
                  { value: "", label: "Todas" },
                  ...REPAIR_PRIORITY_OPTIONS,
                ]}
                value={filters.priority}
                onChange={(value) =>
                  setFilters({ ...filters, priority: value })
                }
              />
              <Select
                label="Tipo de Daño"
                options={[
                  { value: "", label: "Todos" },
                  ...DAMAGE_TYPE_OPTIONS,
                ]}
                value={filters.damageType}
                onChange={(value) =>
                  setFilters({ ...filters, damageType: value })
                }
              />
              <Select
                label="Vehículo"
                options={vehicleOptions}
                value={filters.vehicleId}
                onChange={(value) =>
                  setFilters({ ...filters, vehicleId: value })
                }
              />
              <Input
                type="date"
                label="Fecha desde"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dateFrom: e.target.value })
                }
              />
              <Input
                type="date"
                label="Fecha hasta"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dateTo: e.target.value })
                }
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <StatusPill
          label="Todos"
          count={reports.length}
          active={!filters.status}
          onClick={() => setFilters({ ...filters, status: "" })}
        />
        {Object.entries(REPAIR_STATUS).map(([key, value]) => (
          <StatusPill
            key={value}
            label={REPAIR_STATUS_LABELS[value]}
            count={statusCounts[value] || 0}
            active={filters.status === value}
            onClick={() =>
              setFilters({
                ...filters,
                status: filters.status === value ? "" : value,
              })
            }
            status={value}
          />
        ))}
      </div>

      {/* Resultados */}
      <div className="text-sm text-(--muted-fg)">
        Mostrando {filteredReports.length} de {reports.length} reportes
      </div>

      {/* Lista de reportes */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          icon={Hammer}
          title="No hay reportes de reparación"
          description={
            hasActiveFilters
              ? "No se encontraron reportes con los filtros aplicados"
              : "Crea tu primer reporte de reparación para comenzar"
          }
          action={
            !hasActiveFilters && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Reporte
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {filteredReports.map((report) => {
            const vehicle = vehicles.find((v) => v.$id === report.vehicleId);
            return (
              <motion.div
                key={report.$id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ReportCard
                  report={report}
                  vehicle={vehicle}
                  type="repair"
                  onView={() => onView?.(report.$id)}
                  onEdit={() => onEdit?.(report.$id)}
                  onDelete={() => onDelete?.(report.$id)}
                  onDownloadPdf={() => onDownloadPdf?.(report.$id)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Pill de estado para filtrar rápido
 */
function StatusPill({ label, count, active, onClick, status }) {
  const getStatusColor = () => {
    if (!status) return "";
    switch (status) {
      case REPAIR_STATUS.OPEN:
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case REPAIR_STATUS.IN_PROGRESS:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case REPAIR_STATUS.DONE:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case REPAIR_STATUS.CANCELED:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${
          active
            ? status
              ? getStatusColor()
              : "bg-(--brand) text-white"
            : "bg-(--muted) text-(--muted-fg) hover:bg-(--muted)/80"
        }
      `}
    >
      {label}
      <span
        className={`
        ml-1.5 px-1.5 py-0.5 text-xs rounded-full
        ${active ? "bg-white/20" : "bg-(--card)"}
      `}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * Skeleton de carga
 */
function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-(--muted) rounded-full" />
              <div className="h-5 w-20 bg-(--muted) rounded-full" />
            </div>
            <div className="h-6 w-3/4 bg-(--muted) rounded" />
            <div className="h-4 w-1/2 bg-(--muted) rounded" />
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-(--muted) rounded" />
              <div className="h-4 w-20 bg-(--muted) rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
