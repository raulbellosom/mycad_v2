import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Search,
  Users,
  UserPlus,
  Crown,
  ShieldCheck,
  User,
  Eye,
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { Badge } from "../../../shared/ui/Badge";
import { UserSearch } from "../../../shared/ui/UserSearch";
import {
  listGroupMembers,
  addGroupMember,
  updateGroupMember,
  removeGroupMember,
  listRoles,
  listUserRoles,
  updateUserRoles,
} from "../services/permissions.service";
import { SYSTEM_PERMISSIONS } from "../context/PermissionsProvider";
import { usePermissions } from "../hooks/usePermissions";
import { getAvatarUrl } from "../../../shared/utils/storage";

// Roles de membresía del grupo (diferentes a los roles RBAC)
const MEMBERSHIP_ROLES = [
  {
    value: "OWNER",
    label: "Propietario",
    icon: Crown,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    badge: "warning",
  },
  {
    value: "ADMIN",
    label: "Administrador",
    icon: ShieldCheck,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    badge: "info",
  },
  {
    value: "MEMBER",
    label: "Miembro",
    icon: User,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    badge: "success",
  },
  {
    value: "VIEWER",
    label: "Visor",
    icon: Eye,
    color: "text-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-900/20",
    badge: "default",
  },
];

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

