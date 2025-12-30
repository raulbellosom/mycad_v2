import { useState, useEffect, useMemo, useRef } from "react";
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
  Camera,
  Upload,
  Loader2,
  MoreVertical,
} from "lucide-react";

import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { Select } from "../../../shared/ui/Select";
import { Tabs } from "../../../shared/ui/Tabs";
import { DatePicker } from "../../../shared/ui/DatePicker";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
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
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import {
  getAvatarPreviewUrl,
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
} from "../../auth/services/myProfile.service";
import { updateUserProfile } from "../../users/services/usersAdmin.service";
import { env } from "../../../shared/appwrite/env";
import { cn } from "../../../shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

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
  const { profile } = useAuth();

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
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const menuRef = useRef(null);

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

  // Close avatar menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };
    if (showAvatarMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAvatarMenu]);

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
      const data = {
        firstName: driver.firstName || "",
        lastName: driver.lastName || "",
        phone: driver.phone || "",
        email: driver.email || "",
        birthDate: driver.birthDate
          ? new Date(driver.birthDate).toISOString().split("T")[0]
          : "",
        notes: driver.notes || "",
        status: driver.status || "ACTIVE",
      };
      setFormData(data);
      setInitialFormData(data);
    }
  }, [driver]);

  // Detect if form has changes
  const hasChanges = useMemo(() => {
    if (!initialFormData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  const deleteExistingFileMutation = useMutation({
    mutationFn: ({ docId, fileId }) =>
      deleteDriverFile(docId, fileId, {
        profileId: profile?.$id,
        groupId: activeGroupId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["driverFiles", id]);
      toast.success("Archivo eliminado");
    },
  });

  // Avatar mutations
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!driver?.linkedProfile?.$id) {
        throw new Error("No hay perfil vinculado");
      }
      const oldFileId = driver.linkedProfile.avatarFileId;
      await updateUserProfile(driver.linkedProfile.$id, { avatarFileId: null });
      if (oldFileId) {
        await deleteAvatar(oldFileId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["driver", id]);
      setShowAvatarMenu(false);
      toast.success("Foto eliminada");
    },
    onError: (e) => {
      toast.error(e.message || "Error al eliminar foto");
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      let driverDoc;
      const auditInfo = {
        profileId: profile?.$id,
        groupId: activeGroupId,
      };

      if (isEdit) {
        driverDoc = await updateDriver(id, data, auditInfo);
      } else {
        driverDoc = await createDriver(
          {
            ...data,
            groupId: activeGroupId,
          },
          auditInfo
        );
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
            file.name,
            auditInfo
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    if (!driver?.linkedProfile?.$id) {
      toast.error("No hay perfil vinculado a este conductor");
      return;
    }

    setIsUploadingAvatar(true);
    setShowAvatarMenu(false);
    const toastId = toast.loading("Subiendo foto...");

    try {
      const oldFileId = driver.linkedProfile.avatarFileId;
      const uploaded = await uploadAvatar(file);
      await updateUserProfile(driver.linkedProfile.$id, {
        avatarFileId: uploaded.$id,
      });
      if (oldFileId) {
        await deleteAvatar(oldFileId);
      }
      queryClient.invalidateQueries(["driver", id]);
      toast.success("Foto actualizada", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Error al subir foto", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
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
                      <DatePicker
                        label="Fecha de Nacimiento"
                        value={formData.birthDate}
                        onChange={(value) => handleChange("birthDate", value)}
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
            {/* Driver Avatar */}
            {isEdit && driver?.linkedProfile && (
              <Card className="p-6 overflow-visible">
                <div className="flex flex-col items-center gap-3">
                  {/* Avatar container with menu */}
                  <div className="relative" ref={menuRef}>
                    {/* Hidden file input */}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />

                    {/* Avatar image */}
                    <div
                      className={cn(
                        "relative h-32 w-32 rounded-full overflow-hidden ring-4 ring-(--border)",
                        isUploadingAvatar && "opacity-50",
                        driver.linkedProfile.avatarFileId && "cursor-pointer"
                      )}
                      onClick={() => {
                        if (
                          driver.linkedProfile.avatarFileId &&
                          !isUploadingAvatar
                        ) {
                          setShowAvatarViewer(true);
                        }
                      }}
                    >
                      {driver.linkedProfile.avatarFileId ? (
                        <img
                          src={getAvatarPreviewUrl(
                            driver.linkedProfile.avatarFileId,
                            200
                          )}
                          alt={`${driver.firstName} ${driver.lastName}`}
                          className="h-full w-full object-cover transition-all group-hover:ring-(--brand)"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-(--brand)/10 text-(--brand)">
                          <User size={48} />
                        </div>
                      )}
                    </div>

                    {/* Loading overlay */}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}

                    {/* Camera/Menu button */}
                    <button
                      onClick={() => {
                        if (driver.linkedProfile.avatarFileId) {
                          setShowAvatarMenu(!showAvatarMenu);
                        } else {
                          avatarInputRef.current?.click();
                        }
                      }}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-(--brand) text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                    >
                      {driver.linkedProfile.avatarFileId ? (
                        <MoreVertical size={18} />
                      ) : (
                        <Camera size={18} />
                      )}
                    </button>

                    {/* Avatar menu */}
                    <AnimatePresence>
                      {showAvatarMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 4 }}
                          className="absolute top-full left-0 mt-2 w-44 rounded-xl border border-(--border) bg-(--card) shadow-xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              setShowAvatarMenu(false);
                              setShowAvatarViewer(true);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
                          >
                            <User size={16} className="text-(--brand)" />
                            Ver foto
                          </button>
                          <div className="h-px bg-(--border)" />
                          <button
                            onClick={() => {
                              setShowAvatarMenu(false);
                              avatarInputRef.current?.click();
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
                          >
                            <Upload size={16} className="text-(--brand)" />
                            Cambiar foto
                          </button>
                          <div className="h-px bg-(--border)" />
                          <button
                            onClick={() => deleteAvatarMutation.mutate()}
                            disabled={deleteAvatarMutation.isPending}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Eliminar foto
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Driver info */}
                  <div className="text-center">
                    <h3 className="font-semibold text-(--fg)">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-sm text-(--muted-fg)">
                      {driver.email || "Sin correo"}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                <Button
                  type="submit"
                  form="driver-form"
                  loading={mutation.isPending}
                  disabled={!hasChanges && isEdit}
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

      {/* Avatar Viewer Modal */}
      {isEdit && driver?.linkedProfile?.avatarFileId && (
        <ImageViewerModal
          isOpen={showAvatarViewer}
          onClose={() => setShowAvatarViewer(false)}
          currentImageId={driver.linkedProfile.avatarFileId}
          images={[driver.linkedProfile.avatarFileId]}
          bucketId={env.bucketAvatarsId}
        />
      )}
    </PageLayout>
  );
}
