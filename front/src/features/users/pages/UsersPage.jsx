import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Filter,
  RefreshCw,
  Crown,
} from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";

import { UsersList } from "../components/UsersList";
import { UserDetail } from "../components/UserDetail";
import { CreateUserModal } from "../components/CreateUserModal";
import {
  listAllUsers,
  getUserStats,
  listGroupUsers,
  getGroupUserStats,
} from "../services/usersAdmin.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";

// Filter options
const STATUS_FILTERS = [
  { value: "", label: "Todos los estados" },
  { value: "ACTIVE", label: "Activos" },
  { value: "SUSPENDED", label: "Suspendidos" },
  { value: "DELETED", label: "Eliminados" },
];

export function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Obtener grupo activo para crear conductores
  const { activeGroupId, activeGroup } = useActiveGroup();
  const { can, isPlatformAdmin, isGroupOwner, isGroupAdmin } = usePermissions();

  // Permisos
  const canCreate = can(SYSTEM_PERMISSIONS.USERS_CREATE);

  // Determinar el modo de vista:
  // - isPlatformAdmin: Ve TODOS los usuarios del sistema
  // - isGroupOwner/isGroupAdmin: Ve solo usuarios de su grupo
  const showAllUsers = isPlatformAdmin;

  // Query: Lista de usuarios (contextual)
  const {
    data: users = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: showAllUsers
      ? ["users", "all", statusFilter]
      : ["users", "group", activeGroupId, statusFilter],
    queryFn: () =>
      showAllUsers
        ? listAllUsers({ status: statusFilter || undefined })
        : listGroupUsers(activeGroupId, { status: statusFilter || undefined }),
    enabled: showAllUsers || !!activeGroupId,
  });

  // Query: Estadísticas (contextual)
  const { data: stats } = useQuery({
    queryKey: showAllUsers
      ? ["user-stats", "all"]
      : ["user-stats", "group", activeGroupId],
    queryFn: () =>
      showAllUsers ? getUserStats() : getGroupUserStats(activeGroupId),
    enabled: showAllUsers || !!activeGroupId,
  });

  const selectedUser = users.find((u) => u.$id === selectedUserId);

  // Stats cards config - Contextual según el modo
  const statsCards = showAllUsers
    ? [
        {
          label: "Total usuarios",
          value: stats?.total || 0,
          icon: Users,
          color: "text-blue-500",
          bg: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
          label: "Activos",
          value: stats?.active || 0,
          icon: UserCheck,
          color: "text-green-500",
          bg: "bg-green-100 dark:bg-green-900/20",
        },
        {
          label: "Suspendidos",
          value: stats?.suspended || 0,
          icon: UserX,
          color: "text-amber-500",
          bg: "bg-amber-100 dark:bg-amber-900/20",
        },
        {
          label: "Admins plataforma",
          value: stats?.platformAdmins || 0,
          icon: Shield,
          color: "text-purple-500",
          bg: "bg-purple-100 dark:bg-purple-900/20",
        },
      ]
    : [
        {
          label: "Miembros del grupo",
          value: stats?.total || 0,
          icon: Users,
          color: "text-blue-500",
          bg: "bg-blue-100 dark:bg-blue-900/20",
        },
        {
          label: "Activos",
          value: stats?.active || 0,
          icon: UserCheck,
          color: "text-green-500",
          bg: "bg-green-100 dark:bg-green-900/20",
        },
        {
          label: "Suspendidos",
          value: stats?.suspended || 0,
          icon: UserX,
          color: "text-amber-500",
          bg: "bg-amber-100 dark:bg-amber-900/20",
        },
        {
          label: "Admins del grupo",
          value: stats?.admins || 0,
          icon: Crown,
          color: "text-purple-500",
          bg: "bg-purple-100 dark:bg-purple-900/20",
        },
      ];

  if (isLoading) {
    return <LoadingScreen label="Cargando usuarios..." />;
  }

  // Títulos contextuales
  const pageTitle = showAllUsers ? "Gestión de Usuarios" : "Usuarios del Grupo";
  const pageSubtitle = showAllUsers
    ? "Administra todos los usuarios del sistema"
    : `Administra los miembros de ${activeGroup?.name || "tu grupo"}`;

  return (
    <PageLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              size={14}
              className={isRefetching ? "animate-spin" : ""}
            />
            Actualizar
          </Button>
          {canCreate && (
            <Button onClick={() => setShowCreateModal(true)}>
              <UserPlus size={16} />
              Nuevo usuario
            </Button>
          )}
        </div>
      }
    >
      {/* Banner contextual */}
      {showAllUsers && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
        >
          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Shield
              size={16}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Vista de Administrador de Plataforma
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Estás viendo todos los usuarios registrados en el sistema
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}
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
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm text-(--muted-fg)">
            <Filter size={16} />
            <span>Filtros:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={STATUS_FILTERS}
              className="w-48"
            />
          </div>
          {statusFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("")}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Main content: Lista + Detalle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Lista de usuarios */}
        <div className="lg:col-span-2 min-w-0">
          <UsersList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isLoading={isLoading}
            showMembershipRole={!showAllUsers}
          />
        </div>

        {/* Detalle del usuario */}
        <div className="lg:col-span-3 min-w-0">
          <UserDetail
            user={selectedUser}
            onClose={() => setSelectedUserId(null)}
            showMembershipRole={!showAllUsers}
          />
        </div>
      </div>

      {/* Modal crear usuario */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultGroupId={activeGroupId}
      />
    </PageLayout>
  );
}
