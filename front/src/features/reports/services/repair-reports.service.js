import { ID, Query } from "appwrite";
import { databases, storage, functions } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";
import {
  getFilePreviewUrl,
  getFileDownloadUrl,
} from "../../../shared/utils/storage";
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../../audit/services/audit.service";

const COLLECTION_ID = env.collectionRepairReportsId;
const PARTS_COLLECTION_ID = env.collectionRepairedPartsId;
const FILES_COLLECTION_ID = env.collectionRepairFilesId;
const FILES_TABLE_ID = env.collectionFilesId;
const BUCKET_ID = env.bucketVehiclesId;

/**
 * Obtiene todos los reportes de reparación de un grupo
 */
export async function listRepairReports(groupId, filters = {}) {
  if (!groupId) return [];

  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("reportDate"),
    Query.limit(100),
  ];

  // Filtro por vehículo
  if (filters.vehicleId) {
    queries.push(Query.equal("vehicleId", filters.vehicleId));
  }

  // Filtro por status de reparación
  if (filters.repairStatus) {
    queries.push(Query.equal("status", filters.repairStatus));
  }

  // Filtro por prioridad
  if (filters.priority) {
    queries.push(Query.equal("priority", filters.priority));
  }

  // Filtro por tipo de daño
  if (filters.damageType) {
    queries.push(Query.equal("damageType", filters.damageType));
  }

  // Filtro por rango de fechas
  if (filters.startDate) {
    queries.push(Query.greaterThanEqual("reportDate", filters.startDate));
  }
  if (filters.endDate) {
    queries.push(Query.lessThanEqual("reportDate", filters.endDate));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    COLLECTION_ID,
    queries
  );
  return res.documents;
}

/**
 * Obtiene un reporte de reparación por ID
 */
export async function getRepairReportById(id) {
  const doc = await databases.getDocument(env.databaseId, COLLECTION_ID, id);
  return doc;
}

/**
 * Limpia los datos del reporte de reparación para enviar solo campos válidos a Appwrite
 * Basado en: repair_reports de db_mycad.md
 */
function cleanRepairReportData(data) {
  const cleanedData = {};

  // Campos requeridos (escalares para índices)
  if (data.groupId) cleanedData.groupId = data.groupId;
  if (data.vehicleId) cleanedData.vehicleId = data.vehicleId;
  if (data.createdByProfileId)
    cleanedData.createdByProfileId = data.createdByProfileId;
  if (data.reportDate) cleanedData.reportDate = data.reportDate;
  if (data.title) cleanedData.title = data.title;

  // Relaciones two-way (SIEMPRE enviar para navegación correcta)
  // NOTA: vehicle ahora es one-way, solo enviamos vehicleId escalar
  // createdByProfile: Two-way ↔ users_profile.createdRepairReports
  if (data.createdByProfileId)
    cleanedData.createdByProfile = data.createdByProfileId;

  // Campos opcionales - solo incluir si tienen valor
  if (data.description) cleanedData.description = data.description;
  if (data.status) cleanedData.status = data.status;
  if (data.priority) cleanedData.priority = data.priority;
  if (data.damageType) cleanedData.damageType = data.damageType;
  if (data.workshopName) cleanedData.workshopName = data.workshopName;
  if (data.workshopAddress) cleanedData.workshopAddress = data.workshopAddress;
  if (data.workshopPhone) cleanedData.workshopPhone = data.workshopPhone;
  if (data.startDate) cleanedData.startDate = data.startDate;
  if (data.completionDate) cleanedData.completionDate = data.completionDate;
  if (data.warrantyNotes) cleanedData.warrantyNotes = data.warrantyNotes;

  // Campos numéricos opcionales - convertir a número o null
  if (
    data.odometer !== undefined &&
    data.odometer !== "" &&
    data.odometer !== null
  ) {
    cleanedData.odometer = parseInt(data.odometer) || null;
  }
  if (
    data.costEstimate !== undefined &&
    data.costEstimate !== "" &&
    data.costEstimate !== null
  ) {
    cleanedData.costEstimate = parseFloat(data.costEstimate) || null;
  }
  if (
    data.finalCost !== undefined &&
    data.finalCost !== "" &&
    data.finalCost !== null
  ) {
    cleanedData.finalCost = parseFloat(data.finalCost) || null;
  }
  if (
    data.laborCost !== undefined &&
    data.laborCost !== "" &&
    data.laborCost !== null
  ) {
    cleanedData.laborCost = parseFloat(data.laborCost) || null;
  }
  if (
    data.partsCost !== undefined &&
    data.partsCost !== "" &&
    data.partsCost !== null
  ) {
    cleanedData.partsCost = parseFloat(data.partsCost) || null;
  }
  if (
    data.warrantyDays !== undefined &&
    data.warrantyDays !== "" &&
    data.warrantyDays !== null
  ) {
    cleanedData.warrantyDays = parseInt(data.warrantyDays) || null;
  }

  return cleanedData;
}

