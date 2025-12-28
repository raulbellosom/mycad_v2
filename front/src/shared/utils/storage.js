import { storage } from "../appwrite/client";
import { env } from "../appwrite/env";

/**
 * Genera la URL de preview para un archivo de storage
 * Usa el método del SDK que incluye el project ID automáticamente
 *
 * @param {string} bucketId - ID del bucket
 * @param {string} fileId - ID del archivo
 * @param {object} options - Opciones de preview
 * @param {number} [options.width] - Ancho de la imagen
 * @param {number} [options.height] - Alto de la imagen
 * @param {string} [options.gravity] - Punto de recorte (center, top, bottom, left, right)
 * @param {number} [options.quality] - Calidad de compresión (0-100)
 * @param {string} [options.output] - Formato de salida (jpg, png, webp, gif)
 * @returns {string} URL del preview
 */
export function getFilePreviewUrl(bucketId, fileId, options = {}) {
  if (!fileId) return null;

  const { width, height, gravity, quality, output } = options;

  // Usar el método del SDK que genera la URL correcta
  return storage.getFilePreview(
    bucketId,
    fileId,
    width,
    height,
    gravity,
    quality,
    undefined, // borderWidth
    undefined, // borderColor
    undefined, // borderRadius
    undefined, // opacity
    undefined, // rotation
    undefined, // background
    output
  );
}

/**
 * Genera URL de preview para avatar de usuario
 */
export function getAvatarUrl(avatarFileId, size = 96) {
  if (!avatarFileId) return null;
  return getFilePreviewUrl(env.bucketAvatarsId, avatarFileId, {
    width: size,
    height: size,
  });
}

/**
 * Genera URL de preview para logo de grupo
 */
export function getGroupLogoUrl(logoFileId, size = 96) {
  if (!logoFileId) return null;
  return getFilePreviewUrl(env.bucketAvatarsId, logoFileId, {
    width: size,
    height: size,
  });
}

/**
 * Genera URL de preview para imagen de vehículo
 */
export function getVehicleImageUrl(fileId, width = 400, height = 300) {
  if (!fileId) return null;
  return getFilePreviewUrl(env.bucketVehiclesId, fileId, {
    width,
    height,
  });
}

/**
 * Genera URL para ver archivo (sin transformaciones)
 */
export function getFileViewUrl(bucketId, fileId) {
  if (!fileId) return null;
  return storage.getFileView(bucketId, fileId);
}

/**
 * Genera URL para descargar archivo
 */
export function getFileDownloadUrl(bucketId, fileId) {
  if (!fileId) return null;
  return storage.getFileDownload(bucketId, fileId);
}
