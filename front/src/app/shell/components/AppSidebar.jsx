import { NavLink } from "react-router-dom";
import { cn } from "../../../shared/utils/cn";
import { AppLogo } from "../../../shared/ui/AppLogo";
import { nav } from "./nav";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useActiveGroup } from "../../../features/groups/hooks/useActiveGroup";

export function AppSidebar() {
  const { profile } = useAuth();
  const { activeGroup } = useActiveGroup();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[270px] shrink-0 border-r border-(--sidebar-border) bg-(--sidebar-bg) lg:block">
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center gap-2">
          <AppLogo />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">MyCAD Admin</div>
            <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {activeGroup?.name || "Sin grupo activo"}
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-(--sidebar-fg) hover:bg-(--sidebar-active) hover:text-(--sidebar-active-fg) transition-all",
                  isActive &&
                    "bg-(--sidebar-active) text-(--sidebar-active-fg) shadow-sm"
                )
              }
            >
              <item.icon size={18} className="opacity-80" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 rounded-2xl border border-(--sidebar-border) p-3">
          <div className="truncate text-sm font-semibold">
            {profile ? `${profile.firstName} ${profile.lastName}` : "—"}
          </div>
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {profile?.email || "—"}
          </div>
        </div>
      </div>
    </aside>
  );
}
