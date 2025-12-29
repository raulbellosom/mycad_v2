import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "../../../shared/theme/ThemeToggle";
import { Button } from "../../../shared/ui/Button";
import { Combobox } from "../../../shared/ui/Combobox";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useActiveGroup } from "../../../features/groups/hooks/useActiveGroup";
import { AppLogo } from "../../../shared/ui/AppLogo";
import { getAvatarUrl } from "../../../shared/utils/storage";
import { cn } from "../../../shared/utils/cn";

export function AppTopbar({ onMenuClick }) {
  const { profile, logout } = useAuth();
  const { groups, activeGroupId, setActiveGroupId } = useActiveGroup();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const avatarUrl = getAvatarUrl(profile?.avatarFileId, 40);

  return (
    <header className="sticky top-0 z-40 border-b border-(--border) glass-strong">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-(--fg) hover:bg-(--muted) transition-colors lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <AppLogo />
            <span className="text-sm font-semibold text-(--fg)">MyCAD</span>
          </div>

          {/* Group Selector */}
          <div className="hidden sm:block sm:w-[240px]">
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
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all",
                "hover:bg-(--muted)/50 active:scale-[0.98]",
                showUserMenu && "bg-(--muted)/50"
              )}
            >
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-(--border) bg-(--muted)">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-(--muted-fg)">
                    <User size={16} />
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-(--fg) truncate max-w-[120px]">
                  {profile?.firstName || "Usuario"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={cn(
                  "hidden md:block text-(--muted-fg) transition-transform",
                  showUserMenu && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-(--border) bg-(--card) shadow-xl"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-(--border)">
                    <p className="text-sm font-semibold text-(--fg) truncate">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                    <p className="text-xs text-(--muted-fg) truncate">
                      {profile?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
                    >
                      <User size={16} className="text-(--muted-fg)" />
                      Mi Perfil
                    </Link>
                    <Link
                      to="/groups"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
                    >
                      <Settings size={16} className="text-(--muted-fg)" />
                      Configuración
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="p-1.5 border-t border-(--border)">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
