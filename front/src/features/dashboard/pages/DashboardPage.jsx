import { useMemo } from "react";
import {
  Car,
  Users,
  UserCheck,
  Wrench,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";

// Dashboard hooks
import {
  useDashboardSummary,
  useVehiclesByStatus,
  useVehiclesByBrand,
  useServiceReportsByMonth,
  useRepairReportsByMonth,
  useRecentVehicles,
  useRecentServiceReports,
  usePendingRepairs,
  useVehiclesInMaintenance,
  useExpiringLicenses,
} from "../hooks/useDashboard";

// Dashboard components
import { StatCard, StatGrid, MiniStatCard } from "../components/StatCard";
import { DonutChart } from "../components/DonutChart";
import { HorizontalBarChart, VerticalBarChart } from "../components/BarCharts";
import { ComboTrendChart } from "../components/TrendChart";
import {
  DefaultQuickActions,
  ModulesOverview,
} from "../components/QuickActions";
import {
  RecentVehiclesList,
  RecentServicesList,
  PendingRepairsList,
  ExpiringLicensesList,
  VehiclesInMaintenanceList,
} from "../components/ActivityLists";
import { SimpleDashboard } from "../components/SimpleDashboard";

export function DashboardPage() {
  const { activeGroup, activeGroupId } = useActiveGroup();
  const { can, isLoading: permissionsLoading } = usePermissions();

  // Check if user has permission to view full dashboard
  const canViewFullDashboard = can(SYSTEM_PERMISSIONS.DASHBOARD_VIEW);

  // Main summary data
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useDashboardSummary(activeGroupId);

  // Chart data
  const { data: vehiclesByStatus, isLoading: statusLoading } =
    useVehiclesByStatus(activeGroupId);
  const { data: vehiclesByBrand, isLoading: brandLoading } =
    useVehiclesByBrand(activeGroupId);
  const { data: serviceByMonth, isLoading: serviceMonthLoading } =
    useServiceReportsByMonth(activeGroupId);
  const { data: repairByMonth, isLoading: repairMonthLoading } =
    useRepairReportsByMonth(activeGroupId);

  // Lists data
  const { data: recentVehicles, isLoading: recentVehiclesLoading } =
    useRecentVehicles(activeGroupId, 5);
  const { data: recentServices, isLoading: recentServicesLoading } =
    useRecentServiceReports(activeGroupId, 5);
  const { data: pendingRepairs, isLoading: pendingRepairsLoading } =
    usePendingRepairs(activeGroupId, 5);
  const { data: maintenanceVehicles, isLoading: maintenanceLoading } =
    useVehiclesInMaintenance(activeGroupId);
  const { data: expiringLicenses, isLoading: licensesLoading } =
    useExpiringLicenses(activeGroupId, 30);

  // Combine service and repair data for combo chart
  const combinedMonthlyData = useMemo(() => {
    if (!serviceByMonth || !repairByMonth) return [];

    return serviceByMonth.map((s, index) => ({
      name: s.name,
      servicios: s.servicios,
      reparaciones: repairByMonth[index]?.reparaciones || 0,
    }));
  }, [serviceByMonth, repairByMonth]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Show empty state if no group selected
  if (!activeGroup) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <Activity className="h-10 w-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
            Selecciona un grupo
          </h2>
          <p className="text-stone-500 dark:text-stone-400 max-w-md">
            Para ver el dashboard con información de tus vehículos, conductores
            y reportes, primero selecciona un grupo desde el menú lateral.
          </p>
        </div>
      </PageLayout>
    );
  }

  // Show loading state while permissions are being loaded
  if (permissionsLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 text-(--brand) animate-spin mb-4" />
          <p className="text-stone-500 dark:text-stone-400">Cargando...</p>
        </div>
      </PageLayout>
    );
  }

  // Show simple dashboard if user doesn't have permission to view full dashboard
  if (!canViewFullDashboard) {
    return (
      <PageLayout title="Inicio">
        <SimpleDashboard />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Dashboard"
      subtitle={`Resumen del grupo: ${activeGroup.name}`}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetchSummary()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      }
    >
      {/* KPIs Principales */}
      <StatGrid cols={4}>
        <StatCard
          title="Total Vehículos"
          value={summary?.vehicles?.total || 0}
          subtitle={`${summary?.vehicles?.active || 0} activos`}
          icon={Car}
          variant="primary"
          loading={summaryLoading}
        />
        <StatCard
          title="Conductores"
          value={summary?.drivers?.total || 0}
          subtitle={`${summary?.drivers?.active || 0} activos`}
          icon={UserCheck}
          variant="success"
          loading={summaryLoading}
        />
        <StatCard
          title="Clientes"
          value={summary?.clients?.total || 0}
          subtitle="Registrados"
          icon={Users}
          variant="info"
          loading={summaryLoading}
        />
        <StatCard
          title="Reparaciones Pendientes"
          value={
            (summary?.repairReports?.open || 0) +
            (summary?.repairReports?.inProgress || 0)
          }
          subtitle={`${summary?.repairReports?.highPriority || 0} urgentes`}
          icon={AlertTriangle}
          variant={
            (summary?.repairReports?.highPriority || 0) > 0
              ? "danger"
              : "warning"
          }
          loading={summaryLoading}
        />
      </StatGrid>

      {/* Stats secundarios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStatCard
          label="En Mantenimiento"
          value={summary?.vehicles?.maintenance || 0}
          icon={Wrench}
          color="amber"
          loading={summaryLoading}
        />
        <MiniStatCard
          label="Servicios este mes"
          value={summary?.serviceReports?.thisMonth || 0}
          icon={TrendingUp}
          color="emerald"
          loading={summaryLoading}
        />
        <MiniStatCard
          label="Costo Servicios"
          value={formatCurrency(summary?.serviceReports?.totalCost)}
          icon={DollarSign}
          color="blue"
          loading={summaryLoading}
        />
        <MiniStatCard
          label="Costo Reparaciones Est."
          value={formatCurrency(summary?.repairReports?.totalCost)}
          icon={DollarSign}
          color="red"
          loading={summaryLoading}
        />
      </div>

      {/* Módulos de navegación rápida */}
      <ModulesOverview stats={summary} loading={summaryLoading} />

      {/* Gráficas principales */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Estado de la flota */}
        <DonutChart
          data={vehiclesByStatus}
          title="Estado de la Flota"
          subtitle="Distribución por estado actual"
          loading={statusLoading}
          height={280}
        />

        {/* Tendencia de mantenimiento */}
        <ComboTrendChart
          data={combinedMonthlyData}
          title="Actividad de Mantenimiento"
          subtitle="Servicios y reparaciones - últimos 6 meses"
          loading={serviceMonthLoading || repairMonthLoading}
          height={280}
        />
      </div>

      {/* Gráficas secundarias */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Vehículos por marca */}
        <HorizontalBarChart
          data={vehiclesByBrand}
          title="Vehículos por Marca"
          subtitle="Top marcas en tu flota"
          loading={brandLoading}
          height={250}
        />

        {/* Costos por mes */}
        <VerticalBarChart
          data={serviceByMonth}
          title="Costos de Servicio por Mes"
          subtitle="Últimos 6 meses"
          loading={serviceMonthLoading}
          height={250}
          bars={[{ dataKey: "costo", color: "#22c55e", name: "Costo Total" }]}
        />
      </div>

      {/* Sección de listas y acciones */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Columna 1: Acciones rápidas y vehículos recientes */}
        <div className="space-y-4">
          <DefaultQuickActions />
          <RecentVehiclesList
            vehicles={recentVehicles}
            loading={recentVehiclesLoading}
          />
        </div>

        {/* Columna 2: Alertas y pendientes */}
        <div className="space-y-4">
          <PendingRepairsList
            repairs={pendingRepairs}
            loading={pendingRepairsLoading}
          />
          <ExpiringLicensesList
            licenses={expiringLicenses}
            loading={licensesLoading}
          />
        </div>

        {/* Columna 3: Mantenimiento y servicios */}
        <div className="space-y-4">
          <VehiclesInMaintenanceList
            vehicles={maintenanceVehicles}
            loading={maintenanceLoading}
          />
          <RecentServicesList
            reports={recentServices}
            loading={recentServicesLoading}
          />
        </div>
      </div>

      {/* Footer con info del último refresh */}
      <div className="flex items-center justify-center pt-4 border-t border-stone-200 dark:border-stone-800">
        <p className="text-xs text-stone-400 dark:text-stone-500">
          Los datos se actualizan automáticamente cada 5 minutos
        </p>
      </div>
    </PageLayout>
  );
}
