export const env = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  bucketVehiclesId: import.meta.env.VITE_APPWRITE_BUCKET_VEHICLES_ID,
  platformAdminsTeamId:
    import.meta.env.VITE_APPWRITE_PLATFORM_ADMINS_TEAM_ID || "",
  fnEnsureProfileId: import.meta.env.VITE_APPWRITE_FN_ENSURE_PROFILE_ID || "",
  fnCreateUserWithProfileId:
    import.meta.env.VITE_APPWRITE_FN_CREATE_USER_WITH_PROFILE_ID || "",
  // Collections
  collectionUsersProfileId: import.meta.env
    .VITE_APPWRITE_COLLECTION_USERS_PROFILE_ID,
  collectionGroupsId: import.meta.env.VITE_APPWRITE_COLLECTION_GROUPS_ID,
  collectionVehiclesId: import.meta.env.VITE_APPWRITE_COLLECTION_VEHICLES_ID,

  appName: import.meta.env.VITE_APP_NAME || "MyCAD Admin",
};

export function assertEnv() {
  const required = [
    "endpoint",
    "projectId",
    "databaseId",
    "bucketVehiclesId",
    "collectionUsersProfileId",
    "collectionGroupsId",
    "collectionVehiclesId",
  ];
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing env var: ${k}`);
  }
}
