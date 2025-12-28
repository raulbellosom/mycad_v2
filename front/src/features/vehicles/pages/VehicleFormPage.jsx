import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Car,
  Camera,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  getVehicleById,
  createVehicle,
  updateVehicle,
  listVehicleFiles,
  registerFileInDb,
  deleteVehicleFile,
} from "../services/vehicles.service";
import {
  listVehicleTypes,
  listVehicleBrands,
  listVehicleModels,
} from "../../catalogs/services/catalogs.service";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Combobox } from "../../../shared/ui/Combobox";
import { CreateModelModal } from "../components/CreateModelModal";
import { VehicleMediaManager } from "../components/VehicleMediaManager";

const VEHICLE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "IN_MAINTENANCE", label: "En mantenimiento" },
  { value: "SOLD", label: "Vendido" },
  { value: "RENTED", label: "Rentado" },
  { value: "INACTIVE", label: "Inactivo" },
];

const MILEAGE_UNIT_OPTIONS = [
  { value: "KM", label: "Kilómetros" },
  { value: "MI", label: "Millas" },
];

export function VehicleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== "new";
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    plate: "",
    vin: "",
    brandId: "",
    modelId: "",
    acquisitionDate: "",
    color: "",
    typeId: "",
    status: "ACTIVE",
    mileage: 0,
    mileageUnit: "KM",
    serialNumber: "",
  });

  // Media state
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Modal state
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState("");

  // Fetch catalogs
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

  // Fetch existing vehicle if edit
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id),
    enabled: isEdit,
  });

  // Fetch existing files if edit
  const { data: existingFiles = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ["vehicleFiles", id],
    queryFn: () => listVehicleFiles(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate || "",
        vin: vehicle.vin || "",
        brandId: vehicle.brandId || "",
        modelId: vehicle.modelId || "",
        acquisitionDate: vehicle.acquisitionDate || "",
        color: vehicle.color || "",
        typeId: vehicle.typeId || "",
        status: vehicle.status || "ACTIVE",
        mileage: vehicle.mileage || 0,
        mileageUnit: vehicle.mileageUnit || "KM",
        serialNumber: vehicle.serialNumber || "",
      });
    }
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      let vehicleRes;
      if (isEdit) {
        vehicleRes = await updateVehicle(id, data);
      } else {
        vehicleRes = await createVehicle({
          ...data,
          groupId: activeGroupId,
          ownerProfileId: profile?.$id,
        });
      }

      // If there are staged files, register them now
      if (stagedFiles.length > 0) {
        const vehicleId = isEdit ? id : vehicleRes.$id;
        for (const file of stagedFiles) {
          await registerFileInDb(
            vehicleId,
            activeGroupId,
            file.fileId,
            file.name,
            file.type,
            file.size
          );
        }
      }

      return vehicleRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"]);
      queryClient.invalidateQueries(["vehicleFiles", id]);
      toast.success(
        isEdit ? "Vehículo actualizado" : "Vehículo creado con éxito"
      );
      nav("/vehicles");
    },
    onError: (err) => {
      toast.error(err.message || "Error al guardar");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isUploading) {
      toast.error("Espera a que terminen de subirse los archivos");
      return;
    }
    if (!activeGroupId && !isEdit) {
      toast.error("Selecciona un grupo primero");
      return;
    }
    if (!formData.typeId) {
      toast.error("Selecciona un tipo de vehículo");
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleModelSelect = (modelId) => {
    const selectedModel = vehicleModels.find((m) => m.$id === modelId);
    if (selectedModel) {
      setFormData((prev) => ({
        ...prev,
        modelId: selectedModel.$id,
        brandId: selectedModel.brandId || prev.brandId,
        typeId: selectedModel.typeId || prev.typeId,
      }));
    } else {
      setFormData((prev) => ({ ...prev, modelId }));
    }
  };

  const handleModelCreated = (newModel) => {
    handleModelSelect(newModel.$id);
  };

  const deleteExistingFileMutation = useMutation({
    mutationFn: ({ docId, fileId }) => deleteVehicleFile(docId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicleFiles", id]);
      toast.success("Archivo eliminado");
    },
  });

  if (!activeGroupId) {
    return (
      <div className="grid h-[60dvh] place-items-center px-4">
        <EmptyState
          icon={Car}
          title="Selecciona un grupo"
          description="Para crear o editar vehículos, primero debes seleccionar un grupo en el menú superior."
        />
      </div>
    );
  }

  if (isEdit && isLoadingVehicle)
    return <LoadingScreen label="Cargando vehículo..." />;

  const brandMap = Object.fromEntries(
    vehicleBrands.map((b) => [b.$id, b.name])
  );
  const typeMap = Object.fromEntries(vehicleTypes.map((t) => [t.$id, t.name]));

  const modelOptions = vehicleModels.map((m) => ({
    value: m.$id,
    label: m.year ? `${m.name} (${m.year})` : m.name,
    brandName: brandMap[m.brandId] || "",
    typeName: typeMap[m.typeId] || "",
    year: m.year || "",
    searchText: `${m.name} ${brandMap[m.brandId] || ""} ${
      typeMap[m.typeId] || ""
    } ${m.year || ""}`,
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeader title={isEdit ? "Editar Vehículo" : "Nuevo Vehículo"}>
        <Button variant="ghost" onClick={() => nav(-1)}>
          <ArrowLeft size={18} className="mr-2" /> Cancelar
        </Button>
      </SectionHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <form
              onSubmit={handleSubmit}
              id="vehicle-form"
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Placa / Matrícula"
                  value={formData.plate}
                  onChange={(e) => handleChange("plate", e.target.value)}
                  placeholder="ABC-123"
                />
                <Input
                  label="VIN / Número de serie"
                  value={formData.vin}
                  onChange={(e) => handleChange("vin", e.target.value)}
                  placeholder="1HGBH41JXMN109186"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-(--fg)">
                    Modelo del Vehículo *
                  </label>
                  <Combobox
                    value={formData.modelId}
                    onChange={handleModelSelect}
                    options={modelOptions}
                    placeholder="Buscar modelo, marca, tipo..."
                    emptyText="No se encontraron modelos"
                    onCreateNew={(search) => {
                      setModelSearchTerm(search);
                      setIsModelModalOpen(true);
                    }}
                    createLabel="Crear modelo"
                    searchKeys={["label", "brandName", "typeName", "year"]}
                  />
                </div>

                <Input
                  label="Fecha de Adquisición"
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) =>
                    handleChange("acquisitionDate", e.target.value)
                  }
                />
              </div>

              {formData.modelId && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Marca (auto-completado)"
                    value={brandMap[formData.brandId] || ""}
                    disabled
                    className="bg-(--muted)/50"
                  />
                  <Input
                    label="Tipo (auto-completado)"
                    value={typeMap[formData.typeId] || ""}
                    disabled
                    className="bg-(--muted)/50"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Color"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  placeholder="Blanco, Negro, Azul..."
                />
                <Select
                  label="Estado"
                  value={formData.status}
                  onChange={(v) => handleChange("status", v)}
                  options={VEHICLE_STATUS_OPTIONS}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Kilometraje actual"
                  type="number"
                  min="0"
                  value={formData.mileage}
                  onChange={(e) =>
                    handleChange("mileage", parseInt(e.target.value) || 0)
                  }
                />
                <Select
                  label="Unidad de medida"
                  value={formData.mileageUnit}
                  onChange={(v) => handleChange("mileageUnit", v)}
                  options={MILEAGE_UNIT_OPTIONS}
                />
              </div>
            </form>
          </Card>

          {/* Media Section Integrated Below Main Form (Large Screens) */}
          <div className="hidden lg:block">
            <Card className="p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                <ImageIcon size={20} className="text-(--brand)" />
                Fotos y Archivos
              </h3>
              <VehicleMediaManager
                existingFiles={existingFiles}
                stagedFiles={stagedFiles}
                onAddStaged={(f) => setStagedFiles((prev) => [...prev, f])}
                onRemoveStaged={(id) =>
                  setStagedFiles((prev) => prev.filter((f) => f.fileId !== id))
                }
                onRemoveExisting={(docId, fileId) =>
                  deleteExistingFileMutation.mutate({ docId, fileId })
                }
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            </Card>
          </div>
        </div>

        {/* Right Col: Media & Actions (Small/Med screens) / Sidebar (Large Screens) */}
        <div className="space-y-6 flex flex-col">
          {/* Media Section (Responsive version) - Order 1 on mobile */}
          <div className="lg:hidden order-1">
            <Card className="p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                <ImageIcon size={20} className="text-(--brand)" />
                Fotos y Archivos
              </h3>
              <VehicleMediaManager
                existingFiles={existingFiles}
                stagedFiles={stagedFiles}
                onAddStaged={(f) => setStagedFiles((prev) => [...prev, f])}
                onRemoveStaged={(id) =>
                  setStagedFiles((prev) => prev.filter((f) => f.fileId !== id))
                }
                onRemoveExisting={(docId, fileId) =>
                  deleteExistingFileMutation.mutate({ docId, fileId })
                }
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            </Card>
          </div>

          {/* Action Sidebar - Order 2 on mobile */}
          <Card className="p-6 sticky top-24 order-2 mt-6 lg:mt-0">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  form="vehicle-form"
                  loading={mutation.isPending}
                  className="w-full justify-center py-6 text-lg"
                >
                  <Save size={20} className="mr-2" />
                  {isEdit ? "Guardar Cambios" : "Crear Vehículo"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => nav(-1)}
                  className="w-full justify-center"
                >
                  Cancelar
                </Button>
              </div>

              <div className="rounded-lg bg-(--muted)/30 p-4 border border-(--border)">
                <h4 className="text-sm font-medium text-(--fg) mb-2">
                  Resumen
                </h4>
                <div className="space-y-2 text-xs text-(--muted-fg)">
                  <p className="flex justify-between">
                    <span>Placa:</span>
                    <span className="font-semibold text-(--fg)">
                      {formData.plate || "—"}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Archivos:</span>
                    <span className="font-semibold text-(--fg)">
                      {existingFiles.length + stagedFiles.length}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Model Modal */}
      <CreateModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSuccess={handleModelCreated}
        groupId={activeGroupId}
        initialSearch={modelSearchTerm}
      />
    </div>
  );
}
