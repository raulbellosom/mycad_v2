/**
 * Utilidades para manejo de fechas sin problemas de zona horaria
 *
 * El problema: Cuando el servidor devuelve fechas ISO como "2022-06-22T00:00:00.000+00:00",
 * JavaScript las interpreta en UTC. Al convertirlas a zona horaria local (ej: México UTC-6),
 * la fecha puede mostrar el día anterior.
 *
 * Solución: Extraer solo la parte de fecha (YYYY-MM-DD) sin conversión de zona horaria.
 */

/**
 * Normaliza una fecha ISO del servidor a formato 'yyyy-MM-dd' sin conversión de zona horaria.
 * Útil para poblar inputs de tipo fecha que esperan formato 'yyyy-MM-dd'.
 *
 * @param {string | Date | null | undefined} dateValue - Fecha del servidor (ISO string, Date, etc.)
 * @returns {string} Fecha en formato 'yyyy-MM-dd' o cadena vacía si no es válida
 *
 * @example
 * normalizeServerDate("2022-06-22T00:00:00.000+00:00") // "2022-06-22"
 * normalizeServerDate("2022-06-22") // "2022-06-22"
 * normalizeServerDate(null) // ""
 */
export function normalizeServerDate(dateValue) {
  if (!dateValue) return "";

  // Si es un string, intentar extraer la parte de fecha directamente
  if (typeof dateValue === "string") {
    // Si ya está en formato yyyy-MM-dd, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // Si es formato ISO con hora, extraer solo la fecha (primeros 10 caracteres)
    // Esto evita problemas de zona horaria
    if (/^\d{4}-\d{2}-\d{2}T/.test(dateValue)) {
      return dateValue.substring(0, 10);
    }

    // Para otros formatos, intentar parsear y reformatear
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        // Usar UTC para evitar conversión de zona horaria
        return date.toISOString().substring(0, 10);
      }
    } catch {
      // Si falla, devolver cadena vacía
    }
  }

  // Si es un objeto Date
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    // Usar la fecha local, no UTC
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

/**
 * Formatea una fecha ISO del servidor para mostrar al usuario.
 * Extrae la fecha sin conversión de zona horaria y la formatea.
 *
 * @param {string | null | undefined} dateValue - Fecha del servidor en formato ISO
 * @param {object} options - Opciones de formateo
 * @param {string} options.locale - Locale para formateo (default: 'es-MX')
 * @param {string} options.format - Formato: 'short', 'medium', 'long' (default: 'medium')
 * @param {string} options.fallback - Valor si no hay fecha (default: '—')
 * @returns {string} Fecha formateada para mostrar
 *
 * @example
 * formatServerDate("2022-06-22T00:00:00.000+00:00") // "22 de junio de 2022"
 * formatServerDate(null) // "—"
 */
export function formatServerDate(dateValue, options = {}) {
  const { locale = "es-MX", format = "medium", fallback = "—" } = options;

  const normalized = normalizeServerDate(dateValue);
  if (!normalized) return fallback;

  // Crear fecha usando componentes para evitar zona horaria
  const [year, month, day] = normalized.split("-").map(Number);
  // Crear fecha a mediodía para evitar problemas de zona horaria
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (isNaN(date.getTime())) return fallback;

  const formatOptions = {
    short: { day: "numeric", month: "numeric", year: "numeric" },
    medium: { day: "numeric", month: "long", year: "numeric" },
    long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  };

  try {
    return date.toLocaleDateString(
      locale,
      formatOptions[format] || formatOptions.medium
    );
  } catch {
    return fallback;
  }
}

/**
 * Convierte una fecha local (yyyy-MM-dd) a formato ISO para enviar al servidor.
 * Asegura que la hora sea 00:00:00 UTC para consistencia.
 *
 * @param {string} localDate - Fecha en formato 'yyyy-MM-dd'
 * @returns {string | null} Fecha en formato ISO o null si no es válida
 *
 * @example
 * toServerDate("2022-06-22") // "2022-06-22T00:00:00.000Z" o simplemente "2022-06-22"
 */
export function toServerDate(localDate) {
  if (!localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    return null;
  }
  // Devolver solo la fecha sin hora - el servidor lo manejará
  return localDate;
}

/**
 * Verifica si una fecha es válida
 *
 * @param {string | Date | null | undefined} dateValue - Valor a verificar
 * @returns {boolean} true si es una fecha válida
 */
export function isValidDate(dateValue) {
  if (!dateValue) return false;

  if (typeof dateValue === "string") {
    // Verificar formato básico
    if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      const date = new Date(dateValue);
      return !isNaN(date.getTime());
    }
    return false;
  }

  if (dateValue instanceof Date) {
    return !isNaN(dateValue.getTime());
  }

  return false;
}
