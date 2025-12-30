import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  StopCircle,
  Calendar,
  Clock,
  Gauge,
  Fuel,
  FileText,
  User,
  AlertCircle,
} from "lucide-react";

import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { DatePicker } from "../../../shared/ui/DatePicker";

import { useAssignmentMutations } from "../hooks/useAssignments";

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
export function EndAssignmentModal({ isOpen, onClose, assignment }) {
  const { endAssignment, isLoading } = useAssignmentMutations();

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
      endDate: format(new Date(), "yyyy-MM-dd"),
      endTime: format(new Date(), "HH:mm"),
      endMileage: "",
      endFuelLevel: "",
      notes: "",
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && assignment) {
      reset({
        endDate: format(new Date(), "yyyy-MM-dd"),
        endTime: format(new Date(), "HH:mm"),
        endMileage: "",
        endFuelLevel: "",
        notes: assignment.notes || "",
      });
    }
  }, [isOpen, assignment, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    if (!assignment) return;

    try {
      // Combinar fecha y hora para crear ISO string
      const endDateTime = data.endTime
        ? `${data.endDate}T${data.endTime}:00`
        : `${data.endDate}T23:59:59`;

      await endAssignment.mutateAsync({
        id: assignment.$id,
        endData: {
          endDate: new Date(endDateTime).toISOString(),
          endMileage: data.endMileage
            ? parseInt(data.endMileage, 10)
            : undefined,
          endFuelLevel: data.endFuelLevel
            ? parseInt(data.endFuelLevel, 10)
            : undefined,
          notes: data.notes || undefined,
        },
      });

      onClose();
    } catch (error) {
      console.error("Error ending assignment:", error);
    }
  };

  if (!assignment) return null;

  // Get driver name from assignment (if populated)
  const driverName = assignment.driver
    ? `${assignment.driver.firstName} ${assignment.driver.lastName}`
    : "Conductor";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      header={
        <ModalHeader
          icon={StopCircle}
          title="Finalizar Asignación"
          subtitle={`Finalizar asignación de ${driverName}`}
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
            className="bg-amber-600 hover:bg-amber-700"
          >
            Finalizar Asignación
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-5">
        {/* Info Card */}
        <div className="rounded-lg bg-(--muted)/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--brand)/10">
              <User size={20} className="text-(--brand)" />
            </div>
            <div>
              <p className="font-semibold text-(--fg)">{driverName}</p>
              <p className="text-xs text-(--muted-fg)">
                Inicio:{" "}
                {assignment.startDate
                  ? format(new Date(assignment.startDate), "dd MMM yyyy", {
                      locale: es,
                    })
                  : "—"}
              </p>
            </div>
          </div>
          {assignment.startMileage != null && (
            <div className="flex items-center gap-2 text-sm text-(--muted-fg)">
              <Gauge size={14} />
              <span>
                Kilometraje inicial:{" "}
                <strong className="text-(--fg)">
                  {assignment.startMileage.toLocaleString()} km
                </strong>
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* End Date and Time */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-(--fg)">
              Fecha y hora de finalización{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <DatePicker
                value={watch("endDate")}
                onChange={(value) => setValue("endDate", value)}
                placeholder="Seleccionar fecha"
                error={errors.endDate?.message}
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

          {/* End Mileage */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-(--fg)">
              Kilometraje final
            </label>
            <div className="relative">
              <Gauge
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <input
                type="number"
                {...register("endMileage", {
                  min: {
                    value: assignment.startMileage || 0,
                    message: `Debe ser mayor o igual a ${
                      assignment.startMileage || 0
                    }`,
                  },
                })}
                placeholder={`Mayor a ${
                  assignment.startMileage?.toLocaleString() || 0
                } km`}
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              />
            </div>
            {errors.endMileage && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.endMileage.message}
              </p>
            )}
          </div>

          {/* End Fuel Level */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-(--fg)">
              Nivel de combustible final (%)
            </label>
            <div className="relative">
              <Fuel
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <input
                type="number"
                {...register("endFuelLevel", {
                  min: { value: 0, message: "Mínimo 0%" },
                  max: { value: 100, message: "Máximo 100%" },
                })}
                placeholder="0-100"
                min="0"
                max="100"
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              />
            </div>
            {errors.endFuelLevel && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.endFuelLevel.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-(--fg)">
              Notas de cierre
            </label>
            <div className="relative">
              <FileText
                size={16}
                className="absolute left-3 top-3 text-(--muted-fg)"
              />
              <textarea
                {...register("notes")}
                placeholder="Agregar notas sobre la finalización de esta asignación..."
                rows={3}
                className="w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-3 py-2 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all resize-none"
              />
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
