import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../../audit/services/audit.service";

// Collection IDs - Se agregarán al env.js
const ASSIGNMENTS_COLLECTION_ID =
  env.collectionVehicleDriverAssignmentsId ||
  import.meta.env.VITE_APPWRITE_COLLECTION_VEHICLE_DRIVER_ASSIGNMENTS_ID;
const ASSIGNMENT_FILES_COLLECTION_ID =
  env.collectionVehicleDriverAssignmentFilesId ||
  import.meta.env.VITE_APPWRITE_COLLECTION_VEHICLE_DRIVER_ASSIGNMENT_FILES_ID;
const FILES_COLLECTION_ID = env.collectionFilesId;
const BUCKET_ID = env.bucketVehiclesId;

// --- Assignment Types & Roles ---
export const ASSIGNMENT_ROLES = {
  PRIMARY: "PRIMARY",
  SECONDARY: "SECONDARY",
  TEMP: "TEMP",
  SUBSTITUTE: "SUBSTITUTE",
};

export const ASSIGNMENT_TYPES = {
  OPERATION: "OPERATION",
  RENTAL: "RENTAL",
  MAINTENANCE: "MAINTENANCE",
  DELIVERY: "DELIVERY",
  OTHER: "OTHER",
};

export const ASSIGNMENT_FILE_KINDS = {
  DELIVERY_PHOTO: "DELIVERY_PHOTO",
  SIGNATURE: "SIGNATURE",
  CONTRACT: "CONTRACT",
  OTHER: "OTHER",
};

// Labels para UI
export const ASSIGNMENT_ROLE_LABELS = {
  PRIMARY: "Principal",
  SECONDARY: "Secundario",
  TEMP: "Temporal",
  SUBSTITUTE: "Sustituto",
};

export const ASSIGNMENT_TYPE_LABELS = {
  OPERATION: "Operación",
  RENTAL: "Renta",
  MAINTENANCE: "Mantenimiento",
  DELIVERY: "Entrega",
  OTHER: "Otro",
};

export const ASSIGNMENT_FILE_KIND_LABELS = {
  DELIVERY_PHOTO: "Foto de entrega",
  SIGNATURE: "Firma",
  CONTRACT: "Contrato",
  OTHER: "Otro",
};

// --- List Assignments ---

/**
 * Lista todas las asignaciones de un vehículo
 * @param {string} vehicleId - ID del vehículo
 * @param {boolean} activeOnly - Si true, solo devuelve asignaciones activas
 */
export async function listVehicleAssignments(vehicleId, activeOnly = false) {
  if (!vehicleId) return [];

  const queries = [
    Query.equal("vehicleId", vehicleId),
    Query.equal("enabled", true),
    Query.orderDesc("startDate"),
  ];

  if (activeOnly) {
    queries.push(Query.equal("isActive", true));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    queries
  );

  return res.documents;
}

/**
 * Lista todas las asignaciones de un conductor
 * @param {string} driverId - ID del conductor
 * @param {boolean} activeOnly - Si true, solo devuelve asignaciones activas
 */
export async function listDriverAssignments(driverId, activeOnly = false) {
  if (!driverId) return [];

  const queries = [
    Query.equal("driverId", driverId),
    Query.equal("enabled", true),
    Query.orderDesc("startDate"),
  ];

  if (activeOnly) {
    queries.push(Query.equal("isActive", true));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    queries
  );

  return res.documents;
}

/**
 * Lista todas las asignaciones de un grupo
 * @param {string} groupId - ID del grupo
 * @param {object} options - Opciones de filtrado
 */
export async function listGroupAssignments(groupId, options = {}) {
  if (!groupId) return [];

  const { activeOnly = false, limit = 100 } = options;

  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("startDate"),
    Query.limit(limit),
  ];

  if (activeOnly) {
    queries.push(Query.equal("isActive", true));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    queries
  );

  return res.documents;
}

/**
 * Obtiene la asignación activa actual de un vehículo (conductor principal)
 * @param {string} vehicleId - ID del vehículo
 */
export async function getActiveVehicleAssignment(vehicleId) {
  if (!vehicleId) return null;

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    [
      Query.equal("vehicleId", vehicleId),
      Query.equal("isActive", true),
      Query.equal("enabled", true),
      Query.equal("role", ASSIGNMENT_ROLES.PRIMARY),
      Query.limit(1),
    ]
  );

  return res.documents[0] || null;
}

/**
 * Obtiene una asignación por ID
 * @param {string} id - ID de la asignación
 */
