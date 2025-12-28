import { useState } from "react";

import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { TypesTab } from "../components/TypesTab";
import { BrandsTab } from "../components/BrandsTab";
import { ModelsTab } from "../components/ModelsTab";
import { ConditionsTab } from "../components/ConditionsTab";

const TABS = [
  { id: "types", label: "Tipos de Vehículo" },
  { id: "brands", label: "Marcas" },
  { id: "models", label: "Modelos" },
  { id: "conditions", label: "Condiciones" },
];
// Main Page Component
export function CatalogsPage() {
  const [activeTab, setActiveTab] = useState("types");
  const { activeGroupId } = useActiveGroup();

  if (!activeGroupId) {
    return (
      <div className="p-8">
        <SectionHeader
          title="Catálogos"
          subtitle="Gestiona los catálogos de tu grupo."
        />
        <EmptyState
          icon="folder"
          title="Selecciona un grupo"
          description="Para gestionar catálogos, primero selecciona un grupo activo."
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <SectionHeader
        title="Catálogos"
        subtitle="Gestiona los catálogos de tu grupo."
      />

      {/* Tab navigation */}
      <div className="mb-6 flex gap-2 border-b border-(--border)">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-(--muted-fg) hover:text-(--fg)"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "types" && <TypesTab groupId={activeGroupId} />}
      {activeTab === "brands" && <BrandsTab groupId={activeGroupId} />}
      {activeTab === "models" && <ModelsTab groupId={activeGroupId} />}
      {activeTab === "conditions" && <ConditionsTab groupId={activeGroupId} />}
    </div>
  );
}
