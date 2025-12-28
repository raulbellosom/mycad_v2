import { Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const PERMISSIONS_COLLECTION = env.collectionPermissionsId;
const ROLES_COLLECTION = env.collectionRolesId;
const ROLE_PERMISSIONS_COLLECTION = env.collectionRolePermissionsId;
const USER_ROLES_COLLECTION = env.collectionUserRolesId;
const GROUP_MEMBERS_COLLECTION = env.collectionGroupMembersId;
const GROUPS_COLLECTION = env.collectionGroupsId;

// ========================
// PERMISSIONS (System-wide)
// ========================

/**
 * Lista todos los permisos del sistema
 */
export async function listPermissions() {
  const res = await databases.listDocuments(
    env.databaseId,
    PERMISSIONS_COLLECTION,
    [Query.equal("enabled", true), Query.orderAsc("key"), Query.limit(500)]
  );
  return res.documents;
}

/**
 * Crea un nuevo permiso (solo platform admins)
 */
export async function createPermission(key, description = "") {
  return databases.createDocument(
    env.databaseId,
    PERMISSIONS_COLLECTION,
    "unique()",
    {
      key,
      description,
      enabled: true,
    }
  );
}

/**
 * Actualiza un permiso
 */
export async function updatePermission(permissionId, data) {
  return databases.updateDocument(
    env.databaseId,
    PERMISSIONS_COLLECTION,
    permissionId,
    data
  );
}

/**
 * Elimina un permiso (soft delete)
 */
export async function deletePermission(permissionId) {
  return databases.updateDocument(
    env.databaseId,
    PERMISSIONS_COLLECTION,
    permissionId,
    { enabled: false }
  );
}

// ========================
// ROLES (Per Group/Tenant)
// ========================

/**
 * Lista todos los roles de un grupo
 */
export async function listRoles(groupId) {
  const res = await databases.listDocuments(env.databaseId, ROLES_COLLECTION, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderAsc("name"),
    Query.limit(100),
  ]);
  return res.documents;
}

/**
 * Obtiene un rol por ID
 */
export async function getRole(roleId) {
  return databases.getDocument(env.databaseId, ROLES_COLLECTION, roleId);
}

/**
 * Crea un nuevo rol en un grupo
 */
export async function createRole(
  groupId,
  name,
  description = "",
  isSystem = false
) {
  return databases.createDocument(
    env.databaseId,
    ROLES_COLLECTION,
    "unique()",
    {
      groupId,
      name,
      description,
      isSystem,
      enabled: true,
    }
  );
}

/**
 * Actualiza un rol
 */
export async function updateRole(roleId, data) {
  return databases.updateDocument(
    env.databaseId,
    ROLES_COLLECTION,
    roleId,
    data
  );
}

/**
 * Elimina un rol (soft delete)
 */
export async function deleteRole(roleId) {
  return databases.updateDocument(env.databaseId, ROLES_COLLECTION, roleId, {
    enabled: false,
  });
}

// ========================
// ROLE_PERMISSIONS (Assign permissions to roles)
// ========================

/**
 * Lista los permisos asignados a un rol
 */
export async function listRolePermissions(groupId, roleId) {
  const res = await databases.listDocuments(
    env.databaseId,
    ROLE_PERMISSIONS_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("roleId", roleId),
      Query.equal("enabled", true),
      Query.limit(500),
    ]
  );
  return res.documents;
}

/**
 * Asigna un permiso a un rol
 */
export async function assignPermissionToRole(groupId, roleId, permissionId) {
  // Verificar si ya existe
  const existing = await databases.listDocuments(
    env.databaseId,
    ROLE_PERMISSIONS_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("roleId", roleId),
      Query.equal("permissionId", permissionId),
      Query.limit(1),
    ]
  );

  if (existing.documents.length > 0) {
    // Si existe pero está deshabilitado, habilitarlo
    const doc = existing.documents[0];
    if (!doc.enabled) {
      return databases.updateDocument(
        env.databaseId,
        ROLE_PERMISSIONS_COLLECTION,
        doc.$id,
        { enabled: true }
      );
    }
    return doc;
  }

  // Crear nueva asignación
  return databases.createDocument(
    env.databaseId,
    ROLE_PERMISSIONS_COLLECTION,
    "unique()",
    {
      groupId,
      roleId,
      permissionId,
      enabled: true,
    }
  );
}

