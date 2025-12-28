import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FolderKanban,
  Pencil,
  Check,
  X,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import {
  listVehicleTypes,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
} from "../services/catalogs.service";
import { listVehicles } from "../../vehicles/services/vehicles.service";

export function TypesTab({ groupId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const queryClient = useQueryClient();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["vehicleTypes", groupId],
    queryFn: () => listVehicleTypes(groupId),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", groupId],
    queryFn: () => listVehicles(groupId),
  });

  const createMutation = useMutation({
    mutationFn: (name) => createVehicleType(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicleTypes"]);
      toast.success("Tipo creado");
      setSearchTerm("");
    },
    onError: (err) => toast.error(err.message || "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => updateVehicleType(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicleTypes"]);
      toast.success("Tipo actualizado");
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteVehicleType(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicleTypes"]);
      toast.success("Tipo eliminado");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  const startEdit = (type) => {
    setEditingId(type.$id);
    setEditingName(type.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = (id) => {
    if (editingName.trim()) {
      updateMutation.mutate({ id, name: editingName.trim() });
    }
  };

  if (isLoading) return <LoadingScreen label="Cargando..." />;

  // Filtering logic
  const filteredTypes = types.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Exact match check to prevent duplicates
  const hasExactMatch = types.some(
    (type) => type.name.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  const canCreate = searchTerm.trim() !== "" && filteredTypes.length === 0;

  // Count vehicles per type
  const vehicleCountByType = vehicles.reduce((acc, v) => {
    acc[v.typeId] = (acc[v.typeId] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="p-6">
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            size={18}
          />
          <Input
            placeholder="Buscar o agregar tipo (ej: Sedán, Pickup...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate) {
                createMutation.mutate(searchTerm.trim());
              }
            }}
            className="pl-10"
          />
        </div>

        <Button
          onClick={() => createMutation.mutate(searchTerm.trim())}
          loading={createMutation.isPending}
          disabled={!canCreate}
        >
          <Plus size={18} />
          {searchTerm.trim() && filteredTypes.length === 0
            ? `Agregar "${searchTerm}"`
            : "Agregar"}
        </Button>
      </div>

      {filteredTypes.length === 0 ? (
        <div className="py-12 text-center text-(--muted-fg)">
          <FolderKanban size={48} className="mx-auto mb-3 opacity-30" />
          <p>
            {searchTerm
              ? `No se encontró el tipo "${searchTerm}".`
              : "No hay tipos registrados todavía."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTypes.map((type) => (
            <div
              key={type.$id}
              className="flex items-center justify-between gap-2 rounded-lg border border-(--border) bg-(--muted)/30 px-4 py-3"
            >
              {editingId === type.$id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(type.$id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => saveEdit(type.$id)}
                      className="rounded p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded p-1.5 text-(--muted-fg) hover:bg-(--muted) transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium text-(--fg)">{type.name}</div>
                    <div className="text-xs text-(--muted-fg)">
                      {vehicleCountByType[type.$id] || 0} vehículo(s)
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(type)}
                      className="rounded p-1.5 text-(--muted-fg) hover:bg-(--muted) hover:text-(--fg) transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(type.$id)}
                      className="rounded p-1.5 text-(--muted-fg) hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
