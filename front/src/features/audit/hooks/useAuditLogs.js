import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAuditLogs,
  getAuditLogById,
  getAuditStats,
  logAuditEvent,
} from "../services/audit.service";

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar logs de auditoría con paginación y filtros
 */
export function useAuditLogs(groupId, options = {}) {
  const {
    action,
    entityType,
    profileId,
    startDate,
    endDate,
    search,
    page = 1,
    pageSize = 25,
  } = options;

  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: [
      "audit-logs",
      groupId,
      {
        action,
        entityType,
        profileId,
        startDate,
        endDate,
        search,
        page,
        pageSize,
      },
    ],
    queryFn: () =>
      listAuditLogs(groupId, {
        action,
        entityType,
        profileId,
        startDate,
        endDate,
        search,
        limit: pageSize,
        offset,
      }),
    enabled: !!groupId,
    staleTime: 1000 * 30, // 30 segundos - los logs cambian frecuentemente
    keepPreviousData: true, // Mantener datos mientras carga la siguiente página
  });
}

/**
 * Hook para obtener un log específico por ID
 */
export function useAuditLog(id) {
  return useQuery({
    queryKey: ["audit-log", id],
    queryFn: () => getAuditLogById(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener estadísticas de auditoría
 */
export function useAuditStats(groupId, days = 7) {
  return useQuery({
    queryKey: ["audit-stats", groupId, days],
    queryFn: () => getAuditStats(groupId, days),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para crear un log de auditoría
 * Uso: const { mutate: log } = useLogAuditEvent();
 * log({ groupId, profileId, action, entityType, ... });
 */
export function useLogAuditEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logAuditEvent,
    onSuccess: () => {
      // Invalidar queries de audit logs
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-stats"] });
    },
  });
}

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook para obtener los usuarios únicos de los logs (para filtros)
 */
export function useAuditLogUsers(groupId) {
  const { data } = useAuditLogs(groupId, { pageSize: 100 });

  const users = new Map();
  data?.documents?.forEach((log) => {
    if (log.profile && !users.has(log.profileId)) {
      users.set(log.profileId, {
        id: log.profileId,
        name: log.profile?.firstName
          ? `${log.profile.firstName} ${log.profile.lastName || ""}`.trim()
          : log.profile?.email || "Usuario desconocido",
        email: log.profile?.email,
      });
    }
  });

  return Array.from(users.values());
}
