import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FolderKanban, Pencil, Search } from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { CreateModelModal } from "../../vehicles/components/CreateModelModal";
import {
  listVehicleModels,
  deleteVehicleModel,
  listVehicleBrands,
  listVehicleTypes,
} from "../services/catalogs.service";
import { listVehicles } from "../../vehicles/services/vehicles.service";

export function ModelsTab({ groupId }) {
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["vehicleModels", groupId],
    queryFn: () => listVehicleModels(groupId, null),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["vehicleBrands", groupId],
    queryFn: () => listVehicleBrands(groupId),
  });

  const { data: types = [] } = useQuery({
    queryKey: ["vehicleTypes", groupId],
    queryFn: () => listVehicleTypes(groupId),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", groupId],
    queryFn: () => listVehicles(groupId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVehicleModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicleModels"]);
      toast.success("Modelo eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  const handleModelCreated = () => {
    queryClient.invalidateQueries(["vehicleModels"]);
    setShowModal(false);
    setEditingModel(null);
  };

  const handleEdit = (model) => {
    setEditingModel(model);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingModel(null);
  };

  if (isLoading)
    return (
      <div className="py-8 text-center text-(--muted-fg)">Cargando...</div>
    );

  // Create lookup maps
  const brandMap = Object.fromEntries(brands.map((b) => [b.$id, b.name]));
  const typeMap = Object.fromEntries(types.map((t) => [t.$id, t.name]));
  const typeEconomicGroupMap = Object.fromEntries(
    types.map((t) => [t.$id, t.economicGroup])
  );

  // Count vehicles per model
  const vehicleCountByModel = vehicles.reduce((acc, v) => {
    acc[v.modelId] = (acc[v.modelId] || 0) + 1;
    return acc;
  }, {});

  // Filtering logic
  const filteredModels = models.filter((model) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;

    const nameMatch = model.name.toLowerCase().includes(search);
    const yearMatch = model.year?.toString().includes(search);
    const brandMatch = brandMap[model.brandId]?.toLowerCase().includes(search);
    const typeMatch = typeMap[model.typeId]?.toLowerCase().includes(search);

    return nameMatch || yearMatch || brandMatch || typeMatch;
  });

  return (
    <Card className="p-6">
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            size={18}
          />
          <Input
            placeholder="Buscar por modelo, año, marca o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            setEditingModel(null);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Agregar Modelo
        </Button>
      </div>

      {filteredModels.length === 0 ? (
        <div className="py-12 text-center text-(--muted-fg)">
          <FolderKanban size={48} className="mx-auto mb-3 opacity-30" />
          <p>
            {searchTerm
              ? "No se encontraron modelos que coincidan con la búsqueda."
              : "No hay modelos registrados todavía."}
          </p>
          {!searchTerm && (
            <p className="mt-2 text-sm">
              Haz clic en "Agregar Modelo" para crear uno.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <div
              key={model.$id}
              className="flex flex-col gap-2 rounded-lg border border-(--border) bg-(--muted)/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-(--fg)">
                    {model.name}
                    {model.year && (
                      <span className="ml-2 text-sm text-(--muted-fg)">
                        ({model.year})
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-(--muted-fg)">
                    {model.brandId && (
                      <span className="rounded bg-(--muted) px-2 py-0.5">
                        {brandMap[model.brandId] || "—"}
                      </span>
                    )}
                    {model.typeId && (
                      <span className="rounded bg-(--muted) px-2 py-0.5">
                        {typeMap[model.typeId] || "—"}
                      </span>
                    )}
                    {model.typeId && typeEconomicGroupMap[model.typeId] && (
                      <span className="rounded bg-(--brand)/10 text-(--brand) px-2 py-0.5 font-medium">
                        {typeEconomicGroupMap[model.typeId]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(model)}
                    className="rounded p-1.5 text-(--muted-fg) hover:bg-(--muted) hover:text-(--fg) transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(model.$id)}
                    className="rounded p-1.5 text-(--muted-fg) hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-(--muted-fg)">
                {vehicleCountByModel[model.$id] || 0} vehículo(s)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Model Modal */}
      <CreateModelModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleModelCreated}
        groupId={groupId}
        editingModel={editingModel}
      />
    </Card>
  );
}
