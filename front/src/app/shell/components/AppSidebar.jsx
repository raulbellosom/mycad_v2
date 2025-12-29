import { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { X, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../shared/utils/cn";
import { AppLogo } from "../../../shared/ui/AppLogo";
import { Combobox } from "../../../shared/ui/Combobox";
import { nav } from "./nav";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useActiveGroup } from "../../../features/groups/hooks/useActiveGroup";
import { usePermissions } from "../../../features/groups/hooks/usePermissions";

export function AppSidebar({ mobileOpen, onMobileClose }) {
  const { profile } = useAuth();
  const { activeGroup, groups, activeGroupId, setActiveGroupId } =
    useActiveGroup();
  const permissions = usePermissions();

  // Extraer funciones del contexto con valores por defecto seguros
  const can = permissions?.can;
  const isPlatformAdmin =
    permissions?.isPlatformAdmin || profile?.isPlatformAdmin;

  // Filtrar elementos de navegación según permisos
  const filteredNav = useMemo(() => {
    return nav.filter((item) => {
      // Si no requiere permiso, siempre mostrar
      if (!item.requiredPermission) return true;

      // Platform admins ven todo
      if (isPlatformAdmin) return true;

      // Si no hay función can disponible (sin grupo activo), mostrar solo items sin permiso requerido
      if (typeof can !== "function") return false;

      // Verificar si el usuario tiene el permiso requerido
      return can(item.requiredPermission);
    });
  }, [can, isPlatformAdmin]);

  const sidebarContent = (showGroupSelector = false) => (
    <div className="flex h-full flex-col p-4">
      {/* Logo & Group Info */}
      <div className="mb-4 flex items-center gap-3">
        <AppLogo />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-(--fg)">
            MyCAD Admin
          </div>
          <div className="truncate text-xs text-(--muted-fg)">
            {activeGroup?.name || "Sin grupo activo"}
          </div>
        </div>
      </div>

      {/* Group Selector - Only shown in mobile sidebar */}
      {showGroupSelector && groups && groups.length > 0 && (
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-(--muted-fg)">
            <Building2 size={12} />
            Cambiar grupo
          </label>
          <Combobox
            value={activeGroupId || ""}
            onChange={(v) => setActiveGroupId(v || null)}
            placeholder="Selecciona un grupo"
            emptyText="No hay grupos disponibles"
            options={(groups || []).map((g) => ({
              value: g.$id,
              label: g.name,
            }))}
          />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col gap-1.5">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                "text-(--sidebar-fg) hover:text-(--sidebar-active-fg)",
                isActive
                  ? "bg-linear-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/30 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "hover:bg-(--muted)"
              )
            }
          >
            <item.icon
              size={20}
              className={cn(
                "transition-transform duration-200 group-hover:scale-110"
              )}
            />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile Card */}
      <div className="mt-4 rounded-2xl border border-(--border) bg-(--muted)/50 p-4 backdrop-blur-sm">
        <div className="truncate text-sm font-semibold text-(--fg)">
          {profile ? `${profile.firstName} ${profile.lastName}` : "—"}
        </div>
        <div className="truncate text-xs text-(--muted-fg)">
          {profile?.email || "—"}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 border-r border-(--sidebar-border) bg-(--sidebar-bg) lg:block">
        {sidebarContent(false)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />

            {/* Slide-out Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-(--sidebar-border) bg-(--sidebar-bg) shadow-2xl lg:hidden"
            >
              {/* Close Button */}
              <button
                onClick={onMobileClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-(--muted-fg) hover:bg-(--muted) hover:text-(--fg) transition-colors"
              >
                <X size={20} />
              </button>

              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
