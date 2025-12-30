import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
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

const DRIVERS_COLLECTION_ID = env.collectionDriversId;
const LICENSES_COLLECTION_ID = env.collectionDriverLicensesId;
const DRIVER_FILES_COLLECTION_ID = env.collectionDriverFilesId;
const BUCKET_ID = env.bucketVehiclesId; // Placeholder: using vehicles bucket until a dedicated drivers bucket is created

// --- Driver CRUD ---

export async function listDrivers(groupId) {
  if (!groupId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    DRIVERS_COLLECTION_ID,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
    ]
  );
  return res.documents;
}

export async function getDriverById(id) {
  return await databases.getDocument(env.databaseId, DRIVERS_COLLECTION_ID, id);
}

export async function createDriver(data, auditInfo = {}) {
  const doc = await databases.createDocument(
    env.databaseId,
    DRIVERS_COLLECTION_ID,
    ID.unique(),
    {
      ...data,
      enabled: true,
      status: data.status || "ACTIVE",
      // Relaciones two-way
      linkedProfile: data.linkedProfileId || null, // relación → users_profile
    }
  );

  // Auditoría
  if (auditInfo.profileId && data.groupId) {
    logAuditEvent({
      groupId: data.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.DRIVER,
      entityId: doc.$id,
      entityName:
        `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
        "Conductor nuevo",
      details: { licenseNumber: data.licenseNumber },
    }).catch(console.error);
  }

  return doc;
}

export async function updateDriver(id, data, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    DRIVERS_COLLECTION_ID,
    id,
    data
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.DRIVER,
      entityId: id,
      entityName: auditInfo.driverName || "Conductor",
      details: { updatedFields: Object.keys(data) },
    }).catch(console.error);
  }

  return doc;
}

export async function deleteDriver(id, auditInfo = {}) {
  // Soft delete
  const doc = await databases.updateDocument(
    env.databaseId,
    DRIVERS_COLLECTION_ID,
    id,
    { enabled: false }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.DRIVER,
      entityId: id,
      entityName: auditInfo.driverName || "Conductor",
    }).catch(console.error);
  }

  return doc;
}

// --- License Management ---

export async function listDriverLicenses(driverId) {
  if (!driverId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    LICENSES_COLLECTION_ID,
    [Query.equal("driverId", driverId), Query.equal("enabled", true)]
  );
  return res.documents;
}

export async function createDriverLicense(data, auditInfo = {}) {
  const doc = await databases.createDocument(
    env.databaseId,
    LICENSES_COLLECTION_ID,
    ID.unique(),
    {
      ...data,
      enabled: true,
      // Relaciones two-way
      driver: data.driverId, // relación → drivers
    }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.OTHER,
      entityId: doc.$id,
      entityName: `Licencia: ${data.licenseNumber || ""} (${
        auditInfo.driverName || "Conductor"
      })`,
      details: { licenseNumber: data.licenseNumber, driverId: data.driverId },
    }).catch(console.error);
  }

  return doc;
}

export async function updateDriverLicense(id, data, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    LICENSES_COLLECTION_ID,
    id,
    data
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.OTHER,
      entityId: id,
      entityName: `Licencia actualizada (${
        auditInfo.driverName || "Conductor"
      })`,
      details: { updatedFields: Object.keys(data) },
    }).catch(console.error);
  }

  return doc;
}

// --- Driver File Management ---

export async function uploadDriverFile(file) {
  return await storage.createFile(BUCKET_ID, ID.unique(), file);
}

export async function registerDriverFileInDb(
  driverId,
  groupId,
  storageFileId,
  kind,
  label = "",
  auditInfo = {}
) {
  const doc = await databases.createDocument(
    env.databaseId,
    DRIVER_FILES_COLLECTION_ID,
    ID.unique(),
    {
      driverId,
      groupId,
      fileId: storageFileId,
      kind,
      label,
      enabled: true,
      // Relaciones two-way
      driver: driverId, // relación → drivers
    }
  );

  // Auditoría
  if (auditInfo.profileId && groupId) {
    logAuditEvent({
      groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.OTHER,
      entityType: ENTITY_TYPES.FILE,
      entityId: doc.$id,
      entityName: `Archivo: ${label || kind} (${
        auditInfo.driverName || "Conductor"
      })`,
      details: { kind, label, driverId },
    }).catch(console.error);
  }

  return doc;
}

export async function listDriverFiles(driverId) {
  if (!driverId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    DRIVER_FILES_COLLECTION_ID,
    [Query.equal("driverId", driverId), Query.equal("enabled", true)]
  );
  return res.documents;
}

export async function deleteDriverFile(docId, fileId, auditInfo = {}) {
  if (docId) {
    await databases.deleteDocument(
      env.databaseId,
      DRIVER_FILES_COLLECTION_ID,
      docId
    );
  }

  if (fileId) {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error("Error deleting driver file from storage:", error);
    }
  }

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.FILE,
      entityId: docId || fileId,
      entityName: `Archivo eliminado (${auditInfo.driverName || "Conductor"})`,
      details: { fileLabel: auditInfo.fileLabel },
    }).catch(console.error);
  }
}

export function getDriverFilePreview(fileId, width, height) {
  return getFilePreviewUrl(BUCKET_ID, fileId, { width, height });
}

export function getDriverFileDownload(fileId) {
  return getFileDownloadUrl(BUCKET_ID, fileId);
}
