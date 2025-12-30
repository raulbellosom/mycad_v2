import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  User,
  Plus,
  Calendar,
  Gauge,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Car,
  UserCheck,
  Fuel,
} from "lucide-react";

import { getAvatarPreviewUrl } from "../../auth/services/myProfile.service";

import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { env } from "../../../shared/appwrite/env";
import { cn } from "../../../shared/utils/cn";

import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import { listDrivers } from "../../drivers/services/drivers.service";
import {
  useVehicleAssignments,
  useAssignmentMutations,
} from "../hooks/useAssignments";
import {
  ASSIGNMENT_ROLE_LABELS,
  ASSIGNMENT_TYPE_LABELS,
} from "../services/assignments.service";
import { AssignDriverModal } from "./AssignDriverModal";
import { EndAssignmentModal } from "./EndAssignmentModal";

// ─────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: es });
  } catch {
    return "—";
  }
}

// ─────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────

/** Assignment Card */
function AssignmentCard({
  assignment,
  driver,
  onEdit,
  onEnd,
  onDelete,
  canManage,
  onViewProfile,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const isActive = assignment.isActive;
  const roleLabel = ASSIGNMENT_ROLE_LABELS[assignment.role] || assignment.role;
  const typeLabel =
    ASSIGNMENT_TYPE_LABELS[assignment.assignmentType] ||
    assignment.assignmentType;

  // Check if driver has linkedProfile with avatar
  const linkedProfile = driver?.linkedProfile;
  const hasAvatar = linkedProfile?.avatarFileId;
  const avatarUrl = hasAvatar
    ? getAvatarPreviewUrl(linkedProfile.avatarFileId, 200)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative"
    >
      <Card
        className={cn(
          "p-4 transition-all",
          isActive
            ? "border-green-500/30 bg-green-500/5"
            : "border-(--border) bg-(--card)"
        )}
      >
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          {/* Driver Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Profile Picture or Icon */}
            {avatarUrl ? (
              <div
                onClick={() => onViewProfile?.(linkedProfile.avatarFileId)}
                className={cn(
                  "h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full overflow-hidden cursor-pointer transition-all hover:ring-2",
                  isActive
                    ? "ring-green-500/50 hover:ring-green-500"
                    : "ring-(--border) hover:ring-(--brand)"
                )}
              >
                <img
                  src={avatarUrl}
                  alt={
                    driver
                      ? `${driver.firstName} ${driver.lastName}`
                      : "Conductor"
                  }
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className={cn(
                  "flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full",
                  isActive
                    ? "bg-green-500/10 text-green-600"
                    : "bg-(--muted)/50 text-(--muted-fg)"
                )}
              >
                <User size={24} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-(--fg) truncate text-sm sm:text-base">
                  {driver
                    ? `${driver.firstName} ${driver.lastName}`
                    : "Conductor no encontrado"}
                </h4>
                {isActive && (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 size={12} className="mr-1" />
                    Activo
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                <Badge
                  variant={isActive ? "outline" : "default"}
                  size="sm"
                  className="text-xs"
                >
                  {roleLabel}
                </Badge>
                <Badge variant="outline" size="sm" className="text-xs">
                  {typeLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-(--muted) transition-colors"
              >
                <MoreVertical size={16} className="text-(--muted-fg)" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border border-(--border) bg-(--card) py-1 shadow-lg"
                    >
                      {isActive && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onEnd(assignment);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-(--muted) transition-colors"
                        >
                          <StopCircle size={16} />
                          Finalizar asignación
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(assignment);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-(--fg) hover:bg-(--muted) transition-colors"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(assignment);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-(--muted) transition-colors"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Assignment Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-(--muted-fg)">
            <Calendar size={14} className="shrink-0" />
            <span className="truncate">
              Inicio:{" "}
              <strong className="text-(--fg)">
                {formatDate(assignment.startDate)}
              </strong>
            </span>
          </div>
          {assignment.endDate && (
            <div className="flex items-center gap-2 text-(--muted-fg)">
              <Clock size={14} className="shrink-0" />
              <span className="truncate">
                Fin:{" "}
                <strong className="text-(--fg)">
                  {formatDate(assignment.endDate)}
                </strong>
              </span>
            </div>
          )}
          {assignment.startMileage != null && (
            <div className="flex items-center gap-2 text-(--muted-fg)">
              <Gauge size={14} className="shrink-0" />
              <span className="truncate">
                Km inicio:{" "}
                <strong className="text-(--fg)">
                  {assignment.startMileage.toLocaleString()}
                </strong>
              </span>
            </div>
          )}
          {assignment.endMileage != null && (
            <div className="flex items-center gap-2 text-(--muted-fg)">
              <Gauge size={14} className="shrink-0" />
              <span className="truncate">
                Km fin:{" "}
                <strong className="text-(--fg)">
                  {assignment.endMileage.toLocaleString()}
                </strong>
              </span>
            </div>
          )}
          {assignment.startFuelLevel != null && (
            <div className="flex items-center gap-2 text-(--muted-fg)">
              <Fuel size={14} className="shrink-0" />
              <span className="truncate">
                Combustible inicio:{" "}
                <strong className="text-(--fg)">
                  {assignment.startFuelLevel}%
                </strong>
              </span>
            </div>
          )}
          {assignment.endFuelLevel != null && (
            <div className="flex items-center gap-2 text-(--muted-fg)">
              <Fuel size={14} className="shrink-0" />
              <span className="truncate">
                Combustible fin:{" "}
                <strong className="text-(--fg)">
                  {assignment.endFuelLevel}%
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {assignment.notes && (
          <div className="mt-3 rounded-lg bg-(--muted)/30 p-3">
            <p className="text-sm text-(--muted-fg)">{assignment.notes}</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
export function VehicleDriverAssignments({ vehicleId, vehicle }) {
  const { activeGroupId } = useActiveGroup();
  const { profile } = useAuth();
  const { can } = usePermissions();

  // Permissions
  const canView = can(SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW);
  const canCreate = can(SYSTEM_PERMISSIONS.ASSIGNMENTS_CREATE);
  const canEdit = can(SYSTEM_PERMISSIONS.ASSIGNMENTS_EDIT);
  const canDelete = can(SYSTEM_PERMISSIONS.ASSIGNMENTS_DELETE);
  const canManage = canEdit || canDelete;

  // State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);

  // Fetch assignments
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useVehicleAssignments(vehicleId);

  // Fetch drivers for the group
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers", activeGroupId],
    queryFn: () => listDrivers(activeGroupId),
    enabled: !!activeGroupId,
  });

  // Mutations
  const { deleteAssignment: deleteMutation, isLoading: mutationLoading } =
    useAssignmentMutations();

  // Create driver lookup map
  const driverMap = Object.fromEntries(drivers.map((d) => [d.$id, d]));

  // Separate active and historical assignments
  // Considerar una asignación como activa si la fecha de fin es futura o no existe
  const now = new Date();
  const activeAssignments = assignments.filter((a) => {
    if (!a.endDate) return true; // Sin fecha de fin = siempre activa
    const endDate = new Date(a.endDate);
    return endDate > now; // Activa si la fecha de fin es futura
  });

  const historicalAssignments = assignments.filter((a) => {
    if (!a.endDate) return false; // Sin fecha de fin = no es histórica
    const endDate = new Date(a.endDate);
    return endDate <= now; // Histórica si la fecha de fin ya pasó
  });

  // Handlers
  const handleAssign = () => {
    setEditingAssignment(null);
    setShowAssignModal(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setShowAssignModal(true);
  };

  const handleEnd = (assignment) => {
    setSelectedAssignment(assignment);
    setShowEndModal(true);
  };

  const handleDeleteClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;

    try {
      await deleteMutation.mutateAsync(selectedAssignment.$id);
      setShowDeleteModal(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const handleViewProfile = (avatarFileId) => {
    if (avatarFileId) {
      setSelectedAvatarId(avatarFileId);
      setViewerOpen(true);
    }
  };

  // Loading state
  if (assignmentsLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-(--brand) border-t-transparent rounded-full" />
      </div>
    );
  }

  // No permission to view
  if (!canView) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Sin permisos"
        description="No tienes permisos para ver las asignaciones de conductores."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-(--fg)">
            Asignaciones de Conductor
          </h3>
          <p className="text-sm text-(--muted-fg)">
            {activeAssignments.length > 0
              ? `${activeAssignments.length} asignación(es) activa(s)`
              : "Sin conductor asignado actualmente"}
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleAssign} size="sm">
            <Plus size={16} className="mr-1" />
            Asignar Conductor
          </Button>
        )}
      </div>

      {/* Active Assignments */}
      {activeAssignments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-(--muted-fg) uppercase tracking-wide">
            Asignación Actual
          </h4>
          <AnimatePresence mode="popLayout">
            {activeAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.$id}
                assignment={assignment}
                driver={driverMap[assignment.driverId]}
                onEdit={handleEdit}
                onEnd={handleEnd}
                onDelete={handleDeleteClick}
                onViewProfile={handleViewProfile}
                canManage={canManage}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Historical Assignments */}
      {historicalAssignments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-(--muted-fg) uppercase tracking-wide">
            Historial de Asignaciones
          </h4>
          <AnimatePresence mode="popLayout">
            {historicalAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.$id}
                assignment={assignment}
                driver={driverMap[assignment.driverId]}
                onEdit={handleEdit}
                onEnd={handleEnd}
                onDelete={handleDeleteClick}
                onViewProfile={handleViewProfile}
                canManage={canManage}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {assignments.length === 0 && (
        <EmptyState
          icon={UserCheck}
          title="Sin asignaciones"
          description="Este vehículo no tiene conductores asignados. Asigna un conductor para comenzar a registrar el historial."
          action={
            canCreate && (
              <Button onClick={handleAssign}>
                <Plus size={16} className="mr-1" />
                Asignar Conductor
              </Button>
            )
          }
        />
      )}

      {/* Assign Driver Modal */}
      <AssignDriverModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setEditingAssignment(null);
        }}
        vehicleId={vehicleId}
        vehicle={vehicle}
        drivers={drivers}
        editingAssignment={editingAssignment}
      />

      {/* End Assignment Modal */}
      <EndAssignmentModal
        isOpen={showEndModal}
        onClose={() => {
          setShowEndModal(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAssignment(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar asignación"
        description="¿Estás seguro de que deseas eliminar esta asignación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={mutationLoading}
      />

      {/* Profile Image Viewer */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedAvatarId(null);
        }}
        currentImageId={selectedAvatarId}
        images={selectedAvatarId ? [selectedAvatarId] : []}
        bucketId={env.bucketAvatarsId}
      />
    </div>
  );
}
