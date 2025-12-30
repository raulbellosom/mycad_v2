import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Car,
  Calendar,
  MapPin,
  Gauge,
  Fuel,
  User,
  Plus,
  Edit,
  XCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { useDriverAssignments } from "../../vehicles/hooks/useAssignments";
import {
  ASSIGNMENT_ROLE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "../../vehicles/services/assignments.service";
import { getVehicleById } from "../../vehicles/services/vehicles.service";
import { AssignVehicleModal } from "./AssignVehicleModal";
import { EndAssignmentModal } from "../../vehicles/components/EndAssignmentModal";

export function DriverVehicleAssignments({ driverId, driverName }) {
  const { activeGroupId } = useActiveGroup();
  const { hasPermission } = usePermissions();

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  // Permissions
  const canView = hasPermission("ASSIGNMENTS_VIEW");
  const canCreate = hasPermission("ASSIGNMENTS_CREATE");
  const canEdit = hasPermission("ASSIGNMENTS_EDIT");

  // Fetch assignments
  const { data: assignments = [], isLoading } = useDriverAssignments(driverId);

  // Separate active and historical
  const { active, historical } = useMemo(() => {
    const active = assignments.filter((a) => a.isActive);
    const historical = assignments.filter((a) => !a.isActive);
    return { active, historical };
  }, [assignments]);

  if (!canView) {
    return (
      <Card className="p-6">
        <p className="text-sm text-(--muted-fg)">
          No tienes permisos para ver las asignaciones de vehículos.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-(--brand) border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Car className="text-(--brand)" size={20} />
            <h3 className="text-lg font-semibold text-(--fg)">
              Vehículos Asignados
            </h3>
          </div>
          {canCreate && (
            <Button
              onClick={() => {
                setSelectedAssignment(null);
                setIsAssignModalOpen(true);
              }}
              size="sm"
            >
              <Plus size={16} className="mr-1" />
              Asignar Vehículo
            </Button>
          )}
        </div>

        {/* Active Assignments */}
        {active.length > 0 ? (
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-semibold text-(--muted-fg) uppercase">
              Activas
            </h4>
            {active.map((assignment) => (
              <AssignmentCard
                key={assignment.$id}
                assignment={assignment}
                canEdit={canEdit}
                onEdit={(a) => {
                  setSelectedAssignment(a);
                  setIsAssignModalOpen(true);
                }}
                onEnd={(a) => {
                  setSelectedAssignment(a);
                  setIsEndModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-(--border) rounded-lg mb-6">
            <Car className="mx-auto mb-2 text-(--muted-fg)" size={32} />
            <p className="text-sm text-(--muted-fg)">
              No hay vehículos asignados actualmente
            </p>
          </div>
        )}

        {/* Historical Assignments */}
        {historical.length > 0 && (
          <div className="space-y-4 border-t border-(--border) pt-6">
            <h4 className="text-sm font-semibold text-(--muted-fg) uppercase">
              Historial
            </h4>
            {historical.map((assignment) => (
              <AssignmentCard
                key={assignment.$id}
                assignment={assignment}
                isHistorical
              />
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      {isAssignModalOpen && (
        <AssignVehicleModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedAssignment(null);
          }}
          driverId={driverId}
          driverName={driverName}
          assignment={selectedAssignment}
          groupId={activeGroupId}
        />
      )}

      {isEndModalOpen && selectedAssignment && (
        <EndAssignmentModal
          isOpen={isEndModalOpen}
          onClose={() => {
            setIsEndModalOpen(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          groupId={activeGroupId}
        />
      )}
    </>
  );
}

// Assignment Card Component
function AssignmentCard({ assignment, canEdit, onEdit, onEnd, isHistorical }) {
  const { data: vehicle } = useQuery({
    queryKey: ["vehicle", assignment.vehicleId],
    queryFn: () => getVehicleById(assignment.vehicleId),
    enabled: !!assignment.vehicleId,
  });

  const roleColor =
    {
      PRIMARY: "blue",
      SECONDARY: "green",
      TEMP: "yellow",
      SUBSTITUTE: "purple",
    }[assignment.role] || "gray";

  return (
    <div
      className={`border border-(--border) rounded-lg p-4 ${
        isHistorical ? "bg-(--muted)/20" : "bg-(--card)"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-(--fg)">
              {vehicle?.brand?.name || "Cargando..."}{" "}
              {vehicle?.model?.name || ""}
            </h4>
            <Badge variant={roleColor}>
              {ASSIGNMENT_ROLE_LABELS[assignment.role]}
            </Badge>
            <Badge variant="outline">
              {ASSIGNMENT_TYPE_LABELS[assignment.assignmentType]}
            </Badge>
          </div>
          {vehicle && (
            <div className="flex items-center gap-4 text-sm text-(--muted-fg)">
              {vehicle.plate && (
                <span className="flex items-center gap-1">
                  <Car size={14} />
                  {vehicle.plate}
                </span>
              )}
              {vehicle.economicNumber && (
                <span className="flex items-center gap-1">
                  <FileText size={14} />#{vehicle.economicNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {!isHistorical && canEdit && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(assignment)}
            >
              <Edit size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEnd(assignment)}>
              <XCircle size={14} />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-(--muted-fg)">
          <Calendar size={14} />
          <span>
            Inicio:{" "}
            {assignment.startDate
              ? format(new Date(assignment.startDate), "dd/MMM/yyyy", {
                  locale: es,
                })
              : "—"}
          </span>
        </div>

        {assignment.endDate && (
          <div className="flex items-center gap-2 text-(--muted-fg)">
            <Calendar size={14} />
            <span>
              Fin:{" "}
              {format(new Date(assignment.endDate), "dd/MMM/yyyy", {
                locale: es,
              })}
            </span>
          </div>
        )}

        {assignment.startMileage !== null && (
          <div className="flex items-center gap-2 text-(--muted-fg)">
            <Gauge size={14} />
            <span>Inicio: {assignment.startMileage} km</span>
          </div>
        )}

        {assignment.endMileage !== null && (
          <div className="flex items-center gap-2 text-(--muted-fg)">
            <Gauge size={14} />
            <span>Fin: {assignment.endMileage} km</span>
          </div>
        )}

        {assignment.startFuelLevel !== null && (
          <div className="flex items-center gap-2 text-(--muted-fg)">
            <Fuel size={14} />
            <span>Combustible inicial: {assignment.startFuelLevel}%</span>
          </div>
        )}

        {assignment.endFuelLevel !== null && (
          <div className="flex items-center gap-2 text-(--muted-fg)">
            <Fuel size={14} />
            <span>Combustible final: {assignment.endFuelLevel}%</span>
          </div>
        )}
      </div>

      {assignment.notes && (
        <div className="mt-3 pt-3 border-t border-(--border)">
          <p className="text-sm text-(--muted-fg)">{assignment.notes}</p>
        </div>
      )}
    </div>
  );
}
