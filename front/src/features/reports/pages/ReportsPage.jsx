import { FileBarChart2 } from "lucide-react";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { EmptyState } from "../../../shared/ui/EmptyState";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reportes"
        subtitle="Generación y descarga de informes."
      />
      <EmptyState
        title="Módulo de Reportes"
        description="Aquí podrás generar reportes PDF/Excel de mantenimientos, costos y uso de vehículos."
        icon={FileBarChart2}
      />
    </div>
  );
}
