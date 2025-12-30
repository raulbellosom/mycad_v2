import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { ResourceNotFound } from "../../../shared/ui/ResourceNotFound";
import { ServiceReportView } from "../components/service/ServiceReportView";
import {
  useServiceReport,
  useReopenServiceReport,
  useServiceReportParts,
  useServiceReportFiles,
  useGenerateServiceReportPDF,
} from "../hooks/useServiceReports";
import { useVehicle } from "../../vehicles/hooks/useVehicle";
import { useAuth } from "../../auth/hooks/useAuth";
import { getServiceReportPDFUrl } from "../services/service-reports.service";
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
  const generatePdfMutation = useGenerateServiceReportPDF();

  const parts = partsData || [];
  const files = filesData || [];

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

  const handleDownloadPdf = async () => {
    // Si ya tiene PDF, descargarlo
    if (report.reportFileId) {
      const url = getServiceReportPDFUrl(report.reportFileId);
      window.open(url, "_blank");
      return;
    }

    // Si no tiene PDF, generarlo
    try {
      const result = await generatePdfMutation.mutateAsync({
        reportId: id,
        regenerate: false,
      });

      // Descargar el PDF recién generado
      const url = getServiceReportPDFUrl(result.fileId);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Error al generar el PDF: " + error.message);
    }
  };

  const handleRegeneratePdf = async () => {
    try {
      const result = await generatePdfMutation.mutateAsync({
        reportId: id,
        regenerate: true,
      });

      const url = getServiceReportPDFUrl(result.fileId);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Error al regenerar el PDF: " + error.message);
    }
  };

  if (isLoadingReport) {
    return <LoadingScreen message="Cargando reporte..." />;
  }

  if (error || !report) {
    return (
      <PageLayout title="Error">
        <ResourceNotFound
          resourceType="reporte de servicio"
          resourceId={id}
          reason={
            error?.message?.includes("permission")
              ? "no-permission"
              : "not-found"
          }
          backPath="/reports"
          backLabel="Volver a Reportes"
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
          createdBy={report.createdByProfile}
          finalizedBy={report.finalizedByProfile}
          onEdit={handleEdit}
          onReopen={handleReopen}
          onDownloadPDF={handleDownloadPdf}
          onRegeneratePDF={handleRegeneratePdf}
          canEdit={canEdit}
          canReopen={canReopen}
          isLoading={reopenMutation.isPending}
          isGeneratingPDF={generatePdfMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
