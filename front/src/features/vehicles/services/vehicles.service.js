import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionVehiclesId;
const VEHICLE_FILES_COLLECTION_ID = env.collectionVehicleFilesId;
const FILES_COLLECTION_ID = env.collectionFilesId;
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
 * Registers a file in the database collections.
 * 1. Creates record in 'files' collection with metadata
 * 2. Creates record in 'vehicle_files' collection to link vehicle with file
 */
export async function registerFileInDb(
  vehicleId,
  groupId,
  storageFileId,
  fileName,
  fileType,
  fileSize,
  ownerProfileId
) {
  const isImage = fileType.startsWith("image/");

  console.log("[registerFileInDb] Creating file record:", {
    collectionId: FILES_COLLECTION_ID,
    groupId,
    storageFileId,
    ownerProfileId,
    fileName,
  });

  // 1. Create record in 'files' collection with metadata
  const fileDoc = await databases.createDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      storageFileId,
      ownerProfileId,
      name: fileName,
      mimeType: fileType,
      sizeBytes: fileSize,
      enabled: true,
    }
  );

  console.log("[registerFileInDb] File record created:", fileDoc.$id);

  // 2. Create record in 'vehicle_files' collection (join table)
  const vehicleFileDoc = await databases.createDocument(
    env.databaseId,
    VEHICLE_FILES_COLLECTION_ID,
    ID.unique(),
    {
      groupId,
      vehicleId,
      fileId: fileDoc.$id, // Reference to files.$id
      kind: isImage ? "IMAGE" : "DOCUMENT",
      name: fileName,
      enabled: true,
    }
  );

  return { fileDoc, vehicleFileDoc };
}

/**
 * Legacy/Convenience function that does both at once.
 * Note: ownerProfileId is required for the files collection
 */
export async function uploadVehicleFile(
  vehicleId,
  groupId,
  file,
  ownerProfileId
) {
  const storageRes = await uploadFileToStorage(file);
  const result = await registerFileInDb(
    vehicleId,
    groupId,
    storageRes.$id,
    file.name,
    file.type,
    file.size,
    ownerProfileId
  );
  return { storageRes, ...result };
}

/**
 * Lists files associated with a vehicle.
 * Queries vehicle_files (join table) and enriches with file metadata.
 * Returns documents with both vehicle_files info and the storageFileId for previews.
 */
export async function listVehicleFiles(vehicleId) {
  if (!vehicleId) return [];

  // Get vehicle_files records
  const res = await databases.listDocuments(
    env.databaseId,
    VEHICLE_FILES_COLLECTION_ID,
    [
      Query.equal("vehicleId", vehicleId),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
    ]
  );

  // Enrich each vehicle_file with the storageFileId from files collection
  const enrichedFiles = await Promise.all(
    res.documents.map(async (vf) => {
      try {
        // If there's a 'file' relationship expanded, use it
        if (vf.file && vf.file.storageFileId) {
          return {
            ...vf,
            storageFileId: vf.file.storageFileId,
            mimeType: vf.file.mimeType,
            isImage:
              vf.file.mimeType?.startsWith("image/") || vf.kind === "IMAGE",
          };
        }

        // Otherwise fetch the file metadata
        const fileDoc = await databases.getDocument(
          env.databaseId,
          FILES_COLLECTION_ID,
          vf.fileId
        );
        return {
          ...vf,
          storageFileId: fileDoc.storageFileId,
          mimeType: fileDoc.mimeType,
          isImage:
            fileDoc.mimeType?.startsWith("image/") || vf.kind === "IMAGE",
        };
      } catch (error) {
        console.error(`Error fetching file metadata for ${vf.fileId}:`, error);
        // Return with what we have
        return {
          ...vf,
          storageFileId: vf.fileId, // Fallback: assume fileId is storageFileId (old data)
          isImage: vf.kind === "IMAGE",
        };
      }
    })
  );

  return enrichedFiles;
}

/**
 * Gets the file metadata from the files collection
 */
export async function getFileById(fileId) {
  const doc = await databases.getDocument(
    env.databaseId,
    FILES_COLLECTION_ID,
    fileId
  );
  return doc;
}

/**
 * Deletes a vehicle file association and optionally the underlying file.
 * @param {string} vehicleFileDocId - The vehicle_files document ID
 * @param {string} fileDocId - The files document ID (optional, for cleanup)
 * @param {string} storageFileId - The storage file ID (optional, for cleanup)
 */
export async function deleteVehicleFile(
  vehicleFileDocId,
  fileDocId,
  storageFileId
) {
  // 1. Delete from vehicle_files (join table)
  if (vehicleFileDocId) {
    await databases.deleteDocument(
      env.databaseId,
      VEHICLE_FILES_COLLECTION_ID,
      vehicleFileDocId
    );
  }

  // 2. Delete from files collection (metadata)
  if (fileDocId) {
    try {
      await databases.deleteDocument(
        env.databaseId,
        FILES_COLLECTION_ID,
        fileDocId
      );
    } catch (error) {
      console.error("Error deleting file metadata:", error);
    }
  }

  // 3. Delete from storage bucket
  if (storageFileId) {
    try {
      await storage.deleteFile(BUCKET_ID, storageFileId);
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
