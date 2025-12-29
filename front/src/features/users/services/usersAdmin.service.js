import { databases, functions } from "../../../shared/appwrite/client";
import { Query } from "appwrite";
import { env } from "../../../shared/appwrite/env";

const DB = env.databaseId;
const USERS_PROFILE = env.collectionUsersProfileId;

/**
 * Lista todos los usuarios (perfiles) del sistema
 */
export async function listAllUsers(filters = {}) {
  const queries = [Query.orderDesc("$createdAt"), Query.limit(100)];

  if (filters.search) {
    // Buscar por email, firstName o lastName
    queries.push(
      Query.or([
        Query.contains("email", filters.search),
        Query.contains("firstName", filters.search),
        Query.contains("lastName", filters.search),
      ])
    );
  }

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }

  if (typeof filters.enabled === "boolean") {
    queries.push(Query.equal("enabled", filters.enabled));
  }

  if (filters.isPlatformAdmin !== undefined) {
    queries.push(Query.equal("isPlatformAdmin", filters.isPlatformAdmin));
  }

  const response = await databases.listDocuments(DB, USERS_PROFILE, queries);
  return response.documents;
}

/**
 * Obtiene un usuario por su profileId
 */
export async function getUserById(profileId) {
  return await databases.getDocument(DB, USERS_PROFILE, profileId);
}

/**
 * Obtiene un usuario por su userAuthId
 */
export async function getUserByAuthId(authId) {
  const response = await databases.listDocuments(DB, USERS_PROFILE, [
    Query.equal("userAuthId", authId),
    Query.limit(1),
  ]);
  return response.documents[0] || null;
}

/**
 * Crea un nuevo usuario (Auth + Profile) llamando a la Function
 * @param {Object} data - Datos del usuario
 * @param {string} data.email - Email del usuario (requerido)
 * @param {string} data.password - Contraseña (requerido)
 * @param {string} data.firstName - Nombre (requerido)
 * @param {string} data.lastName - Apellido (requerido)
 * @param {string} [data.phone] - Teléfono (opcional)
 * @param {string} [data.username] - Username (opcional)
 * @param {string} [data.avatarFileId] - ID del avatar (opcional)
 * @param {boolean} [data.isPlatformAdmin] - Es admin de plataforma (opcional)
 * @param {string} [data.groupId] - ID del grupo a agregar (opcional)
 * @param {string} [data.role] - Rol en el grupo: OWNER/ADMIN/MEMBER/VIEWER (opcional)
 * @param {string} [data.roleId] - Role RBAC a asignar (opcional)
 */
export async function createUserWithProfile(data) {
  // Construir el fullname para Auth (firstName + lastName)
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const payload = {
    email: data.email,
    password: data.password,
    name: fullName, // Auth usa 'name' como fullname
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || undefined,
    username: data.username || undefined,
    avatarFileId: data.avatarFileId || undefined,
    isPlatformAdmin: data.isPlatformAdmin || false,
    status: data.status || "ACTIVE",
    enabled: data.enabled !== false,
    // Opcionales para membership
    groupId: data.groupId || undefined,
    role: data.role || undefined,
    roleId: data.roleId || undefined,
  };

  // Limpiar undefined
  Object.keys(payload).forEach(
    (k) => payload[k] === undefined && delete payload[k]
  );

  const execution = await functions.createExecution(
    env.fnCreateUserWithProfileId,
    JSON.stringify(payload)
  );

  // La respuesta de la función viene en responseBody
  // Puede ser el JSON directo o un wrapper legacy con body
  let response;
  try {
    const parsed = JSON.parse(execution.responseBody || "{}");
    // Si tiene body como string (formato legacy), parsearlo
    if (parsed.body && typeof parsed.body === "string") {
      response = JSON.parse(parsed.body);
    } else {
      // Formato nuevo: respuesta directa
      response = parsed;
    }
  } catch (e) {
    throw new Error("Error parseando respuesta de función");
  }

  if (execution.status !== "completed" || !response.ok) {
    throw new Error(response.error || "Error al crear usuario");
  }

  return response;
}

/**
 * Actualiza el perfil de un usuario existente (solo campos del profile, no Auth)
 */
export async function updateUserProfile(profileId, data) {
  const updateData = {};

  // Solo incluir campos que se pueden actualizar
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.username !== undefined) updateData.username = data.username;
  if (data.avatarFileId !== undefined)
    updateData.avatarFileId = data.avatarFileId;
  if (data.isPlatformAdmin !== undefined)
    updateData.isPlatformAdmin = data.isPlatformAdmin;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  return await databases.updateDocument(
    DB,
    USERS_PROFILE,
    profileId,
    updateData
  );
}

/**
 * Desactiva un usuario (soft delete)
 */
export async function disableUser(profileId) {
  return await databases.updateDocument(DB, USERS_PROFILE, profileId, {
    enabled: false,
    status: "SUSPENDED",
  });
}

