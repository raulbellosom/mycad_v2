import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionVehiclesId;
const FILES_COLLECTION_ID = env.collectionVehicleFilesId;
const BUCKET_ID = env.bucketVehiclesId;

export async function listVehicles(groupId) {
  if (!groupId) return [];
  const res = await databases.listDocuments(env.databaseId, COLLECTION_ID, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
}

export async function getVehicleById(id) {
  const doc = await databases.getDocument(env.databaseId, COLLECTION_ID, id);
  return doc;
}

export async function createVehicle(data) {
  const doc = await databases.createDocument(
    env.databaseId,
    COLLECTION_ID,
    ID.unique(),
    {
      ...data,
      enabled: true,
      status: "ACTIVE",
      // Relaciones two-way
      group: data.groupId, // relación → groups
      ownerProfile: data.ownerProfileId, // relación → users_profile
      type: data.typeId || null, // relación → vehicle_types
      brand: data.brandId || null, // relación → vehicle_brands
      model: data.modelId || null, // relación → vehicle_models
    }
  );
  return doc;
}

export async function updateVehicle(id, data) {
  const doc = await databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    id,
    data
  );
  return doc;
}

export async function deleteVehicle(id) {
  // Soft delete
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

// --- File Management ---

/**
 * Uploads a physical file to Storage and returns the storage response.
 * This is used for "staged" uploads before the vehicle is created/saved.
 */
export async function uploadFileToStorage(file) {
  const res = await storage.createFile(BUCKET_ID, ID.unique(), file);
  return res;
}

/**
 * Registers a file in the database collection.
 * This links a storage fileId to a vehicleId and groupId.
 */
export async function registerFileInDb(
  vehicleId,
  groupId,
  storageFileId,
  fileName,
  fileType,
  fileSize
) {
  const isImage = fileType.startsWith("image/");
  const doc = await databases.createDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    ID.unique(),
    {
      vehicleId,
      groupId,
      fileId: storageFileId,
      name: fileName,
      type: fileType,
      size: fileSize,
      isImage,
      enabled: true,
      kind: isImage ? "IMAGE" : "DOCUMENT",
      // Relaciones two-way
      vehicle: vehicleId, // relación → vehicles
    }
  );
  return doc;
}

/**
 * Legacy/Convenience function that does both at once.
 */
export async function uploadVehicleFile(vehicleId, groupId, file) {
  const storageRes = await uploadFileToStorage(file);
  const fileRecord = await registerFileInDb(
    vehicleId,
    groupId,
    storageRes.$id,
    file.name,
    file.type,
    file.size
  );
  return { storageRes, fileRecord };
}

export async function listVehicleFiles(vehicleId) {
  if (!vehicleId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    FILES_COLLECTION_ID,
    [
      Query.equal("vehicleId", vehicleId),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
    ]
  );
  return res.documents;
}

export async function deleteVehicleFile(docId, fileId) {
  // 1. Delete from database
  if (docId) {
    await databases.deleteDocument(env.databaseId, FILES_COLLECTION_ID, docId);
  }

  // 2. Delete from storage
  if (fileId) {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error("Error deleting file from storage:", error);
    }
  }
}

export function getFilePreview(fileId) {
  return storage.getFilePreview(BUCKET_ID, fileId);
}

export function getFileView(fileId) {
  return storage.getFileView(BUCKET_ID, fileId);
}

export function getFileDownload(fileId) {
  return storage.getFileDownload(BUCKET_ID, fileId);
}
