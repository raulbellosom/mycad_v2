import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ServiceReportView } from "../components/service/ServiceReportView";
import {
  useServiceReport,
  useReopenServiceReport,
  useServiceReportParts,
  useServiceReportFiles,
} from "../hooks/useServiceReports";
import { useVehicle } from "../../vehicles/hooks/useVehicle";
import { useAuth } from "../../auth/hooks/useAuth";
import toast from "react-hot-toast";
import { REPORT_STATUS } from "../constants/report.constants";

/**
 * Página para ver un reporte de servicio
 */
export function ServiceReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Queries
  const {
    data: report,
    isLoading: isLoadingReport,
    error,
  } = useServiceReport(id);
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(
    report?.vehicleId
  );
  const { data: partsData } = useServiceReportParts(id);
  const { data: filesData } = useServiceReportFiles(id);

  // Mutations
  const reopenMutation = useReopenServiceReport();

  const parts = partsData?.documents || [];
  const files = filesData?.documents || [];

  const handleEdit = () => {
    navigate(`/reports/service/${id}/edit`);
  };

  const handleReopen = async () => {
    try {
      await reopenMutation.mutateAsync({
        reportId: id,
        profileId: profile?.$id,
      });
      toast.success("Reporte reabierto exitosamente");
    } catch (error) {
      toast.error("Error al reabrir el reporte: " + error.message);
    }
  };

  const handleDownloadPdf = () => {
    // TODO: Implementar descarga de PDF
    toast.info("Función de PDF en desarrollo");
  };

  if (isLoadingReport) {
    return <LoadingScreen message="Cargando reporte..." />;
  }

  if (error || !report) {
    return (
      <PageLayout title="Error">
        <EmptyState
          title="Reporte no encontrado"
          description="El reporte que buscas no existe o no tienes permisos para verlo."
          action={
            <Button onClick={() => navigate("/reports")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Reportes
            </Button>
          }
        />
      </PageLayout>
    );
  }

  const isFinalized = report.status === REPORT_STATUS.FINALIZED;

  // Permisos (simplificado - en producción usar RBAC completo)
  const canEdit = !isFinalized;
  const canReopen = isFinalized && profile?.role === "admin";

  return (
    <PageLayout
      title="Reporte de Servicio"
      subtitle={report.title}
      actions={
        <Button variant="ghost" onClick={() => navigate("/reports")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto">
        <ServiceReportView
          report={report}
          vehicle={vehicle}
          parts={parts}
          files={files}
          onEdit={handleEdit}
          onReopen={handleReopen}
          onDownloadPdf={handleDownloadPdf}
          canEdit={canEdit}
          canReopen={canReopen}
          isLoading={reopenMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
