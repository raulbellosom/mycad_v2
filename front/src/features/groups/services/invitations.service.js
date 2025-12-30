import { databases, functions } from "../../../shared/appwrite/client";
import { Query, ID } from "appwrite";
import { env } from "../../../shared/appwrite/env";
import { addGroupMember } from "./permissions.service";

const DB = env.databaseId;
const INVITATIONS = env.collectionGroupInvitationsId;
const USERS_PROFILE = env.collectionUsersProfileId;
const GROUP_MEMBERS = env.collectionGroupMembersId;

/**
 * Verifica si un email ya existe en la plataforma
 * @param {string} email - Email a verificar
 * @returns {Promise<Object|null>} - Perfil si existe, null si no
 */
export async function checkEmailExists(email) {
  const res = await databases.listDocuments(DB, USERS_PROFILE, [
    Query.equal("email", email.toLowerCase().trim()),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Verifica si un usuario ya es miembro de un grupo
 * @param {string} groupId - ID del grupo
 * @param {string} profileId - ID del perfil
 * @returns {Promise<Object|null>} - Membresía si existe, null si no
 */
export async function checkExistingMembership(groupId, profileId) {
  const res = await databases.listDocuments(DB, GROUP_MEMBERS, [
    Query.equal("groupId", groupId),
    Query.equal("profileId", profileId),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Verifica si ya existe una invitación pendiente para un email en un grupo
 * @param {string} groupId - ID del grupo
 * @param {string} email - Email del invitado
 * @returns {Promise<Object|null>} - Invitación si existe, null si no
 */
export async function checkPendingInvitation(groupId, email) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("groupId", groupId),
    Query.equal("invitedEmail", email.toLowerCase().trim()),
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Crea una invitación y envía el correo
 * @param {Object} params - Parámetros de la invitación
 * @param {string} params.groupId - ID del grupo
 * @param {string} params.groupName - Nombre del grupo
 * @param {string} params.email - Email del invitado
 * @param {string} params.role - Rol propuesto (MEMBER, ADMIN, VIEWER)
 * @param {string} params.message - Mensaje personalizado
 * @param {string} params.inviterProfileId - ID del perfil que invita
 * @param {string} params.inviterName - Nombre de quien invita
 * @returns {Promise<Object>} - Invitación creada
 */
export async function createGroupInvitation({
  groupId,
  groupName,
  email,
  role = "MEMBER",
  message = "",
  inviterProfileId,
  inviterName,
}) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verificar si el email ya existe en la plataforma
  const existingProfile = await checkEmailExists(normalizedEmail);

  // 2. Si ya existe, verificar si ya es miembro del grupo
  if (existingProfile) {
    const existingMembership = await checkExistingMembership(
      groupId,
      existingProfile.$id
    );
    if (existingMembership) {
      throw new Error("Este usuario ya es miembro del grupo");
    }
  }

  // 3. Verificar si ya hay invitación pendiente
  const pendingInvitation = await checkPendingInvitation(
    groupId,
    normalizedEmail
  );
  if (pendingInvitation) {
    throw new Error("Ya existe una invitación pendiente para este email");
  }

  // 4. Crear token único
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  // 5. Crear documento de invitación
  const invitation = await databases.createDocument(
    DB,
    INVITATIONS,
    ID.unique(),
    {
      groupId,
      invitedEmail: normalizedEmail,
      invitedProfileId: existingProfile?.$id || null,
      invitedByProfileId: inviterProfileId,
      role,
      status: "PENDING",
      token,
      message: message || null,
      expiresAt: expiresAt.toISOString(),
      enabled: true,
      // Relaciones
      group: groupId,
      invitedBy: inviterProfileId,
      invitedProfile: existingProfile?.$id || null,
    }
  );

  // 6. Enviar correo
  const acceptUrl = `${window.location.origin}/invitations/accept?token=${token}`;

  try {
    await functions.createExecution(
      env.fnEmailServiceId,
      JSON.stringify({
        action: "send-group-invitation",
        email: normalizedEmail,
        name: existingProfile?.firstName || "",
        inviterName,
        groupName,
        role,
        message,
        acceptUrl,
        lang: "es",
      })
    );
  } catch (emailError) {
    // Si falla el email, no fallar la invitación pero loguear
    console.error("Error enviando email de invitación:", emailError);
  }

  return invitation;
}

/**
 * Obtiene una invitación por token
 * @param {string} token - Token de la invitación
 * @returns {Promise<Object|null>} - Invitación si existe
 */
export async function getInvitationByToken(token) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("token", token),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Obtiene una invitación por ID
 * @param {string} invitationId - ID de la invitación
 * @returns {Promise<Object>} - Invitación
 */
export async function getInvitationById(invitationId) {
  return await databases.getDocument(DB, INVITATIONS, invitationId);
}

/**
 * Acepta una invitación
 * @param {string} token - Token de la invitación
 * @param {string} profileId - ID del perfil que acepta
 * @returns {Promise<Object>} - Invitación actualizada
 */
export async function acceptInvitation(token, profileId) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invitación no encontrada");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Esta invitación ya fue procesada");
  }

  // Verificar expiración
  if (new Date(invitation.expiresAt) < new Date()) {
    await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
      status: "EXPIRED",
    });
    throw new Error("Esta invitación ha expirado");
  }

  // Verificar que el profileId coincida si la invitación era para un usuario específico
  if (
    invitation.invitedProfileId &&
    invitation.invitedProfileId !== profileId
  ) {
    throw new Error("Esta invitación no es para tu cuenta");
  }

  // Verificar si ya es miembro
  const existingMembership = await checkExistingMembership(
    invitation.groupId,
    profileId
  );
  if (existingMembership) {
    // Actualizar invitación como aceptada aunque ya era miembro
    await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
      status: "ACCEPTED",
      respondedAt: new Date().toISOString(),
    });
    throw new Error("Ya eres miembro de este grupo");
  }

  // Actualizar invitación
  await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
    status: "ACCEPTED",
    respondedAt: new Date().toISOString(),
    invitedProfileId: profileId, // Actualizar si no estaba
    invitedProfile: profileId,
  });

  // Agregar como miembro del grupo
  await addGroupMember(
    invitation.groupId,
    profileId,
    invitation.role,
    `Invitado por ${invitation.invitedByProfileId}`
  );

  return invitation;
}

