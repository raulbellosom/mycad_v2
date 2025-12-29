import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Car,
  UserCheck,
  FileText,
  Wrench,
  Calendar,
  ChevronRight,
  Sun,
  Clock,
  Building2,
  ArrowRight,
  Users,
  FolderKanban,
} from "lucide-react";

import { Card } from "../../../shared/ui/Card";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/**
 * SimpleDashboard - Dashboard básico para usuarios sin permisos de dashboard completo
 * Muestra accesos directos basados en los permisos que sí tiene el usuario
 */
export function SimpleDashboard() {
  const { profile } = useAuth();
  const { activeGroup } = useActiveGroup();
  const { can } = usePermissions();

  // Get current time greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  // Get current date formatted
  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  // Build quick links based on available permissions
  const quickLinks = useMemo(() => {
    const links = [];

    if (can(SYSTEM_PERMISSIONS.VEHICLES_VIEW)) {
      links.push({
        to: "/vehicles",
        label: "Vehículos",
        description: "Ver y gestionar la flota",
        icon: Car,
        color: "bg-blue-500",
      });
    }

    if (can(SYSTEM_PERMISSIONS.DRIVERS_VIEW)) {
      links.push({
        to: "/drivers",
        label: "Conductores",
        description: "Gestionar conductores",
        icon: UserCheck,
        color: "bg-emerald-500",
      });
    }

    if (can(SYSTEM_PERMISSIONS.REPORTS_VIEW)) {
      links.push({
        to: "/reports",
        label: "Reportes",
        description: "Servicios y reparaciones",
        icon: FileText,
        color: "bg-violet-500",
      });
    }

    if (can(SYSTEM_PERMISSIONS.SERVICES_VIEW)) {
      links.push({
        to: "/reports?tab=services",
        label: "Servicios",
        description: "Historial de mantenimiento",
        icon: Wrench,
        color: "bg-amber-500",
      });
    }

    if (can(SYSTEM_PERMISSIONS.CLIENTS_VIEW)) {
      links.push({
        to: "/clients",
        label: "Clientes",
        description: "Gestionar clientes",
        icon: Users,
        color: "bg-pink-500",
      });
    }

    if (can(SYSTEM_PERMISSIONS.CATALOGS_VIEW)) {
      links.push({
        to: "/catalogs",
        label: "Catálogos",
        description: "Tipos, marcas, modelos",
        icon: FolderKanban,
        color: "bg-cyan-500",
      });
    }

    return links;
  }, [can]);

  // Quick actions based on permissions
  const quickActions = useMemo(() => {
    const actions = [];

    if (can(SYSTEM_PERMISSIONS.VEHICLES_CREATE)) {
      actions.push({
        to: "/vehicles/new",
        label: "Registrar vehículo",
        icon: Car,
      });
    }

    if (can(SYSTEM_PERMISSIONS.SERVICES_CREATE)) {
      actions.push({
        to: "/reports/service/new",
        label: "Nuevo servicio",
        icon: Wrench,
      });
    }

    if (can(SYSTEM_PERMISSIONS.REPAIRS_CREATE)) {
      actions.push({
        to: "/reports/repair/new",
        label: "Reportar reparación",
        icon: FileText,
      });
    }

    if (can(SYSTEM_PERMISSIONS.DRIVERS_CREATE)) {
      actions.push({
        to: "/drivers/new",
        label: "Agregar conductor",
        icon: UserCheck,
      });
    }

    return actions.slice(0, 4); // Max 4 actions
  }, [can]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="relative p-6 sm:p-8">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-linear-to-br from-(--brand)/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-(--brand)/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2 text-(--muted-fg) mb-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-sm capitalize">{currentDate}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-(--fg) mb-1">
                {greeting}, {profile?.firstName || "Usuario"}
              </h1>

              <p className="text-(--muted-fg)">
                Bienvenido a{" "}
                <span className="font-medium text-(--fg)">
                  {activeGroup?.name || "MyCAD"}
                </span>
              </p>

              {/* Group info badge */}
              {activeGroup && (
                <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-(--muted)/30 rounded-lg w-fit">
                  <Building2 className="h-4 w-4 text-(--brand)" />
                  <span className="text-sm font-medium">
                    {activeGroup.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Links Grid */}
      {quickLinks.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4 text-(--fg)">
            Accesos Rápidos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.to}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={link.to}>
                  <Card className="p-4 hover:shadow-lg transition-all cursor-pointer group border-transparent hover:border-(--brand)/30">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${link.color} text-white shadow-lg`}
                      >
                        <link.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-(--fg) group-hover:text-(--brand) transition-colors">
                          {link.label}
                        </h3>
                        <p className="text-sm text-(--muted-fg) truncate">
                          {link.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-(--muted-fg) group-hover:text-(--brand) group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4 text-(--fg)">
            Acciones Rápidas
          </h2>
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-3 p-3 rounded-xl bg-(--muted)/30 hover:bg-(--brand)/10 transition-colors group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand)/10 text-(--brand) group-hover:bg-(--brand) group-hover:text-white transition-colors">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm text-(--fg) group-hover:text-(--brand) transition-colors">
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 ml-auto text-(--muted-fg) group-hover:text-(--brand) opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Info section */}
      <motion.div variants={itemVariants}>
        <Card className="p-4 bg-linear-to-r from-(--muted)/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-(--fg)">
                ¿Necesitas más acceso?
              </h3>
              <p className="text-sm text-(--muted-fg)">
                Contacta al administrador del grupo para solicitar permisos
                adicionales.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Empty state if no permissions at all */}
      {quickLinks.length === 0 && quickActions.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-(--fg) mb-2">
              Sin módulos disponibles
            </h3>
            <p className="text-(--muted-fg) max-w-md mx-auto">
              Aún no tienes permisos asignados para acceder a los módulos del
              sistema. Contacta al administrador de tu grupo para que te asigne
              un rol.
            </p>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
