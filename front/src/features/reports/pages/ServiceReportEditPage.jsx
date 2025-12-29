import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Car } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ServiceReportForm } from "../components/service/ServiceReportForm";
import {
  useServiceReport,
  useUpdateServiceReport,
  useFinalizeServiceReport,
  useServiceReportParts,
  useServiceReportFiles,
} from "../hooks/useServiceReports";
import { listVehicles } from "../../vehicles/services/vehicles.service";
import {
  listVehicleTypes,
  listVehicleBrands,
  listVehicleModels,
} from "../../catalogs/services/catalogs.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import toast from "react-hot-toast";
import { REPORT_STATUS } from "../constants/report.constants";

/**
 * Página para editar un reporte de servicio existente
 */
export function ServiceReportEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeGroupId } = useActiveGroup();

  // Queries
  const {
    data: report,
    isLoading: isLoadingReport,
    error,
  } = useServiceReport(id);
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });
  const { data: partsData } = useServiceReportParts(id);
  const { data: filesData } = useServiceReportFiles(id);

  // Queries - Catalogs for VehicleCombobox
  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ["vehicleTypes", activeGroupId],
    queryFn: () => listVehicleTypes(activeGroupId),
    enabled: !!activeGroupId,
  });

  const { data: vehicleBrands = [] } = useQuery({
    queryKey: ["vehicleBrands", activeGroupId],
    queryFn: () => listVehicleBrands(activeGroupId),
    enabled: !!activeGroupId,
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ["vehicleModels", activeGroupId],
    queryFn: () => listVehicleModels(activeGroupId, null),
    enabled: !!activeGroupId,
  });

  // Mutations
  const updateMutation = useUpdateServiceReport();
  const finalizeMutation = useFinalizeServiceReport();

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
      navigate(`/reports/service/${id}`);
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
        },
      });
      await finalizeMutation.mutateAsync({
        reportId: id,
        profileId: profile?.$id,
      });
      toast.success("Reporte finalizado exitosamente");
      navigate(`/reports/service/${id}`);
    } catch (error) {
      toast.error("Error al finalizar el reporte: " + error.message);
    }
  };

  const handleCancel = () => {
    navigate(`/reports/service/${id}`);
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
  const isFinalized = report.status === REPORT_STATUS.FINALIZED;

  if (isFinalized) {
    return (
      <PageLayout title="Reporte Finalizado">
        <EmptyState
          title="Reporte finalizado"
          description="Este reporte ha sido finalizado y no puede ser editado."
          action={
            <Button onClick={() => navigate(`/reports/service/${id}`)}>
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
      title="Editar Reporte de Servicio"
      subtitle={report.title}
      actions={
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <ServiceReportForm
          initialData={{
            ...report,
            parts,
          }}
          vehicles={vehiclesList}
          types={vehicleTypes}
          brands={vehicleBrands}
          models={vehicleModels}
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
