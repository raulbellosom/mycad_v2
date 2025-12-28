import { ID, Query } from "appwrite";
import { account, databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const DB = env.databaseId;
const USERS_PROFILE = env.collectionUsersProfileId;
const DRIVERS = env.collectionDriversId;
const DRIVER_LICENSES = env.collectionDriverLicensesId;
const DRIVER_FILES = env.collectionDriverFilesId;
const BUCKET_AVATARS = env.bucketAvatarsId;
const BUCKET_VEHICLES = env.bucketVehiclesId; // Used for driver files

// ==========================================
// Profile Management
// ==========================================

/**
 * Obtiene el perfil completo del usuario actual
 */
export async function getMyProfile(userAuthId) {
  const res = await databases.listDocuments(DB, USERS_PROFILE, [
    Query.equal("userAuthId", userAuthId),
  ]);
  return res.documents?.[0] || null;
}

/**
 * Actualiza información básica del perfil
 */
export async function updateMyProfileInfo(profileId, data) {
  const allowedFields = ["firstName", "lastName", "phone", "username"];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  return await databases.updateDocument(
    DB,
    USERS_PROFILE,
    profileId,
    updateData
  );
}

// ==========================================
// Avatar Management
// ==========================================

/**
 * Sube un nuevo avatar
 */
export async function uploadAvatar(file) {
  if (!BUCKET_AVATARS) {
    throw new Error("El bucket de avatares no está configurado");
  }
  return await storage.createFile(BUCKET_AVATARS, ID.unique(), file);
}

/**
 * Actualiza el avatar del perfil
 */
export async function updateAvatar(profileId, avatarFileId) {
  return await databases.updateDocument(DB, USERS_PROFILE, profileId, {
    avatarFileId,
  });
}

/**
 * Elimina un avatar del storage
 */
export async function deleteAvatar(fileId) {
  if (!BUCKET_AVATARS || !fileId) return;
  try {
    await storage.deleteFile(BUCKET_AVATARS, fileId);
  } catch (error) {
    console.error("Error deleting avatar:", error);
  }
}

/**
 * Obtiene URL de preview del avatar
 */
export function getAvatarPreviewUrl(avatarFileId, size = 200) {
  if (!avatarFileId || !BUCKET_AVATARS) return null;
  return storage.getFilePreview(BUCKET_AVATARS, avatarFileId, size, size);
}

// ==========================================
// Auth Account Management (Appwrite Auth)
// ==========================================

/**
 * Actualiza el email del usuario en Auth
 * Requiere la contraseña actual para validar
 */
export async function updateEmail(newEmail, currentPassword) {
  return await account.updateEmail(newEmail, currentPassword);
}

/**
 * Actualiza el email en el profile después de cambiar en Auth
 */
export async function syncEmailToProfile(profileId, newEmail) {
  return await databases.updateDocument(DB, USERS_PROFILE, profileId, {
    email: newEmail,
  });
}

/**
 * Actualiza la contraseña del usuario
 */
export async function updatePassword(newPassword, currentPassword) {
  return await account.updatePassword(newPassword, currentPassword);
}

/**
 * Actualiza el nombre en Auth
 */
export async function updateAuthName(name) {
  return await account.updateName(name);
}

/**
 * Obtiene las sesiones activas del usuario
 */
export async function getActiveSessions() {
  return await account.listSessions();
}

/**
 * Elimina una sesión específica
 */
export async function deleteSession(sessionId) {
  return await account.deleteSession(sessionId);
}

/**
 * Elimina todas las sesiones excepto la actual
 */
export async function deleteOtherSessions() {
  const sessions = await account.listSessions();
  const currentSession = sessions.sessions.find((s) => s.current);

  for (const session of sessions.sessions) {
    if (!session.current) {
      await account.deleteSession(session.$id);
    }
  }
}

// ==========================================
// Driver Info (if user is also a driver)
// ==========================================

/**
 * Obtiene el registro de driver vinculado al perfil
 */
export async function getMyDriverRecord(profileId) {
  if (!DRIVERS) return null;

  try {
    const res = await databases.listDocuments(DB, DRIVERS, [
      Query.equal("linkedProfileId", profileId),
      Query.equal("enabled", true),
    ]);
    return res.documents?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Actualiza información del driver
 */
export async function updateMyDriverInfo(driverId, data) {
  const allowedFields = ["phone", "notes"];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  return await databases.updateDocument(DB, DRIVERS, driverId, updateData);
}

/**
 * Lista las licencias del driver
 */
export async function getMyDriverLicenses(driverId) {
  if (!DRIVER_LICENSES || !driverId) return [];

  const res = await databases.listDocuments(DB, DRIVER_LICENSES, [
    Query.equal("driverId", driverId),
    Query.equal("enabled", true),
  ]);
  return res.documents;
}

/**
 * Lista los archivos del driver
 */
export async function getMyDriverFiles(driverId) {
  if (!DRIVER_FILES || !driverId) return [];

  const res = await databases.listDocuments(DB, DRIVER_FILES, [
    Query.equal("driverId", driverId),
    Query.equal("enabled", true),
  ]);
  return res.documents;
}

/**
 * Sube un archivo de driver
 */
export async function uploadDriverFile(file) {
  return await storage.createFile(BUCKET_VEHICLES, ID.unique(), file);
}

/**
 * Registra un archivo de driver en la BD
 */
export async function registerDriverFile(
  driverId,
  groupId,
  storageFileId,
  kind,
  label = ""
) {
  return await databases.createDocument(DB, DRIVER_FILES, ID.unique(), {
    driverId,
    groupId,
    fileId: storageFileId,
    kind,
    label,
    enabled: true,
  });
}

/**
 * Elimina un archivo de driver
 */
export async function deleteDriverFile(docId, fileId) {
  if (docId) {
    await databases.deleteDocument(DB, DRIVER_FILES, docId);
  }
  if (fileId) {
    try {
      await storage.deleteFile(BUCKET_VEHICLES, fileId);
    } catch (error) {
      console.error("Error deleting driver file:", error);
    }
  }
}

/**
 * Obtiene preview de un archivo de driver
 */
export function getDriverFilePreviewUrl(fileId, width = 200, height = 200) {
  if (!fileId) return null;
  return storage.getFilePreview(BUCKET_VEHICLES, fileId, width, height);
}

// ==========================================
// Verification Status
// ==========================================

/**
 * Envía email de verificación
 */
export async function sendVerificationEmail(url) {
  return await account.createVerification(url);
}

/**
 * Confirma verificación de email
 */
export async function confirmVerification(userId, secret) {
  return await account.updateVerification(userId, secret);
}

// ==========================================
// Account Preferences (opcional)
// ==========================================

/**
 * Obtiene preferencias del usuario
 */
export async function getPreferences() {
  return await account.getPrefs();
}

/**
 * Actualiza preferencias del usuario
 */
export async function updatePreferences(prefs) {
  return await account.updatePrefs(prefs);
}
