import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

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

export async function createDriver(data) {
  return await databases.createDocument(
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
}

export async function updateDriver(id, data) {
  return await databases.updateDocument(
    env.databaseId,
    DRIVERS_COLLECTION_ID,
    id,
    data
  );
}

export async function deleteDriver(id) {
  // Soft delete
  return await databases.updateDocument(
    env.databaseId,
    DRIVERS_COLLECTION_ID,
    id,
    { enabled: false }
  );
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

export async function createDriverLicense(data) {
  return await databases.createDocument(
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
}

export async function updateDriverLicense(id, data) {
  return await databases.updateDocument(
    env.databaseId,
    LICENSES_COLLECTION_ID,
    id,
    data
  );
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
  label = ""
) {
  return await databases.createDocument(
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

export async function deleteDriverFile(docId, fileId) {
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
}

export function getDriverFilePreview(fileId) {
  return storage.getFilePreview(BUCKET_ID, fileId);
}

export function getDriverFileDownload(fileId) {
  return storage.getFileDownload(BUCKET_ID, fileId);
}
