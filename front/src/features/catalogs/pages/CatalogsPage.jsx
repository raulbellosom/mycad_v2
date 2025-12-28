import { useState } from "react";
import { Folder } from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Tabs } from "../../../shared/ui/Tabs";
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
      <PageLayout.Empty
        icon={Folder}
        title="Selecciona un grupo"
        description="Para gestionar catálogos, primero selecciona un grupo activo."
      />
    );
  }

  return (
    <PageLayout
      title="Catálogos"
      subtitle="Gestiona los catálogos de tu grupo."
    >
      {/* Tab navigation */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "types" && <TypesTab groupId={activeGroupId} />}
        {activeTab === "brands" && <BrandsTab groupId={activeGroupId} />}
        {activeTab === "models" && <ModelsTab groupId={activeGroupId} />}
        {activeTab === "conditions" && (
          <ConditionsTab groupId={activeGroupId} />
        )}
      </div>
    </PageLayout>
  );
}
