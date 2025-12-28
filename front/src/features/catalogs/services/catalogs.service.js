import { ID, Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

// ================================
// VEHICLE TYPES
// ================================
export async function listVehicleTypes(groupId) {
  if (!groupId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehicleTypesId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderAsc("name"),
    ]
  );
  return res.documents;
}

export async function createVehicleType(groupId, name, economicGroup) {
  const doc = await databases.createDocument(
    env.databaseId,
    env.collectionVehicleTypesId,
    ID.unique(),
    {
      groupId,
      name,
      economicGroup,
      enabled: true,
      group: groupId, // relación → groups
    }
  );
  return doc;
}

export async function updateVehicleType(id, name, economicGroup) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleTypesId,
    id,
    { name, economicGroup }
  );
  return doc;
}

export async function deleteVehicleType(id) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleTypesId,
    id,
    { enabled: false }
  );
}

// ================================
// VEHICLE BRANDS
// ================================
export async function listVehicleBrands(groupId) {
  if (!groupId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehicleBrandsId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderAsc("name"),
    ]
  );
  return res.documents;
}

export async function createVehicleBrand(groupId, name) {
  const doc = await databases.createDocument(
    env.databaseId,
    env.collectionVehicleBrandsId,
    ID.unique(),
    {
      groupId,
      name,
      enabled: true,
      group: groupId, // relación → groups
    }
  );
  return doc;
}

export async function updateVehicleBrand(id, name) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleBrandsId,
    id,
    { name }
  );
  return doc;
}

export async function deleteVehicleBrand(id) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleBrandsId,
    id,
    { enabled: false }
  );
}

// ================================
// VEHICLE MODELS
// ================================
export async function listVehicleModels(groupId, brandId = null) {
  if (!groupId) return [];
  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderAsc("name"),
  ];
  if (brandId) {
    queries.push(Query.equal("brandId", brandId));
  }
  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehicleModelsId,
    queries
  );
  return res.documents;
}

export async function createVehicleModel(data) {
  const doc = await databases.createDocument(
    env.databaseId,
    env.collectionVehicleModelsId,
    ID.unique(),
    {
      ...data,
      enabled: true,
      group: data.groupId, // relación → groups
      brand: data.brandId || null, // relación → vehicle_brands
      type: data.typeId || null, // relación → vehicle_types
    }
  );
  return doc;
}

export async function updateVehicleModel(id, data) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleModelsId,
    id,
    data
  );
  return doc;
}

export async function deleteVehicleModel(id) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleModelsId,
    id,
    { enabled: false }
  );
}

// ================================
// CONDITIONS
// ================================
export async function listConditions(groupId) {
  if (!groupId) return [];
  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionConditionsId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderAsc("name"),
    ]
  );
  return res.documents;
}

export async function createCondition(groupId, name, description = "") {
  const doc = await databases.createDocument(
    env.databaseId,
    env.collectionConditionsId,
    ID.unique(),
    {
      groupId,
      name,
      description,
      enabled: true,
      group: groupId, // relación → groups
    }
  );
  return doc;
}

export async function updateCondition(id, name) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionConditionsId,
    id,
    { name }
  );
  return doc;
}

export async function deleteCondition(id) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionConditionsId,
    id,
    { enabled: false }
  );
}
