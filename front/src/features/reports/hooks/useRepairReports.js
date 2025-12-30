import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listRepairReports,
  getRepairReportById,
  createRepairReport,
  updateRepairReport,
  finalizeRepairReport,
  reopenRepairReport,
  deleteRepairReport,
  getRepairReportParts,
  addRepairReportPart,
  updateRepairReportPart,
  deleteRepairReportPart,
  getRepairReportFiles,
  uploadRepairReportFile,
  deleteRepairReportFile,
} from "../services/repair-reports.service";
import toast from "react-hot-toast";

// ============================================
// QUERIES
// ============================================

/**
 * Hook para listar reportes de reparación
 */
export function useRepairReports(groupId, filters = {}) {
  return useQuery({
    queryKey: ["repair-reports", groupId, filters],
    queryFn: () => listRepairReports(groupId, filters),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/**
 * Hook para obtener un reporte de reparación por ID
 */
export function useRepairReport(id) {
  return useQuery({
    queryKey: ["repair-report", id],
    queryFn: () => getRepairReportById(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener las partes de un reporte
 */
export function useRepairReportParts(repairReportId) {
  return useQuery({
    queryKey: ["repair-report-parts", repairReportId],
    queryFn: () => getRepairReportParts(repairReportId),
    enabled: !!repairReportId,
  });
}

/**
 * Hook para obtener los archivos de un reporte
 */
export function useRepairReportFiles(repairReportId) {
  return useQuery({
    queryKey: ["repair-report-files", repairReportId],
    queryFn: () => getRepairReportFiles(repairReportId),
    enabled: !!repairReportId,
  });
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Hook para crear un reporte de reparación
 */
export function useCreateRepairReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRepairReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
      toast.success("Reporte de reparación creado exitosamente");
      return data;
    },
    onError: (error) => {
      toast.error(error?.message || "Error al crear el reporte");
    },
  });
}

/**
 * Hook para actualizar un reporte de reparación
 */
export function useUpdateRepairReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateRepairReport(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
      queryClient.invalidateQueries({ queryKey: ["repair-report", data.$id] });
      toast.success("Reporte actualizado exitosamente");
      return data;
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar el reporte");
    },
  });
}

/**
 * Hook para finalizar un reporte de reparación
 */
export function useFinalizeRepairReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, profileId }) => finalizeRepairReport(id, profileId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
      queryClient.invalidateQueries({ queryKey: ["repair-report", data.$id] });
      toast.success("Reporte finalizado. Ya no podrá ser modificado.");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al finalizar el reporte");
    },
  });
}

/**
 * Hook para reabrir un reporte finalizado
 */
export function useReopenRepairReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reopenRepairReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
      queryClient.invalidateQueries({ queryKey: ["repair-report", data.$id] });
      toast.success("Reporte reabierto para edición");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al reabrir el reporte");
    },
  });
}

/**
 * Hook para eliminar un reporte de reparación
 */
export function useDeleteRepairReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRepairReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repair-reports"] });
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
export function useAddRepairReportPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repairReportId, groupId, data }) =>
      addRepairReportPart(repairReportId, groupId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["repair-report-parts", variables.repairReportId],
      });
      toast.success("Parte agregada");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al agregar parte");
    },
  });
}

/**
 * Hook para actualizar una parte
 */
export function useUpdateRepairReportPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partId, data, repairReportId }) =>
      updateRepairReportPart(partId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["repair-report-parts", variables.repairReportId],
      });
      toast.success("Parte actualizada");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar parte");
    },
  });
}

/**
 * Hook para eliminar una parte
 */
export function useDeleteRepairReportPart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partId, repairReportId }) => deleteRepairReportPart(partId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["repair-report-parts", variables.repairReportId],
      });
      toast.success("Parte eliminada");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar parte");
    },
  });
}

// ============================================
// MUTATIONS - ARCHIVOS
// ============================================

/**
 * Hook para subir un archivo
 */
export function useUploadRepairReportFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repairReportId, groupId, file, profileId }) =>
      uploadRepairReportFile(repairReportId, groupId, file, profileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["repair-report-files", variables.repairReportId],
      });
      toast.success("Archivo subido");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al subir archivo");
    },
  });
}

/**
 * Hook para eliminar un archivo
 */
export function useDeleteRepairReportFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileDocId, storageFileId, repairReportId }) =>
      deleteRepairReportFile(fileDocId, storageFileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["repair-report-files", variables.repairReportId],
      });
      toast.success("Archivo eliminado");
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar archivo");
    },
  });
}