/**
 * Remueve un permiso de un rol (soft delete)
 */
export async function removePermissionFromRole(rolePermissionId) {
  return databases.updateDocument(
    env.databaseId,
    ROLE_PERMISSIONS_COLLECTION,
    rolePermissionId,
    { enabled: false }
  );
}

/**
 * Actualiza todos los permisos de un rol (batch)
 */
export async function updateRolePermissions(groupId, roleId, permissionIds) {
  // Obtener permisos actuales
  const currentAssignments = await listRolePermissions(groupId, roleId);
  const currentPermIds = currentAssignments.map((rp) => rp.permissionId);

  // Permisos a agregar
  const toAdd = permissionIds.filter((id) => !currentPermIds.includes(id));

  // Permisos a remover
  const toRemove = currentAssignments.filter(
    (rp) => !permissionIds.includes(rp.permissionId)
  );

  // Ejecutar operaciones
  const addPromises = toAdd.map((permId) =>
    assignPermissionToRole(groupId, roleId, permId)
  );
  const removePromises = toRemove.map((rp) => removePermissionFromRole(rp.$id));

  await Promise.all([...addPromises, ...removePromises]);

  return listRolePermissions(groupId, roleId);
}

// ========================
// USER_ROLES (Assign roles to users within a group)
// ========================

/**
 * Lista las asignaciones de roles de un usuario en un grupo
 */
export async function listUserRoles(groupId, profileId) {
  const res = await databases.listDocuments(
    env.databaseId,
    USER_ROLES_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );
  return res.documents;
}

/**
 * Lista todos los roles asignados en un grupo (para ver qué usuarios tienen qué roles)
 */
export async function listGroupUserRoles(groupId) {
  const res = await databases.listDocuments(
    env.databaseId,
    USER_ROLES_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(500),
    ]
  );
  return res.documents;
}

/**
 * Asigna un rol a un usuario en un grupo
 */
export async function assignRoleToUser(groupId, profileId, roleId) {
  // Verificar si ya existe
  const existing = await databases.listDocuments(
    env.databaseId,
    USER_ROLES_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("roleId", roleId),
      Query.limit(1),
    ]
  );

  if (existing.documents.length > 0) {
    const doc = existing.documents[0];
    if (!doc.enabled) {
      return databases.updateDocument(
        env.databaseId,
        USER_ROLES_COLLECTION,
        doc.$id,
        { enabled: true, assignedAt: new Date().toISOString() }
      );
    }
    return doc;
  }

  return databases.createDocument(
    env.databaseId,
    USER_ROLES_COLLECTION,
    "unique()",
    {
      groupId,
      profileId,
      roleId,
      enabled: true,
      assignedAt: new Date().toISOString(),
    }
  );
}

/**
 * Remueve un rol de un usuario (soft delete)
 */
export async function removeRoleFromUser(userRoleId) {
  return databases.updateDocument(
    env.databaseId,
    USER_ROLES_COLLECTION,
    userRoleId,
    { enabled: false }
  );
}

/**
 * Actualiza todos los roles de un usuario en un grupo (batch)
 */
export async function updateUserRoles(groupId, profileId, roleIds) {
  const currentAssignments = await listUserRoles(groupId, profileId);
  const currentRoleIds = currentAssignments.map((ur) => ur.roleId);

  const toAdd = roleIds.filter((id) => !currentRoleIds.includes(id));
  const toRemove = currentAssignments.filter(
    (ur) => !roleIds.includes(ur.roleId)
  );

  const addPromises = toAdd.map((roleId) =>
    assignRoleToUser(groupId, profileId, roleId)
  );
  const removePromises = toRemove.map((ur) => removeRoleFromUser(ur.$id));

  await Promise.all([...addPromises, ...removePromises]);

  return listUserRoles(groupId, profileId);
}

// ========================
// GROUP_MEMBERS
// ========================

/**
 * Lista los miembros de un grupo
 */
export async function listGroupMembers(groupId) {
  const res = await databases.listDocuments(
    env.databaseId,
    GROUP_MEMBERS_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(500),
    ]
  );
  return res.documents;
}

/**
 * Obtiene la membresía de un usuario en un grupo
 */
