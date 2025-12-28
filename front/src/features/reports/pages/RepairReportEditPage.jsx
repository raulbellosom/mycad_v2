import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Car } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { RepairReportForm } from "../components/repair/RepairReportForm";
import {
  useRepairReport,
  useUpdateRepairReport,
  useFinalizeRepairReport,
  useRepairReportParts,
  useRepairReportFiles,
} from "../hooks/useRepairReports";
import { listVehicles } from "../../vehicles/services/vehicles.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import toast from "react-hot-toast";
import { REPAIR_STATUS } from "../constants/report.constants";

/**
 * Página para editar un reporte de reparación existente
 */
export function RepairReportEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeGroupId } = useActiveGroup();

  // Queries
  const {
    data: report,
    isLoading: isLoadingReport,
    error,
  } = useRepairReport(id);
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });
  const { data: partsData } = useRepairReportParts(id);
  const { data: filesData } = useRepairReportFiles(id);

  // Mutations
  const updateMutation = useUpdateRepairReport();
  const finalizeMutation = useFinalizeRepairReport();

  const vehiclesList = vehicles || [];
  const parts = partsData?.documents || [];
  const files = filesData?.documents || [];

  const handleSubmit = async (data) => {
    try {
      await updateMutation.mutateAsync({
        reportId: id,
        data: {
          ...data,
        },
      });
      toast.success("Reporte actualizado exitosamente");
      navigate(`/reports/repair/${id}`);
    } catch (error) {
      toast.error("Error al actualizar el reporte: " + error.message);
    }
  };

  const handleFinalize = async (data) => {
    try {
      await updateMutation.mutateAsync({
        reportId: id,
        data: {
          ...data,
          status: REPAIR_STATUS.DONE,
        },
      });
      await finalizeMutation.mutateAsync({
        reportId: id,
        profileId: profile?.$id,
      });
      toast.success("Reporte finalizado exitosamente");
      navigate(`/reports/repair/${id}`);
    } catch (error) {
      toast.error("Error al finalizar el reporte: " + error.message);
    }
  };

  const handleCancel = () => {
    navigate(`/reports/repair/${id}`);
  };

  if (isLoadingReport || isLoadingVehicles) {
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

  // Verificar si el reporte está finalizado
  const isFinalized =
    report.status === REPAIR_STATUS.DONE && report.finalizedAt;

  if (isFinalized) {
    return (
      <PageLayout title="Reporte Finalizado">
        <EmptyState
          title="Reporte finalizado"
          description="Este reporte ha sido finalizado y no puede ser editado."
          action={
            <Button onClick={() => navigate(`/reports/repair/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ver Reporte
            </Button>
          }
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Editar Reporte de Reparación"
      subtitle={report.title}
      actions={
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <RepairReportForm
          initialData={{
            ...report,
            parts,
          }}
          vehicles={vehiclesList}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onFinalize={handleFinalize}
          isLoading={updateMutation.isPending || finalizeMutation.isPending}
          isEditing
        />
      </div>
    </PageLayout>
  );
}
