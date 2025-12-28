import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionRepairReportsId;
const PARTS_COLLECTION_ID = env.collectionRepairedPartsId;
const FILES_COLLECTION_ID = env.collectionRepairFilesId;
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
 * Crea un nuevo reporte de reparación
 */
export async function createRepairReport(data) {
  const { parts, ...reportData } = data;

  // Generar número de reporte
  const reportNumber = `REP-${Date.now().toString(36).toUpperCase()}`;

  // Crear el reporte principal
  const doc = await databases.createDocument(
    env.databaseId,
    COLLECTION_ID,
    ID.unique(),
    {
      ...reportData,
      reportNumber,
      status: reportData.status || "OPEN",
      enabled: true,
    }
  );

  // Crear las partes si existen
  if (parts && parts.length > 0) {
    await Promise.all(
      parts.map((part) =>
        databases.createDocument(
          env.databaseId,
          PARTS_COLLECTION_ID,
          ID.unique(),
          {
            ...part,
            groupId: reportData.groupId,
            repairReportId: doc.$id,
            enabled: true,
          }
        )
      )
    );
  }

  return doc;
}

/**
 * Actualiza un reporte de reparación existente
 */
export async function updateRepairReport(id, data) {
  const { parts, ...reportData } = data;

  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    reportData
  );

  return doc;
}

/**
 * Finaliza un reporte de reparación (bloquea edición)
 */
export async function finalizeRepairReport(id, finalizedByProfileId) {
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
  return doc;
}

/**
 * Reabre un reporte finalizado (solo admin)
 */
export async function reopenRepairReport(id) {
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
  return doc;
}

/**
 * Elimina un reporte de reparación (soft delete)
 */
export async function deleteRepairReport(id) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    {
      enabled: false,
    }
  );
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
  const doc = await databases.createDocument(
    env.databaseId,
    PARTS_COLLECTION_ID,
    ID.unique(),
    {
      ...partData,
      groupId,
      repairReportId,
      enabled: true,
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
export async function uploadRepairReportFile(repairReportId, groupId, file) {
  // Subir a storage
  const storageFile = await storage.createFile(BUCKET_ID, ID.unique(), file);

  // Registrar en BD
  const doc = await databases.createDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      repairReportId,
      fileId: storageFile.$id,
      enabled: true,
    }
  );

  return { storageFile, doc };
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
  return storage.getFilePreview(BUCKET_ID, fileId, 400, 400);
}

/**
 * Obtiene la URL de descarga de un archivo
 */
export function getRepairFileDownloadUrl(fileId) {
  return storage.getFileDownload(BUCKET_ID, fileId);
}
