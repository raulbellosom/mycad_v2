/**
 * Helper para integrar auditoría en hooks de React Query
 *
 * Uso en un hook de mutación:
 *
 * const createVehicleMutation = useMutation({
 *   mutationFn: createVehicle,
 *   onSuccess: (data) => {
 *     auditLog({
 *       groupId,
 *       profileId: currentProfile.$id,
 *       action: AUDIT_ACTIONS.CREATE,
 *       entityType: ENTITY_TYPES.VEHICLE,
 *       entityId: data.$id,
 *       entityName: `${data.brand?.name} ${data.model?.name} - ${data.plate || data.economicNumber}`,
 *     });
 *   }
 * });
 */

import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../services/audit.service";

/**
 * Wrapper simple para logAuditEvent que no falla silenciosamente
 * y que se puede usar en onSuccess de mutations
 */
export function auditLog(params) {
  return logAuditEvent(params).catch((error) => {
    console.warn("Audit log failed:", error);
    // No re-lanzar el error para no afectar la operación principal
  });
}

/**
 * Helper para crear un nombre descriptivo de vehículo
 */
export function getVehicleDisplayName(vehicle) {
  const parts = [];

  if (vehicle.brand?.name) parts.push(vehicle.brand.name);
  if (vehicle.model?.name) parts.push(vehicle.model.name);
  if (vehicle.plate) parts.push(`(${vehicle.plate})`);
  else if (vehicle.economicNumber) parts.push(`(${vehicle.economicNumber})`);

  return parts.join(" ") || `Vehículo ${vehicle.$id?.slice(-6) || ""}`;
}

/**
 * Helper para crear un nombre descriptivo de reporte de servicio
 */
export function getServiceReportDisplayName(report) {
  const date = report.serviceDate
    ? new Date(report.serviceDate).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return `${report.title || "Servicio"} - ${date}`.trim();
}

/**
 * Helper para crear un nombre descriptivo de reporte de reparación
 */
export function getRepairReportDisplayName(report) {
  const date = report.reportDate
    ? new Date(report.reportDate).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return `${report.title || "Reparación"} - ${date}`.trim();
}

/**
 * Helper para crear un nombre descriptivo de cliente
 */
export function getClientDisplayName(client) {
  return (
    client.name || client.email || `Cliente ${client.$id?.slice(-6) || ""}`
  );
}

/**
 * Helper para crear un nombre descriptivo de conductor
 */
export function getDriverDisplayName(driver) {
  const name = `${driver.firstName || ""} ${driver.lastName || ""}`.trim();
  return name || driver.email || `Conductor ${driver.$id?.slice(-6) || ""}`;
}

// Re-exportar las constantes para facilidad de uso
export { AUDIT_ACTIONS, ENTITY_TYPES };
