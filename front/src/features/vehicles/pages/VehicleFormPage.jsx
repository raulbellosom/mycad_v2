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
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";

// Mock catalogs for MVP
const VEHICLE_TYPES = [
  { value: "sedan", label: "Sedán" },
  { value: "suv", label: "SUV" },
  { value: "truck", label: "Camión" },
  { value: "motorcycle", label: "Motocicleta" },
];

export function VehicleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== "new";
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    licensePlate: "",
    vin: "",
    brandId: "",
    modelId: "",
    year: new Date().getFullYear(),
    color: "",
    typeId: "sedan",
    status: "ACTIVE",
    mileage: 0,
    mileageUnit: "KM",
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
        licensePlate: vehicle.plate || "",
        vin: vehicle.vin || "",
        brandId: vehicle.brandId || "",
        modelId: vehicle.modelId || "",
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || "",
        typeId: vehicle.typeId || "sedan",
        status: vehicle.status || "ACTIVE",
        mileage: vehicle.mileage || 0,
        mileageUnit: vehicle.mileageUnit || "KM",
      });
    }
  }, [vehicle]);

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEdit) return updateVehicle(id, data);
      return createVehicle({
        ...data,
        groupId: activeGroupId,
        ownerProfileId: profile?.$id, // In a real app this might come from form or be automatic
        plate: data.licensePlate, // mapping UI name to DB name
        licensePlate: undefined, // remove UI specific
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
    mutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isEdit && isLoadingVehicle)
    return <LoadingScreen label="Cargando vehículo..." />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionHeader title={isEdit ? "Editar Vehículo" : "Nuevo Vehículo"}>
        <Button variant="ghost" onClick={() => nav(-1)}>
          <ArrowLeft size={18} className="mr-2" /> Cancelar
        </Button>
      </SectionHeader>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Placa / Matrícula"
              value={formData.licensePlate}
              onChange={(e) => handleChange("licensePlate", e.target.value)}
              placeholder="ABC-123"
            />
            <Input
              label="VIN (Serie)"
              value={formData.vin}
              onChange={(e) => handleChange("vin", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Marca"
              value={formData.brandId}
              onChange={(e) => handleChange("brandId", e.target.value)}
              placeholder="Toyota, Ford..."
            />
            <Input
              label="Modelo"
              value={formData.modelId}
              onChange={(e) => handleChange("modelId", e.target.value)}
              placeholder="Corolla, Ranger..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Año"
              type="number"
              value={formData.year}
              onChange={(e) =>
                handleChange("year", parseInt(e.target.value) || 0)
              }
            />
            <Input
              label="Color"
              value={formData.color}
              onChange={(e) => handleChange("color", e.target.value)}
            />
            <Select
              label="Tipo"
              value={formData.typeId}
              onChange={(v) => handleChange("typeId", v)}
              options={VEHICLE_TYPES}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Kilometraje"
              type="number"
              value={formData.mileage}
              onChange={(e) =>
                handleChange("mileage", parseInt(e.target.value) || 0)
              }
            />
            <Select
              label="Unidad"
              value={formData.mileageUnit}
              onChange={(v) => handleChange("mileageUnit", v)}
              options={[
                { value: "KM", label: "Kilómetros" },
                { value: "MI", label: "Millas" },
              ]}
            />
            <Select
              label="Estatus"
              value={formData.status}
              onChange={(v) => handleChange("status", v)}
              options={[
                { value: "ACTIVE", label: "Activo" },
                { value: "IN_MAINTENANCE", label: "En mantenimiento" },
                { value: "INACTIVE", label: "Inactivo" },
              ]}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={mutation.isPending}>
              <Save size={18} className="mr-2" />
              Guardar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
