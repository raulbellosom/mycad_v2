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
} from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";

import { UsersList } from "../components/UsersList";
import { UserDetail } from "../components/UserDetail";
import { CreateUserModal } from "../components/CreateUserModal";
import { listAllUsers, getUserStats } from "../services/usersAdmin.service";
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
  const { activeGroupId } = useActiveGroup();
  const { can } = usePermissions();

  // Permisos
  const canCreate = can(SYSTEM_PERMISSIONS.USERS_CREATE);

  // Query: Lista de usuarios
  const {
    data: users = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["users", statusFilter],
    queryFn: () =>
      listAllUsers({
        status: statusFilter || undefined,
      }),
  });

  // Query: Estadísticas
  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: getUserStats,
  });

  const selectedUser = users.find((u) => u.$id === selectedUserId);

  // Stats cards config
  const statsCards = [
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
  ];

  if (isLoading) {
    return <LoadingScreen label="Cargando usuarios..." />;
  }

  return (
    <PageLayout
      title="Gestión de Usuarios"
      subtitle="Administra los usuarios del sistema"
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
          />
        </div>

        {/* Detalle del usuario */}
        <div className="lg:col-span-3 min-w-0">
          <UserDetail
            user={selectedUser}
            onClose={() => setSelectedUserId(null)}
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
