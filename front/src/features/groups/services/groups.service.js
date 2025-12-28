import { ID, Query } from "appwrite";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = env.collectionGroupsId;
const COLLECTION_MEMBERS_ID = env.collectionGroupMembersId;

/**
 * Lista los grupos donde el usuario actual es miembro
 * @param {string} profileId - ID del perfil del usuario actual
 */
export async function listMyGroups(profileId) {
  if (!profileId) {
    return [];
  }

  // 1. Obtener las membresías del usuario
  const membershipsRes = await databases.listDocuments(
    env.databaseId,
    COLLECTION_MEMBERS_ID,
    [
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );

  if (membershipsRes.documents.length === 0) {
    return [];
  }

  // 2. Extraer los IDs de grupo (ahora es groups.$id directamente)
  const groupIds = membershipsRes.documents.map((m) => m.groupId);

  // 3. Obtener los grupos correspondientes usando $id
  const groupsRes = await databases.listDocuments(
    env.databaseId,
    COLLECTION_ID,
    [
      Query.equal("$id", groupIds),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );

  // 4. Agregar el rol del usuario a cada grupo para facilitar uso en UI
  const groupsWithRole = groupsRes.documents.map((group) => {
    const membership = membershipsRes.documents.find(
      (m) => m.groupId === group.$id
    );
    return {
      ...group,
      membershipRole: membership?.role || null,
      membershipId: membership?.$id || null,
    };
  });

  return groupsWithRole;
}

/**
 * Obtiene un grupo por su ID (documento)
 */
export async function getGroup(groupId) {
  return databases.getDocument(env.databaseId, COLLECTION_ID, groupId);
}

/**
 * Crea un nuevo grupo (documento groups + membresía owner)
 * ⚠️ CAMBIO v2: Ya NO creamos Team de Auth de Appwrite
 * @param {Object} params
 * @param {string} params.name - Nombre del grupo
 * @param {string} params.description - Descripción opcional
 * @param {string} params.ownerProfileId - ID del perfil del owner
 * @param {File} [params.logoFile] - Archivo de logo opcional
 */
export async function createGroup({
  name,
  description = "",
  ownerProfileId,
  logoFile,
}) {
  let logoFileId = null;

  // 1. Subir logo si existe
  if (logoFile) {
    const uploaded = await storage.createFile(
      env.bucketAvatarsId,
      ID.unique(),
      logoFile
    );
    logoFileId = uploaded.$id;
  }

  // 2. Crear el documento en la colección groups
  const groupDoc = await databases.createDocument(
    env.databaseId,
    COLLECTION_ID,
    ID.unique(),
    {
      name,
      description,
      ownerProfileId,
      ownerProfile: ownerProfileId, // relación → users_profile
      logoFileId,
      enabled: true,
    }
  );

  // 3. Crear la membresía del owner en group_members
  await databases.createDocument(
    env.databaseId,
    COLLECTION_MEMBERS_ID,
    ID.unique(),
    {
      groupId: groupDoc.$id, // ⚠️ CAMBIO v2: Ahora es groups.$id directamente
      profileId: ownerProfileId, // para búsquedas/índices
      role: "OWNER",
      enabled: true,
      joinedAt: new Date().toISOString(),
      group: groupDoc.$id, // relación → groups
      profile: ownerProfileId, // relación → users_profile
    }
  );

  return groupDoc;
}

/**
 * Actualiza un grupo existente
 */
export async function updateGroup(groupDocId, data) {
  const { name, description, logoFileId } = data;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (logoFileId !== undefined) updateData.logoFileId = logoFileId;

  return databases.updateDocument(
    env.databaseId,
    COLLECTION_ID,
    groupDocId,
    updateData
  );
}

/**
 * Actualiza el logo de un grupo
 */
export async function updateGroupLogo(groupDocId, logoFile) {
  const group = await getGroup(groupDocId);

  // Eliminar logo anterior si existe
  if (group.logoFileId) {
    try {
      await storage.deleteFile(env.bucketAvatarsId, group.logoFileId);
    } catch (e) {
      console.warn("Could not delete old logo:", e);
    }
  }

  // Subir nuevo logo
  const uploaded = await storage.createFile(
    env.bucketAvatarsId,
    ID.unique(),
    logoFile
  );

  // Actualizar documento
  return databases.updateDocument(env.databaseId, COLLECTION_ID, groupDocId, {
    logoFileId: uploaded.$id,
  });
}

/**
 * Elimina el logo de un grupo
 */
export async function removeGroupLogo(groupDocId) {
  const group = await getGroup(groupDocId);

  if (group.logoFileId) {
    try {
      await storage.deleteFile(env.bucketAvatarsId, group.logoFileId);
    } catch (e) {
      console.warn("Could not delete logo:", e);
    }
  }

  return databases.updateDocument(env.databaseId, COLLECTION_ID, groupDocId, {
    logoFileId: null,
  });
}

/**
 * Elimina un grupo (soft delete)
 */
export async function deleteGroup(groupDocId) {
  return databases.updateDocument(env.databaseId, COLLECTION_ID, groupDocId, {
    enabled: false,
  });
}

/**
 * Elimina un grupo permanentemente (hard delete)
 * ⚠️ CAMBIO v2: Ya no eliminamos Team de Auth
 */
export async function hardDeleteGroup(groupDocId) {
  const group = await getGroup(groupDocId);

  // Eliminar logo si existe
  if (group.logoFileId) {
    try {
      await storage.deleteFile(env.bucketAvatarsId, group.logoFileId);
    } catch (e) {
      console.warn("Could not delete logo:", e);
    }
  }

  // Eliminar membresías (usando groupId = groups.$id)
  const memberships = await databases.listDocuments(
    env.databaseId,
    COLLECTION_MEMBERS_ID,
    [Query.equal("groupId", groupDocId)]
  );

  for (const m of memberships.documents) {
    await databases.deleteDocument(
      env.databaseId,
      COLLECTION_MEMBERS_ID,
      m.$id
    );
  }

  // Eliminar documento del grupo
  await databases.deleteDocument(env.databaseId, COLLECTION_ID, groupDocId);

  return true;
}
