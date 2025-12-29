import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer,
  Calendar,
  Gauge,
  Building2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Save,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { Select } from "../../../../shared/ui/Select";
import { VehicleCombobox } from "../../../../shared/ui/VehicleCombobox";
import { VehicleInfoCard } from "../common/VehicleInfoCard";
import { PartsTableLocal } from "../common/PartsTable";
import { ReportSummary } from "../common/ReportSummary";
import { ReportFilesStagingSection } from "../common/ReportFilesSection";
import {
  RepairStatusBadge,
  RepairPriorityBadge,
} from "../common/ReportStatusBadge";
import {
  REPAIR_STATUS,
  REPAIR_STATUS_OPTIONS,
  REPAIR_PRIORITY,
  REPAIR_PRIORITY_OPTIONS,
  DAMAGE_TYPE,
  DAMAGE_TYPE_OPTIONS,
} from "../../constants/report.constants";

// Validation schema
const repairReportSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(120, "El título no puede exceder 120 caracteres"),
  vehicleId: z.string().min(1, "Debes seleccionar un vehículo"),
  reportDate: z.string().min(1, "La fecha es requerida"),
  status: z.string().optional(),
  priority: z.string().optional(),
  damageType: z.string().optional(),
  odometer: z.coerce.number().min(0).optional().or(z.literal("")),
  workshopName: z.string().max(120).optional(),
  workshopAddress: z.string().max(200).optional(),
  workshopPhone: z.string().max(30).optional(),
  costEstimate: z.coerce.number().min(0).optional().or(z.literal("")),
  laborCost: z.coerce.number().min(0).optional().or(z.literal("")),
  finalCost: z.coerce.number().min(0).optional().or(z.literal("")),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  warrantyDays: z.coerce.number().min(0).optional().or(z.literal("")),
  warrantyNotes: z.string().max(500).optional(),
});

/**
 * Formulario completo para crear/editar reportes de reparación
 */
