import { forwardRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Eye,
  CheckCircle,
  RotateCcw,
  UserPlus,
  UserMinus,
  Upload,
  MoreHorizontal,
  Car,
  Wrench,
  FileText,
  Users,
  Building2,
  Shield,
  FolderOpen,
  File,
  HelpCircle,
} from "lucide-react";
import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  ACTION_COLORS,
} from "../services/audit.service";
import { Badge } from "../../../shared/ui/Badge";
import { cn } from "../../../shared/utils/cn";

// ============================================
// ICONOS POR ACCIÓN
// ============================================

const ACTION_ICONS = {
  [AUDIT_ACTIONS.CREATE]: Plus,
  [AUDIT_ACTIONS.UPDATE]: Pencil,
  [AUDIT_ACTIONS.DELETE]: Trash2,
  [AUDIT_ACTIONS.LOGIN]: LogIn,
  [AUDIT_ACTIONS.LOGOUT]: LogOut,
  [AUDIT_ACTIONS.VIEW]: Eye,
  [AUDIT_ACTIONS.FINALIZE]: CheckCircle,
  [AUDIT_ACTIONS.REOPEN]: RotateCcw,
  [AUDIT_ACTIONS.ASSIGN]: UserPlus,
  [AUDIT_ACTIONS.UNASSIGN]: UserMinus,
  [AUDIT_ACTIONS.UPLOAD]: Upload,
  [AUDIT_ACTIONS.OTHER]: MoreHorizontal,
};

// ============================================
// ICONOS POR TIPO DE ENTIDAD
// ============================================

const ENTITY_ICONS = {
  [ENTITY_TYPES.VEHICLE]: Car,
  [ENTITY_TYPES.SERVICE_REPORT]: Wrench,
  [ENTITY_TYPES.REPAIR_REPORT]: FileText,
  [ENTITY_TYPES.CLIENT]: Users,
  [ENTITY_TYPES.RENTAL]: FileText,
  [ENTITY_TYPES.DRIVER]: Users,
  [ENTITY_TYPES.USER]: Users,
  [ENTITY_TYPES.GROUP]: Building2,
  [ENTITY_TYPES.ROLE]: Shield,
  [ENTITY_TYPES.CATALOG]: FolderOpen,
  [ENTITY_TYPES.FILE]: File,
  [ENTITY_TYPES.OTHER]: HelpCircle,
};

// ============================================
// BADGE DE ACCIÓN
// ============================================

export function AuditActionBadge({ action, size = "sm" }) {
  const Icon = ACTION_ICONS[action] || MoreHorizontal;
  const label = ACTION_LABELS[action] || action;
  const color = ACTION_COLORS[action] || "muted";

  return (
    <Badge variant={color} size={size} className="gap-1.5">
      <Icon size={12} />
      <span>{label}</span>
    </Badge>
  );
}

// ============================================
// BADGE DE ENTIDAD
// ============================================

export function AuditEntityBadge({ entityType, size = "sm" }) {
  const Icon = ENTITY_ICONS[entityType] || HelpCircle;
  const label = ENTITY_TYPE_LABELS[entityType] || entityType;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-(--muted-fg)">
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </span>
  );
}

// ============================================
// CARD DE LOG DE AUDITORÍA (Mobile)
// ============================================

export const AuditLogCard = forwardRef(function AuditLogCard(
  { log, onClick, className },
  ref
) {
  const ActionIcon = ACTION_ICONS[log.action] || MoreHorizontal;
  const EntityIcon = ENTITY_ICONS[log.entityType] || HelpCircle;

  const userName = log.profile
    ? `${log.profile.firstName || ""} ${log.profile.lastName || ""}`.trim() ||
      log.profile.email
    : "Usuario desconocido";

  const formattedDate = new Date(log.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = new Date(log.createdAt).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border border-(--border) bg-(--card)",
        "p-4 transition-all hover:border-(--brand)/30 hover:shadow-md",
        "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      {/* Header con acción e icono */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              "bg-(--brand)/10 text-(--brand)"
            )}
          >
            <ActionIcon size={20} />
          </div>
          <div>
            <AuditActionBadge action={log.action} />
            <div className="mt-1 flex items-center gap-1.5 text-xs text-(--muted-fg)">
              <EntityIcon size={12} />
              <span>
                {ENTITY_TYPE_LABELS[log.entityType] || log.entityType}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-(--muted-fg)">
          <div>{formattedDate}</div>
          <div>{formattedTime}</div>
        </div>
      </div>

      {/* Contenido */}
      <div className="space-y-2">
        {log.entityName && (
          <p className="text-sm font-medium text-(--fg) line-clamp-2">
            {log.entityName}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-(--muted-fg)">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-(--muted)/30">
            <Users size={12} />
          </div>
          <span className="truncate">{userName}</span>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================
// FILA DE TABLA (Desktop)
// ============================================

export const AuditLogTableRow = forwardRef(function AuditLogTableRow(
  { log, onClick, className },
  ref
) {
  const EntityIcon = ENTITY_ICONS[log.entityType] || HelpCircle;

  const userName = log.profile
    ? `${log.profile.firstName || ""} ${log.profile.lastName || ""}`.trim() ||
      log.profile.email
    : "Usuario desconocido";

  const formattedDateTime = new Date(log.createdAt).toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <motion.tr
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={cn(
        "group cursor-pointer border-b border-(--border) transition-colors",
        "hover:bg-(--muted)/30",
        className
      )}
    >
      {/* Fecha */}
      <td className="px-4 py-3 text-sm text-(--muted-fg) whitespace-nowrap">
        {formattedDateTime}
      </td>

      {/* Acción */}
      <td className="px-4 py-3">
        <AuditActionBadge action={log.action} />
      </td>

      {/* Tipo de entidad */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm">
          <EntityIcon size={16} className="text-(--muted-fg)" />
          <span>{ENTITY_TYPE_LABELS[log.entityType] || log.entityType}</span>
        </span>
      </td>

      {/* Descripción */}
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm text-(--fg) truncate">{log.entityName || "-"}</p>
      </td>

      {/* Usuario */}
      <td className="px-4 py-3 text-sm text-(--muted-fg) truncate max-w-[200px]">
        {userName}
      </td>
    </motion.tr>
  );
});

// ============================================
// SKELETON LOADING
// ============================================

export function AuditLogCardSkeleton() {
  return (
    <div className="rounded-xl border border-(--border) bg-(--card) p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-(--muted)/50" />
          <div>
            <div className="h-5 w-20 rounded bg-(--muted)/50" />
            <div className="mt-1 h-3 w-24 rounded bg-(--muted)/30" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 rounded bg-(--muted)/30" />
          <div className="h-3 w-12 rounded bg-(--muted)/30" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-(--muted)/40" />
        <div className="h-4 w-1/2 rounded bg-(--muted)/30" />
      </div>
    </div>
  );
}

export function AuditLogTableSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-(--border) animate-pulse">
          <td className="px-4 py-3">
            <div className="h-4 w-32 rounded bg-(--muted)/40" />
          </td>
          <td className="px-4 py-3">
            <div className="h-5 w-24 rounded bg-(--muted)/40" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-(--muted)/40" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-40 rounded bg-(--muted)/40" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-32 rounded bg-(--muted)/40" />
          </td>
        </tr>
      ))}
    </>
  );
}
