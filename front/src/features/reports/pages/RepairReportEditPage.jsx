import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Car } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { ResourceNotFound } from "../../../shared/ui/ResourceNotFound";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { RepairReportForm } from "../components/repair/RepairReportForm";
import {
  useRepairReport,
  useUpdateRepairReport,
  useFinalizeRepairReport,
  useRepairReportParts,
  useRepairReportFiles,
  useUploadRepairReportFile,
  useAddRepairReportPart,
  useUpdateRepairReportPart,
  useDeleteRepairReportPart,
  useDeleteRepairReportFile,
} from "../hooks/useRepairReports";
import { listVehicles } from "../../vehicles/services/vehicles.service";
import {
  listVehicleTypes,
  listVehicleBrands,
  listVehicleModels,
} from "../../catalogs/services/catalogs.service";
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
  const updateMutation = useUpdateRepairReport();
  const finalizeMutation = useFinalizeRepairReport();
  const uploadFileMutation = useUploadRepairReportFile();
  const addPartMutation = useAddRepairReportPart();
  const updatePartMutation = useUpdateRepairReportPart();
  const deletePartMutation = useDeleteRepairReportPart();
  const deleteFileMutation = useDeleteRepairReportFile();

  const vehiclesList = vehicles || [];
  const parts = partsData || [];
  const files = filesData || [];

  /**
   * Procesa las partes: crea nuevas, actualiza existentes, elimina las removidas
   * Las partes nuevas tienen id temporal (temp_xxx), las existentes tienen $id de Appwrite
   */
  const processParts = async (formParts) => {
    // IDs de partes que ya existen en la BD (tienen $id de Appwrite)
    const existingPartIds = parts.map((p) => p.$id);

    // IDs de partes del formulario que tienen $id (ya existen en BD)
    const formPartIds = formParts.filter((p) => p.$id).map((p) => p.$id);

    // Partes a eliminar: estaban en BD pero ya no están en el formulario
    const partsToDelete = existingPartIds.filter(
      (partId) => !formPartIds.includes(partId)
    );

    // Partes a crear: NO tienen $id de Appwrite (son nuevas, solo tienen id temporal)
    const partsToCreate = formParts.filter((p) => !p.$id);

    // Partes a actualizar: tienen $id Y ese $id existe en la BD
    const partsToUpdate = formParts.filter(
      (p) => p.$id && existingPartIds.includes(p.$id)
    );

    const errors = [];

    // 1. Eliminar partes removidas
    for (const partId of partsToDelete) {
      try {
        await deletePartMutation.mutateAsync({
          partId,
          repairReportId: id,
        });
      } catch (error) {
        errors.push(`Error eliminando parte: ${error.message}`);
      }
    }

    // 2. Crear nuevas partes
    for (const part of partsToCreate) {
      try {
        await addPartMutation.mutateAsync({
          repairReportId: id,
          groupId: activeGroupId,
          data: {
            name: part.name,
            quantity: parseInt(part.quantity) || 1,
            unitCost: parseFloat(part.unitCost) || 0,
            notes: part.notes || null,
          },
        });
      } catch (error) {
        errors.push(`Error creando parte "${part.name}": ${error.message}`);
      }
    }

    // 3. Actualizar partes existentes
    for (const part of partsToUpdate) {
      try {
        await updatePartMutation.mutateAsync({
          partId: part.$id,
          repairReportId: id,
          data: {
            name: part.name,
            quantity: parseInt(part.quantity) || 1,
            unitCost: parseFloat(part.unitCost) || 0,
            notes: part.notes || null,
          },
        });
      } catch (error) {
        errors.push(
          `Error actualizando parte "${part.name}": ${error.message}`
        );
      }
    }

    return errors;
  };

  /**
   * Procesa los archivos eliminados
   * deletedFileIds es un array de objetos { docId, storageFileId }
   */
  const processDeletedFiles = async (deletedFileIds) => {
    const errors = [];
    for (const fileInfo of deletedFileIds) {
      try {
        await deleteFileMutation.mutateAsync({
          fileDocId: fileInfo.docId,
          storageFileId: fileInfo.storageFileId,
          repairReportId: id,
        });
      } catch (error) {
        errors.push(`Error eliminando archivo: ${error.message}`);
      }
    }
    return errors;
  };

  const handleSubmit = async (formData) => {
    try {
      // Separate parts, stagedFiles, and deletedFileIds from the report data
      const {
        parts: formParts,
        stagedFiles,
        deletedFileIds,
        ...reportData
      } = formData;

      // 1. Update the report
      await updateMutation.mutateAsync({
        reportId: id,
        data: {
          ...reportData,
        },
      });

      // 2. Process parts (create new, update existing, delete removed)
      if (formParts) {
        const partErrors = await processParts(formParts);
        if (partErrors.length > 0) {
          toast(
            `Algunas partes tuvieron errores: ${partErrors.length}`
          );
        }
      }

      // 3. Delete removed files
      if (deletedFileIds && deletedFileIds.length > 0) {
        const deleteErrors = await processDeletedFiles(deletedFileIds);
        if (deleteErrors.length > 0) {
          toast(
            `Algunos archivos no se pudieron eliminar: ${deleteErrors.length}`
          );
        }
      }

      // 4. Upload new files if they exist
      if (stagedFiles && stagedFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          stagedFiles.map((file) =>
            uploadFileMutation.mutateAsync({
              repairReportId: id,
              groupId: activeGroupId,
              file,
            })
          )
        );

        // Check if any uploads failed
        const failedUploads = uploadResults.filter(
          (r) => r.status === "rejected"
        );
        if (failedUploads.length > 0) {
          toast(
            `Reporte actualizado. ${failedUploads.length} archivo(s) no se pudieron subir.`
          );
        }
      }

      toast.success("Reporte actualizado exitosamente");
      navigate(`/reports/repair/${id}`);
    } catch (error) {
      toast.error("Error al actualizar el reporte: " + error.message);
    }
  };

  const handleFinalize = async (formData) => {
    try {
      // Separate parts, stagedFiles, and deletedFileIds from the report data
      const {
        parts: formParts,
        stagedFiles,
        deletedFileIds,
        ...reportData
      } = formData;

      // 1. Update the report
      await updateMutation.mutateAsync({
        reportId: id,
        data: {
          ...reportData,
        },
      });

      // 2. Process parts (create new, update existing, delete removed)
      if (formParts) {
        const partErrors = await processParts(formParts);
        if (partErrors.length > 0) {
          toast(
            `Algunas partes tuvieron errores: ${partErrors.length}`
          );
        }
      }

      // 3. Delete removed files
      if (deletedFileIds && deletedFileIds.length > 0) {
        await processDeletedFiles(deletedFileIds);
      }

      // 4. Upload new files if they exist
      if (stagedFiles && stagedFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          stagedFiles.map((file) =>
            uploadFileMutation.mutateAsync({
              repairReportId: id,
              groupId: activeGroupId,
              file,
            })
          )
        );

        // Check if any uploads failed
        const failedUploads = uploadResults.filter(
          (r) => r.status === "rejected"
        );
        if (failedUploads.length > 0) {
          toast(
            `${failedUploads.length} archivo(s) no se pudieron subir.`
          );
        }
      }

      // 5. Finalize the report
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
        <ResourceNotFound
          resourceType="reporte de reparación"
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
            files,
          }}
          vehicles={vehiclesList}
          types={vehicleTypes}
          brands={vehicleBrands}
          models={vehicleModels}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onFinalize={handleFinalize}
          isLoading={
            updateMutation.isPending ||
            finalizeMutation.isPending ||
            uploadFileMutation.isPending
          }
          isEditing
        />
      </div>
    </PageLayout>
  );
}
