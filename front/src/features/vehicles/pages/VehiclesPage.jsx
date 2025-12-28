import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Car, Search } from "lucide-react";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { listVehicles } from "../services/vehicles.service";
import { useState } from "react";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";

export function VehiclesPage() {
  const { activeGroupId } = useActiveGroup();
  const [search, setSearch] = useState("");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });

  // Basic filtering logic client-side for MVP
  const filtered = (vehicles || []).filter((v) => {
    const term = search.toLowerCase();
    return (
      (v.brandId || "").toLowerCase().includes(term) ||
      (v.modelId || "").toLowerCase().includes(term) || // Assuming IDs are names or readable for now
      (v.plate || "").toLowerCase().includes(term) ||
      (v.economicNumber || "").toLowerCase().includes(term)
    );
  });

  if (!activeGroupId) {
    return (
      <div className="grid h-[60dvh] place-items-center px-4">
        <EmptyState
          icon={Car}
          title="Selecciona un grupo"
          description="Para ver y gestionar vehículos, primero debes seleccionar un grupo en el menú superior."
        />
      </div>
    );
  }

  if (isLoading) return <LoadingScreen label="Cargando vehículos..." />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Vehículos"
        subtitle="Gestiona la flotilla de tu grupo."
      >
        <Button asChild>
          <Link to="/vehicles/new">
            <Plus size={18} className="mr-2" />
            Nuevo vehículo
          </Link>
        </Button>
      </SectionHeader>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <div className="pointer-events-none absolute left-3 top-2.5 text-neutral-400">
            <Search size={16} />
          </div>
          <Input
            placeholder="Buscar por placa, económico..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No hay vehículos"
          description={
            search
              ? `No se encontraron vehículos que coincidan con "${search}".`
              : "Aún no tienes vehículos registrados en este grupo. ¡Agrega tu primer vehículo para comenzar!"
          }
        >
          <Button asChild>
            <Link to="/vehicles/new">
              <Plus size={18} className="mr-2" />
              Agregar Vehículo
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((vehicle) => (
            <Link key={vehicle.$id} to={`/vehicles/${vehicle.$id}`}>
              <Card className="group h-full transition-colors hover:border-(--brand)/50">
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                    <Car size={20} className="text-neutral-500" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      vehicle.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">
                    {vehicle.brandId} {vehicle.modelId} {vehicle.year}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {vehicle.plate || "Sin placa"}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