export function MembersTab({ groupId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [selectedUserForAdd, setSelectedUserForAdd] = useState(null);
  const [newRole, setNewRole] = useState("MEMBER");
  const queryClient = useQueryClient();
  const { isGroupAdmin, isGroupOwner, hasPermission } = usePermissions();

  const canManageMembers =
    isGroupAdmin || hasPermission(SYSTEM_PERMISSIONS.GROUPS_MEMBERS_MANAGE);

  // Lista de miembros del grupo
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => listGroupMembers(groupId),
    enabled: !!groupId,
  });

  // Lista de roles RBAC del grupo
  const { data: rbacRoles = [] } = useQuery({
    queryKey: ["roles", groupId],
    queryFn: () => listRoles(groupId),
    enabled: !!groupId,
  });

  // Roles asignados al miembro seleccionado
  const { data: memberRoles = [], isLoading: isLoadingMemberRoles } = useQuery({
    queryKey: ["user-roles", groupId, selectedMemberId],
    queryFn: async () => {
      const member = members.find((m) => m.$id === selectedMemberId);
      if (!member) return [];
      return listUserRoles(groupId, member.profileId);
    },
    enabled: !!groupId && !!selectedMemberId,
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: ({ profileId, role }) =>
      addGroupMember(groupId, profileId, role),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-members", groupId]);
      toast.success("Miembro agregado exitosamente");
      setShowAddModal(false);
      setSelectedUserForAdd(null);
      setNewRole("MEMBER");
    },
    onError: (err) => toast.error(err.message || "Error al agregar miembro"),
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ memberId, data }) => updateGroupMember(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-members", groupId]);
      toast.success("Miembro actualizado");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => removeGroupMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-members", groupId]);
      if (selectedMemberId === memberToRemove?.$id) {
        setSelectedMemberId(null);
      }
      setMemberToRemove(null);
      toast.success("Miembro removido del grupo");
    },
    onError: (err) => toast.error(err.message || "Error al remover"),
  });

  const updateMemberRolesMutation = useMutation({
    mutationFn: ({ profileId, roleIds }) =>
      updateUserRoles(groupId, profileId, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries(["user-roles", groupId, selectedMemberId]);
      toast.success("Roles actualizados");
    },
    onError: (err) => toast.error(err.message || "Error al actualizar roles"),
  });

  const handleRoleChange = (memberId, newMembershipRole) => {
    if (!canManageMembers) return;
    updateMemberMutation.mutate({
      memberId,
      data: { role: newMembershipRole },
    });
  };

  const handleRbacRoleToggle = (roleId) => {
    if (!canManageMembers) return;

    const member = members.find((m) => m.$id === selectedMemberId);
    if (!member) return;

    const currentRoleIds = memberRoles.map((ur) => ur.roleId);
    let newRoleIds;

    if (currentRoleIds.includes(roleId)) {
      newRoleIds = currentRoleIds.filter((id) => id !== roleId);
    } else {
      newRoleIds = [...currentRoleIds, roleId];
    }

    updateMemberRolesMutation.mutate({
      profileId: member.profileId,
      roleIds: newRoleIds,
    });
  };

  if (isLoading) return <LoadingScreen label="Cargando miembros..." />;

  // Filtering
  const filteredMembers = members.filter((m) => {
    const profile = m.profile;
    const searchLower = searchTerm.toLowerCase().trim();
    return (
      profile?.firstName?.toLowerCase().includes(searchLower) ||
      profile?.lastName?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower)
    );
  });

  const selectedMember = members.find((m) => m.$id === selectedMemberId);
  const memberRoleIds = memberRoles.map((ur) => ur.roleId);
  const existingProfileIds = members.map((m) => m.profileId);

  const getRoleConfig = (role) => {
    return (
      MEMBERSHIP_ROLES.find((r) => r.value === role) || MEMBERSHIP_ROLES[2]
    );
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lista de Miembros */}
        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          {/* Header */}
          <div className="border-b border-(--border) p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand)/10">
                  <Users className="text-(--brand)" size={16} />
                </div>
                <h3 className="font-semibold">Miembros</h3>
                <Badge variant="primary" size="sm">
                  {members.length}
                </Badge>
              </div>
              {canManageMembers && (
                <Button size="sm" onClick={() => setShowAddModal(true)}>
                  <UserPlus size={14} />
                  <span className="hidden sm:inline">Agregar</span>
                </Button>
              )}
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
                size={16}
              />
              <Input
                placeholder="Buscar miembro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-125 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Users}
                  title="Sin miembros"
                  description={
                    searchTerm
                      ? `No hay resultados para "${searchTerm}"`
                      : "Agrega miembros al grupo"
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
                {filteredMembers.map((member) => {
                  const profile = member.profile || {};
                  const config = getRoleConfig(member.role);
                  const RoleIcon = config.icon;
                  const isSelected = selectedMemberId === member.$id;

                  return (
                    <motion.div
                      key={member.$id}
                      variants={itemVariants}
                      onClick={() => setSelectedMemberId(member.$id)}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-(--brand)/5 border-l-2 border-l-(--brand)"
                          : "hover:bg-(--muted)/50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-full bg-(--muted) flex items-center justify-center overflow-hidden">
                          {profile.avatarFileId ? (
                            <img
                              src={`${env.endpoint}/storage/buckets/${env.bucketAvatarsId}/files/${profile.avatarFileId}/preview?width=80&height=80`}
                              alt={profile.firstName}
                              className="h-10 w-10 object-cover"
                            />
                          ) : (
                            <User size={18} className="text-(--muted-fg)" />
                          )}
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full ${config.bgColor}`}
                        >
                          <RoleIcon size={10} className={config.color} />
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-sm">
                            {profile.firstName} {profile.lastName}
                          </span>
                        </div>
                        <p className="text-xs text-(--muted-fg) truncate">
                          {profile.email}
                        </p>
                      </div>

                      {/* Badge de rol */}
                      <Badge variant={config.badge} size="sm">
                        {config.label}
                      </Badge>

                      {isSelected && (
                        <ChevronRight size={16} className="text-(--brand)" />
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </Card>

        {/* Panel de Detalles y Roles */}
        <Card padding="none" className="lg:col-span-3 overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedMember ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full items-center justify-center p-8"
              >
                <EmptyState
                  icon={User}
                  title="Selecciona un miembro"
                  description="Haz clic en un miembro para ver y gestionar sus roles"
                />
              </motion.div>
            ) : (
              <motion.div
                key={selectedMember.$id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header del miembro */}
                <div className="border-b border-(--border) p-6 bg-linear-to-r from-(--brand)/5 to-transparent">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-xl bg-(--muted) flex items-center justify-center overflow-hidden shadow-md">
                      {selectedMember.profile?.avatarFileId ? (
                        <img
                          src={`${env.endpoint}/storage/buckets/${env.bucketAvatarsId}/files/${selectedMember.profile.avatarFileId}/preview?width=128&height=128`}
                          alt={selectedMember.profile?.firstName}
                          className="h-16 w-16 object-cover"
                        />
                      ) : (
                        <User size={28} className="text-(--muted-fg)" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold truncate">
                        {selectedMember.profile?.firstName}{" "}
                        {selectedMember.profile?.lastName}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-(--muted-fg)">
                        <span className="flex items-center gap-1">
                          <Mail size={14} />
                          {selectedMember.profile?.email}
                        </span>
                        {selectedMember.profile?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {selectedMember.profile.phone}
                          </span>
                        )}
                      </div>
                      {selectedMember.joinedAt && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-(--muted-fg)">
                          <Calendar size={12} />
                          Miembro desde{" "}
                          {new Date(selectedMember.joinedAt).toLocaleDateString(
                            "es-MX",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </div>

                    {/* Botón eliminar */}
                    {canManageMembers && selectedMember.role !== "OWNER" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setMemberToRemove(selectedMember)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-6">
                  {/* Nivel de membresía */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <ShieldCheck size={14} className="text-(--brand)" />
                      Nivel de membresía
                    </label>
                    <Select
                      value={selectedMember.role}
                      onChange={(e) =>
                        handleRoleChange(selectedMember.$id, e.target.value)
                      }
                      disabled={
                        !canManageMembers ||
                        selectedMember.role === "OWNER" ||
                        !isGroupOwner
                      }
                    >
                      {MEMBERSHIP_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-2 text-xs text-(--muted-fg)">
                      {selectedMember.role === "OWNER" &&
                        "El propietario tiene acceso completo al grupo"}
                      {selectedMember.role === "ADMIN" &&
                        "Los administradores pueden gestionar miembros y configuraciones"}
                      {selectedMember.role === "MEMBER" &&
                        "Los miembros pueden acceder según sus roles asignados"}
                      {selectedMember.role === "VIEWER" &&
                        "Los visores tienen acceso de solo lectura"}
                    </p>
                  </div>

                  {/* Roles RBAC */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Shield size={14} className="text-(--brand)" />
                      Roles de permisos
                    </label>

                    {isLoadingMemberRoles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-(--brand) border-t-transparent" />
                      </div>
                    ) : rbacRoles.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-(--border) p-4 text-center">
                        <p className="text-sm text-(--muted-fg)">
                          No hay roles definidos en este grupo.
                        </p>
                        <p className="text-xs text-(--muted-fg) mt-1">
                          Crea roles en la pestaña "Roles & Permisos"
                        </p>
                      </div>
                    ) : (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid gap-2 sm:grid-cols-2"
                      >
                        {rbacRoles.map((role) => {
                          const isAssigned = memberRoleIds.includes(role.$id);

                          return (
                            <motion.label
                              key={role.$id}
                              variants={itemVariants}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                                isAssigned
                                  ? "border-(--brand) bg-(--brand)/5 shadow-sm"
                                  : "border-(--border) hover:bg-(--muted)/50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() => handleRbacRoleToggle(role.$id)}
                                disabled={!canManageMembers}
                                className="h-4 w-4 rounded border-(--border) text-(--brand) focus:ring-(--brand)"
                              />
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
                            </motion.label>
                          );
                        })}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Modal para agregar miembro */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUserForAdd(null);
        }}
        size="md"
        header={
          <ModalHeader
            icon={UserPlus}
            title="Agregar Miembro"
            subtitle="Busca un usuario y asígnale un rol en el grupo"
          />
        }
        footer={
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setSelectedUserForAdd(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() =>
                addMemberMutation.mutate({
                  profileId: selectedUserForAdd?.$id,
                  role: newRole,
                })
              }
              loading={addMemberMutation.isPending}
              disabled={!selectedUserForAdd}
            >
              <UserPlus size={16} />
              Agregar Miembro
            </Button>
          </ModalFooter>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Buscar usuario
            </label>
            <UserSearch
              onSelect={setSelectedUserForAdd}
              excludeIds={existingProfileIds}
              placeholder="Buscar por nombre o email..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Rol inicial
            </label>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              {MEMBERSHIP_ROLES.filter((r) => r.value !== "OWNER").map(
                (role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                )
              )}
            </Select>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => removeMemberMutation.mutate(memberToRemove.$id)}
        title="Eliminar miembro"
        description={`¿Estás seguro de que deseas eliminar a ${memberToRemove?.profile?.firstName} ${memberToRemove?.profile?.lastName} del grupo? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={removeMemberMutation.isPending}
      />
    </>
  );
}
