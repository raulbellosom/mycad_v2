import { useState, useEffect, useMemo } from "react";
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
  Info,
} from "lucide-react";

import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { DatePicker } from "../../../shared/ui/DatePicker";
import { ModelCombobox } from "../../../shared/ui/ModelCombobox";
import { CurrencyInput } from "../../../shared/ui/CurrencyInput";
import { normalizeServerDate } from "../../../shared/utils/dateUtils";
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

  // Track original data for change detection in edit mode
  const [originalFormData, setOriginalFormData] = useState(null);

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
      const initialData = {
        plate: vehicle.plate || "",
        economicNumber: vehicle.economicNumber || "",
        brandId: vehicle.brandId || "",
        modelId: vehicle.modelId || "",
        acquisitionDate: normalizeServerDate(vehicle.acquisitionDate),
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
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    }
  }, [vehicle]);

  // Detect if form has changes (for edit mode)
  const hasChanges = useMemo(() => {
    if (!isEdit) return true; // Always allow submit in create mode
    if (!originalFormData) return false;

    // Check if form data changed
    const formChanged =
      JSON.stringify(formData) !== JSON.stringify(originalFormData);

    // Check if there are new staged files
    const hasNewFiles = stagedFiles.length > 0;

    return formChanged || hasNewFiles;
  }, [isEdit, formData, originalFormData, stagedFiles]);

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

      // Doble validación: si estamos en modo edición, DEBE existir el ID
      // Esto previene crear duplicados accidentalmente
      if (isEdit) {
        if (!id || id === "new") {
          throw new Error("Error: ID de vehículo inválido para actualización");
        }
        // Verificar que el vehículo existe antes de actualizar
        if (!vehicle) {
          throw new Error(
            "Error: No se pudo cargar el vehículo para actualizar"
          );
        }
        console.log("[VehicleFormPage] Actualizando vehículo:", id);
        vehicleRes = await updateVehicle(id, data);
      } else {
        console.log("[VehicleFormPage] Creando nuevo vehículo");
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
            file.size,
            profile?.$id // ownerProfileId
          );
        }
      }

      return vehicleRes;
    },
    onSuccess: (vehicleRes) => {
      queryClient.invalidateQueries(["vehicles"]);
      queryClient.invalidateQueries(["vehicleFiles", id]);

      if (isEdit) {
        // En modo edición: quedarse en el formulario y actualizar el estado original
        toast.success("Vehículo actualizado");
        // Limpiar archivos staged ya registrados
        setStagedFiles([]);
        // Actualizar el estado original para bloquear el botón guardar
        setOriginalFormData({ ...formData });
      } else {
        // En modo creación: navegar a la lista
        toast.success("Vehículo creado con éxito");
        nav("/vehicles");
      }
    },
    onError: (err) => {
      // Handle specific Appwrite errors
      if (err?.code === 401 || err?.type === "user_unauthorized") {
        toast.error(
          "No tienes permisos para realizar esta acción. Contacta al administrador."
        );
      } else if (err?.code === 403) {
        toast.error("Acceso denegado. Verifica tus permisos.");
      } else if (err?.message?.includes("document_invalid_structure")) {
        toast.error("Error en la estructura de datos. Contacta soporte.");
      } else {
        toast.error(err.message || "Error al guardar el vehículo");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Evitar doble submit
    if (mutation.isPending) {
      return;
    }
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
    // Validación crítica: en modo edición, asegurar que tenemos el vehículo cargado
    if (isEdit && !vehicle) {
      toast.error("Error: No se ha cargado el vehículo. Recarga la página.");
      return;
    }

    console.log("[VehicleFormPage] Submit - isEdit:", isEdit, "id:", id);
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
    mutationFn: ({ vehicleFileDocId, fileDocId, storageFileId }) =>
      deleteVehicleFile(vehicleFileDocId, fileDocId, storageFileId),
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
  const typeEconomicGroupMap = Object.fromEntries(
    vehicleTypes.map((t) => [t.$id, t.economicGroup || ""])
  );

  // Get economic group for current selection
  const currentEconomicGroup = formData.typeId
    ? typeEconomicGroupMap[formData.typeId] || ""
    : "";

  // Build composite economic number display (e.g., "02-8291")
  const compositeEconomicNumber = currentEconomicGroup
    ? `${currentEconomicGroup}-${formData.economicNumber || "____"}`
    : formData.economicNumber || "";

  const modelOptions = vehicleModels.map((m) => ({
    value: m.$id,
    label: m.year ? `${m.name} (${m.year})` : m.name,
    brandId: m.brandId,
    typeId: m.typeId,
    brandName: brandMap[m.brandId] || "",
    typeName: typeMap[m.typeId] || "",
    economicGroup: typeEconomicGroupMap[m.typeId] || "",
    year: m.year || "",
    searchText: `${m.name} ${brandMap[m.brandId] || ""} ${
      typeMap[m.typeId] || ""
    } ${m.year || ""} ${typeEconomicGroupMap[m.typeId] || ""}`,
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
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Col: Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                <Info size={20} className="text-(--brand)" />
                Información del Vehículo
              </h3>
              <form
                onSubmit={handleSubmit}
                id="vehicle-form"
                className="space-y-6"
              >
                {/* Model selector - FIRST and most important */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-(--fg)">
                    Modelo del Vehículo *
                  </label>
                  <ModelCombobox
                    value={formData.modelId}
                    onChange={handleModelSelect}
                    options={modelOptions}
                    placeholder="Buscar modelo, marca, tipo, grupo económico..."
                    emptyText="No se encontraron modelos"
                    onCreateNew={(search) => {
                      setModelSearchTerm(search);
                      setIsModelModalOpen(true);
                    }}
                    createLabel="Crear modelo"
                    types={vehicleTypes}
                    brands={vehicleBrands}
                  />
                </div>

                {/* Auto-filled info from model */}
                {formData.modelId && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input
                      label="Marca"
                      value={brandMap[formData.brandId] || ""}
                      disabled
                      className="bg-(--muted)/50"
                    />
                    <Input
                      label="Tipo"
                      value={typeMap[formData.typeId] || ""}
                      disabled
                      className="bg-(--muted)/50"
                    />
                    <Input
                      label="Grupo Económico"
                      value={currentEconomicGroup || "Sin grupo"}
                      disabled
                      className="bg-(--muted)/50"
                    />
                  </div>
                )}

                {/* Economic Number with prefix */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-(--fg)">
                      N° Económico *
                    </label>
                    <div className="flex items-center gap-1">
                      {currentEconomicGroup && (
                        <div className="flex h-10 items-center rounded-l-lg border border-r-0 border-(--border) bg-(--muted)/50 px-3 text-sm font-semibold text-(--brand)">
                          {currentEconomicGroup}-
                        </div>
                      )}
                      <Input
                        value={formData.economicNumber}
                        onChange={(e) =>
                          handleChange(
                            "economicNumber",
                            e.target.value.toUpperCase().slice(0, 8)
                          )
                        }
                        placeholder="8291"
                        className={currentEconomicGroup ? "rounded-l-none" : ""}
                      />
                    </div>
                    {compositeEconomicNumber && (
                      <p className="mt-1 text-xs text-(--muted-fg)">
                        Código completo:{" "}
                        <span className="font-semibold text-(--fg)">
                          {compositeEconomicNumber}
                        </span>
                      </p>
                    )}
                  </div>
                  <Input
                    label="Placa / Matrícula"
                    value={formData.plate}
                    onChange={(e) => handleChange("plate", e.target.value)}
                    placeholder="ABC-123"
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
                  <DatePicker
                    label="Fecha de Adquisición"
                    value={formData.acquisitionDate}
                    onChange={(value) => handleChange("acquisitionDate", value)}
                    placeholder="Seleccionar fecha"
                  />
                  <Input
                    label="Color"
                    value={formData.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    placeholder="Blanco, Negro, Azul..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Estado"
                    value={formData.status}
                    onChange={(v) => handleChange("status", v)}
                    options={VEHICLE_STATUS_OPTIONS}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Kilometraje actual"
                      type="number"
                      min="0"
                      value={formData.mileage || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange(
                          "mileage",
                          val === "" ? 0 : Math.max(0, parseInt(val) || 0)
                        );
                      }}
                      placeholder="0"
                    />
                    <Select
                      label="Unidad"
                      value={formData.mileageUnit}
                      onChange={(v) => handleChange("mileageUnit", v)}
                      options={MILEAGE_UNIT_OPTIONS}
                    />
                  </div>
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
                    <CurrencyInput
                      label="Costo de Adquisición"
                      value={formData.acquisitionCost}
                      onChange={(val) => handleChange("acquisitionCost", val)}
                      currency={formData.acquisitionCostCurrency}
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
                    <CurrencyInput
                      label="Valor en Libros"
                      value={formData.bookValue}
                      onChange={(val) => handleChange("bookValue", val)}
                      currency={formData.bookValueCurrency}
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
                    <CurrencyInput
                      label="Valor de Mercado"
                      value={formData.marketValue}
                      onChange={(val) => handleChange("marketValue", val)}
                      currency={formData.marketValueCurrency}
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
                  onRemoveStaged={async (storageId) => {
                    setStagedFiles((prev) =>
                      prev.filter((f) => f.fileId !== storageId)
                    );
                    // For staged files, only delete from storage (no DB records yet)
                    await deleteVehicleFile(null, null, storageId);
                  }}
                  onRemoveExisting={(
                    vehicleFileDocId,
                    fileDocId,
                    storageFileId
                  ) =>
                    deleteExistingFileMutation.mutate({
                      vehicleFileDocId,
                      fileDocId,
                      storageFileId,
                    })
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
                  onRemoveStaged={async (storageId) => {
                    setStagedFiles((prev) =>
                      prev.filter((f) => f.fileId !== storageId)
                    );
                    // For staged files, only delete from storage (no DB records yet)
                    await deleteVehicleFile(null, null, storageId);
                  }}
                  onRemoveExisting={(
                    vehicleFileDocId,
                    fileDocId,
                    storageFileId
                  ) =>
                    deleteExistingFileMutation.mutate({
                      vehicleFileDocId,
                      fileDocId,
                      storageFileId,
                    })
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
                    disabled={mutation.isPending || isUploading || !hasChanges}
                    className="w-full justify-center py-6 text-lg"
                  >
                    {mutation.isPending ? (
                      <>Guardando...</>
                    ) : (
                      <>
                        <Save size={20} className="mr-2" />
                        {isEdit ? "Guardar Cambios" : "Crear Vehículo"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={mutation.isPending}
                    className="w-full justify-center"
                  >
                    Cancelar
                  </Button>
                </div>

                {/* Loading indicator */}
                {mutation.isPending && (
                  <div className="rounded-lg bg-(--brand)/10 border border-(--brand)/30 p-3 text-center">
                    <p className="text-sm text-(--brand) font-medium">
                      {stagedFiles.length > 0
                        ? "Guardando vehículo y registrando archivos..."
                        : "Guardando vehículo..."}
                    </p>
                  </div>
                )}

                <div className="rounded-lg bg-(--muted)/30 p-4 border border-(--border)">
                  <h4 className="text-sm font-medium text-(--fg) mb-3 pb-2 border-b border-(--border)">
                    Resumen del Vehículo
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    {/* Economic Number - Most Important */}
                    <div className="flex justify-between items-center">
                      <span className="text-(--muted-fg)">N° Económico:</span>
                      <span className="font-bold text-(--fg) text-sm">
                        {compositeEconomicNumber || "—"}
                      </span>
                    </div>

                    {/* Plate */}
                    <div className="flex justify-between items-center">
                      <span className="text-(--muted-fg)">Placa:</span>
                      <span className="font-semibold text-(--fg)">
                        {formData.plate || "—"}
                      </span>
                    </div>

                    {/* Model */}
                    {formData.modelId && (
                      <div className="flex justify-between items-center">
                        <span className="text-(--muted-fg)">Modelo:</span>
                        <span className="font-semibold text-(--fg) text-right max-w-[140px] truncate">
                          {modelOptions.find(
                            (m) => m.value === formData.modelId
                          )?.label || "—"}
                        </span>
                      </div>
                    )}

                    {/* Brand */}
                    {formData.brandId && (
                      <div className="flex justify-between items-center">
                        <span className="text-(--muted-fg)">Marca:</span>
                        <span className="font-semibold text-(--fg)">
                          {brandMap[formData.brandId] || "—"}
                        </span>
                      </div>
                    )}

                    {/* Type */}
                    {formData.typeId && (
                      <div className="flex justify-between items-center">
                        <span className="text-(--muted-fg)">Tipo:</span>
                        <span className="font-semibold text-(--fg)">
                          {typeMap[formData.typeId] || "—"}
                        </span>
                      </div>
                    )}

                    {/* Economic Group */}
                    {currentEconomicGroup && (
                      <div className="flex justify-between items-center">
                        <span className="text-(--muted-fg)">Grupo Econ.:</span>
                        <span className="inline-flex items-center rounded bg-(--brand)/10 px-1.5 py-0.5 text-xs font-semibold text-(--brand)">
                          {currentEconomicGroup}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex justify-between items-center">
                      <span className="text-(--muted-fg)">Estado:</span>
                      <span className="font-semibold text-(--fg)">
                        {VEHICLE_STATUS_OPTIONS.find(
                          (s) => s.value === formData.status
                        )?.label || "—"}
                      </span>
                    </div>

                    {/* Mileage */}
                    {formData.mileage > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-(--muted-fg)">Kilometraje:</span>
                        <span className="font-semibold text-(--fg)">
                          {formData.mileage.toLocaleString()}{" "}
                          {formData.mileageUnit}
                        </span>
                      </div>
                    )}

                    {/* Separator */}
                    <div className="border-t border-(--border) pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-(--muted-fg)">Archivos:</span>
                        <span className="font-semibold text-(--fg)">
                          {existingFiles.length + stagedFiles.length}
                        </span>
                      </div>

                      {/* Acquisition Cost if present */}
                      {formData.acquisitionCost && (
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-(--muted-fg)">Costo Adq.:</span>
                          <span className="font-semibold text-(--fg)">
                            ${Number(formData.acquisitionCost).toLocaleString()}{" "}
                            {formData.acquisitionCostCurrency}
                          </span>
                        </div>
                      )}
                    </div>
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
