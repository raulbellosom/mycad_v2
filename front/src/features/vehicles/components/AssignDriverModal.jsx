import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format, parse } from "date-fns";
import {
  User,
  Calendar,
  Gauge,
  Fuel,
  FileText,
  Car,
  AlertCircle,
  Clock,
} from "lucide-react";

import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { DatePicker } from "../../../shared/ui/DatePicker";
import { cn } from "../../../shared/utils/cn";

import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import { useAssignmentMutations } from "../hooks/useAssignments";
import {
  ASSIGNMENT_ROLES,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_ROLE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  driverHasActivePrimaryAssignment,
} from "../services/assignments.service";

// ─────────────────────────────────────────────────────
// Form Field Components
// ─────────────────────────────────────────────────────
function FormField({ label, error, required, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-(--fg)">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {error.message}
        </p>
      )}
    </div>
  );
}

function SelectField({ register, name, options, placeholder, disabled }) {
  return (
    <select
      {...register(name)}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-(--border) bg-(--card) px-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all disabled:opacity-50"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function InputField({
  register,
  name,
  type = "text",
  placeholder,
  disabled,
  ...props
}) {
  return (
    <input
      type={type}
      {...register(name)}
      placeholder={placeholder}
      disabled={disabled}
      className="h-10 w-full rounded-lg border border-(--border) bg-(--card) px-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all disabled:opacity-50"
      {...props}
    />
  );
}

