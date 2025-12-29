import { Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from "../../audit/services/audit.service";

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
      // Relaciones two-way
      group: groupId, // relación → groups
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
      // Relaciones two-way
      role: roleId, // relación → roles
      permission: permissionId, // relación → permissions
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
 * @param {string} groupId - ID del grupo
 * @param {string} profileId - ID del perfil del usuario que recibe el rol
 * @param {string} roleId - ID del rol a asignar
 * @param {object} auditInfo - Info para auditoría { actorProfileId, roleName, userName }
 */
export async function assignRoleToUser(
  groupId,
  profileId,
  roleId,
  auditInfo = {}
) {
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
      const result = await databases.updateDocument(
        env.databaseId,
        USER_ROLES_COLLECTION,
        doc.$id,
        { enabled: true, assignedAt: new Date().toISOString() }
      );

      // Log de auditoría para reactivación
      if (auditInfo.actorProfileId) {
        logAuditEvent({
          groupId,
          profileId: auditInfo.actorProfileId,
          action: AUDIT_ACTIONS.ASSIGN,
          entityType: ENTITY_TYPES.ROLE,
          entityId: roleId,
          entityName: `Rol "${auditInfo.roleName || roleId}" asignado a ${
            auditInfo.userName || profileId
          }`,
          details: { targetProfileId: profileId, roleId, reactivated: true },
        }).catch(console.error);
      }

      return result;
    }
    return doc;
  }

  const result = await databases.createDocument(
    env.databaseId,
    USER_ROLES_COLLECTION,
    "unique()",
    {
      groupId,
      profileId,
      roleId,
      enabled: true,
      assignedAt: new Date().toISOString(),
      // Relaciones two-way
      group: groupId, // relación → groups
      profile: profileId, // relación → users_profile
      role: roleId, // relación → roles
    }
  );

  // Log de auditoría para nueva asignación
  if (auditInfo.actorProfileId) {
    logAuditEvent({
      groupId,
      profileId: auditInfo.actorProfileId,
      action: AUDIT_ACTIONS.ASSIGN,
      entityType: ENTITY_TYPES.ROLE,
      entityId: roleId,
      entityName: `Rol "${auditInfo.roleName || roleId}" asignado a ${
        auditInfo.userName || profileId
      }`,
      details: { targetProfileId: profileId, roleId },
    }).catch(console.error);
  }

  return result;
}

/**
 * Remueve un rol de un usuario (soft delete)
 * @param {string} userRoleId - ID del documento user_role
 * @param {object} auditInfo - Info para auditoría { groupId, actorProfileId, roleName, userName, roleId, targetProfileId }
 */
export async function removeRoleFromUser(userRoleId, auditInfo = {}) {
  const result = await databases.updateDocument(
    env.databaseId,
    USER_ROLES_COLLECTION,
    userRoleId,
    { enabled: false }
  );

  // Log de auditoría
  if (auditInfo.actorProfileId && auditInfo.groupId) {
    logAuditEvent({
      groupId: auditInfo.groupId,
      profileId: auditInfo.actorProfileId,
      action: AUDIT_ACTIONS.UNASSIGN,
      entityType: ENTITY_TYPES.ROLE,
      entityId: auditInfo.roleId || userRoleId,
      entityName: `Rol "${auditInfo.roleName || "desconocido"}" removido de ${
        auditInfo.userName || auditInfo.targetProfileId || "usuario"
      }`,
      details: {
        userRoleId,
        targetProfileId: auditInfo.targetProfileId,
        roleId: auditInfo.roleId,
      },
    }).catch(console.error);
  }

  return result;
}

/**
 * Actualiza todos los roles de un usuario en un grupo (batch)
 * @param {string} groupId - ID del grupo
 * @param {string} profileId - ID del perfil del usuario
 * @param {string[]} roleIds - Array de IDs de roles a asignar
 * @param {object} auditInfo - Info para auditoría { actorProfileId, userName, rolesMap }
 */
export async function updateUserRoles(
  groupId,
  profileId,
  roleIds,
  auditInfo = {}
) {
  const currentAssignments = await listUserRoles(groupId, profileId);
  const currentRoleIds = currentAssignments.map((ur) => ur.roleId);

  const toAdd = roleIds.filter((id) => !currentRoleIds.includes(id));
  const toRemove = currentAssignments.filter(
    (ur) => !roleIds.includes(ur.roleId)
  );

  // Obtener nombres de roles del mapa si existe
  const getRoleName = (roleId) => auditInfo.rolesMap?.[roleId] || roleId;

  const addPromises = toAdd.map((roleId) =>
    assignRoleToUser(groupId, profileId, roleId, {
      actorProfileId: auditInfo.actorProfileId,
      roleName: getRoleName(roleId),
      userName: auditInfo.userName,
    })
  );
  const removePromises = toRemove.map((ur) =>
    removeRoleFromUser(ur.$id, {
      groupId,
      actorProfileId: auditInfo.actorProfileId,
      roleName: getRoleName(ur.roleId),
      userName: auditInfo.userName,
      roleId: ur.roleId,
      targetProfileId: profileId,
    })
  );

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
 * @param {string} groupId - groups.$id (ID del documento grupo)
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

  // ⚠️ CAMBIO v2: groupId ya ES groups.$id, no necesitamos buscar
  const memberData = {
    groupId, // groups.$id directamente
    profileId, // para búsquedas/índices
    role,
    notes,
    enabled: true,
    joinedAt: new Date().toISOString(),
    group: groupId, // relación → groups (mismo valor que groupId)
    profile: profileId, // relación → users_profile
  };

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
