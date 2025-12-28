import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Calendar,
  Shield,
  Crown,
  Edit3,
  UserX,
  UserCheck,
  Trash2,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Label } from "../../../shared/ui/Label";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { Select } from "../../../shared/ui/Select";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import {
  updateUserProfile,
  disableUser,
  enableUser,
} from "../services/usersAdmin.service";
import { getAvatarUrl } from "../../../shared/utils/storage";

// Status config
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "SUSPENDED", label: "Suspendido" },
  { value: "DELETED", label: "Eliminado" },
];

const STATUS_CONFIG = {
  ACTIVE: { label: "Activo", variant: "success", icon: UserCheck },
  SUSPENDED: { label: "Suspendido", variant: "warning", icon: AlertTriangle },
  DELETED: { label: "Eliminado", variant: "danger", icon: UserX },
};

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserDetail({ user, onClose }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    username: user?.username || "",
    status: user?.status || "ACTIVE",
    isPlatformAdmin: user?.isPlatformAdmin || false,
  });

  // Reset form when user changes
  if (user && formData.firstName !== user.firstName && !isEditing) {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      username: user.username || "",
      status: user.status || "ACTIVE",
      isPlatformAdmin: user.isPlatformAdmin || false,
    });
  }

  const updateMutation = useMutation({
    mutationFn: (data) => updateUserProfile(user.$id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("Usuario actualizado");
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () =>
      user.enabled ? disableUser(user.$id) : enableUser(user.$id),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["user-stats"]);
      toast.success(user.enabled ? "Usuario suspendido" : "Usuario reactivado");
      setShowDisableConfirm(false);
    },
    onError: (err) => toast.error(err.message || "Error"),
  });

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim() || null,
      username: formData.username.trim() || null,
      status: formData.status,
      isPlatformAdmin: formData.isPlatformAdmin,
    });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      username: user?.username || "",
      status: user?.status || "ACTIVE",
      isPlatformAdmin: user?.isPlatformAdmin || false,
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <Card className="h-full flex items-center justify-center">
        <EmptyState
          icon={User}
          title="Selecciona un usuario"
          description="Haz clic en un usuario de la lista para ver sus detalles"
        />
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[user.status] || STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Card padding="none" className="overflow-hidden h-full flex flex-col">
        {/* Header con avatar */}
        <div className="border-b border-(--border) p-6 bg-linear-to-r from-(--brand)/5 to-transparent shrink-0">
          <div className="flex items-start gap-4">
            {/* Avatar grande */}
            <div className="h-20 w-20 rounded-2xl bg-(--muted) flex items-center justify-center overflow-hidden shadow-md shrink-0">
              {user.avatarFileId ? (
                <img
                  src={getAvatarUrl(user.avatarFileId, 160)}
                  alt={user.firstName}
                  className="h-20 w-20 object-cover"
                />
              ) : (
                <User size={32} className="text-(--muted-fg)" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold truncate">
                  {user.firstName} {user.lastName}
                </h2>
                {user.isPlatformAdmin && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Crown size={12} />
                    Admin Plataforma
                  </Badge>
                )}
              </div>
              <p className="text-sm text-(--muted-fg) truncate mt-1">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={statusConfig.variant} dot>
                  {statusConfig.label}
                </Badge>
                {user.username && (
                  <Badge variant="default" size="sm">
                    @{user.username}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    <X size={14} />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save size={14} />
                    Guardar
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={14} />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Body con información */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información personal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-(--muted-fg) uppercase tracking-wide">
              Información Personal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="detail-firstName">Nombre</Label>
                {isEditing ? (
                  <Input
                    id="detail-firstName"
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                    <User size={16} className="text-(--muted-fg)" />
                    <span>{user.firstName}</span>
                  </div>
                )}
              </div>

              {/* Apellido */}
              <div className="space-y-2">
                <Label htmlFor="detail-lastName">Apellido</Label>
                {isEditing ? (
                  <Input
                    id="detail-lastName"
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                    <User size={16} className="text-(--muted-fg)" />
                    <span>{user.lastName}</span>
                  </div>
                )}
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                  <Mail size={16} className="text-(--muted-fg)" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="detail-phone">Teléfono</Label>
                {isEditing ? (
                  <Input
                    id="detail-phone"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    placeholder="Sin teléfono"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                    <Phone size={16} className="text-(--muted-fg)" />
                    <span>{user.phone || "Sin teléfono"}</span>
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="detail-username">Nombre de usuario</Label>
                {isEditing ? (
                  <Input
                    id="detail-username"
                    value={formData.username}
                    onChange={handleChange("username")}
                    placeholder="Sin username"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                    <AtSign size={16} className="text-(--muted-fg)" />
                    <span>
                      {user.username ? `@${user.username}` : "Sin username"}
                    </span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="detail-status">Estado</Label>
                {isEditing ? (
                  <Select
                    id="detail-status"
                    value={formData.status}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, status: val }))
                    }
                    options={STATUS_OPTIONS}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                    <StatusIcon size={16} className="text-(--muted-fg)" />
                    <span>{statusConfig.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permisos de plataforma */}
          {isEditing && (
            <div className="rounded-lg border border-(--border) p-4 bg-(--muted)/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPlatformAdmin}
                  onChange={handleChange("isPlatformAdmin")}
                  className="mt-1 h-4 w-4 rounded border-(--border) text-(--brand) focus:ring-(--brand)"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-amber-500" />
                    <span className="font-medium text-sm">
                      Administrador de plataforma
                    </span>
                  </div>
                  <p className="text-xs text-(--muted-fg) mt-1">
                    Acceso total al sistema y gestión de todos los grupos.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Información del sistema */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-(--muted-fg) uppercase tracking-wide">
              Información del Sistema
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID del perfil</Label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                  <span className="text-xs font-mono truncate">{user.$id}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Auth ID</Label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                  <span className="text-xs font-mono truncate">
                    {user.userAuthId}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fecha de registro</Label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                  <Calendar size={16} className="text-(--muted-fg)" />
                  <span className="text-sm">{formatDate(user.$createdAt)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Última actualización</Label>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-(--muted)/30">
                  <Calendar size={16} className="text-(--muted-fg)" />
                  <span className="text-sm">{formatDate(user.$updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions peligrosas */}
          <div className="space-y-4 pt-4 border-t border-(--border)">
            <h3 className="font-semibold text-sm text-red-500 uppercase tracking-wide">
              Zona de peligro
            </h3>

            <div className="flex flex-wrap gap-3">
              <Button
                variant={user.enabled ? "danger" : "success"}
                size="sm"
                onClick={() => setShowDisableConfirm(true)}
              >
                {user.enabled ? (
                  <>
                    <UserX size={14} />
                    Suspender usuario
                  </>
                ) : (
                  <>
                    <UserCheck size={14} />
                    Reactivar usuario
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        onConfirm={() => toggleStatusMutation.mutate()}
        title={user.enabled ? "Suspender usuario" : "Reactivar usuario"}
        message={
          user.enabled
            ? `¿Estás seguro de suspender a "${user.firstName} ${user.lastName}"? No podrá acceder al sistema.`
            : `¿Reactivar a "${user.firstName} ${user.lastName}"? Podrá volver a acceder al sistema.`
        }
        confirmText={user.enabled ? "Suspender" : "Reactivar"}
        variant={user.enabled ? "danger" : "success"}
        isLoading={toggleStatusMutation.isPending}
      />
    </>
  );
}
