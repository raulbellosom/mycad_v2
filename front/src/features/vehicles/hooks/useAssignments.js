import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listVehicleAssignments,
  listDriverAssignments,
  listGroupAssignments,
  getActiveVehicleAssignment,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  endAssignment,
  deleteAssignment,
  listAssignmentFiles,
} from "../services/assignments.service";

/**
 * Hook para obtener todas las asignaciones de un vehículo
 * @param {string} vehicleId - ID del vehículo
 * @param {boolean} activeOnly - Si true, solo devuelve asignaciones activas
 */
export function useVehicleAssignments(vehicleId, activeOnly = false) {
  return useQuery({
    queryKey: ["vehicleAssignments", vehicleId, { activeOnly }],
    queryFn: () => listVehicleAssignments(vehicleId, activeOnly),
    enabled: !!vehicleId,
  });
}

/**
 * Hook para obtener la asignación activa (conductor principal) de un vehículo
 * @param {string} vehicleId - ID del vehículo
 */
export function useActiveVehicleAssignment(vehicleId) {
  return useQuery({
    queryKey: ["activeVehicleAssignment", vehicleId],
    queryFn: () => getActiveVehicleAssignment(vehicleId),
    enabled: !!vehicleId,
  });
}

/**
 * Hook para obtener todas las asignaciones de un conductor
 * @param {string} driverId - ID del conductor
 * @param {boolean} activeOnly - Si true, solo devuelve asignaciones activas
 */
export function useDriverAssignments(driverId, activeOnly = false) {
  return useQuery({
    queryKey: ["driverAssignments", driverId, { activeOnly }],
    queryFn: () => listDriverAssignments(driverId, activeOnly),
    enabled: !!driverId,
  });
}

/**
 * Hook para obtener todas las asignaciones de un grupo
 * @param {string} groupId - ID del grupo
 * @param {object} options - Opciones de filtrado
 */
export function useGroupAssignments(groupId, options = {}) {
  return useQuery({
    queryKey: ["groupAssignments", groupId, options],
    queryFn: () => listGroupAssignments(groupId, options),
    enabled: !!groupId,
  });
}

/**
 * Hook para obtener una asignación específica
 * @param {string} assignmentId - ID de la asignación
 */
export function useAssignment(assignmentId) {
  return useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => getAssignmentById(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Hook para obtener archivos de una asignación
 * @param {string} assignmentId - ID de la asignación
 */
export function useAssignmentFiles(assignmentId) {
  return useQuery({
    queryKey: ["assignmentFiles", assignmentId],
    queryFn: () => listAssignmentFiles(assignmentId),
    enabled: !!assignmentId,
  });
}

/**
 * Hook para mutaciones de asignaciones (crear, actualizar, eliminar)
 */
export function useAssignmentMutations() {
  const queryClient = useQueryClient();

  const invalidateQueries = (vehicleId, driverId) => {
    // Invalidar queries relacionadas
    queryClient.invalidateQueries({ queryKey: ["vehicleAssignments"] });
    queryClient.invalidateQueries({ queryKey: ["driverAssignments"] });
    queryClient.invalidateQueries({ queryKey: ["groupAssignments"] });
    queryClient.invalidateQueries({ queryKey: ["activeVehicleAssignment"] });

    if (vehicleId) {
      queryClient.invalidateQueries({
        queryKey: ["vehicleAssignments", vehicleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activeVehicleAssignment", vehicleId],
      });
    }
    if (driverId) {
      queryClient.invalidateQueries({
        queryKey: ["driverAssignments", driverId],
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: ({ data, auditInfo }) => createAssignment(data, auditInfo),
    onSuccess: (data) => {
      invalidateQueries(data.vehicleId, data.driverId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, auditInfo }) =>
      updateAssignment(id, data, auditInfo),
    onSuccess: (data) => {
      invalidateQueries(data.vehicleId, data.driverId);
      queryClient.invalidateQueries({ queryKey: ["assignment", data.$id] });
    },
  });

  const endMutation = useMutation({
    mutationFn: ({ id, endData, auditInfo }) =>
      endAssignment(id, endData, auditInfo),
    onSuccess: (data) => {
      invalidateQueries(data.vehicleId, data.driverId);
      queryClient.invalidateQueries({ queryKey: ["assignment", data.$id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, auditInfo }) => deleteAssignment(id, auditInfo),
    onSuccess: (data) => {
      invalidateQueries(data.vehicleId, data.driverId);
    },
  });

  return {
    createAssignment: createMutation,
    updateAssignment: updateMutation,
    endAssignment: endMutation,
    deleteAssignment: deleteMutation,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      endMutation.isPending ||
      deleteMutation.isPending,
  };
}
