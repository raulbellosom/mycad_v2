import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { Button } from "../../../../shared/ui/Button";
import { useDropzone } from "react-dropzone";

/**
 * Sección de archivos adjuntos para reportes
 * Soporta drag & drop, preview de imágenes y descarga
 */
export function ReportFilesSection({
  files = [],
  onUpload,
  onDelete,
  getPreviewUrl,
  getDownloadUrl,
  disabled = false,
  isUploading = false,
  title = "Archivos Adjuntos",
  maxFiles = 10,
  acceptedTypes = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  },
}) {
  const [previewImage, setPreviewImage] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (disabled || isUploading) return;
      acceptedFiles.forEach((file) => {
        onUpload?.(file);
      });
    },
    [onUpload, disabled, isUploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles: maxFiles - files.length,
    disabled: disabled || isUploading || files.length >= maxFiles,
  });

  const isImage = (mimeType) => {
    return mimeType?.startsWith("image/");
  };

  const getFileIcon = (mimeType) => {
    if (isImage(mimeType)) return ImageIcon;
    return FileText;
  };

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-(--border) bg-(--muted)/30">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-(--brand)" />
          <h3 className="font-semibold text-(--fg)">{title}</h3>
          <span className="text-sm text-(--muted-fg)">
            ({files.length}/{maxFiles})
          </span>
        </div>
      </div>

      {/* Dropzone */}
      {!disabled && files.length < maxFiles && (
        <div className="p-4 border-b border-(--border)">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200
              ${
                isDragActive
                  ? "border-(--brand) bg-(--brand)/5"
                  : "border-(--border) hover:border-(--brand)/50 hover:bg-(--muted)/30"
              }
              ${isUploading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <input {...getInputProps()} />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-(--brand) animate-spin" />
                <p className="text-sm text-(--muted-fg)">Subiendo archivo...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-(--brand)" />
                <p className="text-sm text-(--brand) font-medium">
                  Suelta los archivos aquí
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-(--muted-fg)" />
                <div>
                  <p className="text-sm font-medium text-(--fg)">
                    Arrastra archivos aquí o{" "}
                    <span className="text-(--brand)">selecciona</span>
                  </p>
                  <p className="text-xs text-(--muted-fg) mt-1">
                    PNG, JPG, PDF, DOC (máx. {maxFiles} archivos)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Files Grid */}
      <div className="p-4">
        {files.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {files.map((file) => (
                <FileCard
                  key={file.$id || file.id}
                  file={file}
                  previewUrl={getPreviewUrl?.(file.fileId)}
                  downloadUrl={getDownloadUrl?.(file.fileId)}
                  onPreview={() =>
                    isImage(file.mimeType || file.type) &&
                    setPreviewImage(getPreviewUrl?.(file.fileId))
                  }
                  onDelete={() => onDelete?.(file.$id || file.id, file.fileId)}
                  disabled={disabled}
                  isImage={isImage(file.mimeType || file.type)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-(--muted-fg)/50 mb-2" />
            <p className="text-sm text-(--muted-fg)">
              No hay archivos adjuntos
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setPreviewImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * Card individual para cada archivo
 */
function FileCard({
  file,
  previewUrl,
  downloadUrl,
  onPreview,
  onDelete,
  disabled,
  isImage,
}) {
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative rounded-xl border border-(--border) bg-(--card) overflow-hidden"
    >
      {/* Preview / Icon */}
      <div className="aspect-square bg-(--muted) flex items-center justify-center overflow-hidden">
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name || "Archivo"}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="h-10 w-10 text-(--muted-fg)" />
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-(--fg) truncate">
          {file.name || file.label || "Archivo"}
        </p>
      </div>

      {/* Overlay con acciones */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {isImage && (
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {downloadUrl && (
          <Button variant="secondary" size="icon" className="h-8 w-8" asChild>
            <a href={downloadUrl} download target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
        {!disabled && (
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Versión simplificada para staging de archivos (antes de guardar)
 */
export function ReportFilesStagingSection({
  stagedFiles = [],
  onAdd,
  onRemove,
  disabled = false,
  title = "Archivos a Subir",
}) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        onAdd?.(file);
      });
    },
    [onAdd]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    disabled,
  });

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-(--border) bg-(--muted)/30">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-(--brand)" />
          <h3 className="font-semibold text-(--fg)">{title}</h3>
          <span className="text-sm text-(--muted-fg)">
            ({stagedFiles.length})
          </span>
        </div>
      </div>

      {!disabled && (
        <div className="p-4 border-b border-(--border)">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200
              ${
                isDragActive
                  ? "border-(--brand) bg-(--brand)/5"
                  : "border-(--border) hover:border-(--brand)/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto text-(--muted-fg) mb-2" />
            <p className="text-sm text-(--muted-fg)">
              {isDragActive
                ? "Suelta aquí"
                : "Arrastra archivos o haz clic para seleccionar"}
            </p>
          </div>
        </div>
      )}

      <div className="p-4">
        {stagedFiles.length > 0 ? (
          <div className="space-y-2">
            {stagedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-(--muted)/50"
              >
                {file.type?.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <FileText className="h-10 w-10 text-(--muted-fg)" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--fg) truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-(--muted-fg)">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-(--muted-fg) hover:text-red-600"
                    onClick={() => onRemove?.(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-(--muted-fg) text-center py-4">
            No hay archivos seleccionados
          </p>
        )}
      </div>
    </Card>
  );
}
