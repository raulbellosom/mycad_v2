export const env = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  bucketVehiclesId: import.meta.env.VITE_APPWRITE_BUCKET_VEHICLES_ID,
  bucketAvatarsId: import.meta.env.VITE_APPWRITE_BUCKET_AVATARS_ID || "",
  platformAdminsTeamId:
    import.meta.env.VITE_APPWRITE_PLATFORM_ADMINS_TEAM_ID || "",
  fnEnsureProfileId: import.meta.env.VITE_APPWRITE_FN_ENSURE_PROFILE_ID || "",
  fnCreateUserWithProfileId:
    import.meta.env.VITE_APPWRITE_FN_CREATE_USER_WITH_PROFILE_ID || "",

  //Collections
  collectionUsersProfileId: import.meta.env
    .VITE_APPWRITE_COLLECTION_USERS_PROFILE_ID,
  collectionGroupsId: import.meta.env.VITE_APPWRITE_COLLECTION_GROUPS_ID,
  collectionGroupMembersId: import.meta.env
    .VITE_APPWRITE_COLLECTION_GROUP_MEMBERS_ID,
  collectionPermissionsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_PERMISSIONS_ID,
  collectionRolesId: import.meta.env.VITE_APPWRITE_COLLECTION_ROLES_ID,
  collectionRolePermissionsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_ROLE_PERMISSIONS_ID,
  collectionUserRolesId: import.meta.env.VITE_APPWRITE_COLLECTION_USER_ROLES_ID,
  collectionVehiclesId: import.meta.env.VITE_APPWRITE_COLLECTION_VEHICLES_ID,
  collectionVehicleFilesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_VEHICLE_FILES_ID,
  collectionVehicleTypesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_VEHICLE_TYPES_ID,
  collectionVehicleBrandsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_VEHICLE_BRANDS_ID,
  collectionVehicleModelsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_VEHICLE_MODELS_ID,
  collectionConditionsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_VEHICLE_CONDITIONS_ID,
  collectionServiceHistoriesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_SERVICE_HISTORIES_ID,
  collectionReplacedPartsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_REPLACED_PARTS_ID,
  collectionServiceFilesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_SERVICE_FILES_ID,
  collectionRepairReportsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_REPAIR_REPORTS_ID,
  collectionRepairedPartsId: import.meta.env
    .VITE_APPWRITE_COLLECTION_REPAIRED_PARTS_ID,
  collectionRepairFilesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_REPAIR_FILES_ID,
  collectionClientsId: import.meta.env.VITE_APPWRITE_COLLECTION_CLIENTS_ID,
  collectionRentalsId: import.meta.env.VITE_APPWRITE_COLLECTION_RENTALS_ID,
  collectionRentalFilesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_RENTAL_FILES_ID,
  collectionFilesId: import.meta.env.VITE_APPWRITE_COLLECTION_FILES_ID,
  collectionImagesId: import.meta.env.VITE_APPWRITE_COLLECTION_IMAGES_ID,
  collectionDriversId: import.meta.env.VITE_APPWRITE_COLLECTION_DRIVERS_ID,
  collectionDriverLicensesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_DRIVER_LICENSES_ID,
  collectionDriverFilesId: import.meta.env
    .VITE_APPWRITE_COLLECTION_DRIVER_FILES_ID,

  appName: import.meta.env.VITE_APP_NAME || "MyCAD Admin",
};

export function assertEnv() {
  const required = [
    "endpoint",
    "projectId",
    "databaseId",
    "collectionUsersProfileId",
    "collectionGroupsId",
    "collectionVehiclesId",
  ];
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing env var: ${k}`);
  }
}
