import { ID, Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../../audit/services/audit.service";

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

export async function createVehicleType(
  groupId,
  name,
  economicGroup,
  auditInfo = {}
) {
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

  // Auditoría
  if (auditInfo.profileId && groupId) {
    logAuditEvent({
      groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: doc.$id,
      entityName: `Tipo de vehículo: ${name}`,
      details: { catalogType: "vehicle_type", economicGroup },
    }).catch(console.error);
  }

  return doc;
}

export async function updateVehicleType(
  id,
  name,
  economicGroup,
  auditInfo = {}
) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleTypesId,
    id,
    { name, economicGroup }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: `Tipo de vehículo: ${name}`,
      details: { catalogType: "vehicle_type" },
    }).catch(console.error);
  }

  return doc;
}

export async function deleteVehicleType(id, auditInfo = {}) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleTypesId,
    id,
    { enabled: false }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: auditInfo.itemName || "Tipo de vehículo",
      details: { catalogType: "vehicle_type" },
    }).catch(console.error);
  }
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

export async function createVehicleBrand(groupId, name, auditInfo = {}) {
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

  // Auditoría
  if (auditInfo.profileId && groupId) {
    logAuditEvent({
      groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: doc.$id,
      entityName: `Marca: ${name}`,
      details: { catalogType: "vehicle_brand" },
    }).catch(console.error);
  }

  return doc;
}

export async function updateVehicleBrand(id, name, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleBrandsId,
    id,
    { name }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: `Marca: ${name}`,
      details: { catalogType: "vehicle_brand" },
    }).catch(console.error);
  }

  return doc;
}

export async function deleteVehicleBrand(id, auditInfo = {}) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleBrandsId,
    id,
    { enabled: false }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: auditInfo.itemName || "Marca",
      details: { catalogType: "vehicle_brand" },
    }).catch(console.error);
  }
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

export async function createVehicleModel(data, auditInfo = {}) {
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

  // Auditoría
  if (auditInfo.profileId && data.groupId) {
    logAuditEvent({
      groupId: data.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: doc.$id,
      entityName: `Modelo: ${data.name}`,
      details: { catalogType: "vehicle_model", brandId: data.brandId },
    }).catch(console.error);
  }

  return doc;
}

export async function updateVehicleModel(id, data, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleModelsId,
    id,
    data
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: `Modelo: ${data.name || auditInfo.itemName || "Modelo"}`,
      details: { catalogType: "vehicle_model" },
    }).catch(console.error);
  }

  return doc;
}

export async function deleteVehicleModel(id, auditInfo = {}) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionVehicleModelsId,
    id,
    { enabled: false }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: auditInfo.itemName || "Modelo",
      details: { catalogType: "vehicle_model" },
    }).catch(console.error);
  }
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

export async function createCondition(
  groupId,
  name,
  description = "",
  auditInfo = {}
) {
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

  // Auditoría
  if (auditInfo.profileId && groupId) {
    logAuditEvent({
      groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: doc.$id,
      entityName: `Condición: ${name}`,
      details: { catalogType: "vehicle_condition" },
    }).catch(console.error);
  }

  return doc;
}

export async function updateCondition(id, name, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    env.collectionConditionsId,
    id,
    { name }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: `Condición: ${name}`,
      details: { catalogType: "vehicle_condition" },
    }).catch(console.error);
  }

  return doc;
}

export async function deleteCondition(id, auditInfo = {}) {
  await databases.updateDocument(
    env.databaseId,
    env.collectionConditionsId,
    id,
    { enabled: false }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.CATALOG,
      entityId: id,
      entityName: auditInfo.itemName || "Condición",
      details: { catalogType: "vehicle_condition" },
    }).catch(console.error);
  }
}
