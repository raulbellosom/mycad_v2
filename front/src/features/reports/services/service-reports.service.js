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

const COLLECTION_ID = env.collectionServiceHistoriesId;
const PARTS_COLLECTION_ID = env.collectionReplacedPartsId;
const FILES_COLLECTION_ID = env.collectionServiceFilesId;
const FILES_TABLE_ID = env.collectionFilesId;
const BUCKET_ID = env.bucketVehiclesId;

/**
 * Obtiene todos los reportes de servicio de un grupo
 */
export async function listServiceReports(groupId, filters = {}) {
  if (!groupId) return [];

  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("serviceDate"),
    Query.limit(100),
  ];

  // Filtro por vehículo
  if (filters.vehicleId) {
    queries.push(Query.equal("vehicleId", filters.vehicleId));
  }

  // Filtro por status
  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }

  // Filtro por tipo de servicio
  if (filters.serviceType) {
    queries.push(Query.equal("serviceType", filters.serviceType));
  }

  // Filtro por rango de fechas
  if (filters.startDate) {
    queries.push(Query.greaterThanEqual("serviceDate", filters.startDate));
  }
  if (filters.endDate) {
    queries.push(Query.lessThanEqual("serviceDate", filters.endDate));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    COLLECTION_ID,
    queries
  );
  return res.documents;
}

/**
 * Obtiene un reporte de servicio por ID con sus partes
 */
export async function getServiceReportById(id) {
  const doc = await databases.getDocument(env.databaseId, COLLECTION_ID, id);
  return doc;
}

/**
 * Limpia los datos del reporte de servicio para enviar solo campos válidos a Appwrite
 * Basado en: service_histories de db_mycad.md
 */
function cleanServiceReportData(data) {
  const cleanedData = {};

  // Campos requeridos (escalares para índices)
  if (data.groupId) cleanedData.groupId = data.groupId;
  if (data.vehicleId) cleanedData.vehicleId = data.vehicleId;
  if (data.createdByProfileId)
    cleanedData.createdByProfileId = data.createdByProfileId;
  if (data.serviceDate) cleanedData.serviceDate = data.serviceDate;
  if (data.title) cleanedData.title = data.title;

  // Relaciones two-way (SIEMPRE enviar para navegación correcta)
  // NOTA: vehicle ahora es one-way, solo enviamos vehicleId escalar
  // createdByProfile: Two-way ↔ users_profile.createdServiceHistories
  if (data.createdByProfileId)
    cleanedData.createdByProfile = data.createdByProfileId;

  // Campos opcionales - solo incluir si tienen valor
  if (data.description) cleanedData.description = data.description;
  if (data.vendorName) cleanedData.vendorName = data.vendorName;
  if (data.serviceType) cleanedData.serviceType = data.serviceType;
  if (data.invoiceNumber) cleanedData.invoiceNumber = data.invoiceNumber;
  if (data.workshopAddress) cleanedData.workshopAddress = data.workshopAddress;
  if (data.workshopPhone) cleanedData.workshopPhone = data.workshopPhone;
  if (data.nextServiceDate) cleanedData.nextServiceDate = data.nextServiceDate;

  // Campos numéricos opcionales - convertir a número o null
  if (
    data.odometer !== undefined &&
    data.odometer !== "" &&
    data.odometer !== null
  ) {
    cleanedData.odometer = parseInt(data.odometer) || null;
  }
  if (data.cost !== undefined && data.cost !== "" && data.cost !== null) {
    cleanedData.cost = parseFloat(data.cost) || null;
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
    data.nextServiceOdometer !== undefined &&
    data.nextServiceOdometer !== "" &&
    data.nextServiceOdometer !== null
  ) {
    cleanedData.nextServiceOdometer =
      parseInt(data.nextServiceOdometer) || null;
  }

  return cleanedData;
}

/**
 * Crea un nuevo reporte de servicio
 */
