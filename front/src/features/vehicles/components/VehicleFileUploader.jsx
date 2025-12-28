import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { cn } from "../../../shared/utils/cn";
import toast from "react-hot-toast";
import { uploadVehicleFile } from "../services/vehicles.service";

export function VehicleFileUploader({ vehicleId, groupId, onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!vehicleId) {
        toast.error("Guarda el vehículo antes de subir archivos");
        return;
      }

      setIsUploading(true);
      let successCount = 0;

      for (const file of acceptedFiles) {
        try {
          await uploadVehicleFile(vehicleId, groupId, file);
          successCount++;
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Error al subir ${file.name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} archivo(s) subido(s) correctamente`);
        onUploadSuccess?.();
      }

      setIsUploading(false);
    },
    [vehicleId, groupId, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading || !vehicleId,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all hover:bg-(--muted)/50",
        isDragActive ? "border-(--brand) bg-(--brand)/5" : "border-(--border)",
        (!vehicleId || isUploading) && "cursor-not-allowed opacity-60"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-(--brand)/10 p-4 text-(--brand)">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Upload className="h-8 w-8" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium text-(--fg)">
            {isDragActive
              ? "Suelta los archivos aquí"
              : isUploading
              ? "Subiendo archivos..."
              : "Haga clic o arrastre fotos y documentos aquí"}
          </p>
          <p className="mt-1 text-sm text-(--muted-fg)">
            Fotos (JPG, PNG, WEBP) o Documentos (PDF, DOCX)
          </p>
        </div>
        {!vehicleId && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-600">
            <X size={14} /> Primero debes guardar los datos básicos del vehículo
          </p>
        )}
      </div>
    </div>
  );
}
