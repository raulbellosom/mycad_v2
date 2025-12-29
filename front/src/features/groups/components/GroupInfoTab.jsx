import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Pencil,
  Check,
  X,
  Upload,
  Users,
  Shield,
  Car,
  Calendar,
  Hash,
  User,
  Image,
  Trash2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Badge } from "../../../shared/ui/Badge";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { useActiveGroup } from "../hooks/useActiveGroup";
import { usePermissions } from "../hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../context/PermissionsProvider";
import { databases, storage } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";
import { getGroupLogoUrl, getAvatarUrl } from "../../../shared/utils/storage";
import { ID } from "appwrite";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function GroupInfoTab({ groupId }) {
  const { activeGroup, groups, setActiveGroupId } = useActiveGroup();
  const { isGroupAdmin, hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const canManageGroup =
    isGroupAdmin || hasPermission(SYSTEM_PERMISSIONS.GROUPS_MANAGE);

  const updateGroupMutation = useMutation({
    mutationFn: async ({ name, description }) => {
      return databases.updateDocument(
        env.databaseId,
        env.collectionGroupsId,
        activeGroup.$id,
        { name, description }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-groups"]);
      toast.success("Grupo actualizado exitosamente");
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const updateLogoMutation = useMutation({
    mutationFn: async (file) => {
      setIsUploadingLogo(true);

      // Subir nuevo logo
      const uploadedFile = await storage.createFile(
        env.bucketAvatarsId,
        ID.unique(),
        file
      );

      // Actualizar grupo con nuevo logoFileId
      await databases.updateDocument(
        env.databaseId,
        env.collectionGroupsId,
        activeGroup.$id,
        { logoFileId: uploadedFile.$id }
      );

      return uploadedFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-groups"]);
      toast.success("Logo actualizado");
      setIsUploadingLogo(false);
    },
    onError: (err) => {
      toast.error(err.message || "Error al subir logo");
      setIsUploadingLogo(false);
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      await databases.updateDocument(
        env.databaseId,
        env.collectionGroupsId,
        activeGroup.$id,
        { logoFileId: null }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-groups"]);
      toast.success("Logo eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar logo"),
  });

  const startEdit = () => {
    setEditName(activeGroup?.name || "");
    setEditDescription(activeGroup?.description || "");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = () => {
    if (editName.trim()) {
      updateGroupMutation.mutate({
        name: editName.trim(),
        description: editDescription.trim(),
      });
    } else {
      toast.error("El nombre es obligatorio");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      updateLogoMutation.mutate(file);
    }
  };

  if (!activeGroup) {
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <Card className="p-8">
          <EmptyState
            icon={Building2}
            title="Sin grupo seleccionado"
            description="Selecciona un grupo activo para ver su información"
          />

          {groups && groups.length > 0 && (
            <motion.div variants={itemVariants} className="mt-8">
              <h4 className="mb-4 font-medium text-center">
                Tus grupos disponibles:
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {groups.map((g, idx) => (
                  <motion.div
                    key={g.$id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card
                      className="cursor-pointer p-4 hover:border-(--brand) transition-all"
                      onClick={() => setActiveGroupId(g.$id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-(--brand)/10 overflow-hidden">
                          {g.logoFileId ? (
                            <img
                              src={getGroupLogoUrl(g.logoFileId, 96)}
                              alt={g.name}
                              className="h-12 w-12 object-cover"
                            />
                          ) : (
                            <Building2 className="text-(--brand)" size={24} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{g.name}</div>
                          <div className="text-xs text-(--muted-fg) truncate">
                            {g.description || "Sin descripción"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    );
  }

  // Estadísticas mock (puedes conectar con datos reales)
  const stats = [
    {
      icon: Users,
      label: "Miembros",
      value: activeGroup.members?.length || "—",
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: Shield,
      label: "Roles",
      value: "—",
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: Car,
      label: "Vehículos",
      value: "—",
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header del grupo */}
      <motion.div variants={itemVariants}>
        <Card padding="none" className="overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-linear-to-r from-(--brand) to-(--brand)/60 relative">
            <div className="absolute inset-0 bg-black/10" />
            {canManageGroup && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
                onClick={startEdit}
              >
                <Pencil size={14} />
                Editar
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="px-6 pb-6">
            {/* Logo */}
            <div className="relative -mt-12 mb-4">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-2xl border-4 border-(--card) bg-(--muted) flex items-center justify-center overflow-hidden shadow-lg">
                  {isUploadingLogo ? (
                    <RefreshCw
                      size={32}
                      className="text-(--muted-fg) animate-spin"
                    />
                  ) : activeGroup.logoFileId ? (
                    <img
                      src={getGroupLogoUrl(activeGroup.logoFileId, 192)}
                      alt={activeGroup.name}
                      className="h-24 w-24 object-cover"
                    />
                  ) : (
                    <Building2 size={40} className="text-(--muted-fg)" />
                  )}
                </div>

                {canManageGroup && (
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-(--card) border border-(--border) shadow-sm hover:bg-(--muted) transition-colors"
                    >
                      <Upload size={14} className="text-(--muted-fg)" />
                    </button>
                    {activeGroup.logoFileId && (
                      <button
                        onClick={() => removeLogoMutation.mutate()}
                        className="p-1.5 rounded-lg bg-(--card) border border-(--border) shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Nombre y descripción */}
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Input
                    label="Nombre del grupo"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Descripción
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-xl border border-(--border) bg-(--bg) p-3 text-sm focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/20 resize-none"
                      rows={3}
                      placeholder="Descripción del grupo (opcional)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={cancelEdit}>
                      <X size={16} />
                      Cancelar
                    </Button>
                    <Button
                      onClick={saveEdit}
                      loading={updateGroupMutation.isPending}
                    >
                      <Check size={16} />
                      Guardar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="viewing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{activeGroup.name}</h1>
                    <Badge
                      variant={activeGroup.enabled ? "success" : "danger"}
                      dot
                    >
                      {activeGroup.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-(--muted-fg)">
                    {activeGroup.description || "Sin descripción"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}
                  >
                    <Icon size={20} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-(--muted-fg)">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Detalles técnicos e información del propietario */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Detalles técnicos */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Hash size={18} className="text-(--brand)" />
              Información técnica
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-(--border)">
                <span className="text-sm text-(--muted-fg)">Group ID</span>
                <code className="text-sm bg-(--muted) px-2 py-1 rounded">
                  {activeGroup.$id}
                </code>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-(--muted-fg)">Creado</span>
                <span className="text-sm flex items-center gap-1">
                  <Calendar size={14} className="text-(--muted-fg)" />
                  {new Date(activeGroup.$createdAt).toLocaleDateString(
                    "es-MX",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Propietario */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User size={18} className="text-(--brand)" />
              Propietario del grupo
            </h3>
            {activeGroup.ownerProfile ? (
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-(--muted) flex items-center justify-center overflow-hidden">
                  {activeGroup.ownerProfile.avatarFileId ? (
                    <img
                      src={getAvatarUrl(
                        activeGroup.ownerProfile.avatarFileId,
                        112
                      )}
                      alt={activeGroup.ownerProfile.firstName}
                      className="h-14 w-14 object-cover"
                    />
                  ) : (
                    <User size={24} className="text-(--muted-fg)" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {activeGroup.ownerProfile.firstName}{" "}
                    {activeGroup.ownerProfile.lastName}
                  </p>
                  <p className="text-sm text-(--muted-fg)">
                    {activeGroup.ownerProfile.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-(--muted)/50">
                <code className="text-sm">{activeGroup.ownerProfileId}</code>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Cambiar grupo activo */}
      {groups && groups.length > 1 && (
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-(--brand)" />
              Cambiar grupo activo
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => {
                const isActive = activeGroup?.$id === g.$id;

                return (
                  <motion.div
                    key={g.$id}
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      onClick={() => !isActive && setActiveGroupId(g.$id)}
                      className={`p-3 transition-all ${
                        isActive
                          ? "border-(--brand) bg-(--brand)/5 cursor-default"
                          : "cursor-pointer hover:border-(--brand)/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--muted) overflow-hidden shrink-0">
                          {g.logoFileId ? (
                            <img
                              src={getGroupLogoUrl(g.logoFileId, 80)}
                              alt={g.name}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <Building2
                              size={20}
                              className="text-(--muted-fg)"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {g.name}
                          </div>
                          <div className="text-xs text-(--muted-fg) truncate">
                            {g.$id}
                          </div>
                        </div>
                        {isActive && (
                          <Badge variant="primary" size="sm">
                            Activo
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