function TextareaField({ register, name, placeholder, rows = 3, disabled }) {
  return (
    <textarea
      {...register(name)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className="w-full rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all resize-none disabled:opacity-50"
    />
  );
}

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
export function AssignDriverModal({
  isOpen,
  onClose,
  vehicleId,
  vehicle,
  drivers = [],
  editingAssignment = null,
}) {
  const { activeGroupId } = useActiveGroup();
  const { profile } = useAuth();
  const { createAssignment, updateAssignment, isLoading } =
    useAssignmentMutations();

  const [driverWarning, setDriverWarning] = useState(null);

  const isEditing = !!editingAssignment;

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      driverId: "",
      role: ASSIGNMENT_ROLES.PRIMARY,
      assignmentType: ASSIGNMENT_TYPES.OPERATION,
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      endDate: "",
      endTime: "",
      startMileage: "",
      startFuelLevel: "",
      notes: "",
    },
  });

  const selectedDriverId = watch("driverId");
  const selectedRole = watch("role");

  // Reset form when modal opens/closes or when editing assignment changes
  useEffect(() => {
    if (isOpen) {
      if (editingAssignment) {
        const startDateTime = editingAssignment.startDate
          ? new Date(editingAssignment.startDate)
          : new Date();
        const endDateTime = editingAssignment.endDate
          ? new Date(editingAssignment.endDate)
          : null;

        reset({
          driverId: editingAssignment.driverId,
          role: editingAssignment.role,
          assignmentType: editingAssignment.assignmentType,
          startDate: format(startDateTime, "yyyy-MM-dd"),
          startTime: format(startDateTime, "HH:mm"),
          endDate: endDateTime ? format(endDateTime, "yyyy-MM-dd") : "",
          endTime: endDateTime ? format(endDateTime, "HH:mm") : "",
          startMileage: editingAssignment.startMileage ?? "",
          startFuelLevel: editingAssignment.startFuelLevel ?? "",
          notes: editingAssignment.notes ?? "",
        });
      } else {
        reset({
          driverId: "",
          role: ASSIGNMENT_ROLES.PRIMARY,
          assignmentType: ASSIGNMENT_TYPES.OPERATION,
          startDate: format(new Date(), "yyyy-MM-dd"),
          startTime: format(new Date(), "HH:mm"),
          endDate: "",
          endTime: "",
          startMileage: vehicle?.mileage ?? "",
          startFuelLevel: "",
          notes: "",
        });
      }
      setDriverWarning(null);
    }
  }, [isOpen, editingAssignment, reset, vehicle]);

  // Check if selected driver already has a PRIMARY assignment
  useEffect(() => {
    async function checkDriver() {
      if (
        selectedDriverId &&
        selectedRole === ASSIGNMENT_ROLES.PRIMARY &&
        !isEditing
      ) {
        const hasActive = await driverHasActivePrimaryAssignment(
          selectedDriverId
        );
        if (hasActive) {
          setDriverWarning(
            "Este conductor ya tiene una asignación principal activa en otro vehículo."
          );
        } else {
          setDriverWarning(null);
        }
      } else {
        setDriverWarning(null);
      }
    }
    checkDriver();
  }, [selectedDriverId, selectedRole, isEditing]);

  // Filter only active drivers
  const activeDrivers = drivers.filter(
    (d) => d.status === "ACTIVE" && d.enabled !== false
  );

  // Role options
  const roleOptions = Object.entries(ASSIGNMENT_ROLE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Assignment type options
  const typeOptions = Object.entries(ASSIGNMENT_TYPE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Combinar fecha y hora para crear ISO string
      const startDateTime = data.startTime
        ? `${data.startDate}T${data.startTime}:00`
        : `${data.startDate}T00:00:00`;

      const endDateTime =
        data.endDate && data.endTime
          ? `${data.endDate}T${data.endTime}:00`
          : data.endDate
          ? `${data.endDate}T23:59:59`
          : null;

      const payload = {
        groupId: activeGroupId,
        vehicleId,
        driverId: data.driverId,
        startDate: new Date(startDateTime).toISOString(),
        endDate: endDateTime ? new Date(endDateTime).toISOString() : null,
        role: data.role,
        assignmentType: data.assignmentType,
        startMileage: data.startMileage
          ? parseInt(data.startMileage, 10)
          : null,
        startFuelLevel: data.startFuelLevel
          ? parseInt(data.startFuelLevel, 10)
          : null,
        notes: data.notes || null,
        createdByProfileId: profile.$id,
      };

      // Obtener nombres descriptivos para auditoría
      const selectedDriver = activeDrivers.find((d) => d.$id === data.driverId);
      const driverName = selectedDriver
        ? `${selectedDriver.firstName || ""} ${
            selectedDriver.lastName || ""
          }`.trim() || "Conductor"
        : "Conductor";

      const vehicleName = vehicle
        ? `${vehicle.brand?.name || ""} ${vehicle.model?.name || ""} ${
            vehicle.plateNumber || vehicle.economicNumber || ""
          }`.trim()
        : "Vehículo";

      if (isEditing) {
        await updateAssignment.mutateAsync({
          id: editingAssignment.$id,
          data: {
            role: data.role,
            assignmentType: data.assignmentType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            startMileage: payload.startMileage,
            startFuelLevel: payload.startFuelLevel,
            notes: payload.notes,
          },
          auditInfo: {
            profileId: profile.$id,
            groupId: activeGroupId,
          },
        });
      } else {
        await createAssignment.mutateAsync({
          data: payload,
          auditInfo: {
            profileId: profile.$id,
            groupId: activeGroupId,
            vehicleName,
            driverName,
          },
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={
        <ModalHeader
          icon={isEditing ? User : Car}
          title={isEditing ? "Editar Asignación" : "Asignar Conductor"}
          subtitle={
            vehicle
              ? `${vehicle.brand?.name || ""} ${vehicle.model?.name || ""} - ${
                  vehicle.economicNumber || ""
                }`
              : ""
          }
        />
      }
      footer={
        <ModalFooter align="end">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
          >
            {isEditing ? "Guardar Cambios" : "Asignar Conductor"}
          </Button>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Driver Selection */}
        <FormField label="Conductor" required error={errors.driverId}>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            />
            <select
              {...register("driverId", {
                required: "Selecciona un conductor",
              })}
              disabled={isEditing}
              className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all disabled:opacity-50"
            >
              <option value="">Seleccionar conductor...</option>
              {activeDrivers.map((driver) => (
                <option key={driver.$id} value={driver.$id}>
                  {driver.firstName} {driver.lastName}
                  {driver.email ? ` (${driver.email})` : ""}
                </option>
              ))}
            </select>
          </div>
          {driverWarning && (
            <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {driverWarning}
            </p>
          )}
        </FormField>

        {/* Role and Type */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Rol" required>
            <SelectField
              register={register}
              name="role"
              options={roleOptions}
            />
          </FormField>

          <FormField label="Tipo de asignación" required>
            <SelectField
              register={register}
              name="assignmentType"
              options={typeOptions}
            />
          </FormField>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          {/* Start Date and Time */}
          <div>
            <p className="text-sm font-medium text-(--fg) mb-2">
              Fecha y hora de inicio <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                value={watch("startDate")}
                onChange={(value) => setValue("startDate", value)}
                placeholder="Seleccionar fecha"
                error={errors.startDate?.message}
              />
              <div className="relative">
                <Clock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg) z-10"
                />
                <input
                  type="time"
                  {...register("startTime")}
                  className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* End Date and Time */}
          <div>
            <p className="text-sm font-medium text-(--fg) mb-2">
              Fecha y hora de fin (opcional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                value={watch("endDate")}
                onChange={(value) => setValue("endDate", value)}
                placeholder="Seleccionar fecha"
              />
              <div className="relative">
                <Clock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg) z-10"
                />
                <input
                  type="time"
                  {...register("endTime")}
                  className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mileage and Fuel */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kilometraje inicial">
            <div className="relative">
              <Gauge
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <input
                type="number"
                {...register("startMileage", {
                  min: { value: 0, message: "Debe ser positivo" },
                })}
                placeholder="ej: 50000"
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              />
            </div>
          </FormField>

          <FormField label="Nivel de combustible (%)">
            <div className="relative">
              <Fuel
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <input
                type="number"
                {...register("startFuelLevel", {
                  min: { value: 0, message: "Mínimo 0%" },
                  max: { value: 100, message: "Máximo 100%" },
                })}
                placeholder="0-100"
                min="0"
                max="100"
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              />
            </div>
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notas / Observaciones">
          <div className="relative">
            <FileText
              size={16}
              className="absolute left-3 top-3 text-(--muted-fg)"
            />
            <textarea
              {...register("notes")}
              placeholder="Agregar notas sobre esta asignación..."
              rows={3}
              className="w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 py-2 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all resize-none"
            />
          </div>
        </FormField>
      </form>
    </Modal>
  );
}
