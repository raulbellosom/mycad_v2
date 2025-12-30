import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Car, Gauge, Fuel, Clock, AlertCircle, User } from "lucide-react";

import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { Combobox } from "../../../shared/ui/Combobox";
import { DatePicker } from "../../../shared/ui/DatePicker";
import { cn } from "../../../shared/utils/cn";
import { useAssignmentMutations } from "../../vehicles/hooks/useAssignments";
import { useAuth } from "../../auth/hooks/useAuth";
import { listVehicles } from "../../vehicles/services/vehicles.service";
import {
  ASSIGNMENT_ROLES,
  ASSIGNMENT_TYPES,
  ASSIGNMENT_ROLE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  driverHasActiveAssignmentWithRole,
} from "../../vehicles/services/assignments.service";

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
export function AssignVehicleModal({
  isOpen,
  onClose,
  driverId,
  driverName,
  assignment = null,
  groupId,
}) {
  const isEdit = Boolean(assignment);
  const { profile } = useAuth();
  const { createAssignment, updateAssignment, isLoading } =
    useAssignmentMutations();

  const [roleWarning, setRoleWarning] = useState(null);

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", groupId],
    queryFn: () => listVehicles(groupId),
    enabled: !!groupId && isOpen,
  });

  // Filter active vehicles
  const activeVehicles = vehicles.filter(
    (v) => v.status === "ACTIVE" && v.enabled !== false
  );

  // Role options
  const roleOptions = Object.entries(ASSIGNMENT_ROLE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Assignment type options
  const typeOptions = Object.entries(ASSIGNMENT_TYPE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      vehicleId: "",
      role: ASSIGNMENT_ROLES.PRIMARY,
      assignmentType: ASSIGNMENT_TYPES.OPERATION,
      startDate: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endDate: "",
      endTime: "18:00",
      startMileage: "",
      startFuelLevel: "",
      notes: "",
    },
  });

  const selectedRole = watch("role");
  const selectedVehicleId = watch("vehicleId");

  // Reset form when modal opens/closes or when editing assignment changes
  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        const startDateTime = assignment.startDate
          ? new Date(assignment.startDate)
          : null;
        const endDateTime = assignment.endDate
          ? new Date(assignment.endDate)
          : null;

        reset({
          vehicleId: assignment.vehicleId || "",
          role: assignment.role || ASSIGNMENT_ROLES.PRIMARY,
          assignmentType:
            assignment.assignmentType || ASSIGNMENT_TYPES.OPERATION,
          startDate: startDateTime
            ? startDateTime.toISOString().split("T")[0]
            : "",
          startTime: startDateTime
            ? startDateTime.toTimeString().slice(0, 5)
            : "08:00",
          endDate: endDateTime ? endDateTime.toISOString().split("T")[0] : "",
          endTime: endDateTime
            ? endDateTime.toTimeString().slice(0, 5)
            : "18:00",
          startMileage: assignment.startMileage?.toString() || "",
          startFuelLevel: assignment.startFuelLevel?.toString() || "",
          notes: assignment.notes || "",
        });
      } else {
        reset({
          vehicleId: "",
          role: ASSIGNMENT_ROLES.PRIMARY,
          assignmentType: ASSIGNMENT_TYPES.OPERATION,
          startDate: new Date().toISOString().split("T")[0],
          startTime: "08:00",
          endDate: "",
          endTime: "18:00",
          startMileage: "",
          startFuelLevel: "",
          notes: "",
        });
      }
    }
  }, [isOpen, assignment, reset]);

  // Check if driver already has active assignment with selected role
  useEffect(() => {
    if (!isEdit && selectedRole && driverId) {
      async function checkRole() {
        const existingAssignment = await driverHasActiveAssignmentWithRole(
          driverId,
          selectedRole
        );
        if (existingAssignment) {
          setRoleWarning(
            `Este conductor ya tiene un vehículo asignado como ${ASSIGNMENT_ROLE_LABELS[selectedRole]}. La asignación anterior se finalizará automáticamente.`
          );
        } else {
          setRoleWarning(null);
        }
      }
      checkRole();
    } else {
      setRoleWarning(null);
    }
  }, [selectedRole, driverId, isEdit]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      // Combine date + time into ISO string
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
        groupId,
        vehicleId: data.vehicleId,
        driverId,
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
      const selectedVehicle = activeVehicles.find(
        (v) => v.$id === data.vehicleId
      );
      const vehicleName = selectedVehicle
        ? `${selectedVehicle.brand?.name || ""} ${
            selectedVehicle.model?.name || ""
          } ${
            selectedVehicle.plateNumber || selectedVehicle.economicNumber || ""
          }`.trim()
        : "Vehículo";

      if (isEdit) {
        await updateAssignment.mutateAsync({
          id: assignment.$id,
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
            groupId,
          },
        });
      } else {
        await createAssignment.mutateAsync({
          data: payload,
          auditInfo: {
            profileId: profile.$id,
            groupId,
            vehicleName,
            driverName: driverName || "Conductor",
          },
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  // Get selected vehicle for subtitle
  const selectedVehicle = activeVehicles.find(
    (v) => v.$id === selectedVehicleId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={
        <ModalHeader
          icon={isEdit ? Car : User}
          title={isEdit ? "Editar Asignación" : "Asignar Vehículo"}
          subtitle={driverName || ""}
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
            {isEdit ? "Guardar Cambios" : "Asignar Vehículo"}
          </Button>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Vehicle Selection */}
        <FormField label="Vehículo" required error={errors.vehicleId}>
          <Combobox
            value={selectedVehicleId}
            onChange={(value) => setValue("vehicleId", value)}
            options={activeVehicles.map((v) => ({
              value: v.$id,
              label: `${v.brand?.name || ""} ${v.model?.name || ""} ${
                v.plate ? `(${v.plate})` : ""
              } #${v.economicNumber || ""}`.trim(),
            }))}
            placeholder="Seleccionar vehículo..."
            emptyText="No se encontraron vehículos activos"
            disabled={isEdit}
            icon={Car}
          />
          {roleWarning && (
            <p className="text-xs text-amber-500 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {roleWarning}
            </p>
          )}
        </FormField>

        {/* Role and Type */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Rol" required>
            <Combobox
              value={selectedRole}
              onChange={(value) => setValue("role", value)}
              options={roleOptions}
              placeholder="Seleccionar rol..."
              searchEnabled={false}
            />
          </FormField>

          <FormField label="Tipo de asignación" required>
            <Combobox
              value={watch("assignmentType")}
              onChange={(value) => setValue("assignmentType", value)}
              options={typeOptions}
              placeholder="Seleccionar tipo..."
              searchEnabled={false}
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
                  disabled={!watch("endDate")}
                  className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all disabled:opacity-50"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg) z-10"
              />
              <input
                type="number"
                {...register("startMileage")}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              />
            </div>
          </FormField>

          <FormField label="Nivel de combustible (%)">
            <div className="relative">
              <Fuel
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg) z-10"
              />
              <input
                type="number"
                min="0"
                max="100"
                {...register("startFuelLevel")}
                placeholder="0-100"
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              />
            </div>
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notas / Observaciones">
          <TextareaField
            register={register}
            name="notes"
            placeholder="Detalles adicionales sobre la asignación..."
            rows={3}
          />
        </FormField>
      </form>
    </Modal>
  );
}