export async function createServiceReport(data, auditInfo = {}) {
  const { parts, stagedFiles, ...reportData } = data;

  // Limpiar datos para Appwrite
  const cleanedData = cleanServiceReportData(reportData);

  // Crear el reporte principal
  const doc = await databases.createDocument(
    env.databaseId,
    COLLECTION_ID,
    ID.unique(),
    {
      ...cleanedData,
      status: "DRAFT",
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
            serviceHistoryId: doc.$id,
            // Relación two-way con service_histories
            serviceHistory: doc.$id,
            enabled: true,
          }
        );
      } catch (error) {
        // Si es error 409 (ya existe), ignorar - probable retry de red
        if (error?.code === 409 || error?.type === "document_already_exists") {
          console.warn(
            `[createServiceReport] Parte ya existe, ignorando (probable retry)`
          );
        } else {
          console.error("[createServiceReport] Error al crear parte:", error);
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
      entityType: ENTITY_TYPES.SERVICE_REPORT,
      entityId: doc.$id,
      entityName: cleanedData.title || "Reporte de servicio",
      details: {
        vehicleId: cleanedData.vehicleId,
        serviceType: cleanedData.serviceType,
      },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Actualiza un reporte de servicio existente
 */
export async function updateServiceReport(id, data, auditInfo = {}) {
  const { parts, stagedFiles, ...reportData } = data;

  // Limpiar datos para Appwrite (sin campos requeridos para update)
  const cleanedData = {};

  // Solo incluir campos que tienen valor
  if (reportData.title) cleanedData.title = reportData.title;
  if (reportData.serviceDate) cleanedData.serviceDate = reportData.serviceDate;
  if (reportData.description !== undefined)
    cleanedData.description = reportData.description || null;
  if (reportData.vendorName !== undefined)
    cleanedData.vendorName = reportData.vendorName || null;
  if (reportData.serviceType) cleanedData.serviceType = reportData.serviceType;
  if (reportData.invoiceNumber !== undefined)
    cleanedData.invoiceNumber = reportData.invoiceNumber || null;
  if (reportData.workshopAddress !== undefined)
    cleanedData.workshopAddress = reportData.workshopAddress || null;
  if (reportData.workshopPhone !== undefined)
    cleanedData.workshopPhone = reportData.workshopPhone || null;
  if (reportData.nextServiceDate !== undefined)
    cleanedData.nextServiceDate = reportData.nextServiceDate || null;

  // Campos numéricos
  if (reportData.odometer !== undefined && reportData.odometer !== "") {
    cleanedData.odometer = parseInt(reportData.odometer) || null;
  }
  if (reportData.laborCost !== undefined && reportData.laborCost !== "") {
    cleanedData.laborCost = parseFloat(reportData.laborCost) || null;
  }
  if (reportData.partsCost !== undefined && reportData.partsCost !== "") {
    cleanedData.partsCost = parseFloat(reportData.partsCost) || null;
  }
  if (
    reportData.nextServiceOdometer !== undefined &&
    reportData.nextServiceOdometer !== ""
  ) {
    cleanedData.nextServiceOdometer =
      parseInt(reportData.nextServiceOdometer) || null;
  }

  // Actualizar el reporte principal
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
      entityType: ENTITY_TYPES.SERVICE_REPORT,
      entityId: id,
      entityName:
        cleanedData.title || auditInfo.reportTitle || "Reporte de servicio",
      details: { updatedFields: Object.keys(cleanedData) },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Finaliza un reporte de servicio (bloquea edición)
 */
export async function finalizeServiceReport(
  id,
  finalizedByProfileId,
  auditInfo = {}
) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    {
      status: "FINALIZED",
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
      entityType: ENTITY_TYPES.SERVICE_REPORT,
      entityId: id,
      entityName: auditInfo.reportTitle || "Reporte de servicio",
      details: { action: "finalized" },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Reabre un reporte finalizado (solo admin)
 */
export async function reopenServiceReport(id, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    {
      status: "DRAFT",
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
      entityType: ENTITY_TYPES.SERVICE_REPORT,
      entityId: id,
      entityName: auditInfo.reportTitle || "Reporte de servicio",
      details: { action: "reopened" },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Elimina un reporte de servicio (soft delete)
 */
export async function deleteServiceReport(id, auditInfo = {}) {
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
      entityType: ENTITY_TYPES.SERVICE_REPORT,
      entityId: id,
      entityName: auditInfo.reportTitle || "Reporte de servicio",
    }).catch(console.error);
  }

  return doc;
}

// ============================================
// PARTES / REFACCIONES
// ============================================

/**
 * Obtiene las partes de un reporte de servicio
 */
export async function getServiceReportParts(serviceHistoryId) {
  const res = await databases.listDocuments(
    env.databaseId,
    PARTS_COLLECTION_ID,
    [
      Query.equal("serviceHistoryId", serviceHistoryId),
      Query.equal("enabled", true),
      Query.orderAsc("$createdAt"),
    ]
  );
  return res.documents;
}

/**
 * Agrega una parte a un reporte de servicio
 */
export async function addServiceReportPart(
  serviceHistoryId,
  groupId,
  partData
) {
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
      serviceHistoryId,
      enabled: true,
      serviceHistory: serviceHistoryId,
    }
  );
  return doc;
}

/**
 * Actualiza una parte
 */
export async function updateServiceReportPart(partId, data) {
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
export async function deleteServiceReportPart(partId) {
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
 * Obtiene los archivos de un reporte de servicio
 */
export async function getServiceReportFiles(serviceHistoryId) {
  const res = await databases.listDocuments(
    env.databaseId,
    FILES_COLLECTION_ID,
    [
      Query.equal("serviceHistoryId", serviceHistoryId),
      Query.equal("enabled", true),
    ]
  );
  return res.documents;
}

/**
 * Sube un archivo y lo registra en el reporte
 */
export async function uploadServiceReportFile(
  serviceHistoryId,
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

  // 2. Crear documento en 'service_files' apuntando al documento 'files'
  const linkDoc = await databases.createDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      serviceHistoryId,
      fileId: fileDoc.$id, // ID del documento en 'files', no del storage
      enabled: true,
      // Relaciones two-way
      serviceHistory: serviceHistoryId,
      file: fileDoc.$id,
    }
  );

  return { storageFile, fileDoc, linkDoc };
}

/**
 * Elimina un archivo del reporte
 */
export async function deleteServiceReportFile(fileDocId, storageFileId) {
  // Soft delete del registro
  await databases.updateDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    fileDocId,
    {
      enabled: false,
    }
  );

  // Eliminar de storage (opcional, se puede hacer en cleanup)
  try {
    await storage.deleteFile(BUCKET_ID, storageFileId);
  } catch (e) {
    console.warn("Error deleting file from storage:", e);
  }
}

