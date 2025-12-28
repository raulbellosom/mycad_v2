import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  FileText,
  Download,
  Eye,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  listVehicleFiles,
  deleteVehicleFile,
  getFilePreview,
  getFileView,
  getFileDownload,
} from "../services/vehicles.service";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { cn } from "../../../shared/utils/cn";

export function VehicleGallery({ vehicleId }) {
  const queryClient = useQueryClient();
  const [selectedImageId, setSelectedImageId] = useState(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["vehicleFiles", vehicleId],
    queryFn: () => listVehicleFiles(vehicleId),
    enabled: !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ docId, fileId }) => deleteVehicleFile(docId, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicleFiles", vehicleId]);
      toast.success("Archivo eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  if (!vehicleId) return null;
  if (isLoading)
    return (
      <div className="py-8 text-center text-(--muted-fg)">
        Cargando archivos...
      </div>
    );

  const images = files.filter((f) => f.isImage);
  const documents = files.filter((f) => !f.isImage);

  const handleOpenViewer = (fileId) => {
    setSelectedImageId(fileId);
  };

  return (
    <div className="mt-8 space-y-8">
      {/* Photos Section */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <ImageIcon size={20} className="text-(--brand)" />
          Fotos del Vehículo
        </h3>
        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-(--border) py-10 text-center text-(--muted-fg)">
            No hay fotos cargadas.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((file) => (
              <div
                key={file.$id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-(--border) bg-(--muted)/50"
              >
                <img
                  src={getFilePreview(file.fileId)}
                  alt={file.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleOpenViewer(file.fileId)}
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 backdrop-blur-sm"
                    title="Ver"
                  >
                    <Eye size={18} />
                  </button>
                  <a
                    href={getFileDownload(file.fileId)}
                    className="rounded-full bg-white/20 p-2 text-white hover:bg-white/40 backdrop-blur-sm"
                    title="Descargar"
                  >
                    <Download size={18} />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar esta foto?")) {
                        deleteMutation.mutate({
                          docId: file.$id,
                          fileId: file.fileId,
                        });
                      }
                    }}
                    className="rounded-full bg-red-500/80 p-2 text-white hover:bg-red-600 backdrop-blur-sm"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <FileText size={20} className="text-(--brand)" />
          Documentos
        </h3>
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-(--border) py-10 text-center text-(--muted-fg)">
            No hay documentos cargados.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((file) => (
              <div
                key={file.$id}
                className="flex items-center justify-between gap-3 rounded-lg border border-(--border) bg-(--muted)/30 p-4 transition-colors hover:bg-(--muted)/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-(--brand)/10 p-2 text-(--brand)">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-(--fg)">
                      {file.name}
                    </p>
                    <p className="text-xs text-(--muted-fg)">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <a
                    href={getFileView(file.fileId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 text-(--muted-fg) hover:bg-(--muted) transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar este documento?")) {
                        deleteMutation.mutate({
                          docId: file.$id,
                          fileId: file.fileId,
                        });
                      }
                    }}
                    className="rounded p-1.5 text-(--muted-fg) hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full screen photo viewer */}
      {selectedImageId && (
        <ImageViewerModal
          currentImageId={selectedImageId}
          images={images.map((img) => img.fileId)}
          isOpen={!!selectedImageId}
          onClose={() => setSelectedImageId(null)}
        />
      )}
    </div>
  );
}
