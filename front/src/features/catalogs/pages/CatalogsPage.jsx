import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Card } from "../../../shared/ui/Card";
import { Tabs } from "../../../shared/ui/Tabs";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { listCatalog } from "../services/catalogs.service";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";

const TABS = [
  { id: "brands", label: "Marcas" },
  { id: "models", label: "Modelos" },
  { id: "types", label: "Tipos de Vehículo" },
];

export function CatalogsPage() {
  const [activeTab, setActiveTab] = useState("brands");

  const { data: items, isLoading } = useQuery({
    queryKey: ["catalogs", activeTab],
    queryFn: () => listCatalog(activeTab),
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Catálogos"
        subtitle="Gestión global de metadatos de vehículos."
      />

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <Card>
        {isLoading ? (
          <div className="p-12 text-center text-sm text-neutral-500">
            Cargando...
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState title="Catálogo vacío" />
        ) : (
          <div className="divide-y divide-(--border)">
            {items.map((item) => (
              <div
                key={item.$id}
                className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-neutral-400">
                  $id: {item.$id}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
