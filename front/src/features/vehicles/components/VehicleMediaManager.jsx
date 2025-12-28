import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Download,
  Eye,
} from "lucide-react";
import { cn } from "../../../shared/utils/cn";
import {
  getFilePreview,
  uploadFileToStorage,
  deleteVehicleFile,
} from "../services/vehicles.service";
import toast from "react-hot-toast";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";

export function VehicleMediaManager({
  existingFiles = [],
  stagedFiles = [],
  onAddStaged,
  onRemoveStaged,
  onRemoveExisting,
  isUploading = false,
  setIsUploading,
}) {
  const [selectedImageId, setSelectedImageId] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setIsUploading(true);
      for (const file of acceptedFiles) {
        try {
          const res = await uploadFileToStorage(file);
          onAddStaged({
            fileId: res.$id,
            name: file.name,
            type: file.type,
            size: file.size,
            isImage: file.type.startsWith("image/"),
          });
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Error al subir ${file.name}`);
        }
      }
      setIsUploading(false);
    },
    [onAddStaged, setIsUploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif", ".svg"],
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/zip": [".zip"],
      "application/x-rar-compressed": [".rar"],
    },
  });

  const allPhotos = [
    ...existingFiles.filter((f) => f.isImage),
    ...stagedFiles.filter((f) => f.isImage),
  ];

  const allDocs = [
    ...existingFiles.filter((f) => !f.isImage),
    ...stagedFiles.filter((f) => !f.isImage),
  ];

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all hover:bg-(--muted)/50",
          isDragActive
            ? "border-(--brand) bg-(--brand)/5"
            : "border-(--border)",
          isUploading && "cursor-not-allowed opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="rounded-full bg-(--brand)/10 p-3 text-(--brand)">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-(--fg)">
              {isDragActive
                ? "Suelta para subir"
                : "Arrastra o haz clic para subir fotos y documentos"}
            </p>
            <p className="text-xs text-(--muted-fg)">
              Fotos (JPG, PNG, SVG) o Documentos (PDF, MD, DOCX, XLSX)
            </p>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="space-y-6">
        {/* Photos Grid */}
        {allPhotos.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--fg)">
              <ImageIcon size={16} className="text-(--brand)" /> Fotos
            </h4>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {allPhotos.map((file) => (
                <div
                  key={file.fileId}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-(--border) bg-(--muted)/30"
                >
                  <img
                    src={getFilePreview(file.fileId)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setSelectedImageId(file.fileId)}
                      className="rounded-full bg-white/20 p-1.5 text-white hover:bg-white/40 backdrop-blur-sm"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (file.$id) onRemoveExisting(file.$id, file.fileId);
                        else onRemoveStaged(file.fileId);
                      }}
                      className="rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-600 backdrop-blur-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {/* Staged Indicator */}
                  {!file.$id && (
                    <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents List */}
        {allDocs.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--fg)">
              <FileText size={16} className="text-(--brand)" /> Documentos
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {allDocs.map((file) => (
                <div
                  key={file.fileId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-(--border) bg-(--muted)/20 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={18} className="text-(--muted-fg)" />
                    <span className="truncate text-xs font-medium text-(--fg)">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (file.$id) onRemoveExisting(file.$id, file.fileId);
                      else onRemoveStaged(file.fileId);
                    }}
                    className="rounded p-1 text-(--muted-fg) hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {selectedImageId && (
        <ImageViewerModal
          currentImageId={selectedImageId}
          images={allPhotos.map((p) => p.fileId)}
          isOpen={!!selectedImageId}
          onClose={() => setSelectedImageId(null)}
        />
      )}
    </div>
  );
}
