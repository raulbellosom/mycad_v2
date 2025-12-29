import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listServiceReports,
  getServiceReportById,
  createServiceReport,
  updateServiceReport,
  finalizeServiceReport,
  reopenServiceReport,
  deleteServiceReport,
  getServiceReportParts,
  addServiceReportPart,
  updateServiceReportPart,
  deleteServiceReportPart,
  getServiceReportFiles,
  uploadServiceReportFile,
  deleteServiceReportFile,
} from "../services/service-reports.service";
import toast from "react-hot-toast";

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar reportes de servicio
 */
export function useServiceReports(groupId, filters = {}) {
  return useQuery({
    queryKey: ["service-reports", groupId, filters],
    queryFn: () => listServiceReports(groupId, filters),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/**
 * Hook para obtener un reporte de servicio por ID
 */
export function useServiceReport(id) {
  return useQuery({
    queryKey: ["service-report", id],
    queryFn: () => getServiceReportById(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener las partes de un reporte
 */
export function useServiceReportParts(serviceHistoryId) {
  return useQuery({
    queryKey: ["service-report-parts", serviceHistoryId],
    queryFn: () => getServiceReportParts(serviceHistoryId),
    enabled: !!serviceHistoryId,
  });
}

/**
 * Hook para obtener los archivos de un reporte
 */
export function useServiceReportFiles(serviceHistoryId) {
  return useQuery({
    queryKey: ["service-report-files", serviceHistoryId],
    queryFn: () => getServiceReportFiles(serviceHistoryId),
    enabled: !!serviceHistoryId,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para crear un reporte de servicio
 */
export function useCreateServiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createServiceReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-reports"] });
      return data;
    },
  });
}

/**
 * Hook para actualizar un reporte de servicio
 */
export function useUpdateServiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateServiceReport(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-reports"] });
      queryClient.invalidateQueries({ queryKey: ["service-report", data.$id] });
      return data;
    },
  });
}

/**
 * Hook para finalizar un reporte de servicio
 */
export function useFinalizeServiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, profileId }) => finalizeServiceReport(reportId, profileId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-reports"] });
      queryClient.invalidateQueries({ queryKey: ["service-report", data.$id] });
    },
  });
}

/**
 * Hook para reabrir un reporte finalizado
 */
export function useReopenServiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reopenServiceReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["service-reports"] });
      queryClient.invalidateQueries({ queryKey: ["service-report", data.$id] });
      toast.success("Reporte reabierto para edición");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al reabrir el reporte");
    },
  });
}

/**
 * Hook para eliminar un reporte de servicio
 */
export function useDeleteServiceReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteServiceReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-reports"] });
      toast.success("Reporte eliminado");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar el reporte");
    },
  });
}

// ============================================
// MUTATIONS - PARTES
// ============================================

/**
 * Hook para agregar una parte
 */
export function useAddServiceReportPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceHistoryId, groupId, data }) =>
      addServiceReportPart(serviceHistoryId, groupId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-report-parts", variables.serviceHistoryId],
      });
      toast.success("Refacción agregada");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al agregar refacción");
    },
  });
}

/**
 * Hook para actualizar una parte
 */
export function useUpdateServiceReportPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partId, data, serviceHistoryId }) =>
      updateServiceReportPart(partId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-report-parts", variables.serviceHistoryId],
      });
      toast.success("Refacción actualizada");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar refacción");
    },
  });
}

/**
 * Hook para eliminar una parte
 */
export function useDeleteServiceReportPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partId, serviceHistoryId }) =>
      deleteServiceReportPart(partId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-report-parts", variables.serviceHistoryId],
      });
      toast.success("Refacción eliminada");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar refacción");
    },
  });
}

// ============================================
// MUTATIONS - ARCHIVOS
// ============================================

/**
 * Hook para subir un archivo
 */
export function useUploadServiceReportFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceHistoryId, groupId, file }) =>
      uploadServiceReportFile(serviceHistoryId, groupId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-report-files", variables.serviceHistoryId],
      });
    },
  });
}

/**
 * Hook para eliminar un archivo
 */
export function useDeleteServiceReportFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileDocId, storageFileId, serviceHistoryId }) =>
      deleteServiceReportFile(fileDocId, storageFileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-report-files", variables.serviceHistoryId],
      });
      toast.success("Archivo eliminado");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar archivo");
    },
  });
}
