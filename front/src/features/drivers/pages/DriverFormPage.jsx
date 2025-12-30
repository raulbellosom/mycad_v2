import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  User,
  ShieldAlert,
  FileText,
  Trash2,
  Plus,
  Calendar,
  Smartphone,
  Mail,
  StickyNote,
  Car,
} from "lucide-react";

import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { Tabs } from "../../../shared/ui/Tabs";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import {
  getDriverById,
  createDriver,
  updateDriver,
  listDriverLicenses,
  createDriverLicense,
  updateDriverLicense,
  listDriverFiles,
  registerDriverFileInDb,
  deleteDriverFile,
} from "../services/drivers.service";
import { DriverLicenseManager } from "../components/DriverLicenseManager";
import { DriverMediaManager } from "../components/DriverMediaManager";
import { DriverVehicleAssignments } from "../components/DriverVehicleAssignments";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { cn } from "../../../shared/utils/cn";

const DRIVER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "SUSPENDED", label: "Suspendido" },
];

const TABS = [
  { id: "info", label: "Información" },
  { id: "vehicles", label: "Vehículos" },
  { id: "licenses", label: "Licencias" },
  { id: "files", label: "Archivos" },
];

export function DriverFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id) && id !== "new";
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();

  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    birthDate: "",
    notes: "",
    status: "ACTIVE",
  });

  const [stagedFiles, setStagedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Warning for unsaved uploads
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

  const handleCancel = async () => {
    if (stagedFiles.length > 0) {
      const confirmed = window.confirm(
        "Tienes archivos subidos que no se han guardado. ¿Estás seguro de que quieres salir? Se eliminarán del servidor."
      );
      if (!confirmed) return;

      // Cleanup staged files
      for (const file of stagedFiles) {
        await deleteDriverFile(null, file.fileId);
      }
    }
    nav(-1);
  };

  // Fetch driver data
  const { data: driver, isLoading: isLoadingDriver } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => getDriverById(id),
    enabled: isEdit,
  });

  // Fetch existing files
  const { data: existingFiles = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ["driverFiles", id],
    queryFn: () => listDriverFiles(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        firstName: driver.firstName || "",
        lastName: driver.lastName || "",
        phone: driver.phone || "",
        email: driver.email || "",
        birthDate: driver.birthDate
          ? new Date(driver.birthDate).toISOString().split("T")[0]
          : "",
        notes: driver.notes || "",
        status: driver.status || "ACTIVE",
      });
    }
  }, [driver]);

  const deleteExistingFileMutation = useMutation({
    mutationFn: ({ docId, fileId }) => deleteDriverFile(docId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries(["driverFiles", id]);
      toast.success("Archivo eliminado");
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      let driverDoc;
      if (isEdit) {
        driverDoc = await updateDriver(id, data);
      } else {
        driverDoc = await createDriver({
          ...data,
          groupId: activeGroupId,
        });
      }

      // Register staged files
      if (stagedFiles.length > 0) {
        const targetId = driverDoc.$id;
        for (const file of stagedFiles) {
          await registerDriverFileInDb(
            targetId,
            activeGroupId,
            file.fileId,
            file.isImage ? "PHOTO" : "DOC",
            file.name
          );
        }
      }
      return driverDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["drivers"]);
      setStagedFiles([]);
      toast.success(
        isEdit ? "Conductor actualizado" : "Conductor creado con éxito"
      );
      nav("/drivers");
    },
    onError: (err) => {
      toast.error(err.message || "Error al guardar");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isEdit && isLoadingDriver)
    return <LoadingScreen label="Cargando conductor..." />;

  return (
    <PageLayout
      title={isEdit ? "Editar Conductor" : "Nuevo Conductor"}
      actions={
        <Button variant="ghost" onClick={handleCancel}>
          <ArrowLeft size={18} className="mr-2" /> Volver
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl w-full">
        {/* Tabs Navigation */}
        {isEdit && (
          <div className="mb-6">
            <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Col: Content based on active tab */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* Info Tab */}
            {activeTab === "info" && (
              <>
                <Card className="p-6">
                  <form
                    onSubmit={handleSubmit}
                    id="driver-form"
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 text-lg font-semibold text-(--fg) mb-4">
                      <User size={20} className="text-(--brand)" />
                      Información Personal
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Nombre(s) *"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                        placeholder="Ej. Juan"
                      />
                      <Input
                        label="Apellidos *"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleChange("lastName", e.target.value)
                        }
                        placeholder="Ej. Pérez"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="relative">
                        <Input
                          label="Teléfono"
                          value={formData.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          placeholder="55-1234-5678"
                        />
                        <Smartphone
                          className="absolute right-3 top-9 text-(--muted-fg)"
                          size={16}
                        />
                      </div>
                      <div className="relative">
                        <Input
                          label="Correo electrónico"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                          placeholder="juan@ejemplo.com"
                        />
                        <Mail
                          className="absolute right-3 top-9 text-(--muted-fg)"
                          size={16}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Fecha de Nacimiento"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                          handleChange("birthDate", e.target.value)
                        }
                      />
                      <Select
                        label="Estado"
                        value={formData.status}
                        onChange={(v) => handleChange("status", v)}
                        options={DRIVER_STATUS_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-(--fg)">
                        Notas / Observaciones
                      </label>
                      <div className="relative">
                        <textarea
                          className="min-h-25 w-full rounded-lg border border-(--border) bg-(--card) p-3 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all placeholder:text-(--muted-fg)"
                          placeholder="Añade detalles adicionales aquí..."
                          value={formData.notes}
                          onChange={(e) =>
                            handleChange("notes", e.target.value)
                          }
                        />
                        <StickyNote
                          className="absolute right-3 bottom-3 text-(--muted-fg)"
                          size={16}
                        />
                      </div>
                    </div>
                  </form>
                </Card>
              </>
            )}

            {/* Vehicles Tab */}
            {activeTab === "vehicles" && isEdit && (
              <DriverVehicleAssignments
                driverId={id}
                driverName={`${driver?.firstName || ""} ${
                  driver?.lastName || ""
                }`.trim()}
              />
            )}

            {/* Licenses Tab */}
            {activeTab === "licenses" && (
              <DriverLicenseManager driverId={id} groupId={activeGroupId} />
            )}

            {/* Files Tab */}
            {activeTab === "files" && (
              <Card className="p-6">
                <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                  <FileText size={20} className="text-(--brand)" />
                  Documentos y Archivos
                </h3>
                <DriverMediaManager
                  existingFiles={existingFiles}
                  stagedFiles={stagedFiles}
                  onAddStaged={(f) => setStagedFiles((prev) => [...prev, f])}
                  onRemoveStaged={async (fid) => {
                    setStagedFiles((prev) =>
                      prev.filter((f) => f.fileId !== fid)
                    );
                    await deleteDriverFile(null, fid);
                  }}
                  onRemoveExisting={(docId, fileId) =>
                    deleteExistingFileMutation.mutate({ docId, fileId })
                  }
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              </Card>
            )}
          </div>

          {/* Right Col: Actions & Summary */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                <Button
                  type="submit"
                  form="driver-form"
                  loading={mutation.isPending}
                  className="w-full justify-center py-6 text-lg"
                >
                  <Save size={20} className="mr-2" />
                  {isEdit ? "Guardar Cambios" : "Crear Conductor"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="w-full justify-center"
                >
                  Cancelar
                </Button>

                <div className="rounded-lg bg-(--muted)/30 p-4 border border-(--border)">
                  <h4 className="text-sm font-medium text-(--fg) mb-2">
                    Resumen
                  </h4>
                  <div className="space-y-2 text-xs text-(--muted-fg)">
                    <p className="flex justify-between">
                      <span>Nombre:</span>
                      <span className="font-semibold text-(--fg)">
                        {formData.firstName || formData.lastName
                          ? `${formData.firstName} ${formData.lastName}`
                          : "—"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Estado:</span>
                      <span
                        className={cn(
                          "font-semibold",
                          formData.status === "ACTIVE"
                            ? "text-green-500"
                            : "text-amber-500"
                        )}
                      >
                        {formData.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