export async function getAssignmentById(id) {
  return await databases.getDocument(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    id
  );
}

// --- Create Assignment ---

/**
 * Crea una nueva asignación de vehículo a conductor
 * @param {object} data - Datos de la asignación
 */
export async function createAssignment(data, auditInfo = {}) {
  const {
    groupId,
    vehicleId,
    driverId,
    startDate,
    endDate,
    role = ASSIGNMENT_ROLES.PRIMARY,
    assignmentType = ASSIGNMENT_TYPES.OPERATION,
    startMileage,
    endMileage,
    startFuelLevel,
    endFuelLevel,
    notes,
    createdByProfileId,
  } = data;

  // Si es PRIMARY y activa, primero desactivamos cualquier asignación PRIMARY existente del vehículo
  if (role === ASSIGNMENT_ROLES.PRIMARY && !endDate) {
    await deactivateVehiclePrimaryAssignment(vehicleId);
  }

  // Desactivamos cualquier asignación activa del conductor con el mismo rol
  // Regla: Un conductor solo puede tener UN vehículo activo por rol
  if (!endDate) {
    await deactivateDriverAssignmentByRole(driverId, role);
  }

  // Una asignación está activa si:
  // 1. No tiene fecha de fin (indefinida), O
  // 2. Tiene fecha de fin pero es en el futuro
  const now = new Date();
  const isActive = !endDate || new Date(endDate) > now;

  const doc = await databases.createDocument(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      vehicleId,
      driverId,
      startDate,
      endDate: endDate || null,
      isActive,
      role,
      assignmentType,
      startMileage: startMileage || null,
      endMileage: endMileage || null,
      startFuelLevel: startFuelLevel || null,
      endFuelLevel: endFuelLevel || null,
      notes: notes || null,
      createdByProfileId,
      enabled: true,
      // Relaciones two-way
      vehicle: vehicleId,
      driver: driverId,
      createdBy: createdByProfileId,
    }
  );

  // Auditoría
  if (createdByProfileId && groupId) {
    logAuditEvent({
      groupId,
      profileId: createdByProfileId,
      action: AUDIT_ACTIONS.OTHER,
      entityType: ENTITY_TYPES.OTHER,
      entityId: doc.$id,
      entityName: `Asignación: ${auditInfo.vehicleName || vehicleId} → ${
        auditInfo.driverName || driverId
      }`,
      details: {
        vehicleName: auditInfo.vehicleName,
        driverName: auditInfo.driverName,
        role,
        assignmentType,
        action: "assignment_created",
      },
    }).catch(console.error);
  }

  return doc;
}

// --- Update Assignment ---

/**
 * Actualiza una asignación existente
 * @param {string} id - ID de la asignación
 * @param {object} data - Datos a actualizar
 */
export async function updateAssignment(id, data, auditInfo = {}) {
  const updateData = { ...data };

  // Si se está estableciendo o modificando endDate, recalcular isActive
  if (data.endDate !== undefined) {
    const now = new Date();
    updateData.isActive = !data.endDate || new Date(data.endDate) > now;
  }

  // Remover campos que no deben actualizarse directamente
  delete updateData.groupId;
  delete updateData.vehicleId;
  delete updateData.driverId;
  delete updateData.createdByProfileId;

  const doc = await databases.updateDocument(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    id,
    updateData
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.OTHER,
      entityId: id,
      entityName: `Asignación actualizada`,
      details: {
        updatedFields: Object.keys(updateData),
        action: "assignment_updated",
      },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Finaliza una asignación (establecer fecha de fin y desactivar)
 * @param {string} id - ID de la asignación
 * @param {object} endData - Datos de finalización
 */
export async function endAssignment(id, endData = {}, auditInfo = {}) {
  const {
    endDate = new Date().toISOString(),
    endMileage,
    endFuelLevel,
    notes,
  } = endData;

  const doc = await databases.updateDocument(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    id,
    {
      endDate,
      isActive: false,
      ...(endMileage !== undefined && { endMileage }),
      ...(endFuelLevel !== undefined && { endFuelLevel }),
      ...(notes && { notes }),
    }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.OTHER,
      entityType: ENTITY_TYPES.OTHER,
      entityId: id,
      entityName: `Asignación finalizada`,
      details: { endDate, endMileage, action: "assignment_ended" },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Desactiva la asignación PRIMARY activa de un vehículo
 * (útil antes de crear una nueva asignación PRIMARY)
 * @param {string} vehicleId - ID del vehículo
 */
export async function deactivateVehiclePrimaryAssignment(vehicleId) {
  const activeAssignment = await getActiveVehicleAssignment(vehicleId);

  if (activeAssignment) {
    await endAssignment(activeAssignment.$id, {
      endDate: new Date().toISOString(),
    });
  }
}

// --- Delete Assignment ---

/**
 * Elimina (soft delete) una asignación
 * @param {string} id - ID de la asignación
 */
export async function deleteAssignment(id, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    id,
    {
      enabled: false,
      isActive: false,
    }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.OTHER,
      entityId: id,
      entityName: "Asignación eliminada",
      details: { action: "assignment_deleted" },
    }).catch(console.error);
  }

  return doc;
}

// --- Assignment Files ---

/**
 * Lista archivos de una asignación
 * @param {string} assignmentId - ID de la asignación
 */
export async function listAssignmentFiles(assignmentId) {
  if (!assignmentId) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENT_FILES_COLLECTION_ID,
    [Query.equal("assignmentId", assignmentId), Query.equal("enabled", true)]
  );

  return res.documents;
}

