import { env } from "../appwrite/env";

/**
 * Construye la URL base para archivos de Storage de Appwrite
 * Incluye siempre el parámetro project para evitar errores 404
 */
function buildStorageUrl(bucketId, fileId, endpoint, params = {}) {
  if (!fileId || !bucketId) return null;

  const url = new URL(
    `${env.endpoint}/storage/buckets/${bucketId}/files/${fileId}/${endpoint}`
  );

  // Siempre incluir el project ID
  url.searchParams.set("project", env.projectId);

  // Agregar parámetros adicionales
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Genera la URL de preview para un archivo de storage
 *
 * @param {string} bucketId - ID del bucket
 * @param {string} fileId - ID del archivo
 * @param {object} options - Opciones de preview
 * @param {number} [options.width] - Ancho de la imagen
 * @param {number} [options.height] - Alto de la imagen
 * @param {string} [options.gravity] - Punto de recorte (center, top-left, top, top-right, left, right, bottom-left, bottom, bottom-right)
 * @param {number} [options.quality] - Calidad de compresión (0-100)
 * @param {number} [options.borderWidth] - Ancho del borde
 * @param {string} [options.borderColor] - Color del borde en hex
 * @param {number} [options.borderRadius] - Radio del borde
 * @param {number} [options.opacity] - Opacidad (0-1)
 * @param {number} [options.rotation] - Rotación en grados (0, 90, 180, 270)
 * @param {string} [options.background] - Color de fondo en hex
 * @param {string} [options.output] - Formato de salida (jpg, png, webp, gif)
 * @returns {string|null} URL del preview
 */
export function getFilePreviewUrl(bucketId, fileId, options = {}) {
  if (!fileId) return null;

  return buildStorageUrl(bucketId, fileId, "preview", options);
}

/**
 * Genera URL de preview para avatar de usuario
 * @param {string} avatarFileId - ID del archivo de avatar
 * @param {number} [size=96] - Tamaño del avatar (cuadrado)
 * @returns {string|null} URL del avatar
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
 * @param {string} logoFileId - ID del archivo de logo
 * @param {number} [size=96] - Tamaño del logo (cuadrado)
 * @returns {string|null} URL del logo
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
 * @param {string} fileId - ID del archivo
 * @param {number} [width=400] - Ancho de la imagen
 * @param {number} [height=300] - Alto de la imagen
 * @returns {string|null} URL de la imagen
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
 * @param {string} bucketId - ID del bucket
 * @param {string} fileId - ID del archivo
 * @returns {string|null} URL de vista
 */
export function getFileViewUrl(bucketId, fileId) {
  if (!fileId) return null;
  return buildStorageUrl(bucketId, fileId, "view");
}

/**
 * Genera URL para descargar archivo
 * @param {string} bucketId - ID del bucket
 * @param {string} fileId - ID del archivo
 * @returns {string|null} URL de descarga
 */
export function getFileDownloadUrl(bucketId, fileId) {
  if (!fileId) return null;
  return buildStorageUrl(bucketId, fileId, "download");
}

/**
 * Genera URL de preview para archivos genéricos con bucket configurable
 * @param {string} bucketId - ID del bucket
 * @param {string} fileId - ID del archivo
 * @param {number} [width] - Ancho opcional
 * @param {number} [height] - Alto opcional
 * @returns {string|null} URL del preview
 */
export function getGenericFileUrl(bucketId, fileId, width, height) {
  if (!fileId || !bucketId) return null;
  const options = {};
  if (width) options.width = width;
  if (height) options.height = height;
  return getFilePreviewUrl(bucketId, fileId, options);
}
