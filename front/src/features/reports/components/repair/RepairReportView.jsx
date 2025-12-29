import { motion } from "framer-motion";
import {
  Hammer,
  Calendar,
  Gauge,
  Building2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Clock,
  User,
  Edit2,
  FileDown,
  Undo2,
  AlertTriangle,
  Shield,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { Button } from "../../../../shared/ui/Button";
import { formatServerDate } from "../../../../shared/utils/dateUtils";
import { VehicleInfoCard } from "../common/VehicleInfoCard";
import { PartsTable } from "../common/PartsTable";
import { ReportFilesSection } from "../common/ReportFilesSection";
import { ReportSummary } from "../common/ReportSummary";
import {
  RepairStatusBadge,
  RepairPriorityBadge,
  DamageTypeBadge,
  ReportFinalizedIndicator,
} from "../common/ReportStatusBadge";
import {
  REPORT_STATUS,
  REPAIR_STATUS,
  DAMAGE_TYPE_LABELS,
} from "../../constants/report.constants";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Vista de solo lectura de un reporte de reparación
 * Muestra toda la información del reporte en formato de documento
 */
export function RepairReportView({
  report,
  vehicle,
  parts = [],
  files = [],
  onEdit,
  onReopen,
  onDownloadPdf,
  canEdit = false,
  canReopen = false,
  isLoading = false,
}) {
  const isFinalized =
    report?.status === REPAIR_STATUS.DONE || report?.finalizedAt;
  const laborCost = parseFloat(report?.laborCost) || 0;
  const partsCost = parseFloat(report?.partsCost) || 0;
  const finalCost = parseFloat(report?.finalCost) || 0;

  const formatDate = (dateStr) => {
    return formatServerDate(dateStr, { format: "medium", fallback: "-" });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  if (!report) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-(--muted-fg) mb-4" />
        <p className="text-(--muted-fg)">No se encontró el reporte</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className="space-y-6"
    >
      {/* Header con acciones */}
      <motion.div variants={fadeIn}>
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <RepairStatusBadge status={report.status} size="lg" />
                {report.priority && (
                  <RepairPriorityBadge priority={report.priority} size="lg" />
                )}
                {report.damageType && (
                  <DamageTypeBadge type={report.damageType} />
                )}
              </div>
              <h1 className="text-2xl font-bold text-(--fg) mt-3">
                {report.title}
              </h1>
              <p className="text-(--muted-fg) mt-1">
                Reporte de Reparación • {formatDate(report.reportDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canEdit && !isFinalized && (
                <Button variant="outline" onClick={onEdit} disabled={isLoading}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              {canReopen && isFinalized && (
                <Button
                  variant="outline"
                  onClick={onReopen}
                  disabled={isLoading}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Reabrir
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={onDownloadPdf}
                disabled={isLoading}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>

          {/* Indicador de finalizado */}
          {isFinalized && (
            <ReportFinalizedIndicator
              finalizedAt={report.finalizedAt}
              finalizedBy={report.finalizedByProfile?.name}
            />
          )}
        </Card>
      </motion.div>

      {/* Información del vehículo */}
      <motion.div variants={fadeIn}>
        <VehicleInfoCard vehicle={vehicle} />
      </motion.div>

      {/* Detalles de la reparación */}
      <motion.div variants={fadeIn}>
        <Card>
          <Card.Header>
            <Card.Title icon={AlertTriangle}>
              Detalles de la Reparación
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem
                icon={Calendar}
                label="Fecha del Reporte"
                value={formatDate(report.reportDate)}
              />
              <InfoItem
                icon={Gauge}
                label="Kilometraje"
                value={
                  report.odometer
                    ? `${report.odometer.toLocaleString()} km`
                    : "-"
                }
              />
              <InfoItem
                icon={AlertTriangle}
                label="Tipo de Daño"
                value={
                  DAMAGE_TYPE_LABELS[report.damageType] ||
                  report.damageType ||
                  "-"
                }
              />
              <InfoItem
                icon={Calendar}
                label="Fecha Inicio"
                value={formatDate(report.startDate)}
              />
              <InfoItem
                icon={Calendar}
                label="Fecha Finalización"
                value={formatDate(report.completionDate)}
              />
              {report.startDate && report.completionDate && (
                <InfoItem
                  icon={Clock}
                  label="Duración"
                  value={calculateDuration(
                    report.startDate,
                    report.completionDate
                  )}
                />
              )}
            </div>
          </Card.Content>
        </Card>
      </motion.div>

      {/* Información del Taller */}
      {(report.workshopName ||
        report.workshopAddress ||
        report.workshopPhone) && (
        <motion.div variants={fadeIn}>
          <Card>
            <Card.Header>
              <Card.Title icon={Building2}>Información del Taller</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {report.workshopName && (
                  <InfoItem
                    icon={Building2}
                    label="Nombre"
                    value={report.workshopName}
                  />
                )}
                {report.workshopPhone && (
                  <InfoItem
                    icon={Phone}
                    label="Teléfono"
                    value={report.workshopPhone}
                  />
                )}
                {report.workshopAddress && (
                  <InfoItem
                    icon={MapPin}
                    label="Dirección"
                    value={report.workshopAddress}
                    span={2}
                  />
                )}
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      )}

      {/* Grid de dos columnas para costos y partes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Partes Reemplazadas */}
        <motion.div variants={fadeIn} className="min-w-0">
          <Card className="h-full">
            <Card.Header>
              <Card.Title icon={Wrench}>
                Partes Reparadas / Reemplazadas
              </Card.Title>
            </Card.Header>
            <Card.Content>
              {parts.length > 0 ? (
                <PartsTable parts={parts} readonly />
              ) : (
                <EmptySection message="No se registraron partes" />
              )}
            </Card.Content>
          </Card>
        </motion.div>

        {/* Resumen de Costos */}
        <motion.div variants={fadeIn}>
          <Card className="h-full">
            <Card.Header>
              <Card.Title icon={DollarSign}>Resumen de Costos</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {report.costEstimate > 0 && (
                  <CostItem
                    label="Costo Estimado Inicial"
                    value={formatCurrency(report.costEstimate)}
                    muted
                  />
                )}
                <CostItem
                  label="Mano de Obra"
                  value={formatCurrency(laborCost)}
                />
                <CostItem
                  label="Partes y Refacciones"
                  value={formatCurrency(partsCost)}
                />
                <div className="border-t border-(--border) pt-4">
                  <CostItem
                    label="Costo Total"
                    value={formatCurrency(finalCost || laborCost + partsCost)}
                    highlight
                  />
                </div>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      </div>

      {/* Descripción */}
      {report.description && (
        <motion.div variants={fadeIn}>
          <Card>
            <Card.Header>
              <Card.Title icon={FileText}>
                Descripción del Problema y Solución
              </Card.Title>
            </Card.Header>
            <Card.Content>
              <p className="text-(--fg) whitespace-pre-wrap">
                {report.description}
              </p>
            </Card.Content>
          </Card>
        </motion.div>
      )}

      {/* Garantía */}
      {(report.warrantyDays > 0 || report.warrantyNotes) && (
        <motion.div variants={fadeIn}>
          <Card className="border-l-4 border-l-emerald-500">
            <Card.Header>
              <Card.Title icon={Shield}>Información de Garantía</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col sm:flex-row gap-4">
                {report.warrantyDays > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <Shield className="h-8 w-8 text-emerald-600" />
                    <div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Período de Garantía
                      </p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        {report.warrantyDays} días
                      </p>
                    </div>
                  </div>
                )}
                {report.warrantyNotes && (
                  <div className="flex-1">
                    <p className="text-sm text-(--muted-fg) mb-1">
                      Condiciones
                    </p>
                    <p className="text-(--fg) whitespace-pre-wrap">
                      {report.warrantyNotes}
                    </p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      )}

      {/* Archivos adjuntos */}
      <motion.div variants={fadeIn}>
        <Card>
          <Card.Header>
            <Card.Title icon={FileText}>Archivos Adjuntos</Card.Title>
          </Card.Header>
          <Card.Content>
            {files.length > 0 ? (
              <ReportFilesSection files={files} readonly />
            ) : (
              <EmptySection message="No hay archivos adjuntos" />
            )}
          </Card.Content>
        </Card>
      </motion.div>

      {/* Información de auditoría */}
      <motion.div variants={fadeIn}>
        <Card className="bg-(--muted)/30">
          <Card.Content className="py-4">
            <div className="flex flex-wrap gap-6 text-sm text-(--muted-fg)">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Creado por:{" "}
                  {report.createdByProfile?.name || "Usuario desconocido"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Creado: {new Date(report.$createdAt).toLocaleString("es-MX")}
                </span>
              </div>
              {report.$updatedAt !== report.$createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Actualizado:{" "}
                    {new Date(report.$updatedAt).toLocaleString("es-MX")}
                  </span>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/**
 * Item de información
 */
function InfoItem({ icon: Icon, label, value, span }) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-(--muted)/50">
          <Icon className="h-4 w-4 text-(--muted-fg)" />
        </div>
        <div>
          <p className="text-sm text-(--muted-fg)">{label}</p>
          <p className="font-medium text-(--fg)">{value}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Item de costo
 */
function CostItem({ label, value, highlight = false, muted = false }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${
          highlight
            ? "font-semibold text-(--fg)"
            : muted
            ? "text-(--muted-fg)"
            : "text-(--fg)"
        }`}
      >
        {label}
      </span>
      <span
        className={`
        font-mono
        ${highlight ? "text-lg font-bold text-(--brand)" : ""}
        ${muted ? "text-(--muted-fg)" : "text-(--fg)"}
      `}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Sección vacía
 */
function EmptySection({ message }) {
  return (
    <div className="py-8 text-center">
      <p className="text-(--muted-fg)">{message}</p>
    </div>
  );
}

/**
 * Calcula la duración entre dos fechas
 */
function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Mismo día";
  if (diffDays === 1) return "1 día";
  return `${diffDays} días`;
}
