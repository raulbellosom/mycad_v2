import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  RefreshCw,
  LayoutGrid,
  List,
  Download,
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
} from "lucide-react";

import { useAuditLogs, useAuditStats } from "../hooks/useAuditLogs";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import {
  AUDIT_ACTIONS,
  ACTION_LABELS,
  ACTION_COLORS,
} from "../services/audit.service";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Badge } from "../../../shared/ui/Badge";

import {
  AuditLogCard,
  AuditLogTableRow,
  AuditLogCardSkeleton,
  AuditLogTableSkeleton,
} from "../components/AuditLogItem";
import { AuditLogDetailModal } from "../components/AuditLogDetailModal";
import { AuditFilters } from "../components/AuditFilters";
import { AuditPagination } from "../components/AuditPagination";
import { cn } from "../../../shared/utils/cn";

const VIEW_MODES = {
  GRID: "grid",
  TABLE: "table",
};

const PAGE_SIZE = 25;

export function AuditLogsPage() {
  const { activeGroupId } = useActiveGroup();

  // Estado de la UI
  const [viewMode, setViewMode] = useState(VIEW_MODES.TABLE);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    action: "all",
    entityType: "all",
    profileId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Query de logs
  const {
    data: logsData,
    isLoading,
    isRefetching,
    refetch,
  } = useAuditLogs(activeGroupId, {
    ...filters,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  // Query de estadísticas
  const { data: stats } = useAuditStats(activeGroupId, 7);

  const logs = logsData?.documents || [];
  const totalItems = logsData?.total || 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  // Handlers
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset a primera página al cambiar filtros
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    // TODO: Implementar exportación a CSV
    console.log("Exportar logs...");
  };

  // Sin grupo seleccionado
  if (!activeGroupId) {
    return (
      <PageLayout.Empty
        icon={History}
        title="Selecciona un grupo"
        description="Para ver el historial de auditoría, primero selecciona un grupo."
      />
    );
  }

  return (
    <PageLayout
      title="Auditoría"
      subtitle="Historial de actividad del sistema"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="hidden sm:flex"
          >
            <RefreshCw
              size={16}
              className={cn("mr-2", isRefetching && "animate-spin")}
            />
            Actualizar
          </Button>
        </div>
      }
    >
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <StatsCard
          icon={Activity}
          label="Total de eventos"
          value={stats?.total || 0}
          color="brand"
        />
        <StatsCard
          icon={TrendingUp}
          label="Creaciones"
          value={stats?.byAction?.[AUDIT_ACTIONS.CREATE] || 0}
          color="success"
        />
        <StatsCard
          icon={Clock}
          label="Actualizaciones"
          value={stats?.byAction?.[AUDIT_ACTIONS.UPDATE] || 0}
          color="info"
        />
        <StatsCard
          icon={AlertCircle}
          label="Eliminaciones"
          value={stats?.byAction?.[AUDIT_ACTIONS.DELETE] || 0}
          color="danger"
        />
      </div>

      {/* Filtros */}
      <AuditFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        className="mb-6"
      />

      {/* Controles de vista */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-(--muted-fg)">
          {totalItems} {totalItems === 1 ? "registro" : "registros"} encontrados
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(VIEW_MODES.TABLE)}
            className={cn(
              "hidden lg:flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              viewMode === VIEW_MODES.TABLE
                ? "bg-(--brand)/10 text-(--brand)"
                : "text-(--muted-fg) hover:bg-(--muted)/50"
            )}
            title="Vista de tabla"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.GRID)}
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-lg transition-colors",
              viewMode === VIEW_MODES.GRID
                ? "bg-(--brand)/10 text-(--brand)"
                : "text-(--muted-fg) hover:bg-(--muted)/50"
            )}
            title="Vista de tarjetas"
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        viewMode === VIEW_MODES.TABLE ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-(--border) bg-(--muted)/30">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AuditLogTableSkeleton rows={10} />
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AuditLogCardSkeleton key={i} />
            ))}
          </div>
        )
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin registros de auditoría"
          description={
            filters.action !== "all" ||
            filters.entityType !== "all" ||
            filters.startDate ||
            filters.endDate ||
            filters.search
              ? "No se encontraron registros con los filtros seleccionados."
              : "Aún no hay actividad registrada en este grupo."
          }
        />
      ) : viewMode === VIEW_MODES.TABLE ? (
        /* Vista de tabla - solo desktop */
        <Card className="overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--border) bg-(--muted)/30">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                    Acción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-(--muted-fg)">
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {logs.map((log) => (
                    <AuditLogTableRow
                      key={log.$id}
                      log={log}
                      onClick={() => handleLogClick(log)}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {/* Vista de tarjetas - siempre visible en mobile, condicional en desktop */}
      {!isLoading && logs.length > 0 && (
        <div
          className={cn(
            "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
            viewMode === VIEW_MODES.TABLE && "lg:hidden"
          )}
        >
          <AnimatePresence mode="popLayout">
            {logs.map((log) => (
              <AuditLogCard
                key={log.$id}
                log={log}
                onClick={() => handleLogClick(log)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Paginación */}
      {!isLoading && logs.length > 0 && (
        <AuditPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          className="mt-6"
        />
      )}

      {/* Modal de detalle */}
      <AuditLogDetailModal
        log={selectedLog}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
      />
    </PageLayout>
  );
}

// ============================================
// Componente de tarjeta de estadísticas
// ============================================

function StatsCard({ icon: Icon, label, value, color = "brand" }) {
  const colorClasses = {
    brand: "bg-(--brand)/10 text-(--brand)",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    danger: "bg-red-500/10 text-red-600 dark:text-red-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            colorClasses[color]
          )}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-(--fg)">{value}</p>
          <p className="text-xs text-(--muted-fg) truncate">{label}</p>
        </div>
      </div>
    </Card>
  );
}
