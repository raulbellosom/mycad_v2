import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  Car,
  ShieldAlert,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Upload,
  Trash2,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Image as ImageIcon,
  MoreVertical,
  StickyNote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Card } from "../../../../shared/ui/Card";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { ImageViewerModal } from "../../../../shared/ui/ImageViewerModal";
import {
  getMyDriverLicenses,
  getMyDriverFiles,
  updateMyDriverInfo,
  uploadDriverFile,
  registerDriverFile,
  deleteDriverFile,
  getDriverFilePreviewUrl,
} from "../../../auth/services/myProfile.service";
import { env } from "../../../../shared/appwrite/env";
import { getFileDownloadUrl } from "../../../../shared/utils/storage";
import { cn } from "../../../../shared/utils/cn";

// Helper para obtener URL de descarga
function getDriverFileDownloadUrl(fileId) {
  if (!fileId) return null;
  return getFileDownloadUrl(env.bucketVehiclesId, fileId);
}

export function ProfileDriverTab({ profile, driverRecord, onUpdate }) {
  const queryClient = useQueryClient();
  const [expandedLicense, setExpandedLicense] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Query: Licenses
  const { data: licenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ["myDriverLicenses", driverRecord.$id],
    queryFn: () => getMyDriverLicenses(driverRecord.$id),
    enabled: !!driverRecord.$id,
  });

  // Query: Files
  const { data: driverFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["myDriverFiles", driverRecord.$id],
    queryFn: () => getMyDriverFiles(driverRecord.$id),
    enabled: !!driverRecord.$id,
  });

  // Separate photos and docs
  const photos = driverFiles.filter(
    (f) =>
      f.kind === "PHOTO" ||
      f.kind === "LICENSE_FRONT" ||
      f.kind === "LICENSE_BACK"
  );
  const docs = driverFiles.filter(
    (f) => !["PHOTO", "LICENSE_FRONT", "LICENSE_BACK"].includes(f.kind)
  );

  return (
    <div className="space-y-6">
      {/* Driver Info Summary */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <Car size={20} className="text-(--brand)" />
          Información de Conductor
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoItem
            icon={User}
            label="Nombre"
            value={`${driverRecord.firstName} ${driverRecord.lastName}`}
          />
          <InfoItem
            icon={Phone}
            label="Teléfono"
            value={driverRecord.phone || "No registrado"}
          />
          <InfoItem
            icon={Mail}
            label="Correo"
            value={driverRecord.email || "No registrado"}
          />
          <InfoItem
            icon={Calendar}
            label="Fecha de Nacimiento"
            value={
              driverRecord.birthDate
                ? new Date(driverRecord.birthDate).toLocaleDateString("es-MX")
                : "No registrada"
            }
          />
        </div>

        {/* Status Badge */}
        <div className="mt-4 pt-4 border-t border-(--border)">
          <div className="flex items-center gap-2">
            <span className="text-sm text-(--muted-fg)">Estado:</span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
                driverRecord.status === "ACTIVE"
                  ? "bg-green-500/10 text-green-500"
                  : driverRecord.status === "INACTIVE"
                  ? "bg-gray-500/10 text-gray-500"
                  : "bg-amber-500/10 text-amber-500"
              )}
            >
              {driverRecord.status}
            </span>
          </div>

          {driverRecord.notes && (
            <div className="mt-3 rounded-lg bg-(--muted)/20 p-3">
              <p className="text-xs text-(--muted-fg) flex items-center gap-1 mb-1">
                <StickyNote size={12} /> Notas
              </p>
              <p className="text-sm text-(--fg)">{driverRecord.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Licenses */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <ShieldAlert size={20} className="text-(--brand)" />
          Licencias de Conducir
          {licenses.length > 0 && (
            <span className="ml-2 rounded-full bg-(--brand)/10 px-2 py-0.5 text-xs font-bold text-(--brand)">
              {licenses.length}
            </span>
          )}
        </h3>

        {licensesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-(--brand)" />
          </div>
        ) : licenses.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-(--border) p-8 text-center bg-(--muted)/10">
            <ShieldAlert size={32} className="mx-auto mb-2 text-(--muted-fg)" />
            <p className="text-sm text-(--muted-fg)">
              No tienes licencias registradas.
            </p>
            <p className="text-xs text-(--muted-fg) mt-1">
              Contacta a tu administrador para agregar una licencia.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {licenses.map((license) => (
              <LicenseCard
                key={license.$id}
                license={license}
                isExpanded={expandedLicense === license.$id}
                onToggle={() =>
                  setExpandedLicense(
                    expandedLicense === license.$id ? null : license.$id
                  )
                }
              />
            ))}
          </div>
        )}
      </Card>

      {/* Files & Photos */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <FileText size={20} className="text-(--brand)" />
          Documentos y Archivos
        </h3>

        {filesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-(--brand)" />
          </div>
        ) : driverFiles.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-(--border) p-8 text-center bg-(--muted)/10">
            <FileText size={32} className="mx-auto mb-2 text-(--muted-fg)" />
            <p className="text-sm text-(--muted-fg)">
              No tienes documentos registrados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photos Section */}
            {photos.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--fg)">
                  <ImageIcon size={16} className="text-(--brand)" /> Fotos
                </h4>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {photos.map((file) => (
                    <PhotoThumb
                      key={file.$id}
                      file={file}
                      onClick={() => setSelectedImageId(file.fileId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {docs.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--fg)">
                  <FileText size={16} className="text-(--brand)" /> Documentos
                </h4>
                <div className="space-y-2">
                  {docs.map((file) => (
                    <DocItem key={file.$id} file={file} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Image Viewer */}
      {selectedImageId && (
        <ImageViewerModal
          isOpen={!!selectedImageId}
          onClose={() => setSelectedImageId(null)}
          currentImageId={selectedImageId}
          images={photos.map((f) => f.fileId)}
        />
      )}
    </div>
  );
}

// Info Item Component
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-(--brand)/10 flex items-center justify-center text-(--brand)">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-(--muted-fg)">{label}</p>
        <p className="text-sm font-medium text-(--fg)">{value}</p>
      </div>
    </div>
  );
}

// License Card Component
function LicenseCard({ license, isExpanded, onToggle }) {
  const isExpired =
    license.expiresAt && new Date(license.expiresAt) < new Date();
  const isExpiringSoon =
    license.expiresAt &&
    !isExpired &&
    new Date(license.expiresAt) <
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        isExpired
          ? "border-red-500/30 bg-red-500/5"
          : isExpiringSoon
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-(--border)"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              isExpired
                ? "bg-red-500/10 text-red-500"
                : isExpiringSoon
                ? "bg-amber-500/10 text-amber-500"
                : "bg-(--brand)/10 text-(--brand)"
            )}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="font-semibold text-(--fg)">{license.licenseNumber}</p>
            <p className="text-xs text-(--muted-fg)">
              Tipo: {license.licenseType} •{" "}
              {license.state || license.country || "N/A"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpired && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
              VENCIDA
            </span>
          )}
          {isExpiringSoon && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
              POR VENCER
            </span>
          )}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-(--border) p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-(--muted-fg)">Fecha de Emisión</p>
                  <p className="text-sm font-medium text-(--fg)">
                    {license.issuedAt
                      ? new Date(license.issuedAt).toLocaleDateString("es-MX")
                      : "No especificada"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-(--muted-fg)">
                    Fecha de Vencimiento
                  </p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isExpired
                        ? "text-red-500"
                        : isExpiringSoon
                        ? "text-amber-500"
                        : "text-(--fg)"
                    )}
                  >
                    {license.expiresAt
                      ? new Date(license.expiresAt).toLocaleDateString("es-MX")
                      : "No especificada"}
                  </p>
                </div>
              </div>

              {/* License Images */}
              {(license.frontImageId || license.backImageId) && (
                <div className="flex gap-3 pt-2">
                  {license.frontImageId && (
                    <div className="flex-1">
                      <p className="text-xs text-(--muted-fg) mb-1">Frente</p>
                      <img
                        src={getDriverFilePreviewUrl(
                          license.frontImageId,
                          300,
                          200
                        )}
                        alt="Frente de licencia"
                        className="rounded-lg border border-(--border) w-full h-24 object-cover"
                      />
                    </div>
                  )}
                  {license.backImageId && (
                    <div className="flex-1">
                      <p className="text-xs text-(--muted-fg) mb-1">Reverso</p>
                      <img
                        src={getDriverFilePreviewUrl(
                          license.backImageId,
                          300,
                          200
                        )}
                        alt="Reverso de licencia"
                        className="rounded-lg border border-(--border) w-full h-24 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Photo Thumbnail Component
function PhotoThumb({ file, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-(--border) bg-(--card) shadow-sm transition-all hover:border-(--brand)/50"
    >
      <img
        src={getDriverFilePreviewUrl(file.fileId, 200, 200)}
        alt={file.label || "Foto"}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
        <Eye
          size={20}
          className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
      {file.label && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-[10px] text-white truncate">
          {file.label}
        </div>
      )}
    </div>
  );
}

// Document Item Component
function DocItem({ file }) {
  const kindLabels = {
    ID: "Identificación",
    CONTRACT: "Contrato",
    OTHER: "Otro",
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-(--border) p-3 hover:bg-(--muted)/20 transition-all">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-(--muted)/30 flex items-center justify-center text-(--muted-fg)">
          <FileText size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-(--fg)">
            {file.label || "Documento"}
          </p>
          <p className="text-xs text-(--muted-fg)">
            {kindLabels[file.kind] || file.kind}
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          window.open(getDriverFileDownloadUrl(file.fileId), "_blank")
        }
      >
        <Download size={14} />
      </Button>
    </div>
  );
}
