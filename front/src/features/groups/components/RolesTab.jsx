import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Key,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Badge } from "../../../shared/ui/Badge";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listRolePermissions,
  listPermissions,
  updateRolePermissions,
  createPermission,
} from "../services/permissions.service";
import {
  SYSTEM_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
} from "../context/PermissionsProvider";
import { usePermissions } from "../hooks/usePermissions";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function RolesTab({ groupId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const queryClient = useQueryClient();
  const { isGroupAdmin, hasPermission } = usePermissions();

  const canManageRoles =
    isGroupAdmin || hasPermission(SYSTEM_PERMISSIONS.GROUPS_ROLES_MANAGE);

  // Lista de roles del grupo
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", groupId],
    queryFn: () => listRoles(groupId),
    enabled: !!groupId,
  });

  // Lista de todos los permisos del sistema
  const { data: allPermissions = [], refetch: refetchPermissions } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: listPermissions,
  });

  // Seed automático de permisos CRUD estándar si faltan
  useEffect(() => {
    if (!allPermissions || allPermissions.length === 0) return;
    const existingKeys = new Set(allPermissions.map((p) => p.key));
    const systemPerms = Object.entries(SYSTEM_PERMISSIONS);
    const toCreate = systemPerms.filter(([k, key]) => !existingKeys.has(key));
    if (toCreate.length > 0) {
      Promise.all(
        toCreate.map(([k, key]) =>
          createPermission(key, PERMISSION_LABELS[key] || "")
        )
      ).then(() => {
        refetchPermissions();
      });
    }
  }, [allPermissions, refetchPermissions]);

  // Permisos del rol seleccionado
  const { data: rolePermissions = [], isLoading: isLoadingRolePermissions } =
    useQuery({
      queryKey: ["role-permissions", groupId, selectedRoleId],
      queryFn: () => listRolePermissions(groupId, selectedRoleId),
      enabled: !!groupId && !!selectedRoleId,
    });

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({ name, description }) =>
      createRole(groupId, name, description, false),
    onSuccess: () => {
      queryClient.invalidateQueries(["roles", groupId]);
      toast.success("Rol creado exitosamente");
      setSearchTerm("");
      setNewDescription("");
    },
    onError: (err) => toast.error(err.message || "Error al crear rol"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, description }) =>
      updateRole(id, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries(["roles", groupId]);
      toast.success("Rol actualizado");
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message || "Error al actualizar rol"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["roles", groupId]);
      if (selectedRoleId === roleToDelete?.$id) {
        setSelectedRoleId(null);
      }
      setRoleToDelete(null);
      toast.success("Rol eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar rol"),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }) =>
      updateRolePermissions(groupId, roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries([
        "role-permissions",
        groupId,
        selectedRoleId,
      ]);
      toast.success("Permisos actualizados");
    },
    onError: (err) =>
      toast.error(err.message || "Error al actualizar permisos"),
  });

  const startEdit = (role) => {
    setEditingId(role.$id);
    setEditingName(role.name);
    setEditingDescription(role.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const saveEdit = (id) => {
    if (editingName.trim()) {
      updateMutation.mutate({
        id,
        name: editingName.trim(),
        description: editingDescription.trim(),
      });
    } else {
      toast.error("El nombre es obligatorio");
    }
  };

  const handlePermissionToggle = (permissionId) => {
    if (!canManageRoles) return;

    const currentPermIds = rolePermissions.map((rp) => rp.permissionId);
    let newPermIds;

    if (currentPermIds.includes(permissionId)) {
      newPermIds = currentPermIds.filter((id) => id !== permissionId);
    } else {
      newPermIds = [...currentPermIds, permissionId];
    }

    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: newPermIds,
    });
  };

  const toggleAllPermissionsInCategory = (categoryPermissions, enable) => {
    if (!canManageRoles) return;

    const currentPermIds = rolePermissions.map((rp) => rp.permissionId);
    const categoryPermIds = allPermissions
      .filter((p) => categoryPermissions.includes(p.key))
      .map((p) => p.$id);

    let newPermIds;
    if (enable) {
      newPermIds = [...new Set([...currentPermIds, ...categoryPermIds])];
    } else {
      newPermIds = currentPermIds.filter((id) => !categoryPermIds.includes(id));
    }

    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: newPermIds,
    });
  };

  const toggleAllPermissions = (enable) => {
    if (!canManageRoles) return;

    const newPermIds = enable ? allPermissions.map((p) => p.$id) : [];

    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: newPermIds,
    });
  };

  if (isLoading) return <LoadingScreen label="Cargando roles..." />;

  // Filtering
  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const canCreate =
    canManageRoles &&
    searchTerm.trim() !== "" &&
    !roles.some(
      (r) => r.name.toLowerCase() === searchTerm.toLowerCase().trim()
    );

  const currentPermissionIds = rolePermissions.map((rp) => rp.permissionId);
  const selectedRole = roles.find((r) => r.$id === selectedRoleId);

  // Calcular estadísticas de permisos
  const totalPermissions = allPermissions.length;
  const assignedPermissions = currentPermissionIds.length;
  const permissionPercentage =
    totalPermissions > 0
      ? Math.round((assignedPermissions / totalPermissions) * 100)
      : 0;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lista de Roles */}
        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          {/* Header */}
          <div className="border-b border-(--border) p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand)/10">
                <Shield className="text-(--brand)" size={16} />
              </div>
              <h3 className="font-semibold">Roles del Grupo</h3>
              <Badge variant="primary" size="sm">
                {roles.length}
              </Badge>
            </div>

            {/* Buscador / Crear */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
                    size={16}
                  />
                  <Input
                    placeholder="Buscar o crear rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                {canCreate && (
                  <Button
                    size="sm"
                    className="h-9"
                    loading={createMutation.isPending}
                    onClick={() =>
                      createMutation.mutate({
                        name: searchTerm.trim(),
                        description: newDescription.trim(),
                      })
                    }
                  >
                    <Plus size={14} />
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {canCreate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      placeholder="Descripción del rol (opcional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-125 overflow-y-auto">
            {filteredRoles.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Shield}
                  title="Sin roles"
                  description={
                    searchTerm
                      ? `No hay resultados para "${searchTerm}"`
                      : "Crea roles para asignar permisos"
                  }
                />
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-(--border)"
              >
                {filteredRoles.map((role) => {
                  const isSelected = selectedRoleId === role.$id;
                  const isEditing = editingId === role.$id;

                  return (
                    <motion.div
                      key={role.$id}
                      variants={itemVariants}
                      onClick={() => !isEditing && setSelectedRoleId(role.$id)}
                      className={`p-4 transition-all ${
                        isEditing
                          ? "bg-(--muted)/30"
                          : isSelected
                          ? "bg-(--brand)/5 border-l-2 border-l-(--brand) cursor-pointer"
                          : "hover:bg-(--muted)/50 cursor-pointer"
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="text-sm h-9"
                            autoFocus
                            placeholder="Nombre del rol"
                          />
                          <Input
                            value={editingDescription}
                            onChange={(e) =>
                              setEditingDescription(e.target.value)
                            }
                            placeholder="Descripción"
                            className="text-sm h-9"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveEdit(role.$id)}
                              loading={updateMutation.isPending}
                            >
                              <Check size={14} />
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              role.isSystem ? "bg-(--brand)/10" : "bg-(--muted)"
                            }`}
                          >
                            {role.isSystem ? (
                              <ShieldCheck
                                size={18}
                                className="text-(--brand)"
                              />
                            ) : (
                              <Shield size={18} className="text-(--muted-fg)" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {role.name}
                              </span>
                              {role.isSystem && (
                                <Badge variant="primary" size="sm">
                                  Sistema
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-xs text-(--muted-fg) truncate mt-0.5">
                                {role.description}
                              </p>
                            )}
                          </div>

                          {canManageRoles && !role.isSystem && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(role);
                                }}
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRoleToDelete(role);
                                }}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          )}

                          {isSelected && (
                            <ChevronRight
                              size={16}
                              className="text-(--brand)"
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </Card>

        {/* Panel de Permisos */}
        <Card padding="none" className="lg:col-span-3 overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedRoleId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center p-8"
              >
                <EmptyState
                  icon={Key}
                  title="Selecciona un rol"
                  description="Haz clic en un rol para gestionar sus permisos"
                />
              </motion.div>
            ) : isLoadingRolePermissions ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center p-8"
              >
                <LoadingScreen label="Cargando permisos..." />
              </motion.div>
            ) : (
              <motion.div
                key={selectedRoleId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="border-b border-(--border) p-4 bg-linear-to-r from-(--brand)/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--brand)/10">
                        <ShieldAlert size={24} className="text-(--brand)" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {selectedRole?.name}
                        </h3>
                        <p className="text-sm text-(--muted-fg)">
                          {selectedRole?.description || "Sin descripción"}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-(--brand)">
                        {assignedPermissions}/{totalPermissions}
                      </div>
                      <div className="text-xs text-(--muted-fg)">
                        permisos asignados
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-(--muted) overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${permissionPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-(--brand) rounded-full"
                      />
                    </div>
                  </div>

                  {/* Quick actions */}
                  {canManageRoles && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllPermissions(true)}
                        disabled={assignedPermissions === totalPermissions}
                      >
                        <CheckCircle2 size={14} />
                        Todos
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAllPermissions(false)}
                        disabled={assignedPermissions === 0}
                      >
                        <XCircle size={14} />
                        Ninguno
                      </Button>
                    </div>
                  )}
                </div>

                {/* Permisos por categoría */}
                <div className="max-h-105 overflow-y-auto p-4">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    {PERMISSION_CATEGORIES.map((category) => {
                      // Obtener permisos de esta categoría
                      const categoryPerms = allPermissions.filter((p) =>
                        category.permissions.includes(p.key)
                      );
                      const assignedInCategory = categoryPerms.filter((p) =>
                        currentPermissionIds.includes(p.$id)
                      ).length;
                      const allAssigned =
                        assignedInCategory === categoryPerms.length &&
                        categoryPerms.length > 0;

                      return (
                        <motion.div
                          key={category.id}
                          variants={itemVariants}
                          className="rounded-xl border border-(--border) overflow-hidden"
                        >
                          {/* Category header */}
                          <div className="flex items-center justify-between bg-(--muted)/30 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {category.label}
                              </span>
                              <Badge
                                variant={allAssigned ? "success" : "default"}
                                size="sm"
                              >
                                {assignedInCategory}/{categoryPerms.length}
                              </Badge>
                            </div>
                            {canManageRoles && categoryPerms.length > 0 && (
                              <Button
                                size="sm"
                                variant={allAssigned ? "ghost" : "outline"}
                                className="h-7 text-xs"
                                onClick={() =>
                                  toggleAllPermissionsInCategory(
                                    category.permissions,
                                    !allAssigned
                                  )
                                }
                              >
                                {allAssigned ? (
                                  <>
                                    <XCircle size={12} />
                                    Quitar
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={12} />
                                    Todos
                                  </>
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Permissions grid */}
                          <div className="p-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              {categoryPerms.map((perm) => {
                                const isAssigned =
                                  currentPermissionIds.includes(perm.$id);

                                return (
                                  <motion.label
                                    key={perm.$id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all text-sm ${
                                      isAssigned
                                        ? "border-(--brand)/50 bg-(--brand)/5"
                                        : "border-(--border) hover:bg-(--muted)/50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() =>
                                        handlePermissionToggle(perm.$id)
                                      }
                                      disabled={!canManageRoles}
                                      className="h-4 w-4 rounded border-(--border) text-(--brand) focus:ring-(--brand)"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="truncate block">
                                        {PERMISSION_LABELS[perm.key] ||
                                          perm.key}
                                      </span>
                                    </div>
                                    {isAssigned && (
                                      <CheckCircle2
                                        size={14}
                                        className="text-(--brand) shrink-0"
                                      />
                                    )}
                                  </motion.label>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={() => deleteMutation.mutate(roleToDelete.$id)}
        title="Eliminar rol"
        description={`¿Estás seguro de que deseas eliminar el rol "${roleToDelete?.name}"? Los miembros que tengan este rol perderán los permisos asociados.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
