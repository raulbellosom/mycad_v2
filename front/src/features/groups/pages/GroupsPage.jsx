import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Card } from "../../../shared/ui/Card";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { useActiveGroup } from "../hooks/useActiveGroup";

export function GroupsPage() {
  const { groups, activeGroupId } = useActiveGroup();

  return (
    <div>
      <SectionHeader
        title="Grupos"
        subtitle="Teams + metadata (colección groups)."
      />
      <Card>
        {!groups || groups.length === 0 ? (
          <EmptyState
            title="Aún no tienes grupos"
            description="Asigna el usuario a un Team y crea su doc 'groups'."
          />
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <div
                key={g.$id}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{g.name}</div>
                  <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    teamId: {g.teamId}
                  </div>
                </div>
                <div className="text-xs font-semibold text-brand">
                  {activeGroupId === g.teamId ? "Activo" : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