/**
 * Reactiva un usuario
 */
export async function enableUser(profileId) {
  return await databases.updateDocument(DB, USERS_PROFILE, profileId, {
    enabled: true,
    status: "ACTIVE",
  });
}

/**
 * Cambia el estado de un usuario
 */
export async function updateUserStatus(profileId, status) {
  return await databases.updateDocument(DB, USERS_PROFILE, profileId, {
    status,
    enabled: status === "ACTIVE",
  });
}

/**
 * Busca usuarios por término (para autocomplete/search)
 */
export async function searchUsers(term, excludeIds = []) {
  if (!term || term.length < 2) return [];

  const queries = [
    Query.or([
      Query.contains("email", term),
      Query.contains("firstName", term),
      Query.contains("lastName", term),
    ]),
    Query.equal("enabled", true),
    Query.limit(20),
  ];

  const response = await databases.listDocuments(DB, USERS_PROFILE, queries);

  // Filtrar los que ya están excluidos
  return response.documents.filter((u) => !excludeIds.includes(u.$id));
}

/**
 * Obtiene estadísticas de usuarios (todos - para platform admins)
 */
export async function getUserStats() {
  const [total, active, suspended, admins] = await Promise.all([
    databases.listDocuments(DB, USERS_PROFILE, [Query.limit(1)]),
    databases.listDocuments(DB, USERS_PROFILE, [
      Query.equal("status", "ACTIVE"),
      Query.limit(1),
    ]),
    databases.listDocuments(DB, USERS_PROFILE, [
      Query.equal("status", "SUSPENDED"),
      Query.limit(1),
    ]),
    databases.listDocuments(DB, USERS_PROFILE, [
      Query.equal("isPlatformAdmin", true),
      Query.limit(1),
    ]),
  ]);

  return {
    total: total.total,
    active: active.total,
    suspended: suspended.total,
    platformAdmins: admins.total,
  };
}

// ============================================
// USUARIOS POR GRUPO (para group owners/admins)
// ============================================

const GROUP_MEMBERS = env.collectionGroupMembersId;

/**
 * Lista los usuarios miembros de un grupo específico
 * @param {string} groupId - ID del grupo
 * @param {Object} filters - Filtros opcionales
 */
export async function listGroupUsers(groupId, filters = {}) {
  if (!groupId) return [];

  // 1. Obtener membresías del grupo
  const memberQueries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.limit(200),
  ];

  const membersRes = await databases.listDocuments(
    DB,
    GROUP_MEMBERS,
    memberQueries
  );

  if (membersRes.documents.length === 0) return [];

  // 2. Obtener los profileIds de los miembros
  const profileIds = membersRes.documents.map((m) => m.profileId);

  // 3. Obtener los perfiles de esos usuarios
  const profileQueries = [
    Query.equal("$id", profileIds),
    Query.orderDesc("$createdAt"),
  ];

  if (filters.status) {
    profileQueries.push(Query.equal("status", filters.status));
  }

  if (typeof filters.enabled === "boolean") {
    profileQueries.push(Query.equal("enabled", filters.enabled));
  }

  const profilesRes = await databases.listDocuments(
    DB,
    USERS_PROFILE,
    profileQueries
  );

  // 4. Enriquecer con info de membresía
  const membershipMap = new Map(
    membersRes.documents.map((m) => [m.profileId, m])
  );

  return profilesRes.documents.map((profile) => ({
    ...profile,
    membership: membershipMap.get(profile.$id),
  }));
}

/**
 * Obtiene estadísticas de usuarios de un grupo específico
 * @param {string} groupId - ID del grupo
 */
export async function getGroupUserStats(groupId) {
  if (!groupId) {
    return { total: 0, active: 0, suspended: 0, admins: 0 };
  }

  // 1. Obtener membresías del grupo
  const membersRes = await databases.listDocuments(DB, GROUP_MEMBERS, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.limit(500),
  ]);

  if (membersRes.documents.length === 0) {
    return { total: 0, active: 0, suspended: 0, admins: 0 };
  }

  const profileIds = membersRes.documents.map((m) => m.profileId);
  const membershipMap = new Map(
    membersRes.documents.map((m) => [m.profileId, m])
  );

  // 2. Obtener perfiles
  const profilesRes = await databases.listDocuments(DB, USERS_PROFILE, [
    Query.equal("$id", profileIds),
  ]);

  const profiles = profilesRes.documents;

  // 3. Calcular estadísticas
  const active = profiles.filter((p) => p.status === "ACTIVE").length;
  const suspended = profiles.filter((p) => p.status === "SUSPENDED").length;
  const admins = profiles.filter((p) => {
    const membership = membershipMap.get(p.$id);
    return membership?.role === "OWNER" || membership?.role === "ADMIN";
  }).length;

  return {
    total: profiles.length,
    active,
    suspended,
    admins, // Admins del grupo (no de plataforma)
  };
}
