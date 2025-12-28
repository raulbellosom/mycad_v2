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
  DollarSign,
} from "lucide-react";

import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { PageLayout } from "../../../shared/ui/PageLayout";
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

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "USD", label: "USD - Dólar Americano" },
  { value: "EUR", label: "EUR - Euro" },
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
    economicNumber: "",
    brandId: "",
    modelId: "",
    acquisitionDate: "",
    color: "",
    typeId: "",
    status: "ACTIVE",
    mileage: 0,
    mileageUnit: "KM",
    serialNumber: "",
    // Accounting fields
    acquisitionCost: "",
    acquisitionCostCurrency: "MXN",
    bookValue: "",
    bookValueCurrency: "MXN",
    marketValue: "",
    marketValueCurrency: "MXN",
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
        economicNumber: vehicle.economicNumber || "",
        brandId: vehicle.brandId || "",
        modelId: vehicle.modelId || "",
        acquisitionDate: vehicle.acquisitionDate || "",
        color: vehicle.color || "",
        typeId: vehicle.typeId || "",
        status: vehicle.status || "ACTIVE",
        mileage: vehicle.mileage || 0,
        mileageUnit: vehicle.mileageUnit || "KM",
        serialNumber: vehicle.serialNumber || "",
        // Accounting fields
        acquisitionCost: vehicle.acquisitionCost ?? "",
        acquisitionCostCurrency: vehicle.acquisitionCostCurrency || "MXN",
        bookValue: vehicle.bookValue ?? "",
        bookValueCurrency: vehicle.bookValueCurrency || "MXN",
        marketValue: vehicle.marketValue ?? "",
        marketValueCurrency: vehicle.marketValueCurrency || "MXN",
      });
    }
  }, [vehicle]);

  // Prevent accidental navigation with staged files
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (stagedFiles.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [stagedFiles]);

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
    if (!formData.economicNumber) {
      toast.error("El Número Económico es obligatorio");
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

  const handleCancel = async () => {
    if (stagedFiles.length > 0) {
      const confirmCleanup = window.confirm(
        "Tienes archivos subidos. ¿Estás seguro de que deseas cancelar? Se eliminarán los archivos temporales."
      );
      if (!confirmCleanup) return;

      const toastId = toast.loading("Limpiando archivos...");
      try {
        await Promise.all(
          stagedFiles.map((file) => deleteVehicleFile(null, file.fileId))
        );
        toast.success("Limpieza completada", { id: toastId });
      } catch (error) {
        console.error("Cleanup error:", error);
        toast.error("Error al limpiar archivos", { id: toastId });
      }
    }
    nav(-1);
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
      <PageLayout.Empty
        icon={Car}
        title="Selecciona un grupo"
        description="Para crear o editar vehículos, primero debes seleccionar un grupo en el menú superior."
      />
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
    <PageLayout
      title={isEdit ? "Editar Vehículo" : "Nuevo Vehículo"}
      actions={
        <Button variant="ghost" onClick={() => nav(-1)}>
          <ArrowLeft size={18} className="mr-2" /> Cancelar
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Col: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <form
                onSubmit={handleSubmit}
                id="vehicle-form"
                className="space-y-6"
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Placa / Matrícula"
                    value={formData.plate}
                    onChange={(e) => handleChange("plate", e.target.value)}
                    placeholder="ABC-123"
                  />
                  <Input
                    label="N° Económico *"
                    value={formData.economicNumber}
                    onChange={(e) =>
                      handleChange(
                        "economicNumber",
                        e.target.value.toUpperCase().slice(0, 8)
                      )
                    }
                    placeholder="E-1234"
                  />
                  <Input
                    label="N° Serie"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      handleChange("serialNumber", e.target.value)
                    }
                    placeholder="SN123456789"
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

            {/* Accounting/Financial Section */}
            <Card className="p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                <DollarSign size={20} className="text-(--brand)" />
                Datos Contables
              </h3>
              <div className="space-y-4">
                {/* Acquisition Cost */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Costo de Adquisición"
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      value={formData.acquisitionCost}
                      onChange={(e) =>
                        handleChange(
                          "acquisitionCost",
                          e.target.value ? parseFloat(e.target.value) : ""
                        )
                      }
                      placeholder="0.00"
                      form="vehicle-form"
                    />
                  </div>
                  <Select
                    label="Moneda"
                    value={formData.acquisitionCostCurrency}
                    onChange={(v) => handleChange("acquisitionCostCurrency", v)}
                    options={CURRENCY_OPTIONS}
                  />
                </div>

                {/* Book Value */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Valor en Libros"
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      value={formData.bookValue}
                      onChange={(e) =>
                        handleChange(
                          "bookValue",
                          e.target.value ? parseFloat(e.target.value) : ""
                        )
                      }
                      placeholder="0.00"
                      form="vehicle-form"
                    />
                  </div>
                  <Select
                    label="Moneda"
                    value={formData.bookValueCurrency}
                    onChange={(v) => handleChange("bookValueCurrency", v)}
                    options={CURRENCY_OPTIONS}
                  />
                </div>

                {/* Market Value */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Valor de Mercado"
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      value={formData.marketValue}
                      onChange={(e) =>
                        handleChange(
                          "marketValue",
                          e.target.value ? parseFloat(e.target.value) : ""
                        )
                      }
                      placeholder="0.00"
                      form="vehicle-form"
                    />
                  </div>
                  <Select
                    label="Moneda"
                    value={formData.marketValueCurrency}
                    onChange={(v) => handleChange("marketValueCurrency", v)}
                    options={CURRENCY_OPTIONS}
                  />
                </div>

                <p className="text-xs text-(--muted-fg) mt-2">
                  Estos valores son opcionales y se utilizan para reportes
                  contables y de depreciación.
                </p>
              </div>
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
                  onRemoveStaged={async (id) => {
                    setStagedFiles((prev) =>
                      prev.filter((f) => f.fileId !== id)
                    );
                    await deleteVehicleFile(null, id);
                  }}
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
                  onRemoveStaged={async (id) => {
                    setStagedFiles((prev) =>
                      prev.filter((f) => f.fileId !== id)
                    );
                    await deleteVehicleFile(null, id);
                  }}
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
                    onClick={handleCancel}
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
                      <span>Económico:</span>
                      <span className="font-semibold text-(--fg)">
                        {formData.economicNumber || "—"}
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
    </PageLayout>
  );
}
