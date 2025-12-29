import { ID, Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionAuditLogsId;

/**
 * Acciones de auditoría disponibles
 */
export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  VIEW: "VIEW",
  FINALIZE: "FINALIZE",
  REOPEN: "REOPEN",
  ASSIGN: "ASSIGN",
  UNASSIGN: "UNASSIGN",
  UPLOAD: "UPLOAD",
  OTHER: "OTHER",
};

/**
 * Tipos de entidades que se pueden auditar
 */
export const ENTITY_TYPES = {
  VEHICLE: "vehicles",
  SERVICE_REPORT: "service_histories",
  REPAIR_REPORT: "repair_reports",
  CLIENT: "clients",
  RENTAL: "rentals",
  DRIVER: "drivers",
  USER: "users_profile",
  GROUP: "groups",
  ROLE: "roles",
  CATALOG: "catalogs",
  FILE: "files",
  OTHER: "other",
};

/**
 * Etiquetas legibles para tipos de entidad
 */
export const ENTITY_TYPE_LABELS = {
  [ENTITY_TYPES.VEHICLE]: "Vehículo",
  [ENTITY_TYPES.SERVICE_REPORT]: "Reporte de Servicio",
  [ENTITY_TYPES.REPAIR_REPORT]: "Reporte de Reparación",
  [ENTITY_TYPES.CLIENT]: "Cliente",
  [ENTITY_TYPES.RENTAL]: "Renta",
  [ENTITY_TYPES.DRIVER]: "Conductor",
  [ENTITY_TYPES.USER]: "Usuario",
  [ENTITY_TYPES.GROUP]: "Grupo",
  [ENTITY_TYPES.ROLE]: "Rol",
  [ENTITY_TYPES.CATALOG]: "Catálogo",
  [ENTITY_TYPES.FILE]: "Archivo",
  [ENTITY_TYPES.OTHER]: "Otro",
};

/**
 * Etiquetas legibles para acciones
 */
export const ACTION_LABELS = {
  [AUDIT_ACTIONS.CREATE]: "Creación",
  [AUDIT_ACTIONS.UPDATE]: "Actualización",
  [AUDIT_ACTIONS.DELETE]: "Eliminación",
  [AUDIT_ACTIONS.LOGIN]: "Inicio de sesión",
  [AUDIT_ACTIONS.LOGOUT]: "Cierre de sesión",
  [AUDIT_ACTIONS.VIEW]: "Visualización",
  [AUDIT_ACTIONS.FINALIZE]: "Finalización",
  [AUDIT_ACTIONS.REOPEN]: "Reapertura",
  [AUDIT_ACTIONS.ASSIGN]: "Asignación",
  [AUDIT_ACTIONS.UNASSIGN]: "Desasignación",
  [AUDIT_ACTIONS.UPLOAD]: "Carga de archivo",
  [AUDIT_ACTIONS.OTHER]: "Otro",
};

/**
 * Colores para las acciones (para badges)
 */
export const ACTION_COLORS = {
  [AUDIT_ACTIONS.CREATE]: "success",
  [AUDIT_ACTIONS.UPDATE]: "info",
  [AUDIT_ACTIONS.DELETE]: "danger",
  [AUDIT_ACTIONS.LOGIN]: "brand",
  [AUDIT_ACTIONS.LOGOUT]: "muted",
  [AUDIT_ACTIONS.VIEW]: "muted",
  [AUDIT_ACTIONS.FINALIZE]: "success",
  [AUDIT_ACTIONS.REOPEN]: "warning",
  [AUDIT_ACTIONS.ASSIGN]: "info",
  [AUDIT_ACTIONS.UNASSIGN]: "warning",
  [AUDIT_ACTIONS.UPLOAD]: "info",
  [AUDIT_ACTIONS.OTHER]: "muted",
};

/**
 * Lista los logs de auditoría con filtros y paginación
 */
export async function listAuditLogs(groupId, options = {}) {
  if (!groupId) return { documents: [], total: 0 };

  const {
    action,
    entityType,
    profileId,
    startDate,
    endDate,
    search,
    limit = 25,
    offset = 0,
  } = options;

  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ];

  // Filtro por acción
  if (action && action !== "all") {
    queries.push(Query.equal("action", action));
  }

  // Filtro por tipo de entidad
  if (entityType && entityType !== "all") {
    queries.push(Query.equal("entityType", entityType));
  }

  // Filtro por usuario que realizó la acción
  if (profileId) {
    queries.push(Query.equal("profileId", profileId));
  }

  // Filtro por rango de fechas
  if (startDate) {
    queries.push(Query.greaterThanEqual("createdAt", startDate));
  }
  if (endDate) {
    queries.push(Query.lessThanEqual("createdAt", endDate));
  }

  // Búsqueda por texto en entityName
  if (search) {
    queries.push(Query.search("entityName", search));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    COLLECTION_ID,
    queries
  );

  return {
    documents: res.documents,
    total: res.total,
  };
}

/**
 * Obtiene un log de auditoría por ID
 */
export async function getAuditLogById(id) {
  const doc = await databases.getDocument(env.databaseId, COLLECTION_ID, id);
  return doc;
}

/**
 * Crea un nuevo log de auditoría
 * Esta función se usa internamente desde otros servicios
 */
export async function createAuditLog({
  groupId,
  profileId,
  action,
  entityType,
  entityId,
  entityName,
  details,
  ipAddress,
  userAgent,
}) {
  // No crear log si no hay colección configurada
  if (!COLLECTION_ID) {
    console.warn("Audit logs collection not configured");
    return null;
  }

  try {
    const doc = await databases.createDocument(
      env.databaseId,
      COLLECTION_ID,
      ID.unique(),
      {
        groupId,
        profileId,
        action,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || navigator.userAgent || null,
        createdAt: new Date().toISOString(),
        enabled: true,
        // Relación two-way
        profile: profileId,
      }
    );
    return doc;
  } catch (error) {
    // No fallar silenciosamente en producción, pero loguear el error
    console.error("Error creating audit log:", error);
    return null;
  }
}

/**
 * Helper para crear un log desde cualquier parte de la app
 * Uso: await logAuditEvent({ ... })
 */
export async function logAuditEvent({
  groupId,
  profileId,
  action,
  entityType,
  entityId,
  entityName,
  details,
}) {
  return createAuditLog({
    groupId,
    profileId,
    action,
    entityType,
    entityId,
    entityName,
    details,
    userAgent: navigator.userAgent,
  });
}

/**
 * Obtiene estadísticas de auditoría para un grupo
 */
export async function getAuditStats(groupId, days = 7) {
  if (!groupId) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.greaterThanEqual("createdAt", startDate.toISOString()),
    Query.limit(500), // Limitar para stats
  ];

  const res = await databases.listDocuments(
    env.databaseId,
    COLLECTION_ID,
    queries
  );

  // Calcular estadísticas
  const stats = {
    total: res.total,
    byAction: {},
    byEntityType: {},
    byDay: {},
  };

  res.documents.forEach((doc) => {
    // Por acción
    stats.byAction[doc.action] = (stats.byAction[doc.action] || 0) + 1;

    // Por tipo de entidad
    stats.byEntityType[doc.entityType] =
      (stats.byEntityType[doc.entityType] || 0) + 1;

    // Por día
    const day = doc.createdAt.split("T")[0];
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
  });

  return stats;
}

/**
 * Elimina (soft delete) un log de auditoría
 * Normalmente no se usa, pero por si acaso
 */
export async function deleteAuditLog(id) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    { enabled: false }
  );
  return doc;
}
