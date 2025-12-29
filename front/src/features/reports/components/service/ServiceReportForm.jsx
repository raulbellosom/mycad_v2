import { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
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
import { ReportStatusBadge } from "../common/ReportStatusBadge";
import {
  SERVICE_TYPE,
  SERVICE_TYPE_OPTIONS,
  REPORT_STATUS,
} from "../../constants/report.constants";

// Validation schema
const serviceReportSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(120, "El título no puede exceder 120 caracteres"),
  vehicleId: z.string().min(1, "Debes seleccionar un vehículo"),
  serviceDate: z.string().min(1, "La fecha es requerida"),
  serviceType: z.string().optional(),
  odometer: z.coerce.number().min(0).optional().or(z.literal("")),
  vendorName: z.string().max(120).optional(),
  workshopAddress: z.string().max(200).optional(),
  workshopPhone: z.string().max(30).optional(),
  invoiceNumber: z.string().max(50).optional(),
  laborCost: z.coerce.number().min(0).optional().or(z.literal("")),
  description: z.string().max(1500).optional(),
  nextServiceDate: z.string().optional(),
  nextServiceOdometer: z.coerce.number().min(0).optional().or(z.literal("")),
});

/**
 * Formulario completo para crear/editar reportes de servicio
 * Diseño modular con secciones colapsables
 */
export function ServiceReportForm({
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
    service: true,
    workshop: false,
    parts: true,
    costs: true,
    notes: false,
    nextService: false,
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
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(serviceReportSchema),
    defaultValues: {
      title: initialData.title || "",
      vehicleId: initialData.vehicleId || "",
      serviceDate:
        initialData.serviceDate?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      serviceType: initialData.serviceType || SERVICE_TYPE.MAINTENANCE,
      odometer: initialData.odometer || "",
      vendorName: initialData.vendorName || "",
      workshopAddress: initialData.workshopAddress || "",
      workshopPhone: initialData.workshopPhone || "",
      invoiceNumber: initialData.invoiceNumber || "",
      laborCost: initialData.laborCost || "",
      description: initialData.description || "",
      nextServiceDate: initialData.nextServiceDate?.split("T")[0] || "",
      nextServiceOdometer: initialData.nextServiceOdometer || "",
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

  // Auto-fill vehicle info when selected
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

  const isFinalized = initialData.status === REPORT_STATUS.FINALIZED;
  const canEdit = !isFinalized;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Header con status */}
      {isEditing && (
        <div className="flex items-center justify-between mb-2">
          <ReportStatusBadge status={initialData.status} />
          {isFinalized && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Este reporte está finalizado y no puede ser editado</span>
            </div>
          )}
        </div>
      )}

      {/* Sección: Vehículo */}
      <FormSection
        title="Vehículo"
        icon={Wrench}
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

      {/* Sección: Datos del Servicio */}
      <FormSection
        title="Datos del Servicio"
        icon={Calendar}
        expanded={expandedSections.service}
        onToggle={() => toggleSection("service")}
        hasError={!!errors.title || !!errors.serviceDate}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Título del Servicio *"
            placeholder="Ej: Cambio de aceite y filtros"
            {...register("title")}
            error={errors.title?.message}
            disabled={!canEdit}
          />
          <Controller
            name="serviceType"
            control={control}
            render={({ field }) => (
              <Select
                label="Tipo de Servicio"
                options={SERVICE_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                disabled={!canEdit}
              />
            )}
          />
          <Input
            type="date"
            label="Fecha del Servicio *"
            {...register("serviceDate")}
            error={errors.serviceDate?.message}
            disabled={!canEdit}
          />
          <Input
            type="number"
            label="Kilometraje"
            placeholder="45000"
            {...register("odometer")}
            error={errors.odometer?.message}
            disabled={!canEdit}
          />
        </div>
      </FormSection>

      {/* Sección: Información del Taller */}
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
            placeholder="Ej: AutoService Pro"
            {...register("vendorName")}
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
          <Input
            label="No. de Factura"
            placeholder="Ej: FAC-2024-001"
            {...register("invoiceNumber")}
            disabled={!canEdit}
          />
        </div>
      </FormSection>

      {/* Sección: Refacciones */}
      <FormSection
        title="Refacciones / Partes"
        icon={Wrench}
        expanded={expandedSections.parts}
        onToggle={() => toggleSection("parts")}
      >
        <PartsTableLocal
          parts={parts}
          onChange={setParts}
          disabled={!canEdit}
          title="Refacciones Utilizadas"
        />
      </FormSection>

      {/* Sección: Resumen de Costos */}
      <FormSection
        title="Resumen de Costos"
        icon={DollarSign}
        expanded={expandedSections.costs}
        onToggle={() => toggleSection("costs")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
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
              <p className="text-sm text-(--muted-fg)">Costo de Refacciones</p>
              <p className="text-lg font-semibold text-(--fg)">
                $
                {partsCost.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-(--muted-fg)">
                (Calculado automáticamente)
              </p>
            </div>
          </div>
          <ReportSummary laborCost={laborCost} partsCost={partsCost} />
        </div>
      </FormSection>

      {/* Sección: Observaciones */}
      <FormSection
        title="Observaciones"
        icon={FileText}
        expanded={expandedSections.notes}
        onToggle={() => toggleSection("notes")}
        optional
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-(--fg)">
            Descripción / Notas
          </label>
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--fg) placeholder:text-(--muted-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            placeholder="Describe el trabajo realizado, observaciones, recomendaciones..."
            {...register("description")}
            disabled={!canEdit}
          />
        </div>
      </FormSection>

      {/* Sección: Próximo Servicio */}
      <FormSection
        title="Próximo Servicio"
        icon={Calendar}
        expanded={expandedSections.nextService}
        onToggle={() => toggleSection("nextService")}
        optional
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Fecha Sugerida"
            {...register("nextServiceDate")}
            disabled={!canEdit}
          />
          <Input
            type="number"
            label="Kilometraje Sugerido"
            placeholder="Ej: 50000"
            {...register("nextServiceOdometer")}
            disabled={!canEdit}
          />
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
            {isEditing ? "Guardar Cambios" : "Guardar Borrador"}
          </Button>
          <Button
            type="button"
            onClick={handleFinalizeClick}
            disabled={isLoading}
            className="order-1 sm:order-3"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Finalizar Reporte
          </Button>
        </div>
      )}
    </form>
  );
}

/**
 * Sección colapsable del formulario
 */
function FormSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children,
  optional = false,
  hasError = false,
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
            ${hasError ? "bg-red-100 dark:bg-red-900/20" : "bg-(--brand)/10"}
          `}
          >
            <Icon
              className={`h-5 w-5 ${
                hasError ? "text-red-600" : "text-(--brand)"
              }`}
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