/**
 * Rechaza una invitación
 * @param {string} token - Token de la invitación
 * @returns {Promise<Object>} - Invitación actualizada
 */
export async function rejectInvitation(token) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invitación no encontrada");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Esta invitación ya fue procesada");
  }

  return await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
    status: "REJECTED",
    respondedAt: new Date().toISOString(),
  });
}

/**
 * Lista invitaciones pendientes de un usuario (por profileId)
 * @param {string} profileId - ID del perfil
 * @returns {Promise<Array>} - Lista de invitaciones
 */
export async function listMyPendingInvitations(profileId) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("invitedProfileId", profileId),
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.greaterThan("expiresAt", new Date().toISOString()),
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
}

/**
 * Lista invitaciones pendientes por email (para usuarios no registrados aún)
 * @param {string} email - Email del usuario
 * @returns {Promise<Array>} - Lista de invitaciones
 */
export async function listPendingInvitationsByEmail(email) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("invitedEmail", email.toLowerCase().trim()),
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.greaterThan("expiresAt", new Date().toISOString()),
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
}

/**
 * Lista todas las invitaciones enviadas por un grupo
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Array>} - Lista de invitaciones
 */
export async function listGroupInvitations(groupId) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);
  return res.documents;
}

/**
 * Lista invitaciones pendientes de un grupo
 * @param {string} groupId - ID del grupo
 * @returns {Promise<Array>} - Lista de invitaciones pendientes
 */
export async function listGroupPendingInvitations(groupId) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("groupId", groupId),
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
  return res.documents;
}

/**
 * Cancela una invitación pendiente
 * @param {string} invitationId - ID de la invitación
 * @returns {Promise<Object>} - Invitación actualizada
 */
export async function cancelInvitation(invitationId) {
  const invitation = await getInvitationById(invitationId);

  if (invitation.status !== "PENDING") {
    throw new Error("Solo se pueden cancelar invitaciones pendientes");
  }

  return await databases.updateDocument(DB, INVITATIONS, invitationId, {
    status: "CANCELLED",
  });
}

/**
 * Reenvía una invitación (genera nuevo token y extiende expiración)
 * @param {string} invitationId - ID de la invitación
 * @param {string} inviterName - Nombre de quien reenvía
 * @param {string} groupName - Nombre del grupo
 * @returns {Promise<Object>} - Invitación actualizada
 */
export async function resendInvitation(invitationId, inviterName, groupName) {
  const invitation = await getInvitationById(invitationId);

  if (invitation.status !== "PENDING") {
    throw new Error("Solo se pueden reenviar invitaciones pendientes");
  }

  // Generar nuevo token y extender expiración
  const newToken = crypto.randomUUID();
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 7);

  // Actualizar invitación
  const updated = await databases.updateDocument(
    DB,
    INVITATIONS,
    invitationId,
    {
      token: newToken,
      expiresAt: newExpiresAt.toISOString(),
    }
  );

  // Reenviar correo
  const acceptUrl = `${window.location.origin}/invitations/accept?token=${newToken}`;

  try {
    await functions.createExecution(
      env.fnEmailServiceId,
      JSON.stringify({
        action: "send-group-invitation",
        email: invitation.invitedEmail,
        name: "", // No tenemos el nombre si no está registrado
        inviterName,
        groupName,
        role: invitation.role,
        message: invitation.message || "",
        acceptUrl,
        lang: "es",
      })
    );
  } catch (emailError) {
    console.error("Error reenviando email de invitación:", emailError);
  }

  return updated;
}

/**
 * Marca invitaciones expiradas (para ejecutar periódicamente si se desea)
 * @param {string} groupId - ID del grupo (opcional, si no se pasa revisa todas)
 */
export async function markExpiredInvitations(groupId = null) {
  const queries = [
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.lessThan("expiresAt", new Date().toISOString()),
    Query.limit(100),
  ];

  if (groupId) {
    queries.unshift(Query.equal("groupId", groupId));
  }

  const res = await databases.listDocuments(DB, INVITATIONS, queries);

  const updates = res.documents.map((inv) =>
    databases.updateDocument(DB, INVITATIONS, inv.$id, {
      status: "EXPIRED",
    })
  );

  await Promise.all(updates);

  return res.documents.length;
}
