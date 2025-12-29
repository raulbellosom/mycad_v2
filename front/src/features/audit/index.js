// Página principal
export { AuditLogsPage } from "./pages/AuditLogsPage";

// Hooks
export {
  useAuditLogs,
  useAuditLog,
  useAuditStats,
  useLogAuditEvent,
} from "./hooks/useAuditLogs";

// Helpers para integración fácil
export {
  auditLog,
  getVehicleDisplayName,
  getServiceReportDisplayName,
  getRepairReportDisplayName,
  getClientDisplayName,
  getDriverDisplayName,
} from "./hooks/useAuditHelpers";

// Servicio (para uso en otros módulos)
export {
  logAuditEvent,
  createAuditLog,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  ACTION_COLORS,
} from "./services/audit.service";

// Componentes (por si se necesitan reusar)
export {
  AuditLogCard,
  AuditLogTableRow,
  AuditActionBadge,
  AuditEntityBadge,
} from "./components/AuditLogItem";
export { AuditLogDetailModal } from "./components/AuditLogDetailModal";
export { AuditFilters } from "./components/AuditFilters";
export { AuditPagination } from "./components/AuditPagination";
