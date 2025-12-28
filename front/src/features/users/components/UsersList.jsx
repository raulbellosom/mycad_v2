import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Mail,
  Phone,
  ChevronRight,
  Crown,
  Shield,
  UserCheck,
  Clock,
} from "lucide-react";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Badge } from "../../../shared/ui/Badge";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { getAvatarUrl } from "../../../shared/utils/storage";

// Status config
const STATUS_CONFIG = {
  ACTIVE: {
    label: "Activo",
    variant: "success",
    icon: UserCheck,
  },
  SUSPENDED: {
    label: "Suspendido",
    variant: "warning",
    icon: Clock,
  },
  DELETED: {
    label: "Eliminado",
    variant: "danger",
    icon: User,
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function UsersList({
  users = [],
  selectedUserId,
  onSelectUser,
  searchTerm,
  onSearchChange,
  isLoading,
}) {
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase().trim();
    return (
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search)
    );
  });

  return (
    <Card padding="none" className="overflow-hidden h-full flex flex-col">
      {/* Header con búsqueda */}
      <div className="border-b border-(--border) p-4 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--brand)/10">
            <User className="text-(--brand)" size={16} />
          </div>
          <h3 className="font-semibold">Usuarios</h3>
          <Badge variant="primary" size="sm">
            {users.length}
          </Badge>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            size={16}
          />
          <Input
            placeholder="Buscar usuario..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={User}
              title="Sin usuarios"
              description={
                searchTerm
                  ? `No hay resultados para "${searchTerm}"`
                  : "No hay usuarios registrados"
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
            {filteredUsers.map((user) => {
              const statusConfig =
                STATUS_CONFIG[user.status] || STATUS_CONFIG.ACTIVE;
              const isSelected = selectedUserId === user.$id;

              return (
                <motion.div
                  key={user.$id}
                  variants={itemVariants}
                  onClick={() => onSelectUser(user.$id)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-(--brand)/5 border-l-2 border-l-(--brand)"
                      : "hover:bg-(--muted)/50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-(--muted) flex items-center justify-center overflow-hidden">
                      {user.avatarFileId ? (
                        <img
                          src={`${env.endpoint}/storage/buckets/${env.bucketAvatarsId}/files/${user.avatarFileId}/preview?width=80&height=80`}
                          alt={user.firstName}
                          className="h-10 w-10 object-cover"
                        />
                      ) : (
                        <User size={18} className="text-(--muted-fg)" />
                      )}
                    </div>
                    {/* Badge indicador */}
                    {user.isPlatformAdmin && (
                      <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Crown size={10} className="text-amber-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate text-sm">
                        {user.firstName} {user.lastName}
                      </span>
                      {user.isPlatformAdmin && (
                        <Badge variant="warning" size="sm">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-(--muted-fg) truncate flex items-center gap-1">
                      <Mail size={10} />
                      {user.email}
                    </p>
                  </div>

                  {/* Status badge */}
                  <Badge variant={statusConfig.variant} size="sm" dot>
                    {statusConfig.label}
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
  );
}
