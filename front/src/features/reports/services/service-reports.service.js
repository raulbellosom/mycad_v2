import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionServiceHistoriesId;
const PARTS_COLLECTION_ID = env.collectionReplacedPartsId;
const FILES_COLLECTION_ID = env.collectionServiceFilesId;
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
 * Crea un nuevo reporte de servicio
 */
export async function createServiceReport(data) {
  const { parts, ...reportData } = data;

  // Crear el reporte principal
  const doc = await databases.createDocument(
    env.databaseId,
    COLLECTION_ID,
    ID.unique(),
    {
      ...reportData,
      status: "DRAFT",
      enabled: true,
      // Relaciones two-way
      vehicle: reportData.vehicleId, // relación → vehicles
      createdByProfile: reportData.createdByProfileId, // relación → users_profile
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
            serviceHistoryId: doc.$id,
            enabled: true,
            // Relaciones two-way
            serviceHistory: doc.$id, // relación → service_histories
          }
        )
      )
    );
  }

  return doc;
}

/**
 * Actualiza un reporte de servicio existente
 */
export async function updateServiceReport(id, data) {
  const { parts, ...reportData } = data;

  // Actualizar el reporte principal
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    reportData
  );

  return doc;
}

/**
 * Finaliza un reporte de servicio (bloquea edición)
 */
export async function finalizeServiceReport(id, finalizedByProfileId) {
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
  return doc;
}

/**
 * Reabre un reporte finalizado (solo admin)
 */
export async function reopenServiceReport(id) {
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
  return doc;
}

/**
 * Elimina un reporte de servicio (soft delete)
 */
export async function deleteServiceReport(id) {
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
  const doc = await databases.createDocument(
    env.databaseId,
    PARTS_COLLECTION_ID,
    ID.unique(),
    {
      ...partData,
      groupId,
      serviceHistoryId,
      enabled: true,
      // Relaciones two-way
      serviceHistory: serviceHistoryId, // relación → service_histories
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
export async function uploadServiceReportFile(serviceHistoryId, groupId, file) {
  // Subir a storage
  const storageFile = await storage.createFile(BUCKET_ID, ID.unique(), file);

  // Registrar en BD
  const doc = await databases.createDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      serviceHistoryId,
      fileId: storageFile.$id,
      enabled: true,
      // Relaciones two-way
      serviceHistory: serviceHistoryId, // relación → service_histories
    }
  );

  return { storageFile, doc };
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
  return storage.getFilePreview(BUCKET_ID, fileId, 400, 400);
}

/**
 * Obtiene la URL de descarga de un archivo
 */
export function getServiceFileDownloadUrl(fileId) {
  return storage.getFileDownload(BUCKET_ID, fileId);
}
