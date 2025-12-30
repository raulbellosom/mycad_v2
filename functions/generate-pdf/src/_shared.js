import { Client, Databases, Storage } from "node-appwrite";

export function getAppwriteClient() {
  // Appwrite automatically injects these variables in function runtime
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!projectId) {
    throw new Error("Missing APPWRITE_FUNCTION_PROJECT_ID");
  }
  if (!apiKey) {
    throw new Error("Missing APPWRITE_API_KEY");
  }

  const client = new Client()
    .setEndpoint(
      process.env.APPWRITE_ENDPOINT || "https://appwrite.racoondevs.com/v1"
    )
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);
  const storage = new Storage(client);

  return { client, databases, storage };
}

export const env = {
  databaseId: process.env.APPWRITE_DATABASE_ID,
  bucketReportFilesId: process.env.APPWRITE_BUCKET_REPORT_FILES_ID,
  collectionServiceHistoriesId:
    process.env.APPWRITE_COLLECTION_SERVICE_HISTORIES_ID,
  collectionRepairReportsId: process.env.APPWRITE_COLLECTION_REPAIR_REPORTS_ID,
  collectionReplacedPartsId: process.env.APPWRITE_COLLECTION_REPLACED_PARTS_ID,
  collectionRepairedPartsId: process.env.APPWRITE_COLLECTION_REPAIRED_PARTS_ID,
  collectionVehiclesId: process.env.APPWRITE_COLLECTION_VEHICLES_ID,
  collectionVehicleTypesId: process.env.APPWRITE_COLLECTION_VEHICLE_TYPES_ID,
  collectionVehicleBrandsId: process.env.APPWRITE_COLLECTION_VEHICLE_BRANDS_ID,
  collectionVehicleModelsId: process.env.APPWRITE_COLLECTION_VEHICLE_MODELS_ID,
  collectionGroupsId: process.env.APPWRITE_COLLECTION_GROUPS_ID,
  collectionUsersProfileId: process.env.APPWRITE_COLLECTION_USERS_PROFILE_ID,
  bucketGroupLogosId: process.env.APPWRITE_BUCKET_GROUP_LOGOS_ID,
};
