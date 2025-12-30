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
import { ImageViewerModal } from "../../../../shared/ui/ImageViewerModal";
import { env } from "../../../../shared/appwrite/env";
import { cn } from "../../../../shared/utils/cn";

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
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Función helper para detectar si es imagen
  const isImageFile = (f) => {
    const mimeType = f.file?.mimeType || "";
    const name = f.file?.name || f.name || "";
    return (
      mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
    );
  };

  // Separar imágenes y documentos
  const imageFiles = files.filter(isImageFile);
  const documentFiles = files.filter((f) => !isImageFile(f));

  // Obtener lista de IDs de imágenes para el visor
  const imageFileIds = imageFiles
    .map((f) => f.file?.storageFileId)
    .filter(Boolean);

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

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      {!disabled && files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? "border-(--brand) bg-(--brand)/5"
                : "border-(--border) hover:border-(--brand)/50 hover:bg-(--muted)/30"
            }
            ${isUploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <input {...getInputProps()} style={{ display: "none" }} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-(--brand) animate-spin" />
              <p className="text-sm text-(--muted-fg)">Subiendo archivo...</p>
            </div>
          ) : isDragActive ? (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-(--brand)" />
              <p className="text-sm text-(--brand) font-medium">
                Suelta los archivos aquí
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-(--muted-fg)" />
              <div>
                <p className="text-sm font-medium text-(--fg)">
                  Haga clic o arrastre fotos y documentos aquí
                </p>
                <p className="text-xs text-(--muted-fg) mt-1">
                  Fotos (JPG, PNG, WEBP) o Documentos (PDF, DOCX)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {files.length === 0 && !isUploading && (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-(--border) bg-(--card)">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--muted)/50">
            <FileText size={32} className="text-(--muted-fg)" />
          </div>
          <h3 className="text-lg font-semibold text-(--fg)">Sin archivos</h3>
          <p className="mt-1 text-sm text-(--muted-fg)">
            No hay archivos adjuntos en este reporte.
          </p>
        </div>
      )}

      {/* Sección de Fotos */}
      {imageFiles.length > 0 && (
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
            <ImageIcon size={20} className="text-(--brand)" />
            Fotos ({imageFiles.length})
          </h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {imageFiles.map((file) => {
                const storageFileId = file.file?.storageFileId;
                const previewUrl = storageFileId
                  ? getPreviewUrl?.(storageFileId)
                  : null;
                const downloadUrl = storageFileId
                  ? getDownloadUrl?.(storageFileId)
                  : null;
                return (
                  <FileCard
                    key={file.$id || file.id}
                    file={file.file || file}
                    previewUrl={previewUrl}
                    downloadUrl={downloadUrl}
                    isImage={true}
                    onPreview={() =>
                      storageFileId && setSelectedImageId(storageFileId)
                    }
                    onDelete={() =>
                      onDelete?.(file.$id || file.id, storageFileId)
                    }
                    disabled={disabled}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Sección de Documentos */}
      {documentFiles.length > 0 && (
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
            <FileText size={20} className="text-(--brand)" />
            Documentos ({documentFiles.length})
          </h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {documentFiles.map((file) => {
                const storageFileId = file.file?.storageFileId;
                const downloadUrl = storageFileId
                  ? getDownloadUrl?.(storageFileId)
                  : null;
                return (
                  <FileCard
                    key={file.$id || file.id}
                    file={file.file || file}
                    previewUrl={null}
                    downloadUrl={downloadUrl}
                    isImage={false}
                    onPreview={() => {}}
                    onDelete={() =>
                      onDelete?.(file.$id || file.id, storageFileId)
                    }
                    disabled={disabled}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        currentImageId={selectedImageId}
        images={imageFileIds}
        isOpen={!!selectedImageId}
        onClose={() => setSelectedImageId(null)}
        bucketId={env.bucketVehiclesId}
      />
    </div>
  );
}

/**
 * Card individual para cada archivo
 */
function FileCard({
  file,
  previewUrl,
  downloadUrl,
  isImage,
  onPreview,
  onDelete,
  disabled,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showImage = isImage && previewUrl && imageLoaded && !imageError;
  const isLoadingImage = isImage && previewUrl && !imageLoaded && !imageError;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-xl border border-(--border) bg-(--card) transition-shadow hover:shadow-lg"
    >
      {/* Preview Area */}
      <div
        className={cn(
          "relative flex h-32 items-center justify-center overflow-hidden",
          showImage ? "bg-gray-100 dark:bg-gray-800" : "bg-(--muted)/50"
        )}
      >
        {isImage && previewUrl && !imageError && (
          <img
            src={previewUrl}
            alt={file.name || file.label || "Archivo"}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0 absolute"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {/* Loader mientras carga la imagen */}
        {/* Loader mientras carga la imagen */}
        {isLoadingImage && (
          <Loader2 size={24} className="animate-spin text-(--muted-fg)" />
        )}
        {/* Ícono de documento si no es imagen, hay error, o no hay URL */}
        {(!isImage || imageError || !previewUrl) && !isLoadingImage && (
          <FileText size={40} className="text-(--muted-fg)" />
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          {showImage && (
            <button
              onClick={onPreview}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              title="Ver"
            >
              <Eye size={18} />
            </button>
          )}
          {downloadUrl && (
            <button
              onClick={() => window.open(downloadUrl, "_blank")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              title="Descargar"
            >
              <Download size={18} />
            </button>
          )}
          {!disabled && (
            <button
              onClick={onDelete}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/80 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="p-3">
        <p
          className="truncate text-sm font-medium text-(--fg)"
          title={file.name || file.label}
        >
          {file.name || file.label || "Archivo"}
        </p>
        <p className="text-xs text-(--muted-fg)">
          {file.sizeBytes ? `${(file.sizeBytes / 1024).toFixed(1)} KB` : "—"}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Card para archivos existentes con estado de carga de imagen
 */
function ExistingFileCard({
  fileRecord,
  previewUrl,
  downloadUrl,
  isImage,
  onPreview,
  onRemove,
  disabled,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const showImage = isImage && previewUrl && imageLoaded && !imageError;
  const isLoadingImage = isImage && previewUrl && !imageLoaded && !imageError;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-xl border border-(--border) bg-(--card) transition-shadow hover:shadow-lg"
    >
      {/* Preview Area */}
      <div
        className={cn(
          "relative flex h-32 items-center justify-center overflow-hidden",
          showImage ? "bg-gray-100 dark:bg-gray-800" : "bg-(--muted)/50"
        )}
      >
        {isImage && previewUrl && !imageError && (
          <img
            src={previewUrl}
            alt={fileRecord?.name || fileRecord?.label || "Archivo"}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0 absolute"
            )}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {/* Loader mientras carga la imagen */}
        {isLoadingImage && (
          <Loader2 size={24} className="animate-spin text-(--muted-fg)" />
        )}
        {/* Ícono de documento si no es imagen, hay error, o no hay URL */}
        {(!isImage || imageError || !previewUrl) && !isLoadingImage && (
          <FileText size={40} className="text-(--muted-fg)" />
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          {showImage && (
            <button
              onClick={onPreview}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              title="Ver"
            >
              <Eye size={18} />
            </button>
          )}
          {downloadUrl && (
            <button
              onClick={() => window.open(downloadUrl, "_blank")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              title="Descargar"
            >
              <Download size={18} />
            </button>
          )}
          {!disabled && (
            <button
              onClick={onRemove}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/80 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* File Info */}
      <div className="p-3">
        <p
          className="truncate text-sm font-medium text-(--fg)"
          title={fileRecord?.name || fileRecord?.label}
        >
          {fileRecord?.name || fileRecord?.label || "Archivo"}
        </p>
        <p className="text-xs text-(--muted-fg)">
          {fileRecord?.sizeBytes
            ? `${(fileRecord.sizeBytes / 1024).toFixed(1)} KB`
            : "—"}
        </p>
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
            <input {...getInputProps()} style={{ display: "none" }} />
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

/**
 * Versión para edición que combina archivos existentes y nuevos
 */
export function ReportFilesEditSection({
  existingFiles = [],
  stagedFiles = [],
  onAddStaged,
  onRemoveStaged,
  onRemoveExisting,
  getFilePreviewUrl,
  getFileDownloadUrl,
  disabled = false,
  title = "Archivos Adjuntos",
}) {
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Función helper para detectar si es imagen
  const isImageFile = (f) => {
    const mimeType = f.file?.mimeType || "";
    const name = f.file?.name || f.name || "";
    return (
      mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name)
    );
  };

  // Separar existingFiles en imágenes y documentos
  const existingImages = existingFiles.filter(isImageFile);
  const existingDocuments = existingFiles.filter((f) => !isImageFile(f));

  // Obtener lista de IDs de archivos existentes que son imágenes
  const imageFileIds = existingImages
    .map((f) => f.file?.storageFileId)
    .filter(Boolean);

  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        onAddStaged?.(file);
      });
    },
    [onAddStaged]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    disabled,
  });

  const totalFiles = existingFiles.length + stagedFiles.length;

  return (
    <div className="space-y-6">
      {/* Dropzone para nuevos archivos */}
      {!disabled && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragActive
                ? "border-(--brand) bg-(--brand)/5"
                : "border-(--border) hover:border-(--brand)/50"
            }
          `}
        >
          <input {...getInputProps()} style={{ display: "none" }} />
          <Upload className="h-10 w-10 mx-auto text-(--muted-fg) mb-2" />
          <p className="text-sm font-medium text-(--fg)">
            {isDragActive
              ? "Suelta los archivos aquí"
              : "Haga clic o arrastre fotos y documentos aquí"}
          </p>
          <p className="text-xs text-(--muted-fg) mt-1">
            Fotos (JPG, PNG, WEBP) o Documentos (PDF, DOCX)
          </p>
        </div>
      )}

      {totalFiles === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-(--border) bg-(--card)">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--muted)/50">
            <FileText size={32} className="text-(--muted-fg)" />
          </div>
          <h3 className="text-lg font-semibold text-(--fg)">Sin archivos</h3>
          <p className="mt-1 text-sm text-(--muted-fg)">
            No hay archivos adjuntos en este reporte.
          </p>
        </div>
      )}

      {/* Sección de Fotos Existentes */}
      {existingImages.length > 0 && (
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
            <ImageIcon size={20} className="text-(--brand)" />
            Fotos ({existingImages.length})
          </h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {existingImages.map((fileRecord) => {
              const storageFileId = fileRecord.file?.storageFileId;
              const previewUrl = storageFileId
                ? getFilePreviewUrl?.(storageFileId)
                : null;
              const downloadUrl = storageFileId
                ? getFileDownloadUrl?.(storageFileId)
                : null;

              return (
                <ExistingFileCard
                  key={fileRecord.$id}
                  fileRecord={fileRecord.file || fileRecord}
                  previewUrl={previewUrl}
                  downloadUrl={downloadUrl}
                  isImage={true}
                  onPreview={() =>
                    storageFileId && setSelectedImageId(storageFileId)
                  }
                  onRemove={() => onRemoveExisting?.(fileRecord.$id)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Sección de Documentos Existentes */}
      {existingDocuments.length > 0 && (
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
            <FileText size={20} className="text-(--brand)" />
            Documentos ({existingDocuments.length})
          </h3>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {existingDocuments.map((fileRecord) => {
              const storageFileId = fileRecord.file?.storageFileId;
              const downloadUrl = storageFileId
                ? getFileDownloadUrl?.(storageFileId)
                : null;

              return (
                <ExistingFileCard
                  key={fileRecord.$id}
                  fileRecord={fileRecord.file || fileRecord}
                  previewUrl={null}
                  downloadUrl={downloadUrl}
                  isImage={false}
                  onPreview={() => {}}
                  onRemove={() => onRemoveExisting?.(fileRecord.$id)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Archivos nuevos (staged) */}
      {stagedFiles.length > 0 && (
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
            <Upload size={20} className="text-(--brand)" />
            Archivos Nuevos ({stagedFiles.length})
          </h3>
          <div className="space-y-2">
            {stagedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-(--brand)/5 border border-(--brand)/20"
              >
                {file.type?.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-(--muted)/50">
                    <FileText size={24} className="text-(--brand)" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--fg) truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-(--muted-fg)">
                    {(file.size / 1024).toFixed(1)} KB • Nuevo
                  </p>
                </div>
                {!disabled && (
                  <button
                    onClick={() => onRemoveStaged?.(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-(--muted-fg) hover:bg-red-600/10 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        currentImageId={selectedImageId}
        images={imageFileIds}
        isOpen={!!selectedImageId}
        onClose={() => setSelectedImageId(null)}
        bucketId={env.bucketVehiclesId}
      />
    </div>
  );
}
