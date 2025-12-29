import { motion } from "framer-motion";
import { Car, Gauge, Calendar, Hash, Palette } from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { env } from "../../../../shared/appwrite/env";
import { getFilePreviewUrl } from "../../../../shared/utils/storage";

/**
 * Card que muestra la información del vehículo en reportes
 * Diseño elegante y compacto con imagen
 */
export function VehicleInfoCard({ vehicle, onClick, compact = false }) {
  if (!vehicle) return null;

  // Obtener imagen del vehículo si existe
  const getVehicleImage = () => {
    if (vehicle.files && vehicle.files.length > 0) {
      const imageFile = vehicle.files.find((f) => f.isImage);
      if (imageFile) {
        return getFilePreviewUrl(env.bucketVehiclesId, imageFile.fileId, {
          width: 200,
          height: 200,
        });
      }
    }
    return null;
  };

  const imageUrl = getVehicleImage();

  // Información a mostrar
  const vehicleName = [
    vehicle.brand?.name || vehicle.brandId,
    vehicle.model?.name || vehicle.modelId,
    vehicle.model?.year || vehicle.year,
  ]
    .filter(Boolean)
    .join(" ");

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-(--muted)/50 border border-(--border) cursor-pointer transition-colors hover:bg-(--muted)"
        onClick={onClick}
      >
        {/* Imagen o placeholder */}
        <div className="h-12 w-12 rounded-lg bg-(--muted) flex items-center justify-center overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={vehicleName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Car className="h-6 w-6 text-(--muted-fg)" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-(--fg) truncate">
            {vehicleName || "Vehículo"}
          </p>
          <p className="text-xs text-(--muted-fg)">
            {vehicle.plate || "Sin placas"} • {vehicle.economicNumber || "—"}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      padding="none"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Imagen */}
        <div className="sm:w-32 h-32 sm:h-auto bg-gradient-to-br from-(--muted) to-(--border) flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={vehicleName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Car className="h-12 w-12 text-(--muted-fg)" />
          )}
        </div>

        {/* Información */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="font-semibold text-lg text-(--fg)">
                {vehicleName || "Vehículo sin nombre"}
              </h3>
              <p className="text-sm text-(--muted-fg)">
                {vehicle.type?.name || vehicle.typeId || "Sin tipo"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={Hash} label="Placas" value={vehicle.plate || "—"} />
            <InfoItem
              icon={Hash}
              label="No. Económico"
              value={vehicle.economicNumber || "—"}
            />
            <InfoItem
              icon={Gauge}
              label="Kilometraje"
              value={
                vehicle.mileage
                  ? `${vehicle.mileage.toLocaleString()} ${
                      vehicle.mileageUnit || "km"
                    }`
                  : "—"
              }
            />
            <InfoItem
              icon={Palette}
              label="Color"
              value={vehicle.color || "—"}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-(--muted-fg) flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-(--muted-fg)">{label}</p>
        <p className="text-sm font-medium text-(--fg) truncate">{value}</p>
      </div>
    </div>
  );
}

/**
 * Selector de vehículo para formularios
 */
export function VehicleSelector({ vehicles, selectedId, onSelect, disabled }) {
  const selectedVehicle = vehicles?.find((v) => v.$id === selectedId);

  if (selectedVehicle) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-(--fg)">
          Vehículo seleccionado
        </label>
        <VehicleInfoCard
          vehicle={selectedVehicle}
          compact
          onClick={disabled ? undefined : () => onSelect(null)}
        />
        {!disabled && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-sm text-(--brand) hover:underline"
          >
            Cambiar vehículo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-(--fg)">
        Seleccionar vehículo *
      </label>
      <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
        {vehicles?.map((vehicle) => (
          <VehicleInfoCard
            key={vehicle.$id}
            vehicle={vehicle}
            compact
            onClick={() => onSelect(vehicle.$id)}
          />
        ))}
        {(!vehicles || vehicles.length === 0) && (
          <p className="text-sm text-(--muted-fg) text-center py-4">
            No hay vehículos disponibles
          </p>
        )}
      </div>
    </div>
  );
}
