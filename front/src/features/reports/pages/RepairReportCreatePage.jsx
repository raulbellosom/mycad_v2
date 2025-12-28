import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Hammer, Car } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { RepairReportForm } from "../components/repair/RepairReportForm";
import {
  useCreateRepairReport,
  useFinalizeRepairReport,
} from "../hooks/useRepairReports";
import { listVehicles } from "../../vehicles/services/vehicles.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import toast from "react-hot-toast";
import { REPAIR_STATUS } from "../constants/report.constants";

/**
 * Página para crear un nuevo reporte de reparación
 */
export function RepairReportCreatePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeGroupId } = useActiveGroup();

  // Queries
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });

  // Mutations
  const createMutation = useCreateRepairReport();
  const finalizeMutation = useFinalizeRepairReport();

  const vehiclesList = vehicles || [];

  // Si no hay grupo seleccionado
  if (!activeGroupId) {
    return (
      <PageLayout title="Nuevo Reporte de Reparación">
        <EmptyState
          icon={Car}
          title="Selecciona un grupo"
          description="Para crear un reporte, primero debes seleccionar un grupo en el menú superior."
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

  const handleSubmit = async (data) => {
    try {
      const result = await createMutation.mutateAsync({
        ...data,
        groupId: activeGroupId,
        createdByProfileId: profile?.$id,
      });
      toast.success("Reporte de reparación creado exitosamente");
      navigate(`/reports/repair/${result.$id}`);
    } catch (error) {
      toast.error("Error al crear el reporte: " + error.message);
    }
  };

  const handleFinalize = async (data) => {
    try {
      const result = await createMutation.mutateAsync({
        ...data,
        groupId: activeGroupId,
        status: REPAIR_STATUS.DONE,
        createdByProfileId: profile?.$id,
      });
      await finalizeMutation.mutateAsync({
        reportId: result.$id,
        profileId: profile?.$id,
      });
      toast.success("Reporte creado y finalizado exitosamente");
      navigate(`/reports/repair/${result.$id}`);
    } catch (error) {
      toast.error("Error al crear el reporte: " + error.message);
    }
  };

  const handleCancel = () => {
    navigate("/reports");
  };

  if (isLoadingVehicles) {
    return <LoadingScreen message="Cargando datos..." />;
  }

  return (
    <PageLayout
      title="Nuevo Reporte de Reparación"
      subtitle="Registra una reparación o arreglo realizado a un vehículo"
      actions={
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <RepairReportForm
          vehicles={vehiclesList}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onFinalize={handleFinalize}
          isLoading={createMutation.isPending || finalizeMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
