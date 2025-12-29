import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  User,
  Monitor,
  Globe,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ACTION_LABELS, ENTITY_TYPE_LABELS } from "../services/audit.service";
import { AuditActionBadge, AuditEntityBadge } from "./AuditLogItem";
import { cn } from "../../../shared/utils/cn";

/**
 * Modal para ver detalles de un log de auditoría
 */
export function AuditLogDetailModal({ log, isOpen, onClose }) {
  if (!log) return null;

  const userName = log.profile
    ? `${log.profile.firstName || ""} ${log.profile.lastName || ""}`.trim() ||
      log.profile.email
    : "Usuario desconocido";

  const formattedDateTime = new Date(log.createdAt).toLocaleDateString(
    "es-MX",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );

  // Parsear detalles si existen
  let details = null;
  if (log.details) {
    try {
      details =
        typeof log.details === "string" ? JSON.parse(log.details) : log.details;
    } catch {
      details = log.details;
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={cn(
              "fixed inset-4 z-50 m-auto max-h-[90vh] max-w-lg",
              "overflow-hidden rounded-2xl bg-(--card) shadow-2xl",
              "flex flex-col",
              "md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-full"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-(--border) px-6 py-4">
              <h2 className="text-lg font-semibold text-(--fg)">
                Detalle de Actividad
              </h2>
              <button
                onClick={onClose}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  "text-(--muted-fg) transition-colors",
                  "hover:bg-(--muted)/50 hover:text-(--fg)"
                )}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Acción y tipo */}
                <div className="flex flex-wrap items-center gap-3">
                  <AuditActionBadge action={log.action} size="md" />
                  <span className="text-(--muted-fg)">en</span>
                  <AuditEntityBadge entityType={log.entityType} />
                </div>

                {/* Nombre de la entidad */}
                {log.entityName && (
                  <div className="rounded-xl bg-(--muted)/20 p-4">
                    <div className="flex items-start gap-3">
                      <FileText
                        size={20}
                        className="mt-0.5 text-(--muted-fg) shrink-0"
                      />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-(--muted-fg) mb-1">
                          Recurso afectado
                        </p>
                        <p className="text-sm font-medium text-(--fg)">
                          {log.entityName}
                        </p>
                        {log.entityId && (
                          <p className="mt-1 text-xs text-(--muted-fg) font-mono">
                            ID: {log.entityId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Info del usuario */}
                <DetailItem icon={User} label="Usuario">
                  <p className="font-medium">{userName}</p>
                  {log.profile?.email && (
                    <p className="text-xs text-(--muted-fg)">
                      {log.profile.email}
                    </p>
                  )}
                </DetailItem>

                {/* Fecha y hora */}
                <DetailItem icon={Clock} label="Fecha y hora">
                  <p className="capitalize">{formattedDateTime}</p>
                </DetailItem>

                {/* User Agent */}
                {log.userAgent && (
                  <DetailItem icon={Monitor} label="Dispositivo">
                    <p className="text-xs break-all">{log.userAgent}</p>
                  </DetailItem>
                )}

                {/* IP Address */}
                {log.ipAddress && (
                  <DetailItem icon={Globe} label="Dirección IP">
                    <p className="font-mono">{log.ipAddress}</p>
                  </DetailItem>
                )}

                {/* Detalles adicionales */}
                {details && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-(--muted-fg)">
                      Detalles adicionales
                    </p>
                    <div className="rounded-xl bg-(--muted)/20 p-4">
                      {typeof details === "object" ? (
                        <div className="space-y-2">
                          {Object.entries(details).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-(--muted-fg)">{key}:</span>
                              <span className="font-medium text-(--fg)">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{details}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-(--border) px-6 py-4">
              <button
                onClick={onClose}
                className={cn(
                  "w-full rounded-xl bg-(--muted)/30 px-4 py-2.5",
                  "text-sm font-medium text-(--fg)",
                  "transition-colors hover:bg-(--muted)/50"
                )}
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Componente auxiliar para items de detalle
// ============================================

function DetailItem({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--muted)/30 text-(--muted-fg)">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-(--muted-fg) mb-0.5">
          {label}
        </p>
        <div className="text-sm text-(--fg)">{children}</div>
      </div>
    </div>
  );
}
