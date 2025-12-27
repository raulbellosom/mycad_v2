import { ID, Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionVehiclesId;

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
