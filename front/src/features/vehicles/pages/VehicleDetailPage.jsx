import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { getVehicleById } from "../services/vehicles.service";

export function VehicleDetailPage() {
  const { id } = useParams();
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id),
  });

  if (isLoading) return <LoadingScreen label="Cargando detalles..." />;

  if (!vehicle) return <div>Vehículo no encontrado</div>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`${vehicle.brandId || ""} ${vehicle.modelId || ""} ${
          vehicle.year || ""
        }`}
        subtitle={`Placa: ${vehicle.plate || "—"} • Económico: ${
          vehicle.economicNumber || "—"
        }`}
      />
      <div>
        {/* Tabs and content implementation pending */}
        <p>
          Detalles del vehículo (Pendiente de implementar tabs: General,
          Archivos, Servicios)
        </p>
      </div>
    </div>
  );
}
