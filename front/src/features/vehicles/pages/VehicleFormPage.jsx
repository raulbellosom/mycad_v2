import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

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

  // Fetch existing if edit
  const { data: vehicle, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id),
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
    mutationFn: (data) => {
      if (isEdit) return updateVehicle(id, data);
      return createVehicle({
        ...data,
        groupId: activeGroupId,
        ownerProfileId: profile?.$id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"]);
      toast.success(isEdit ? "Vehículo actualizado" : "Vehículo creado");
      nav("/vehicles");
    },
    onError: (err) => {
      toast.error(err.message || "Error al guardar");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
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

  // Handle model selection - auto-fill brand and type
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

  // Handle model creation success
  const handleModelCreated = (newModel) => {
    handleModelSelect(newModel.$id);
  };

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

  // Create lookup maps
  const brandMap = Object.fromEntries(
    vehicleBrands.map((b) => [b.$id, b.name])
  );
  const typeMap = Object.fromEntries(vehicleTypes.map((t) => [t.$id, t.name]));

  // Model options with searchable metadata (show year in label)
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
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionHeader title={isEdit ? "Editar Vehículo" : "Nuevo Vehículo"}>
        <Button variant="ghost" onClick={() => nav(-1)}>
          <ArrowLeft size={18} className="mr-2" /> Cancelar
        </Button>
      </SectionHeader>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => handleChange("acquisitionDate", e.target.value)}
            />
          </div>

          {/* Show selected brand and type (read-only for reference) */}
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

          <div className="flex justify-end gap-3 border-t border-(--border) pt-6">
            <Button type="button" variant="ghost" onClick={() => nav(-1)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              <Save size={18} className="mr-2" />
              {isEdit ? "Actualizar" : "Crear"} Vehículo
            </Button>
          </div>
        </form>
      </Card>

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
