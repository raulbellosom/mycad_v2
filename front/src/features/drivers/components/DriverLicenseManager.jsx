import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Calendar,
  Layers,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listDriverLicenses,
  createDriverLicense,
  updateDriverLicense,
  uploadDriverFile,
  getDriverFilePreview,
} from "../services/drivers.service";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Select } from "../../../shared/ui/Select";
import { DatePicker } from "../../../shared/ui/DatePicker";
import { Card } from "../../../shared/ui/Card";
import { cn } from "../../../shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../auth/hooks/useAuth";

const LICENSE_TYPE_OPTIONS = [
  { value: "A", label: "Tipo A - Motocicletas" },
  { value: "A1", label: "Tipo A1 - Motocicletas hasta 125cc" },
  { value: "A2", label: "Tipo A2 - Motocicletas hasta 400cc" },
  { value: "B", label: "Tipo B - Automóviles particulares" },
  { value: "C", label: "Tipo C - Camiones de carga" },
  { value: "D", label: "Tipo D - Transporte de pasajeros" },
  { value: "E", label: "Tipo E - Tractocamiones con remolque" },
  { value: "E1", label: "Tipo E1 - Tractocamiones articulados" },
];

export function DriverLicenseManager({ driverId, groupId }) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ["driverLicenses", driverId],
    queryFn: () => listDriverLicenses(driverId),
    enabled: !!driverId,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      createDriverLicense(
        { ...data, driverId, groupId },
        { profileId: profile?.$id, groupId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["driverLicenses", driverId]);
      setIsAdding(false);
      toast.success("Licencia añadida");
    },
  });

  if (!driverId) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <ShieldAlert size={20} className="text-(--brand)" />
          Licencias de Conducir
        </h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus size={16} className="mr-1" /> Añadir Nueva
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {isAdding && (
          <LicenseForm
            onCancel={() => setIsAdding(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isPending={createMutation.isPending}
          />
        )}

        {licenses.length === 0 && !isAdding && (
          <div className="rounded-xl border-2 border-dashed border-(--border) p-8 text-center bg-(--muted)/10">
            <p className="text-sm text-(--muted-fg)">
              No hay licencias registradas aún.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {licenses.map((license) => (
            <LicenseItem
              key={license.$id}
              license={license}
              isExpanded={expandedId === license.$id}
              onToggle={() =>
                setExpandedId(expandedId === license.$id ? null : license.$id)
              }
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function LicenseForm({ onCancel, onSubmit, isPending, initialData = {} }) {
  const [data, setData] = useState({
    licenseNumber: initialData.licenseNumber || "",
    licenseType: initialData.licenseType || "A",
    country: initialData.country || "MX",
    state: initialData.state || "",
    issuedAt: initialData.issuedAt
      ? new Date(initialData.issuedAt).toISOString().split("T")[0]
      : "",
    expiresAt: initialData.expiresAt
      ? new Date(initialData.expiresAt).toISOString().split("T")[0]
      : "",
    frontImageId: initialData.frontImageId || "",
    backImageId: initialData.backImageId || "",
  });

  const [previews, setPreviews] = useState({
    front: initialData.frontImageId
      ? getDriverFilePreview(initialData.frontImageId)
      : null,
    back: initialData.backImageId
      ? getDriverFilePreview(initialData.backImageId)
      : null,
  });

  const handleFileUpload = async (side, file) => {
    if (!file) return;
    const toastId = toast.loading(
      `Subiendo foto ${side === "front" ? "frontal" : "trasera"}...`
    );
    try {
      const res = await uploadDriverFile(file);
      setData((prev) => ({
        ...prev,
        [side === "front" ? "frontImageId" : "backImageId"]: res.$id,
      }));
      setPreviews((prev) => ({
        ...prev,
        [side]: getDriverFilePreview(res.$id),
      }));
      toast.success("Foto subida", { id: toastId });
    } catch (error) {
      toast.error("Error al subir foto", { id: toastId });
    }
  };

  return (
    <div className="rounded-xl border border-(--brand)/20 bg-(--brand)/5 p-5 animate-in fade-in slide-in-from-top-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Número de Licencia *"
          value={data.licenseNumber}
          onChange={(e) =>
            setData((prev) => ({ ...prev, licenseNumber: e.target.value }))
          }
        />
        <Select
          label="Tipo *"
          options={LICENSE_TYPE_OPTIONS}
          value={data.licenseType}
          onChange={(v) => setData((prev) => ({ ...prev, licenseType: v }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4">
        <Input
          label="País (Código)"
          placeholder="MX"
          value={data.country}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              country: e.target.value.toUpperCase().slice(0, 2),
            }))
          }
        />
        <Input
          label="Estado"
          placeholder="JAL"
          value={data.state}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              state: e.target.value.toUpperCase(),
            }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4">
        <DatePicker
          label="Fecha de Emisión"
          value={data.issuedAt}
          onChange={(value) =>
            setData((prev) => ({ ...prev, issuedAt: value }))
          }
        />
        <DatePicker
          label="Fecha de Vencimiento"
          value={data.expiresAt}
          onChange={(value) =>
            setData((prev) => ({ ...prev, expiresAt: value }))
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-(--muted-fg) uppercase">
            Frente de Licencia
          </label>
          <div className="group relative aspect-[1.6/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-(--border) bg-(--card) transition-all hover:border-(--brand)/50">
            {previews.front ? (
              <img
                src={previews.front}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-(--muted-fg)">
                <ImageIcon size={24} />
                <span className="text-[10px]">Click para subir frente</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => handleFileUpload("front", e.target.files[0])}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-(--muted-fg) uppercase">
            Reverso de Licencia
          </label>
          <div className="group relative aspect-[1.6/1] w-full overflow-hidden rounded-lg border-2 border-dashed border-(--border) bg-(--card) transition-all hover:border-(--brand)/50">
            {previews.back ? (
              <img src={previews.back} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-(--muted-fg)">
                <ImageIcon size={24} />
                <span className="text-[10px]">Click para subir reverso</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => handleFileUpload("back", e.target.files[0])}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 border-t border-(--brand)/10 pt-5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button size="sm" onClick={() => onSubmit(data)} loading={isPending}>
          Guardar Licencia
        </Button>
      </div>
    </div>
  );
}

function LicenseItem({ license, isExpanded, onToggle }) {
  const isExpired =
    license.expiresAt && new Date(license.expiresAt) < new Date();

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-all",
        isExpanded
          ? "border-(--brand) bg-(--brand)/5"
          : "border-(--border) bg-(--card) hover:border-(--brand)/30"
      )}
    >
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border",
              isExpired
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : "bg-(--brand)/10 border-(--brand)/20 text-(--brand)"
            )}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-(--fg)">
                {license.licenseNumber}
              </span>
              <span className="rounded-full bg-(--muted) px-2 py-0.5 text-[10px] uppercase font-bold text-(--muted-fg)">
                {license.licenseType}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-(--muted-fg) mt-0.5">
              <span className="flex items-center gap-1">
                <Globe size={12} /> {license.country} - {license.state}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {isExpired
                  ? "Vencida"
                  : `Vence: ${new Date(
                      license.expiresAt
                    ).toLocaleDateString()}`}
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-(--muted-fg)" />
        ) : (
          <ChevronDown size={20} className="text-(--muted-fg)" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-(--brand)/10"
          >
            <div className="p-4 grid gap-4 sm:grid-cols-2 bg-black/5">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-(--muted-fg) uppercase">
                  Frente
                </p>
                {license.frontImageId ? (
                  <img
                    src={getDriverFilePreview(license.frontImageId)}
                    className="aspect-[1.6/1] w-full rounded-lg object-cover border border-(--border)"
                  />
                ) : (
                  <div className="aspect-[1.6/1] w-full rounded-lg bg-(--muted)/20 flex items-center justify-center text-xs text-(--muted-fg)">
                    No disponible
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-(--muted-fg) uppercase">
                  Reverso
                </p>
                {license.backImageId ? (
                  <img
                    src={getDriverFilePreview(license.backImageId)}
                    className="aspect-[1.6/1] w-full rounded-lg object-cover border border-(--border)"
                  />
                ) : (
                  <div className="aspect-[1.6/1] w-full rounded-lg bg-(--muted)/20 flex items-center justify-center text-xs text-(--muted-fg)">
                    No disponible
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end p-3 bg-black/5">
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500 hover:bg-red-500/10"
              >
                <Trash2 size={14} className="mr-1" /> Eliminar Licencia
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