/**
 * Crea un nuevo reporte de reparación
 */
export async function createRepairReport(data, auditInfo = {}) {
  const { parts, stagedFiles, ...reportData } = data;

  // Limpiar datos para Appwrite
  const cleanedData = cleanRepairReportData(reportData);

  // Generar número de reporte
  const reportNumber = `REP-${Date.now().toString(36).toUpperCase()}`;

  // Crear el reporte principal
  const doc = await databases.createDocument(
    env.databaseId,
    COLLECTION_ID,
    ID.unique(),
    {
      ...cleanedData,
      reportNumber,
      status: cleanedData.status || "OPEN",
      enabled: true,
    }
  );

  // Crear las partes si existen (secuencialmente para evitar colisiones de ID)
  // Usamos 'unique()' string para que el SERVIDOR genere el ID, no el cliente
  if (parts && parts.length > 0) {
    for (const part of parts) {
      try {
        await databases.createDocument(
          env.databaseId,
          PARTS_COLLECTION_ID,
          "unique()",
          {
            name: part.name,
            quantity: parseInt(part.quantity) || 1,
            unitCost: parseFloat(part.unitCost) || 0,
            notes: part.notes || null,
            groupId: cleanedData.groupId,
            repairReportId: doc.$id,
            // Relación two-way con repair_reports
            repairReport: doc.$id,
            enabled: true,
          }
        );
      } catch (error) {
        // Si es error 409 (ya existe), ignorar - probable retry de red
        if (error?.code === 409 || error?.type === "document_already_exists") {
          console.warn(
            `[createRepairReport] Parte ya existe, ignorando (probable retry)`
          );
        } else {
          console.error("[createRepairReport] Error al crear parte:", error);
          throw error;
        }
      }
    }
  }

  // Auditoría
  if (auditInfo.profileId && cleanedData.groupId) {
    logAuditEvent({
      groupId: cleanedData.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.REPAIR_REPORT,
      entityId: doc.$id,
      entityName: cleanedData.title || reportNumber,
      details: {
        vehicleId: cleanedData.vehicleId,
        priority: cleanedData.priority,
      },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Actualiza un reporte de reparación existente
 */
export async function updateRepairReport(id, data, auditInfo = {}) {
  const { parts, stagedFiles, ...reportData } = data;

  // Limpiar datos para Appwrite (sin campos requeridos para update)
  const cleanedData = {};

  // Solo incluir campos que tienen valor
  if (reportData.title) cleanedData.title = reportData.title;
  if (reportData.reportDate) cleanedData.reportDate = reportData.reportDate;
  if (reportData.description !== undefined)
    cleanedData.description = reportData.description || null;
  if (reportData.status) cleanedData.status = reportData.status;
  if (reportData.priority) cleanedData.priority = reportData.priority;
  if (reportData.damageType) cleanedData.damageType = reportData.damageType;
  if (reportData.workshopName !== undefined)
    cleanedData.workshopName = reportData.workshopName || null;
  if (reportData.workshopAddress !== undefined)
    cleanedData.workshopAddress = reportData.workshopAddress || null;
  if (reportData.workshopPhone !== undefined)
    cleanedData.workshopPhone = reportData.workshopPhone || null;
  if (reportData.startDate !== undefined)
    cleanedData.startDate = reportData.startDate || null;
  if (reportData.completionDate !== undefined)
    cleanedData.completionDate = reportData.completionDate || null;
  if (reportData.warrantyNotes !== undefined)
    cleanedData.warrantyNotes = reportData.warrantyNotes || null;

  // Campos numéricos
  if (reportData.odometer !== undefined && reportData.odometer !== "") {
    cleanedData.odometer = parseInt(reportData.odometer) || null;
  }
  if (reportData.costEstimate !== undefined && reportData.costEstimate !== "") {
    cleanedData.costEstimate = parseFloat(reportData.costEstimate) || null;
  }
  if (reportData.finalCost !== undefined && reportData.finalCost !== "") {
    cleanedData.finalCost = parseFloat(reportData.finalCost) || null;
  }
  if (reportData.laborCost !== undefined && reportData.laborCost !== "") {
    cleanedData.laborCost = parseFloat(reportData.laborCost) || null;
  }
  if (reportData.partsCost !== undefined && reportData.partsCost !== "") {
    cleanedData.partsCost = parseFloat(reportData.partsCost) || null;
  }
  if (reportData.warrantyDays !== undefined && reportData.warrantyDays !== "") {
    cleanedData.warrantyDays = parseInt(reportData.warrantyDays) || null;
  }

  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    cleanedData
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.REPAIR_REPORT,
      entityId: id,
      entityName:
        cleanedData.title || auditInfo.reportTitle || "Reporte de reparación",
      details: { updatedFields: Object.keys(cleanedData) },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Finaliza un reporte de reparación (bloquea edición)
 */
export async function finalizeRepairReport(
  id,
  finalizedByProfileId,
  auditInfo = {}
) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    {
      status: "DONE",
      finalizedAt: new Date().toISOString(),
      finalizedByProfileId,
    }
  );

  // Auditoría
  if (finalizedByProfileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: finalizedByProfileId,
      action: AUDIT_ACTIONS.OTHER,
      entityType: ENTITY_TYPES.REPAIR_REPORT,
      entityId: id,
      entityName: auditInfo.reportTitle || "Reporte de reparación",
      details: { action: "finalized" },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Reabre un reporte finalizado (solo admin)
 */
export async function reopenRepairReport(id, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    {
      status: "IN_PROGRESS",
      finalizedAt: null,
      finalizedByProfileId: null,
    }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.OTHER,
      entityType: ENTITY_TYPES.REPAIR_REPORT,
      entityId: id,
      entityName: auditInfo.reportTitle || "Reporte de reparación",
      details: { action: "reopened" },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Elimina un reporte de reparación (soft delete)
 */
export async function deleteRepairReport(id, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    {
      enabled: false,
    }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.REPAIR_REPORT,
      entityId: id,
      entityName: auditInfo.reportTitle || "Reporte de reparación",
    }).catch(console.error);
  }

  return doc;
}

// ============================================
// PARTES REPARADAS
// ============================================

/**
 * Obtiene las partes de un reporte de reparación
 */
export async function getRepairReportParts(repairReportId) {
  const res = await databases.listDocuments(
    env.databaseId,
    PARTS_COLLECTION_ID,
    [
      Query.equal("repairReportId", repairReportId),
      Query.equal("enabled", true),
      Query.orderAsc("$createdAt"),
    ]
  );
  return res.documents;
}

/**
 * Agrega una parte a un reporte de reparación
 */
export async function addRepairReportPart(repairReportId, groupId, partData) {
  // Dejar que Appwrite genere el ID en el servidor
  const doc = await databases.createDocument(
    env.databaseId,
    PARTS_COLLECTION_ID,
    ID.unique(),
    {
      name: partData.name,
      quantity: partData.quantity,
      unitCost: partData.unitCost || 0,
      notes: partData.notes || null,
      groupId,
      repairReportId,
      enabled: true,
      repairReport: repairReportId,
    }
  );
  return doc;
}

/**
 * Actualiza una parte reparada
 */
export async function updateRepairReportPart(partId, data) {
  const doc = await databases.updateDocument(
    env.databaseId,
    PARTS_COLLECTION_ID,
    partId,
    data
  );
  return doc;
}

/**
 * Elimina una parte (soft delete)
 */
export async function deleteRepairReportPart(partId) {
  const doc = await databases.updateDocument(
    env.databaseId,
    PARTS_COLLECTION_ID,
    partId,
    { enabled: false }
  );
  return doc;
}

// ============================================
// ARCHIVOS
// ============================================

/**
 * Obtiene los archivos de un reporte de reparación
 */
export async function getRepairReportFiles(repairReportId) {
  const res = await databases.listDocuments(
    env.databaseId,
    FILES_COLLECTION_ID,
    [
      Query.equal("repairReportId", repairReportId),
      Query.equal("enabled", true),
    ]
  );
  return res.documents;
}

/**
 * Sube un archivo y lo registra en el reporte
 */
export async function uploadRepairReportFile(
  repairReportId,
  groupId,
  file,
  profileId
) {
  // Subir a storage
  const storageFile = await storage.createFile(BUCKET_ID, ID.unique(), file);

  // 1. Crear documento en tabla 'files'
  const fileDoc = await databases.createDocument(
    env.databaseId,
    FILES_TABLE_ID,
    ID.unique(),
    {
      groupId,
      storageFileId: storageFile.$id,
      ownerProfileId: profileId,
      name: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      enabled: true,
      // Relación two-way
      ownerProfile: profileId,
    }
  );

  // 2. Crear documento en 'repair_files' apuntando al documento 'files'
  const linkDoc = await databases.createDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      repairReportId,
      fileId: fileDoc.$id, // ID del documento en 'files', no del storage
      enabled: true,
      // Relaciones two-way
      repairReport: repairReportId,
      file: fileDoc.$id,
    }
  );

  return { storageFile, fileDoc, linkDoc };
}

/**
 * Elimina un archivo del reporte
 */
export async function deleteRepairReportFile(fileDocId, storageFileId) {
  await databases.updateDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    fileDocId,
    {
      enabled: false,
    }
  );

  try {
    await storage.deleteFile(BUCKET_ID, storageFileId);
  } catch (e) {
    console.warn("Error deleting file from storage:", e);
  }
}