export function RepairReportForm({
  initialData = {},
  vehicles = [],
  // Catalog data for VehicleCombobox
  types = [],
  brands = [],
  models = [],
  onSubmit,
  onCancel,
  onFinalize,
  isLoading = false,
  isEditing = false,
}) {
  const [expandedSections, setExpandedSections] = useState({
    vehicle: true,
    repair: true,
    workshop: false,
    parts: true,
    costs: true,
    notes: false,
    warranty: false,
    files: false,
  });
  const [parts, setParts] = useState(initialData.parts || []);
  const [stagedFiles, setStagedFiles] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(repairReportSchema),
    defaultValues: {
      title: initialData.title || "",
      vehicleId: initialData.vehicleId || "",
      reportDate:
        initialData.reportDate?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      status: initialData.status || REPAIR_STATUS.OPEN,
      priority: initialData.priority || REPAIR_PRIORITY.NORMAL,
      damageType: initialData.damageType || DAMAGE_TYPE.MECHANICAL,
      odometer: initialData.odometer || "",
      workshopName: initialData.workshopName || "",
      workshopAddress: initialData.workshopAddress || "",
      workshopPhone: initialData.workshopPhone || "",
      costEstimate: initialData.costEstimate || "",
      laborCost: initialData.laborCost || "",
      finalCost: initialData.finalCost || "",
      description: initialData.description || "",
      startDate: initialData.startDate?.split("T")[0] || "",
      completionDate: initialData.completionDate?.split("T")[0] || "",
      warrantyDays: initialData.warrantyDays || "",
      warrantyNotes: initialData.warrantyNotes || "",
    },
  });

  const watchedValues = watch();
  const selectedVehicleId = watchedValues.vehicleId;
  const laborCost = parseFloat(watchedValues.laborCost) || 0;

  // Calculate parts cost
  const partsCost = useMemo(() => {
    return parts.reduce((acc, part) => {
      return acc + (part.quantity || 0) * (part.unitCost || 0);
    }, 0);
  }, [parts]);

  // Auto-fill vehicle info
  useEffect(() => {
    if (selectedVehicleId && !isEditing) {
      const vehicle = vehicles.find((v) => v.$id === selectedVehicleId);
      if (vehicle && vehicle.mileage && !watchedValues.odometer) {
        setValue("odometer", vehicle.mileage);
      }
    }
  }, [
    selectedVehicleId,
    vehicles,
    setValue,
    isEditing,
    watchedValues.odometer,
  ]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFormSubmit = (data) => {
    onSubmit?.({
      ...data,
      parts,
      partsCost,
      stagedFiles,
    });
  };

  const handleFinalizeClick = () => {
    handleSubmit((data) => {
      onFinalize?.({
        ...data,
        parts,
        partsCost,
        stagedFiles,
      });
    })();
  };

  const isFinalized =
    initialData.status === REPAIR_STATUS.DONE || initialData.finalizedAt;
  const canEdit = !isFinalized;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Header con status */}
      {isEditing && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <RepairStatusBadge status={initialData.status} />
            {initialData.priority && (
              <RepairPriorityBadge priority={initialData.priority} />
            )}
          </div>
          {isFinalized && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Este reporte está finalizado</span>
            </div>
          )}
        </div>
      )}

      {/* Sección: Vehículo */}
      <FormSection
        title="Vehículo"
        icon={Hammer}
        expanded={expandedSections.vehicle}
        onToggle={() => toggleSection("vehicle")}
        hasError={!!errors.vehicleId}
      >
        <div className="space-y-3">
          <label className="text-sm font-medium text-(--fg)">
            Seleccionar vehículo *
          </label>
          <Controller
            name="vehicleId"
            control={control}
            render={({ field }) => (
              <VehicleCombobox
                value={field.value}
                onChange={field.onChange}
                vehicles={vehicles}
                types={types}
                brands={brands}
                models={models}
                placeholder="Buscar por placa, N° económico, marca, modelo..."
                emptyText="No se encontraron vehículos"
                disabled={!canEdit}
              />
            )}
          />
          {/* Show selected vehicle preview */}
          {watchedValues.vehicleId && (
            <VehicleInfoCard
              vehicle={vehicles.find((v) => v.$id === watchedValues.vehicleId)}
              compact
            />
          )}
        </div>
        {errors.vehicleId && (
          <p className="text-sm text-red-500 mt-1">
            {errors.vehicleId.message}
          </p>
        )}
      </FormSection>

      {/* Sección: Datos de la Reparación */}
      <FormSection
        title="Datos de la Reparación"
        icon={AlertTriangle}
        expanded={expandedSections.repair}
        onToggle={() => toggleSection("repair")}
        hasError={!!errors.title || !!errors.reportDate}
        iconColor="text-orange-500"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Título / Descripción del Problema *"
              placeholder="Ej: Falla en sistema de frenos"
              {...register("title")}
              error={errors.title?.message}
              disabled={!canEdit}
            />
          </div>
          <Input
            type="date"
            label="Fecha del Reporte *"
            {...register("reportDate")}
            error={errors.reportDate?.message}
            disabled={!canEdit}
          />
          <Input
            type="number"
            label="Kilometraje"
            placeholder="45000"
            {...register("odometer")}
            disabled={!canEdit}
          />
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                label="Prioridad"
                options={REPAIR_PRIORITY_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
          <Controller
            name="damageType"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Daño"
                options={DAMAGE_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Estado"
                options={REPAIR_STATUS_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
        </div>

        {/* Fechas de reparación */}
        <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-(--border)">
          <Input
            type="date"
            label="Fecha Inicio Reparación"
            {...register("startDate")}
            disabled={!canEdit}
          />
          <Input
            type="date"
            label="Fecha Finalización"
            {...register("completionDate")}
            disabled={!canEdit}
          />
        </div>
      </FormSection>

      {/* Sección: Taller */}
      <FormSection
        title="Información del Taller"
        icon={Building2}
        expanded={expandedSections.workshop}
        onToggle={() => toggleSection("workshop")}
        optional
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre del Taller"
            placeholder="Ej: Taller Mecánico Express"
            {...register("workshopName")}
            disabled={!canEdit}
          />
          <Input
            label="Teléfono"
            placeholder="Ej: 555-123-4567"
            {...register("workshopPhone")}
            disabled={!canEdit}
          />
          <div className="sm:col-span-2">
            <Input
              label="Dirección"
              placeholder="Ej: Av. Principal #123"
              {...register("workshopAddress")}
              disabled={!canEdit}
            />
          </div>
        </div>
      </FormSection>

      {/* Sección: Partes Reparadas */}
      <FormSection
        title="Partes Reparadas / Reemplazadas"
        icon={Hammer}
        expanded={expandedSections.parts}
        onToggle={() => toggleSection("parts")}
      >
        <PartsTableLocal
          parts={parts}
          onChange={setParts}
          disabled={!canEdit}
          title="Partes"
        />
      </FormSection>

      {/* Sección: Costos */}
      <FormSection
        title="Costos"
        icon={DollarSign}
        expanded={expandedSections.costs}
        onToggle={() => toggleSection("costs")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Input
              type="number"
              label="Costo Estimado"
              placeholder="0.00"
              step="0.01"
              min="0"
              {...register("costEstimate")}
              disabled={!canEdit}
            />
            <Input
              type="number"
              label="Mano de Obra"
              placeholder="0.00"
              step="0.01"
              min="0"
              {...register("laborCost")}
              disabled={!canEdit}
            />
            <div className="p-3 rounded-lg bg-(--muted)/50">
              <p className="text-sm text-(--muted-fg)">Costo de Partes</p>
              <p className="text-lg font-semibold text-(--fg)">
                $
                {partsCost.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <Input
              type="number"
              label="Costo Final Total"
              placeholder="0.00"
              step="0.01"
              min="0"
              {...register("finalCost")}
              disabled={!canEdit}
            />
          </div>
          <ReportSummary laborCost={laborCost} partsCost={partsCost} />
        </div>
      </FormSection>

      {/* Sección: Observaciones */}
      <FormSection
        title="Descripción Detallada"
        icon={FileText}
        expanded={expandedSections.notes}
        onToggle={() => toggleSection("notes")}
        optional
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-(--fg)">
            Descripción del problema y solución
          </label>
          <textarea
            className="w-full min-h-[150px] rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--fg) placeholder:text-(--muted-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            placeholder="Describe el problema encontrado, diagnóstico realizado, trabajo ejecutado y cualquier observación relevante..."
            {...register("description")}
            disabled={!canEdit}
          />
        </div>
      </FormSection>

      {/* Sección: Garantía */}
      <FormSection
        title="Garantía"
        icon={Shield}
        expanded={expandedSections.warranty}
        onToggle={() => toggleSection("warranty")}
        optional
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Días de Garantía"
            placeholder="Ej: 30"
            min="0"
            {...register("warrantyDays")}
            disabled={!canEdit}
          />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-(--fg)">
              Condiciones de Garantía
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--fg) placeholder:text-(--muted-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              placeholder="Términos y condiciones de la garantía..."
              {...register("warrantyNotes")}
              disabled={!canEdit}
            />
          </div>
        </div>
      </FormSection>

      {/* Sección: Archivos */}
      <FormSection
        title="Archivos Adjuntos"
        icon={FileText}
        expanded={expandedSections.files}
        onToggle={() => toggleSection("files")}
        optional
      >
        <ReportFilesStagingSection
          stagedFiles={stagedFiles}
          onAdd={(file) => setStagedFiles([...stagedFiles, file])}
          onRemove={(index) =>
            setStagedFiles(stagedFiles.filter((_, i) => i !== index))
          }
          disabled={!canEdit}
        />
      </FormSection>

      {/* Actions */}
      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-(--border)">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="order-3 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading}
            className="order-2"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Guardar Cambios" : "Guardar"}
          </Button>
          <Button
            type="button"
            onClick={handleFinalizeClick}
            disabled={isLoading}
            className="order-1 sm:order-3"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Finalizar Reparación
          </Button>
        </div>
      )}
    </form>
  );
}

/**
 * Sección colapsable
 */
function FormSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
  optional = false,
  hasError = false,
  iconColor = "text-(--brand)",
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between p-4 
          hover:bg-(--muted)/30 transition-colors text-left
          ${hasError ? "bg-red-50 dark:bg-red-900/10" : ""}
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
            p-2 rounded-lg 
            ${hasError ? "bg-red-100 dark:bg-red-900/20" : "bg-(--muted)"}
          `}
          >
            <Icon
              className={`h-5 w-5 ${hasError ? "text-red-600" : iconColor}`}
            />
          </div>
          <div>
            <h3 className="font-semibold text-(--fg)">{title}</h3>
            {optional && (
              <span className="text-xs text-(--muted-fg)">Opcional</span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-(--muted-fg)" />
        ) : (
          <ChevronDown className="h-5 w-5 text-(--muted-fg)" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-(--border)">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
