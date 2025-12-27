import { Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionGroupsId;

export async function listMyGroups() {
  const res = await databases.listDocuments(env.databaseId, COLLECTION_ID, [
    Query.equal("enabled", true),
  ]);
  return res.documents;
}
