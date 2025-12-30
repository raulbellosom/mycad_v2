import { ID, Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../../audit/services/audit.service";

const CLIENTS_COLLECTION_ID = env.collectionClientsId;

/**
 * List all clients for a group
 */
export async function listClients(groupId, options = {}) {
  if (!groupId) return [];

  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
  ];

  if (options.limit) {
    queries.push(Query.limit(options.limit));
  }

  if (options.offset) {
    queries.push(Query.offset(options.offset));
  }

  const res = await databases.listDocuments(
    env.databaseId,
    CLIENTS_COLLECTION_ID,
    queries
  );

  return res.documents;
}

/**
 * Search clients by name, email or phone
 */
export async function searchClients(groupId, searchTerm) {
  if (!groupId || !searchTerm) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    CLIENTS_COLLECTION_ID,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.or([
        Query.contains("name", searchTerm),
        Query.contains("email", searchTerm),
        Query.contains("phone", searchTerm),
      ]),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ]
  );

  return res.documents;
}

/**
 * Get a single client by ID
 */
export async function getClientById(id) {
  return await databases.getDocument(env.databaseId, CLIENTS_COLLECTION_ID, id);
}

/**
 * Create a new client
 */
export async function createClient(data, auditInfo = {}) {
  const doc = await databases.createDocument(
    env.databaseId,
    CLIENTS_COLLECTION_ID,
    ID.unique(),
    {
      ...data,
      enabled: true,
    }
  );

  // Auditoría
  if (auditInfo.profileId && data.groupId) {
    logAuditEvent({
      groupId: data.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.CREATE,
      entityType: ENTITY_TYPES.CLIENT,
      entityId: doc.$id,
      entityName: data.name || "Cliente nuevo",
      details: { email: data.email, phone: data.phone },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Update an existing client
 */
export async function updateClient(id, data, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    CLIENTS_COLLECTION_ID,
    id,
    data
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.CLIENT,
      entityId: id,
      entityName: data.name || auditInfo.clientName || "Cliente",
      details: { updatedFields: Object.keys(data) },
    }).catch(console.error);
  }

  return doc;
}

/**
 * Soft delete a client
 */
export async function deleteClient(id, auditInfo = {}) {
  const doc = await databases.updateDocument(
    env.databaseId,
    CLIENTS_COLLECTION_ID,
    id,
    { enabled: false }
  );

  // Auditoría
  if (auditInfo.profileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.profileId,
      action: AUDIT_ACTIONS.DELETE,
      entityType: ENTITY_TYPES.CLIENT,
      entityId: id,
      entityName: auditInfo.clientName || "Cliente",
    }).catch(console.error);
  }

  return doc;
}

/**
 * Count total clients for a group
 */
export async function countClients(groupId) {
  if (!groupId) return 0;

  const res = await databases.listDocuments(
    env.databaseId,
    CLIENTS_COLLECTION_ID,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  return res.total;
}
