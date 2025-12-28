import { FileBarChart2 } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { EmptyState } from "../../../shared/ui/EmptyState";

export function ReportsPage() {
  return (
    <PageLayout title="Reportes" subtitle="Generación y descarga de informes.">
      <EmptyState
        title="Módulo de Reportes"
        description="Aquí podrás generar reportes PDF/Excel de mantenimientos, costos y uso de vehículos."
        icon={FileBarChart2}
      />
    </PageLayout>
  );
}
