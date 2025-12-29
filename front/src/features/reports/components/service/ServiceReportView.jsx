import { motion } from "framer-motion";
import {
  Calendar,
  Gauge,
  Building2,
  Phone,
  MapPin,
  FileText,
  User,
  Clock,
  Printer,
  Edit,
  RotateCcw,
  CheckCircle,
  Download,
} from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { Button } from "../../../../shared/ui/Button";
import { Badge } from "../../../../shared/ui/Badge";
import { formatServerDate } from "../../../../shared/utils/dateUtils";
import { VehicleInfoCard } from "../common/VehicleInfoCard";
import { PartsTable } from "../common/PartsTable";
import { ReportSummary } from "../common/ReportSummary";
import { ReportFilesSection } from "../common/ReportFilesSection";
import { ReportStatusBadge } from "../common/ReportStatusBadge";
import {
  getServiceFilePreviewUrl,
  getServiceFileDownloadUrl,
} from "../../services/service-reports.service";
import {
  SERVICE_TYPE_LABELS,
  REPORT_STATUS,
} from "../../constants/report.constants";

/**
 * Vista de solo lectura de un reporte de servicio
 * Diseño tipo "documento" elegante para impresión y visualización
 */
export function ServiceReportView({
  report,
  vehicle,
  parts = [],
  files = [],
  createdBy,
  finalizedBy,
  onEdit,
  onFinalize,
  onReopen,
  onDownloadPDF,
  canEdit = true,
  canFinalize = true,
  canReopen = false,
}) {
  const isFinalized = report?.status === REPORT_STATUS.FINALIZED;

  // Format helpers
  const formatDate = (date) => {
    return formatServerDate(date, { format: "long" });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    // Para datetime completos con hora, usamos la fecha local
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value) => {
    return (parseFloat(value) || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-(--card) rounded-2xl border border-(--border)">
        <div className="flex items-center gap-3">
          <ReportStatusBadge status={report.status} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-(--fg)">{report.title}</h1>
            <p className="text-sm text-(--muted-fg)">
              Reporte de Servicio • {formatDate(report.serviceDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadPDF && (
            <Button variant="outline" size="sm" onClick={onDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          {canEdit && !isFinalized && onEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {canFinalize && !isFinalized && onFinalize && (
            <Button size="sm" onClick={onFinalize}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          )}
          {canReopen && isFinalized && onReopen && (
            <Button variant="outline" size="sm" onClick={onReopen}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reabrir
            </Button>
          )}
        </div>
      </div>

      {/* Contenido principal estilo documento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-(--card) rounded-2xl border border-(--border) shadow-sm overflow-hidden print:shadow-none print:border-none"
      >
        {/* Header del documento */}
        <div className="bg-gradient-to-r from-(--brand) to-(--brand-600) text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Reporte de Servicio</h2>
              <p className="opacity-80">
                {SERVICE_TYPE_LABELS[report.serviceType] || "Servicio"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Folio</p>
              <p className="text-xl font-mono font-bold">
                SRV-{report.$id?.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del vehículo */}
          <Section title="Información del Vehículo">
            {vehicle && <VehicleInfoCard vehicle={vehicle} />}
          </Section>

          {/* Detalles del servicio */}
          <Section title="Detalles del Servicio">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem
                icon={Calendar}
                label="Fecha"
                value={formatDate(report.serviceDate)}
              />
              <InfoItem
                icon={Gauge}
                label="Kilometraje"
                value={
                  report.odometer
                    ? `${report.odometer.toLocaleString()} km`
                    : "—"
                }
              />
              <InfoItem
                icon={FileText}
                label="Tipo"
                value={SERVICE_TYPE_LABELS[report.serviceType] || "—"}
              />
              <InfoItem
                icon={FileText}
                label="Factura"
                value={report.invoiceNumber || "—"}
              />
            </div>
          </Section>

          {/* Información del taller */}
          {(report.vendorName ||
            report.workshopAddress ||
            report.workshopPhone) && (
            <Section title="Información del Taller">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoItem
                  icon={Building2}
                  label="Taller"
                  value={report.vendorName || "—"}
                />
                <InfoItem
                  icon={Phone}
                  label="Teléfono"
                  value={report.workshopPhone || "—"}
                />
                <InfoItem
                  icon={MapPin}
                  label="Dirección"
                  value={report.workshopAddress || "—"}
                  className="md:col-span-1"
                />
              </div>
            </Section>
          )}

          {/* Refacciones */}
          {parts.length > 0 && (
            <Section title="Refacciones Utilizadas">
              <PartsTable parts={parts} disabled />
            </Section>
          )}

          {/* Resumen de costos */}
          <Section title="Resumen de Costos">
            <ReportSummary
              laborCost={report.laborCost}
              partsCost={report.partsCost || report.cost}
            />
          </Section>

          {/* Observaciones */}
          {report.description && (
            <Section title="Observaciones">
              <div className="p-4 bg-(--muted)/30 rounded-xl">
                <p className="text-(--fg) whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            </Section>
          )}

          {/* Próximo servicio */}
          {(report.nextServiceDate || report.nextServiceOdometer) && (
            <Section title="Próximo Servicio">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-300">
                    Recordatorio
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {report.nextServiceDate && (
                    <div>
                      <span className="text-(--muted-fg)">Fecha: </span>
                      <span className="font-medium text-(--fg)">
                        {formatDate(report.nextServiceDate)}
                      </span>
                    </div>
                  )}
                  {report.nextServiceOdometer && (
                    <div>
                      <span className="text-(--muted-fg)">Kilometraje: </span>
                      <span className="font-medium text-(--fg)">
                        {report.nextServiceOdometer.toLocaleString()} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Archivos */}
          {files.length > 0 && (
            <Section title="Archivos Adjuntos">
              <ReportFilesSection
                files={files}
                getPreviewUrl={getServiceFilePreviewUrl}
                getDownloadUrl={getServiceFileDownloadUrl}
                disabled
              />
            </Section>
          )}

          {/* Footer con información de auditoría */}
          <div className="pt-6 mt-6 border-t border-(--border)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-(--muted-fg)">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Creado por:{" "}
                  <span className="text-(--fg) font-medium">
                    {createdBy?.firstName} {createdBy?.lastName}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Fecha: {formatDateTime(report.$createdAt)}</span>
              </div>
              {isFinalized && (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>
                      Finalizado por:{" "}
                      <span className="text-(--fg) font-medium">
                        {finalizedBy?.firstName} {finalizedBy?.lastName}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Fecha finalización: {formatDateTime(report.finalizedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Sección con título
 */
function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-(--fg) mb-4 pb-2 border-b border-(--border)">
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * Item de información
 */
function InfoItem({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="p-2 rounded-lg bg-(--muted)">
        <Icon className="h-4 w-4 text-(--muted-fg)" />
      </div>
      <div>
        <p className="text-xs text-(--muted-fg)">{label}</p>
        <p className="text-sm font-medium text-(--fg)">{value}</p>
      </div>
    </div>
  );
}
