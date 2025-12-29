import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Wrench, Car } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ServiceReportForm } from "../components/service/ServiceReportForm";
import {
  useCreateServiceReport,
  useFinalizeServiceReport,
  useUploadServiceReportFile,
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

/**
 * Página para crear un nuevo reporte de servicio
 */
export function ServiceReportCreatePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { activeGroupId } = useActiveGroup();

  // Queries - Vehicles
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });

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
  const createMutation = useCreateServiceReport();
  const finalizeMutation = useFinalizeServiceReport();
  const uploadFileMutation = useUploadServiceReportFile();

  const vehiclesList = vehicles || [];

  // Si no hay grupo seleccionado
  if (!activeGroupId) {
    return (
      <PageLayout title="Nuevo Reporte de Servicio">
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

  const handleSubmit = async (formData) => {
    try {
      // Separate stagedFiles from the report data
      const { stagedFiles, ...reportData } = formData;
      
      // 1. Create the report without files
      const result = await createMutation.mutateAsync({
        ...reportData,
        groupId: activeGroupId,
        createdByProfileId: profile?.$id,
      });
      
      // 2. Upload files if they exist
      if (stagedFiles && stagedFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          stagedFiles.map(file => 
            uploadFileMutation.mutateAsync({
              serviceHistoryId: result.$id,
              groupId: activeGroupId,
              file
            })
          )
        );
        
        // Check if any uploads failed
        const failedUploads = uploadResults.filter(r => r.status === 'rejected');
        if (failedUploads.length > 0) {
          toast.warning(`Reporte creado. ${failedUploads.length} archivo(s) no se pudieron subir.`);
        }
      }
      
      toast.success("Reporte de servicio creado exitosamente");
      navigate(`/reports/service/${result.$id}`);
    } catch (error) {
      toast.error("Error al crear el reporte: " + error.message);
    }
  };

  const handleFinalize = async (formData) => {
    try {
      // Separate stagedFiles from the report data
      const { stagedFiles, ...reportData } = formData;
      
      // 1. Create the report without files
      const result = await createMutation.mutateAsync({
        ...reportData,
        groupId: activeGroupId,
        createdByProfileId: profile?.$id,
      });
      
      // 2. Upload files if they exist
      if (stagedFiles && stagedFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          stagedFiles.map(file => 
            uploadFileMutation.mutateAsync({
              serviceHistoryId: result.$id,
              groupId: activeGroupId,
              file
            })
          )
        );
        
        // Check if any uploads failed
        const failedUploads = uploadResults.filter(r => r.status === 'rejected');
        if (failedUploads.length > 0) {
          toast.warning(`Reporte creado. ${failedUploads.length} archivo(s) no se pudieron subir.`);
        }
      }
      
      // 3. Finalize the report
      await finalizeMutation.mutateAsync({
        reportId: result.$id,
        profileId: profile?.$id,
      });
      
      toast.success("Reporte creado y finalizado exitosamente");
      navigate(`/reports/service/${result.$id}`);
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
      title="Nuevo Reporte de Servicio"
      subtitle="Registra un servicio o mantenimiento realizado a un vehículo"
      actions={
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <ServiceReportForm
          vehicles={vehiclesList}
          types={vehicleTypes}
          brands={vehicleBrands}
          models={vehicleModels}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onFinalize={handleFinalize}
          isLoading={createMutation.isPending || finalizeMutation.isPending || uploadFileMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
