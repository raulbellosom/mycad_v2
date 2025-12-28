import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Search,
  Key,
  AlertTriangle,
  RefreshCw,
  Shield,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Badge } from "../../../shared/ui/Badge";
import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { PageTransition } from "../../../shared/ui/PageTransition";
import {
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../services/permissions.service";
import {
  SYSTEM_PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
} from "../context/PermissionsProvider";
import { useAuth } from "../../auth/hooks/useAuth";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/**
 * Página de administración de permisos del sistema
 * Solo accesible para Platform Admins
 */
export function PermissionsAdminPage() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingKey, setEditingKey] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [permToDelete, setPermToDelete] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  const isPlatformAdmin = profile?.isPlatformAdmin;

  // Lista de permisos
  const {
    data: permissions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: listPermissions,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({ key, description }) => createPermission(key, description),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-permissions"]);
      toast.success("Permiso creado exitosamente");
      setNewKey("");
      setNewDescription("");
      setShowCreateForm(false);
    },
    onError: (err) => toast.error(err.message || "Error al crear permiso"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, key, description }) =>
      updatePermission(id, { key, description }),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-permissions"]);
      toast.success("Permiso actualizado");
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message || "Error al actualizar permiso"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-permissions"]);
      setPermToDelete(null);
      toast.success("Permiso eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar permiso"),
  });

  // Seed all system permissions
  const seedPermissionsMutation = useMutation({
    mutationFn: async () => {
      const existingKeys = new Set(permissions.map((p) => p.key));
      const allSystemPerms = Object.values(SYSTEM_PERMISSIONS);
      const toCreate = allSystemPerms.filter((key) => !existingKeys.has(key));

      for (const key of toCreate) {
        await createPermission(key, PERMISSION_LABELS[key] || "");
      }

      return toCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries(["all-permissions"]);
      toast.success(`Se crearon ${count} permisos del sistema`);
    },
    onError: (err) => toast.error(err.message || "Error al crear permisos"),
  });

  const startEdit = (perm) => {
    setEditingId(perm.$id);
    setEditingKey(perm.key);
    setEditingDescription(perm.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingKey("");
    setEditingDescription("");
  };

  const saveEdit = (id) => {
    if (editingKey.trim()) {
      updateMutation.mutate({
        id,
        key: editingKey.trim(),
        description: editingDescription.trim(),
      });
    } else {
      toast.error("La clave es obligatoria");
    }
  };

  // Verificar si es platform admin
  if (!isPlatformAdmin) {
    return (
      <PageTransition>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
            >
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </motion.div>
            <h2 className="mb-2 text-xl font-semibold">Acceso Restringido</h2>
            <p className="text-sm text-(--muted-fg)">
              Esta sección solo está disponible para administradores de
              plataforma.
            </p>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) return <LoadingScreen label="Cargando permisos..." />;

  // Filtering
  const filteredPermissions = permissions.filter(
    (p) =>
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check missing permissions
  const existingKeys = new Set(permissions.map((p) => p.key));
  const missingPermissions = Object.values(SYSTEM_PERMISSIONS).filter(
    (key) => !existingKeys.has(key)
  );

  return (
    <PageTransition>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <SectionHeader
          title="Permisos del Sistema"
          subtitle="Administra los permisos globales de la plataforma"
        />

        {/* Warning if missing permissions */}
        <AnimatePresence>
          {missingPermissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Permisos faltantes detectados
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Hay{" "}
                      <span className="font-bold">
                        {missingPermissions.length}
                      </span>{" "}
                      permisos del sistema que no existen en la base de datos.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => seedPermissionsMutation.mutate()}
                      loading={seedPermissionsMutation.isPending}
                    >
                      <Sparkles size={14} />
                      Crear permisos faltantes
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--brand)/10">
                <Key size={20} className="text-(--brand)" />
              </div>
              <div>
                <p className="text-2xl font-bold">{permissions.length}</p>
                <p className="text-xs text-(--muted-fg)">Total permisos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(SYSTEM_PERMISSIONS).length -
                    missingPermissions.length}
                </p>
                <p className="text-xs text-(--muted-fg)">Permisos activos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
                <AlertTriangle size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {missingPermissions.length}
                </p>
                <p className="text-xs text-(--muted-fg)">Faltantes</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Lista de permisos */}
          <Card padding="none" className="lg:col-span-3 overflow-hidden">
            <div className="border-b border-(--border) p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand)/10">
                    <Key className="text-(--brand)" size={16} />
                  </div>
                  <h3 className="font-semibold">Permisos</h3>
                  <Badge variant="primary" size="sm">
                    {permissions.length}
                  </Badge>
                </div>
                <Button size="sm" onClick={() => setShowCreateForm(true)}>
                  <Plus size={14} />
                  Nuevo
                </Button>
              </div>

              {/* Buscador */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
                  size={16}
                />
                <Input
                  placeholder="Buscar permiso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-125 overflow-y-auto">
              {filteredPermissions.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Key}
                    title="Sin permisos"
                    description={
                      searchTerm
                        ? `No hay resultados para "${searchTerm}"`
                        : "No hay permisos en el sistema"
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
                  {filteredPermissions.map((perm) => {
                    const isSystemPerm = Object.values(
                      SYSTEM_PERMISSIONS
                    ).includes(perm.key);

                    return (
                      <motion.div
                        key={perm.$id}
                        variants={itemVariants}
                        className="p-4 hover:bg-(--muted)/30 transition-colors"
                      >
                        {editingId === perm.$id ? (
                          <div className="space-y-3">
                            <Input
                              value={editingKey}
                              onChange={(e) => setEditingKey(e.target.value)}
                              placeholder="Clave del permiso"
                              className="font-mono text-sm h-9"
                              autoFocus
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
                                onClick={() => saveEdit(perm.$id)}
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
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-sm font-medium text-(--brand)">
                                  {perm.key}
                                </code>
                                {isSystemPerm && (
                                  <Badge variant="primary" size="sm">
                                    Sistema
                                  </Badge>
                                )}
                              </div>
                              {perm.description && (
                                <p className="mt-1 text-xs text-(--muted-fg)">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => startEdit(perm)}
                              >
                                <Pencil size={14} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => setPermToDelete(perm)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </Card>

          {/* Categorías de referencia */}
          <Card padding="none" className="lg:col-span-2 overflow-hidden">
            <div className="border-b border-(--border) p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand)/10">
                  <Shield className="text-(--brand)" size={16} />
                </div>
                <h3 className="font-semibold">Categorías del Sistema</h3>
              </div>
            </div>

            <div className="max-h-125 overflow-y-auto p-4 space-y-4">
              {PERMISSION_CATEGORIES.map((cat) => {
                const catPerms = cat.permissions;
                const existingCount = catPerms.filter((key) =>
                  existingKeys.has(key)
                ).length;
                const allExist = existingCount === catPerms.length;

                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-(--border) overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-(--muted)/30 px-3 py-2">
                      <span className="text-sm font-medium">{cat.label}</span>
                      <Badge
                        variant={allExist ? "success" : "warning"}
                        size="sm"
                      >
                        {existingCount}/{catPerms.length}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {catPerms.map((key) => {
                          const exists = existingKeys.has(key);
                          const shortKey = key.split(".").slice(-1)[0];

                          return (
                            <span
                              key={key}
                              title={key}
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono ${
                                exists
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              }`}
                            >
                              {exists ? (
                                <CheckCircle2 size={10} />
                              ) : (
                                <XCircle size={10} />
                              )}
                              {shortKey}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Modal para crear permiso */}
        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          size="md"
          header={
            <ModalHeader
              icon={Plus}
              title="Crear Nuevo Permiso"
              subtitle="Agrega un nuevo permiso al sistema"
            />
          }
          footer={
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() =>
                  createMutation.mutate({
                    key: newKey.trim(),
                    description: newDescription.trim(),
                  })
                }
                loading={createMutation.isPending}
                disabled={!newKey.trim()}
              >
                <Plus size={16} />
                Crear Permiso
              </Button>
            </ModalFooter>
          }
        >
          <div className="space-y-4">
            <Input
              label="Clave del permiso"
              placeholder="ej: vehicles.create"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="font-mono"
            />
            <Input
              label="Descripción"
              placeholder="Descripción del permiso"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />

            <div className="flex items-start gap-2 p-3 rounded-lg bg-(--muted)/50">
              <Info size={16} className="text-(--muted-fg) mt-0.5" />
              <p className="text-xs text-(--muted-fg)">
                Usa el formato <code>modulo.accion</code> para mantener
                consistencia (ej: vehicles.edit, reports.create)
              </p>
            </div>
          </div>
        </Modal>

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          isOpen={!!permToDelete}
          onClose={() => setPermToDelete(null)}
          onConfirm={() => deleteMutation.mutate(permToDelete.$id)}
          title="Eliminar permiso"
          description={`¿Estás seguro de que deseas eliminar el permiso "${permToDelete?.key}"? Los roles que tengan este permiso lo perderán.`}
          confirmText="Eliminar"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      </div>
    </PageTransition>
  );
}
