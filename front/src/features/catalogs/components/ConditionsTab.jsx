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
  listConditions,
  createCondition,
  updateCondition,
  deleteCondition,
} from "../services/catalogs.service";

export function ConditionsTab({ groupId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const queryClient = useQueryClient();

  const { data: conditions = [], isLoading } = useQuery({
    queryKey: ["conditions", groupId],
    queryFn: () => listConditions(groupId),
  });

  const createMutation = useMutation({
    mutationFn: (name) => createCondition(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries(["conditions"]);
      toast.success("Condición creada");
      setSearchTerm("");
    },
    onError: (err) => toast.error(err.message || "Error al crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => updateCondition(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries(["conditions"]);
      toast.success("Condición actualizada");
      setEditingId(null);
    },
    onError: (err) => toast.error(err.message || "Error al actualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCondition(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["conditions"]);
      toast.success("Condición eliminada");
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  const startEdit = (condition) => {
    setEditingId(condition.$id);
    setEditingName(condition.name);
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
  const filteredConditions = conditions.filter((condition) =>
    condition.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Exact match check
  const hasExactMatch = conditions.some(
    (condition) =>
      condition.name.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  const canCreate = searchTerm.trim() !== "" && filteredConditions.length === 0;

  return (
    <Card className="p-6">
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            size={18}
          />
          <Input
            placeholder="Buscar o agregar condición (ej: Excelente, Buena...)"
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
          {searchTerm.trim() && filteredConditions.length === 0
            ? `Agregar "${searchTerm}"`
            : "Agregar"}
        </Button>
      </div>

      {filteredConditions.length === 0 ? (
        <div className="py-12 text-center text-(--muted-fg)">
          <FolderKanban size={48} className="mx-auto mb-3 opacity-30" />
          <p>
            {searchTerm
              ? `No se encontró la condición "${searchTerm}".`
              : "No hay condiciones registradas todavía."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConditions.map((condition) => (
            <div
              key={condition.$id}
              className="flex items-center justify-between gap-2 rounded-lg border border-(--border) bg-(--muted)/30 px-4 py-3"
            >
              {editingId === condition.$id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(condition.$id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => saveEdit(condition.$id)}
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
                    <div className="font-medium text-(--fg)">
                      {condition.name}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(condition)}
                      className="rounded p-1.5 text-(--muted-fg) hover:bg-(--muted) hover:text-(--fg) transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(condition.$id)}
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
