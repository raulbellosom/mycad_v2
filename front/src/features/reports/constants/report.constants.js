/**
 * Constantes y enums para el módulo de reportes
 */

// ============================================
// STATUS DE REPORTES
// ============================================

export const REPORT_STATUS = {
  DRAFT: "DRAFT",
  FINALIZED: "FINALIZED",
};

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.DRAFT]: "Borrador",
  [REPORT_STATUS.FINALIZED]: "Finalizado",
};

export const REPORT_STATUS_COLORS = {
  [REPORT_STATUS.DRAFT]: "warning",
  [REPORT_STATUS.FINALIZED]: "success",
};

// ============================================
// TIPOS DE SERVICIO
// ============================================

export const SERVICE_TYPE = {
  MAINTENANCE: "MAINTENANCE",
  SERVICE: "SERVICE",
  OTHER: "OTHER",
};

export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPE.MAINTENANCE]: "Mantenimiento",
  [SERVICE_TYPE.SERVICE]: "Servicio",
  [SERVICE_TYPE.OTHER]: "Otro",
};

export const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ============================================
// STATUS DE REPARACIÓN
// ============================================

export const REPAIR_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
};

export const REPAIR_STATUS_LABELS = {
  [REPAIR_STATUS.OPEN]: "Abierto",
  [REPAIR_STATUS.IN_PROGRESS]: "En Progreso",
  [REPAIR_STATUS.DONE]: "Completado",
  [REPAIR_STATUS.CANCELED]: "Cancelado",
};

export const REPAIR_STATUS_COLORS = {
  [REPAIR_STATUS.OPEN]: "info",
  [REPAIR_STATUS.IN_PROGRESS]: "warning",
  [REPAIR_STATUS.DONE]: "success",
  [REPAIR_STATUS.CANCELED]: "danger",
};

export const REPAIR_STATUS_OPTIONS = Object.entries(REPAIR_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ============================================
// PRIORIDAD DE REPARACIÓN
// ============================================

export const REPAIR_PRIORITY = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export const REPAIR_PRIORITY_LABELS = {
  [REPAIR_PRIORITY.LOW]: "Baja",
  [REPAIR_PRIORITY.NORMAL]: "Normal",
  [REPAIR_PRIORITY.HIGH]: "Alta",
  [REPAIR_PRIORITY.URGENT]: "Urgente",
};

export const REPAIR_PRIORITY_COLORS = {
  [REPAIR_PRIORITY.LOW]: "default",
  [REPAIR_PRIORITY.NORMAL]: "info",
  [REPAIR_PRIORITY.HIGH]: "warning",
  [REPAIR_PRIORITY.URGENT]: "danger",
};

export const REPAIR_PRIORITY_OPTIONS = Object.entries(
  REPAIR_PRIORITY_LABELS
).map(([value, label]) => ({ value, label }));

// ============================================
// TIPO DE DAÑO
// ============================================

export const DAMAGE_TYPE = {
  MECHANICAL: "MECHANICAL",
  ELECTRICAL: "ELECTRICAL",
  BODY: "BODY",
  INTERIOR: "INTERIOR",
  OTHER: "OTHER",
};

export const DAMAGE_TYPE_LABELS = {
  [DAMAGE_TYPE.MECHANICAL]: "Mecánico",
  [DAMAGE_TYPE.ELECTRICAL]: "Eléctrico",
  [DAMAGE_TYPE.BODY]: "Carrocería",
  [DAMAGE_TYPE.INTERIOR]: "Interior",
  [DAMAGE_TYPE.OTHER]: "Otro",
};

export const DAMAGE_TYPE_OPTIONS = Object.entries(DAMAGE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ============================================
// TABS DE LA PÁGINA PRINCIPAL
// ============================================

export const REPORT_TABS = {
  SERVICE: "service",
  REPAIR: "repair",
};

export const REPORT_TAB_OPTIONS = [
  { id: REPORT_TABS.SERVICE, label: "Servicios", icon: "Wrench" },
  { id: REPORT_TABS.REPAIR, label: "Reparaciones", icon: "Hammer" },
];