/**
 * Sube un archivo para una asignación
 * @param {File} file - Archivo a subir
 */
export async function uploadAssignmentFile(file) {
  return await storage.createFile(BUCKET_ID, ID.unique(), file);
}

/**
 * Registra un archivo de asignación en la base de datos
 * @param {object} data - Datos del archivo
 */
export async function registerAssignmentFile(data) {
  const { groupId, assignmentId, fileId, kind } = data;

  return await databases.createDocument(
    env.databaseId,
    ASSIGNMENT_FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      assignmentId,
      fileId,
      kind,
      enabled: true,
      // Relaciones two-way
      assignment: assignmentId,
      file: fileId,
    }
  );
}

/**
 * Elimina (soft delete) un archivo de asignación
 * @param {string} id - ID del registro del archivo
 */
export async function deleteAssignmentFile(id) {
  return await databases.updateDocument(
    env.databaseId,
    ASSIGNMENT_FILES_COLLECTION_ID,
    id,
    { enabled: false }
  );
}

// --- Validations ---

/**
 * Verifica si un conductor ya tiene una asignación activa como PRIMARY
 * @param {string} driverId - ID del conductor
 * @returns {Promise<boolean>}
 */
export async function driverHasActivePrimaryAssignment(driverId) {
  if (!driverId) return false;

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    [
      Query.equal("driverId", driverId),
      Query.equal("isActive", true),
      Query.equal("enabled", true),
      Query.equal("role", ASSIGNMENT_ROLES.PRIMARY),
      Query.limit(1),
    ]
  );

  return res.documents.length > 0;
}

/**
 * Verifica si un vehículo ya tiene una asignación activa como PRIMARY
 * @param {string} vehicleId - ID del vehículo
 * @returns {Promise<boolean>}
 */
export async function vehicleHasActivePrimaryAssignment(vehicleId) {
  if (!vehicleId) return false;

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    [
      Query.equal("vehicleId", vehicleId),
      Query.equal("isActive", true),
      Query.equal("enabled", true),
      Query.equal("role", ASSIGNMENT_ROLES.PRIMARY),
      Query.limit(1),
    ]
  );

  return res.documents.length > 0;
}

/**
 * Verifica si un conductor ya tiene una asignación activa con el rol especificado
 * @param {string} driverId - ID del conductor
 * @param {string} role - Rol a verificar (PRIMARY, SECONDARY, etc.)
 * @returns {Promise<object|null>} - Devuelve la asignación si existe, null si no
 */
export async function driverHasActiveAssignmentWithRole(driverId, role) {
  if (!driverId || !role) return null;

  const res = await databases.listDocuments(
    env.databaseId,
    ASSIGNMENTS_COLLECTION_ID,
    [
      Query.equal("driverId", driverId),
      Query.equal("isActive", true),
      Query.equal("enabled", true),
      Query.equal("role", role),
      Query.limit(1),
    ]
  );

  return res.documents[0] || null;
}

/**
 * Desactiva la asignación activa de un conductor con un rol específico
 * (útil antes de crear una nueva asignación con el mismo rol)
 * @param {string} driverId - ID del conductor
 * @param {string} role - Rol a desactivar
 */
export async function deactivateDriverAssignmentByRole(driverId, role) {
  const activeAssignment = await driverHasActiveAssignmentWithRole(
    driverId,
    role
  );

  if (activeAssignment) {
    await endAssignment(activeAssignment.$id, {
      endDate: new Date().toISOString(),
    });
  }
}
