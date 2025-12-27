import { LogOut } from "lucide-react";
import { ThemeToggle } from "../../../shared/theme/ThemeToggle";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useActiveGroup } from "../../../features/groups/hooks/useActiveGroup";

export function AppTopbar() {
  const { logout } = useAuth();
  const { groups, activeGroupId, setActiveGroupId } = useActiveGroup();

  return (
    <header className="sticky top-0 z-40 border-b border-(--border) bg-(--card)/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="text-sm font-semibold">Panel</div>

          <div className="w-[240px]">
            <Select
              value={activeGroupId || ""}
              onChange={(v) => setActiveGroupId(v || null)}
              placeholder="Selecciona un grupo"
              options={(groups || []).map((g) => ({
                value: g.teamId,
                label: g.name,
              }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={logout}
            className="px-3"
            title="Salir"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
