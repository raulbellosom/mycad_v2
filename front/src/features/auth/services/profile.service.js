import { Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionUsersProfileId;

export async function getMyProfile(userAuthId) {
  const res = await databases.listDocuments(env.databaseId, COLLECTION_ID, [
    Query.equal("userAuthId", userAuthId),
  ]);
  const doc = res.documents?.[0];
  if (!doc) {
    throw new Error(
      "No existe users_profile para este usuario. Configura Function ensureProfile."
    );
  }
  return doc;
}
