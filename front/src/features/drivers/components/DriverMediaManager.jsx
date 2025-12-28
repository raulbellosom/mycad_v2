import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Download,
  Eye,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../shared/utils/cn";
import {
  getDriverFilePreview,
  uploadDriverFile,
  deleteDriverFile,
  getDriverFileDownload,
} from "../services/drivers.service";
import toast from "react-hot-toast";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";

export function DriverMediaManager({
  existingFiles = [],
  stagedFiles = [],
  onAddStaged,
  onRemoveStaged,
  onRemoveExisting,
  isUploading = false,
  setIsUploading,
}) {
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      setIsUploading(true);
      for (const file of acceptedFiles) {
        try {
          const res = await uploadDriverFile(file);
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
              Documentación, contratos o fotos adicionales
            </p>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="space-y-6">
        {allPhotos.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--fg)">
              <ImageIcon size={16} className="text-(--brand)" /> Fotos
            </h4>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {allPhotos.map((file) => (
                <div key={file.fileId} className="group relative aspect-square">
                  <div
                    onClick={() => setSelectedImageId(file.fileId)}
                    className="h-full w-full cursor-pointer overflow-hidden rounded-xl border border-(--border) bg-(--card) shadow-sm transition-all hover:border-(--brand)/50"
                  >
                    <img
                      src={getDriverFilePreview(file.fileId)}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Action Menu */}
                  <div className="absolute top-1.5 left-1.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(
                          activeMenuId === file.fileId ? null : file.fileId
                        );
                      }}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full transition-all border border-white/20 shadow-lg active:scale-90",
                        activeMenuId === file.fileId
                          ? "bg-white text-black"
                          : "bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 lg:opacity-0"
                      )}
                    >
                      <MoreVertical size={14} />
                    </button>

                    <AnimatePresence>
                      {activeMenuId === file.fileId && (
                        <motion.div
                          ref={menuRef}
                          initial={{ opacity: 0, scale: 0.9, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 4 }}
                          className="absolute top-8 left-0 z-30 min-w-(--spacing-32) overflow-hidden rounded-xl border border-(--border) bg-(--card)/95 shadow-2xl backdrop-blur-xl"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImageId(file.fileId);
                              setActiveMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-(--fg) hover:bg-(--brand)/10 transition-colors"
                          >
                            <Eye size={14} className="text-(--brand)" /> Ver
                          </button>
                          <div className="h-px bg-(--border)" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (file.$id)
                                onRemoveExisting(file.$id, file.fileId);
                              else onRemoveStaged(file.fileId);
                              setActiveMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={14} /> Eliminar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {/* Staged Indicator */}
                  {!file.$id && (
                    <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white shadow-lg pointer-events-none" />
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
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <FileText
                      size={18}
                      className="shrink-0 text-(--muted-fg)"
                    />
                    <span
                      className="truncate text-xs font-medium text-(--fg)"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = getDriverFileDownload(file.fileId);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = file.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="rounded p-1.5 text-(--muted-fg) hover:bg-(--brand)/10 hover:text-(--brand) transition-colors"
                      title="Descargar"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (file.$id) onRemoveExisting(file.$id, file.fileId);
                        else onRemoveStaged(file.fileId);
                      }}
                      className="rounded p-1.5 text-(--muted-fg) hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                      title="Eliminar"
                    >
                      <X size={16} />
                    </button>
                  </div>
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
