import { Badge } from "../../../../shared/ui/Badge";
import {
  REPORT_STATUS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  REPAIR_STATUS,
  REPAIR_STATUS_LABELS,
  REPAIR_STATUS_COLORS,
  REPAIR_PRIORITY,
  REPAIR_PRIORITY_LABELS,
  REPAIR_PRIORITY_COLORS,
  DAMAGE_TYPE_LABELS,
} from "../../constants/report.constants";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileEdit,
  Lock,
} from "lucide-react";

/**
 * Badge para mostrar el status de un reporte de servicio
 */
export function ReportStatusBadge({ status, size = "md" }) {
  const label = REPORT_STATUS_LABELS[status] || status;
  const variant = REPORT_STATUS_COLORS[status] || "default";

  const icons = {
    [REPORT_STATUS.DRAFT]: FileEdit,
    [REPORT_STATUS.FINALIZED]: CheckCircle2,
  };

  const Icon = icons[status];

  return (
    <Badge variant={variant} size={size} className="gap-1.5">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

/**
 * Badge para mostrar el status de reparación
 */
export function RepairStatusBadge({ status, size = "md" }) {
  const label = REPAIR_STATUS_LABELS[status] || status;
  const variant = REPAIR_STATUS_COLORS[status] || "default";

  const icons = {
    [REPAIR_STATUS.OPEN]: AlertCircle,
    [REPAIR_STATUS.IN_PROGRESS]: Clock,
    [REPAIR_STATUS.DONE]: CheckCircle2,
    [REPAIR_STATUS.CANCELED]: XCircle,
  };

  const Icon = icons[status];

  return (
    <Badge variant={variant} size={size} className="gap-1.5">
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

/**
 * Badge para mostrar la prioridad de reparación
 */
export function RepairPriorityBadge({ priority, size = "md" }) {
  const label = REPAIR_PRIORITY_LABELS[priority] || priority;
  const variant = REPAIR_PRIORITY_COLORS[priority] || "default";

  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}

/**
 * Badge para mostrar el tipo de daño
 */
export function DamageTypeBadge({ type, size = "md" }) {
  const label = DAMAGE_TYPE_LABELS[type] || type;

  return (
    <Badge variant="default" size={size}>
      {label}
    </Badge>
  );
}

/**
 * Indicador de reporte finalizado
 */
export function ReportFinalizedIndicator({ finalizedAt, finalizedBy }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <Lock className="h-4 w-4" />
        <span className="font-medium">Reporte Finalizado</span>
      </div>
      <div className="mt-1 text-sm text-green-600 dark:text-green-500">
        {finalizedAt && <span>Finalizado el {formatDate(finalizedAt)}</span>}
        {finalizedBy && <span> por {finalizedBy}</span>}
      </div>
    </div>
  );
}