/**
 * Obtiene la URL de preview de un archivo
 */
export function getServiceFilePreviewUrl(fileId) {
  return getFilePreviewUrl(BUCKET_ID, fileId, { width: 400, height: 400 });
}

/**
 * Obtiene la URL de descarga de un archivo
 */
export function getServiceFileDownloadUrl(fileId) {
  return getFileDownloadUrl(BUCKET_ID, fileId);
}

/**
 * Genera el PDF del reporte de servicio
 * @param {string} reportId - ID del reporte
 * @param {boolean} regenerate - Si es true, regenera el PDF aunque ya exista
 * @returns {Promise<{success: boolean, fileId: string, fileName: string}>}
 */
export async function generateServiceReportPDF(reportId, regenerate = false) {
  if (!env.fnGeneratePdfId) {
    throw new Error("Function ID for PDF generation is not configured");
  }

  const execution = await functions.createExecution(
    env.fnGeneratePdfId,
    JSON.stringify({
      reportType: "service",
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
export function getServiceReportPDFUrl(fileId) {
  if (!fileId) return null;
  return getFileDownloadUrl(env.bucketReportFilesId, fileId);
}

/**
 * Obtiene la URL de preview del PDF del reporte
 */
export function getServiceReportPDFPreviewUrl(fileId) {
  if (!fileId) return null;
  return getFilePreviewUrl(env.bucketReportFilesId, fileId);
}
