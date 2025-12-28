import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Shield,
  Settings,
  ChevronRight,
  Plus,
} from "lucide-react";

import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { PageTransition } from "../../../shared/ui/PageTransition";
import { useActiveGroup } from "../hooks/useActiveGroup";
import { usePermissions } from "../hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../context/PermissionsProvider";
import { GroupInfoTab } from "../components/GroupInfoTab";
import { MembersTab } from "../components/MembersTab";
import { RolesTab } from "../components/RolesTab";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { getGroupLogoUrl } from "../../../shared/utils/storage";

const TABS = [
  {
    id: "info",
    label: "Información",
    icon: Building2,
    description: "Detalles y configuración del grupo",
  },
  {
    id: "members",
    label: "Miembros",
    icon: Users,
    description: "Gestiona los miembros del grupo",
  },
  {
    id: "roles",
    label: "Roles & Permisos",
    icon: Shield,
    description: "Configura roles y permisos",
  },
];

export function GroupsPage() {
  const [activeTab, setActiveTab] = useState("info");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    activeGroupId,
    activeGroup,
    groups,
    isLoadingGroups,
    setActiveGroupId,
  } = useActiveGroup();
  const { hasPermission, isGroupAdmin } = usePermissions();

  // Filtrar tabs basados en permisos
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "info") return true;
    if (tab.id === "members") {
      return (
        isGroupAdmin ||
        hasPermission(SYSTEM_PERMISSIONS.GROUPS_MEMBERS_VIEW) ||
        hasPermission(SYSTEM_PERMISSIONS.GROUPS_MEMBERS_MANAGE)
      );
    }
    if (tab.id === "roles") {
      return (
        isGroupAdmin ||
        hasPermission(SYSTEM_PERMISSIONS.GROUPS_ROLES_VIEW) ||
        hasPermission(SYSTEM_PERMISSIONS.GROUPS_ROLES_MANAGE)
      );
    }
    return true;
  });

  return (
    <PageTransition>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <SectionHeader
            title="Gestión de Grupos"
            subtitle={
              activeGroup
                ? `Administrando: ${activeGroup.name}`
                : "Selecciona un grupo para comenzar"
            }
          />
          <Button onClick={() => setShowCreateModal(true)} className="shrink-0">
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo grupo</span>
          </Button>
        </div>

        {/* Active group indicator */}
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-linear-to-r from-(--brand)/5 to-transparent border-(--brand)/20">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-(--card) border border-(--border) flex items-center justify-center overflow-hidden shadow-sm">
                  {activeGroup.logoFileId ? (
                    <img
                      src={getGroupLogoUrl(activeGroup.logoFileId, 96)}
                      alt={activeGroup.name}
                      className="h-12 w-12 object-cover"
                    />
                  ) : (
                    <Building2 size={24} className="text-(--brand)" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg truncate">
                      {activeGroup.name}
                    </h2>
                    <Badge
                      variant={activeGroup.enabled ? "success" : "danger"}
                      size="sm"
                      dot
                    >
                      {activeGroup.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-(--muted-fg) truncate">
                    {activeGroup.description || "Sin descripción"}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-sm text-(--muted-fg)">
                  <Users size={16} />
                  <span>{groups?.length || 0} grupos disponibles</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab navigation - Desktop */}
        <div className="hidden md:block mb-6">
          <div className="flex gap-2 p-1 bg-(--muted)/50 rounded-xl">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                    isActive
                      ? "text-(--brand)"
                      : "text-(--muted-fg) hover:text-(--fg)"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-(--card) rounded-lg shadow-sm border border-(--border)"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={16} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab navigation - Mobile */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-(--brand) text-white shadow-lg shadow-(--brand)/25"
                      : "bg-(--muted) text-(--muted-fg) hover:bg-(--muted)/80"
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "info" && <GroupInfoTab groupId={activeGroupId} />}

            {activeTab === "members" && (
              <>
                {!activeGroupId ? (
                  <Card className="p-8">
                    <EmptyState
                      icon={Users}
                      title="Selecciona un grupo"
                      description="Selecciona un grupo activo para gestionar sus miembros"
                    />
                  </Card>
                ) : (
                  <MembersTab groupId={activeGroupId} />
                )}
              </>
            )}

            {activeTab === "roles" && (
              <>
                {!activeGroupId ? (
                  <Card className="p-8">
                    <EmptyState
                      icon={Shield}
                      title="Selecciona un grupo"
                      description="Selecciona un grupo activo para gestionar roles y permisos"
                    />
                  </Card>
                ) : (
                  <RolesTab groupId={activeGroupId} />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Quick stats footer - when group is selected */}
        {activeGroup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 pt-6 border-t border-(--border)"
          >
            <div className="flex flex-wrap gap-4 justify-center text-xs text-(--muted-fg)">
              <span className="flex items-center gap-1">
                <Building2 size={12} />
                Team ID: <code className="ml-1">{activeGroup.teamId}</code>
              </span>
              <span className="flex items-center gap-1">
                <Settings size={12} />
                Creado:{" "}
                {new Date(activeGroup.$createdAt).toLocaleDateString("es-MX")}
              </span>
            </div>
          </motion.div>
        )}

        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </PageTransition>
  );
}
