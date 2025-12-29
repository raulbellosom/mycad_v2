import { useQuery } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getVehiclesByType,
  getVehiclesByBrand,
  getVehiclesByStatus,
  getServiceReportsByMonth,
  getRepairReportsByMonth,
  getRecentVehicles,
  getRecentServiceReports,
  getPendingRepairs,
  getVehiclesInMaintenance,
  getExpiringLicenses,
} from "../services/dashboard.service";

/**
 * Hook principal para obtener el resumen del dashboard
 */
export function useDashboardSummary(groupId) {
  return useQuery({
    queryKey: ["dashboard-summary", groupId],
    queryFn: () => getDashboardSummary(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos
  });
}

/**
 * Hook para obtener vehículos por tipo (para gráfica de pie)
 */
export function useVehiclesByType(groupId) {
  return useQuery({
    queryKey: ["dashboard-vehicles-by-type", groupId],
    queryFn: () => getVehiclesByType(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener vehículos por marca (para gráfica de barras)
 */
export function useVehiclesByBrand(groupId) {
  return useQuery({
    queryKey: ["dashboard-vehicles-by-brand", groupId],
    queryFn: () => getVehiclesByBrand(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener vehículos por estado (para gráfica donut)
 */
export function useVehiclesByStatus(groupId) {
  return useQuery({
    queryKey: ["dashboard-vehicles-by-status", groupId],
    queryFn: () => getVehiclesByStatus(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener reportes de servicio por mes
 */
export function useServiceReportsByMonth(groupId) {
  return useQuery({
    queryKey: ["dashboard-service-reports-by-month", groupId],
    queryFn: () => getServiceReportsByMonth(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener reportes de reparación por mes
 */
export function useRepairReportsByMonth(groupId) {
  return useQuery({
    queryKey: ["dashboard-repair-reports-by-month", groupId],
    queryFn: () => getRepairReportsByMonth(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener vehículos recientes
 */
export function useRecentVehicles(groupId, limit = 5) {
  return useQuery({
    queryKey: ["dashboard-recent-vehicles", groupId, limit],
    queryFn: () => getRecentVehicles(groupId, limit),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener reportes de servicio recientes
 */
export function useRecentServiceReports(groupId, limit = 5) {
  return useQuery({
    queryKey: ["dashboard-recent-service-reports", groupId, limit],
    queryFn: () => getRecentServiceReports(groupId, limit),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener reparaciones pendientes
 */
export function usePendingRepairs(groupId, limit = 5) {
  return useQuery({
    queryKey: ["dashboard-pending-repairs", groupId, limit],
    queryFn: () => getPendingRepairs(groupId, limit),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener vehículos en mantenimiento
 */
export function useVehiclesInMaintenance(groupId) {
  return useQuery({
    queryKey: ["dashboard-vehicles-in-maintenance", groupId],
    queryFn: () => getVehiclesInMaintenance(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener licencias próximas a vencer
 */
export function useExpiringLicenses(groupId, daysAhead = 30) {
  return useQuery({
    queryKey: ["dashboard-expiring-licenses", groupId, daysAhead],
    queryFn: () => getExpiringLicenses(groupId, daysAhead),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}