export async function getGroupMembership(groupId, profileId) {
  const res = await databases.listDocuments(
    env.databaseId,
    GROUP_MEMBERS_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );
  return res.documents[0] || null;
}

/**
 * Agrega un miembro al grupo
 * @param {string} groupId - teamId del grupo (groups.teamId)
 * @param {string} profileId - users_profile.$id
 * @param {string} role - OWNER/ADMIN/MEMBER/VIEWER
 * @param {string} notes - notas opcionales
 */
export async function addGroupMember(
  groupId,
  profileId,
  role = "MEMBER",
  notes = ""
) {
  // Verificar si ya existe
  const existing = await databases.listDocuments(
    env.databaseId,
    GROUP_MEMBERS_COLLECTION,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.limit(1),
    ]
  );

  if (existing.documents.length > 0) {
    const doc = existing.documents[0];
    if (!doc.enabled) {
      return databases.updateDocument(
        env.databaseId,
        GROUP_MEMBERS_COLLECTION,
        doc.$id,
        { enabled: true, role, joinedAt: new Date().toISOString() }
      );
    }
    return doc;
  }

  // Buscar el $id del documento de groups para la relación
  let groupDocId = null;
  if (GROUPS_COLLECTION) {
    const groupsResult = await databases.listDocuments(
      env.databaseId,
      GROUPS_COLLECTION,
      [Query.equal("teamId", groupId), Query.limit(1)]
    );
    if (groupsResult.documents.length > 0) {
      groupDocId = groupsResult.documents[0].$id;
    }
  }

  const memberData = {
    groupId, // teamId para búsquedas/índices
    profileId, // para búsquedas/índices
    role,
    notes,
    enabled: true,
    joinedAt: new Date().toISOString(),
    profile: profileId, // relación → users_profile
  };

  // Solo agregar la relación group si encontramos el documento
  if (groupDocId) {
    memberData.group = groupDocId; // relación → groups
  }

  return databases.createDocument(
    env.databaseId,
    GROUP_MEMBERS_COLLECTION,
    "unique()",
    memberData
  );
}

/**
 * Actualiza el rol de un miembro en el grupo
 */
export async function updateGroupMember(memberId, data) {
  return databases.updateDocument(
    env.databaseId,
    GROUP_MEMBERS_COLLECTION,
    memberId,
    data
  );
}

/**
 * Remueve un miembro del grupo (soft delete)
 */
export async function removeGroupMember(memberId) {
  return databases.updateDocument(
    env.databaseId,
    GROUP_MEMBERS_COLLECTION,
    memberId,
    { enabled: false }
  );
}

// ========================
// UTILITY: Get all permissions for a user in a group
// ========================

/**
 * Obtiene todos los permisos de un usuario en un grupo específico
 * Combina todos los permisos de todos los roles asignados al usuario
 */
export async function getUserPermissionsInGroup(groupId, profileId) {
  // 1. Obtener roles del usuario en este grupo
  const userRoles = await listUserRoles(groupId, profileId);
  const roleIds = userRoles.map((ur) => ur.roleId);

  if (roleIds.length === 0) return [];

  // 2. Obtener permisos de cada rol
  const permissionPromises = roleIds.map((roleId) =>
    listRolePermissions(groupId, roleId)
  );
  const rolePermissionsArrays = await Promise.all(permissionPromises);

  // 3. Combinar y deduplicar permissionIds
  const allPermissionIds = new Set();
  rolePermissionsArrays.forEach((rpArr) => {
    rpArr.forEach((rp) => allPermissionIds.add(rp.permissionId));
  });

  if (allPermissionIds.size === 0) return [];

  // 4. Obtener info completa de cada permiso
  const permissionPromisesDetail = [...allPermissionIds].map((permId) =>
    databases.getDocument(env.databaseId, PERMISSIONS_COLLECTION, permId)
  );
  const permissions = await Promise.all(permissionPromisesDetail);

  return permissions.filter((p) => p.enabled);
}

/**
 * Verifica si un usuario tiene un permiso específico en un grupo
 */
export async function userHasPermission(groupId, profileId, permissionKey) {
  const permissions = await getUserPermissionsInGroup(groupId, profileId);
  return permissions.some((p) => p.key === permissionKey);
}