/**
 * Obtiene la URL de preview de un archivo
 */
export function getRepairFilePreviewUrl(fileId) {
  return getFilePreviewUrl(BUCKET_ID, fileId, { width: 400, height: 400 });
}

/**
 * Obtiene la URL de descarga de un archivo
 */
export function getRepairFileDownloadUrl(fileId) {
  return getFileDownloadUrl(BUCKET_ID, fileId);
}

/**
 * Genera el PDF del reporte de reparación
 * @param {string} reportId - ID del reporte
 * @param {boolean} regenerate - Si es true, regenera el PDF aunque ya exista
 * @returns {Promise<{success: boolean, fileId: string, fileName: string}>}
 */
export async function generateRepairReportPDF(reportId, regenerate = false) {
  if (!env.fnGeneratePdfId) {
    throw new Error("Function ID for PDF generation is not configured");
  }

  const execution = await functions.createExecution(
    env.fnGeneratePdfId,
    JSON.stringify({
      reportType: "repair",
      reportId,
      regenerate,
    })
  );

  // Esperar a que termine la ejecución
  if (execution.status === "failed") {
    throw new Error(execution.responseBody || "Failed to generate PDF");
  }

  const response = JSON.parse(execution.responseBody);
  if (!response.success) {
    throw new Error(response.error || "Failed to generate PDF");
  }

  return response;
}

/**
 * Obtiene la URL de descarga del PDF del reporte
 */
export function getRepairReportPDFUrl(fileId) {
  if (!fileId) return null;
  return getFileDownloadUrl(env.bucketReportFilesId, fileId);
}

/**
 * Obtiene la URL de preview del PDF del reporte
 */
export function getRepairReportPDFPreviewUrl(fileId) {
  if (!fileId) return null;
  return getFilePreviewUrl(env.bucketReportFilesId, fileId);
}
