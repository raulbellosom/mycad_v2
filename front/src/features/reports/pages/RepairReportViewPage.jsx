import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { ResourceNotFound } from "../../../shared/ui/ResourceNotFound";
import { RepairReportView } from "../components/repair/RepairReportView";
import {
  useRepairReport,
  useReopenRepairReport,
  useRepairReportParts,
  useRepairReportFiles,
  useGenerateRepairReportPDF,
} from "../hooks/useRepairReports";
import { useVehicle } from "../../vehicles/hooks/useVehicle";
import { useAuth } from "../../auth/hooks/useAuth";
import { getRepairReportPDFUrl } from "../services/repair-reports.service";
import toast from "react-hot-toast";
import { REPAIR_STATUS } from "../constants/report.constants";

/**
 * Página para ver un reporte de reparación
 */
export function RepairReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Queries
  const {
    data: report,
    isLoading: isLoadingReport,
    error,
  } = useRepairReport(id);
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(
    report?.vehicleId
  );
  const { data: partsData } = useRepairReportParts(id);
  const { data: filesData } = useRepairReportFiles(id);

  // Mutations
  const reopenMutation = useReopenRepairReport();
  const generatePdfMutation = useGenerateRepairReportPDF();

  const parts = partsData || [];
  const files = filesData || [];

  const handleEdit = () => {
    navigate(`/reports/repair/${id}/edit`);
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
      const url = getRepairReportPDFUrl(report.reportFileId);
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
      const url = getRepairReportPDFUrl(result.fileId);
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

      const url = getRepairReportPDFUrl(result.fileId);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Error al regenerar el PDF: " + error.message);
    }
  };

  const isFinalized =
    report.status === REPAIR_STATUS.DONE && report.finalizedAt;

  // Permisos (simplificado - en producción usar RBAC completo)
  const canEdit = !isFinalized;
  const canReopen = isFinalized && profile?.role === "admin";

  return (
    <PageLayout
      title="Reporte de Reparación"
      subtitle={report.title}
      actions={
        <Button variant="ghost" onClick={() => navigate("/reports")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto">
        <RepairReportView
          report={report}
          vehicle={vehicle}
          parts={parts}
          files={files}
          createdBy={report.createdByProfile}
          finalizedBy={report.finalizedByProfile}
          onEdit={handleEdit}
          onReopen={handleReopen}
          onDownloadPdf={handleDownloadPdf}
          onRegeneratePdf={handleRegeneratePdf}
          canEdit={canEdit}
          canReopen={canReopen}
          isLoading={reopenMutation.isPending}
          isGeneratingPDF={generatePdfMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
