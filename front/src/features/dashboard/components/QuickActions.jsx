import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import {
  Car,
  Users,
  UserCheck,
  Wrench,
  AlertTriangle,
  FileText,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";

/**
 * QuickAction - Botón de acción rápida para el dashboard
 */
export function QuickAction({
  icon: Icon,
  label,
  description,
  to,
  onClick,
  variant = "default",
}) {
  const variants = {
    default: {
      bg: "bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800",
      icon: "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300",
    },
    primary: {
      bg: "bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50",
      icon: "bg-orange-500 text-white",
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
      icon: "bg-emerald-500 text-white",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50",
      icon: "bg-amber-500 text-white",
    },
  };

  const style = variants[variant] || variants.default;

  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(
        clsx(
          "flex items-center gap-4 rounded-xl p-4 transition-colors cursor-pointer",
          style.bg
        )
      )}
    >
      <div
        className={twMerge(
          clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            style.icon
          )
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-900 dark:text-white">
          {label}
        </p>
        {description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
            {description}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-stone-400 dark:text-stone-500" />
    </motion.div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

/**
 * QuickActionsGrid - Grid de acciones rápidas
 */
export function QuickActionsGrid({ children }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-4">
        Acciones Rápidas
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

/**
 * DefaultQuickActions - Acciones rápidas predeterminadas
 */
export function DefaultQuickActions() {
  return (
    <QuickActionsGrid>
      <QuickAction
        icon={Plus}
        label="Nuevo Vehículo"
        description="Agregar a la flota"
        to="/vehicles/new"
        variant="primary"
      />
      <QuickAction
        icon={UserCheck}
        label="Nuevo Conductor"
        description="Registrar conductor"
        to="/drivers/new"
        variant="success"
      />
      <QuickAction
        icon={Wrench}
        label="Reporte de Servicio"
        description="Crear nuevo reporte"
        to="/reports/service/new"
        variant="default"
      />
      <QuickAction
        icon={AlertTriangle}
        label="Reporte de Reparación"
        description="Reportar daño o falla"
        to="/reports/repair/new"
        variant="warning"
      />
    </QuickActionsGrid>
  );
}

/**
 * NavigationCard - Tarjeta de navegación a módulos
 */
export function NavigationCard({
  icon: Icon,
  title,
  description,
  count,
  to,
  color = "orange",
}) {
  const colors = {
    orange: "from-orange-500 to-orange-600",
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    violet: "from-violet-500 to-violet-600",
    pink: "from-pink-500 to-pink-600",
  };

  return (
    <Link to={to}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm"
      >
        {/* Gradient accent */}
        <div
          className={twMerge(
            clsx(
              "absolute inset-x-0 top-0 h-1 bg-linear-to-r",
              colors[color] || colors.orange
            )
          )}
        />

        <div className="p-5">
          <div className="flex items-start justify-between">
            <div
              className={twMerge(
                clsx(
                  "flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br text-white",
                  colors[color] || colors.orange
                )
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            {count !== undefined && (
              <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-xs font-bold text-stone-700 dark:text-stone-300">
                {count}
              </span>
            )}
          </div>

          <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {description}
          </p>

          <div className="mt-4 flex items-center text-sm font-medium text-orange-600 dark:text-orange-400">
            Ver módulo
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/**
 * ModulesOverview - Vista general de módulos principales
 */
export function ModulesOverview({ stats, loading = false }) {
  const modules = [
    {
      icon: Car,
      title: "Vehículos",
      description: "Gestiona tu flota de vehículos",
      count: loading ? "..." : stats?.vehicles?.total || 0,
      to: "/vehicles",
      color: "orange",
    },
    {
      icon: UserCheck,
      title: "Conductores",
      description: "Administra conductores",
      count: loading ? "..." : stats?.drivers?.total || 0,
      to: "/drivers",
      color: "blue",
    },
    {
      icon: Users,
      title: "Clientes",
      description: "Base de datos de clientes",
      count: loading ? "..." : stats?.clients?.total || 0,
      to: "/clients",
      color: "emerald",
    },
    {
      icon: FileText,
      title: "Reportes",
      description: "Servicios y reparaciones",
      count: loading
        ? "..."
        : (stats?.serviceReports?.total || 0) +
          (stats?.repairReports?.total || 0),
      to: "/reports",
      color: "amber",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {modules.map((module) => (
        <NavigationCard key={module.to} {...module} />
      ))}
    </div>
  );
}
