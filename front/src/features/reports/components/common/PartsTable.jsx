import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Package,
  DollarSign,
} from "lucide-react";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";
import { Card } from "../../../../shared/ui/Card";

/**
 * Tabla interactiva para gestionar partes/refacciones
 * Permite agregar, editar y eliminar partes inline
 */
export function PartsTable({
  parts = [],
  onAdd,
  onUpdate,
  onDelete,
  disabled = false,
  title = "Refacciones / Partes",
}) {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newPart, setNewPart] = useState({
    name: "",
    quantity: 1,
    unitCost: "",
    notes: "",
  });

  // Calcular totales
  const totals = useMemo(() => {
    return parts.reduce(
      (acc, part) => {
        const subtotal = (part.quantity || 0) * (part.unitCost || 0);
        return {
          items: acc.items + (part.quantity || 0),
          total: acc.total + subtotal,
        };
      },
      { items: 0, total: 0 }
    );
  }, [parts]);

  const handleAddPart = () => {
    if (!newPart.name.trim()) return;

    onAdd?.({
      name: newPart.name.trim(),
      quantity: parseInt(newPart.quantity) || 1,
      unitCost: parseFloat(newPart.unitCost) || 0,
      notes: newPart.notes.trim(),
    });

    setNewPart({ name: "", quantity: 1, unitCost: "", notes: "" });
    setIsAdding(false);
  };

  const handleCancelAdd = () => {
    setNewPart({ name: "", quantity: 1, unitCost: "", notes: "" });
    setIsAdding(false);
  };

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-(--border) bg-(--muted)/30">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-(--brand)" />
          <h3 className="font-semibold text-(--fg)">{title}</h3>
          <span className="text-sm text-(--muted-fg)">
            ({parts.length} {parts.length === 1 ? "item" : "items"})
          </span>
        </div>
        {!disabled && !isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-(--muted)/20 text-left">
              <th className="px-4 py-3 text-xs font-medium text-(--muted-fg) uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-4 py-3 text-xs font-medium text-(--muted-fg) uppercase tracking-wider text-center w-20">
                Cant.
              </th>
              <th className="px-4 py-3 text-xs font-medium text-(--muted-fg) uppercase tracking-wider text-right w-28">
                P. Unit.
              </th>
              <th className="px-4 py-3 text-xs font-medium text-(--muted-fg) uppercase tracking-wider text-right w-28">
                Subtotal
              </th>
              {!disabled && (
                <th className="px-4 py-3 text-xs font-medium text-(--muted-fg) uppercase tracking-wider text-center w-24">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border)">
            <AnimatePresence mode="popLayout">
              {/* Fila para agregar nueva parte */}
              {isAdding && (
                <motion.tr
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-(--brand)/5"
                >
                  <td className="px-4 py-3">
                    <Input
                      placeholder="Nombre de la pieza"
                      value={newPart.name}
                      onChange={(e) =>
                        setNewPart({ ...newPart, name: e.target.value })
                      }
                      className="h-9"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={newPart.quantity}
                      onChange={(e) =>
                        setNewPart({ ...newPart, quantity: e.target.value })
                      }
                      className="h-9 text-center"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newPart.unitCost}
                      onChange={(e) =>
                        setNewPart({ ...newPart, unitCost: e.target.value })
                      }
                      className="h-9 text-right"
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-(--fg)">
                    $
                    {(
                      (parseFloat(newPart.quantity) || 0) *
                      (parseFloat(newPart.unitCost) || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAddPart}
                        className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelAdd}
                        className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              )}

              {/* Partes existentes */}
              {parts.map((part) => (
                <PartsTableRow
                  key={part.$id || part.id}
                  part={part}
                  isEditing={editingId === (part.$id || part.id)}
                  onEdit={() => setEditingId(part.$id || part.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdate={(data) => {
                    onUpdate?.(part.$id || part.id, data);
                    setEditingId(null);
                  }}
                  onDelete={() => onDelete?.(part.$id || part.id)}
                  disabled={disabled}
                />
              ))}

              {/* Empty state */}
              {parts.length === 0 && !isAdding && (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td
                    colSpan={disabled ? 4 : 5}
                    className="px-4 py-8 text-center"
                  >
                    <Package className="h-12 w-12 mx-auto text-(--muted-fg)/50 mb-2" />
                    <p className="text-sm text-(--muted-fg)">
                      No hay refacciones agregadas
                    </p>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar primera refacción
                      </Button>
                    )}
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer con totales */}
      {parts.length > 0 && (
        <div className="border-t border-(--border) bg-(--muted)/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-(--muted-fg)">
              <span>{totals.items} piezas</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-(--brand)" />
              <span className="text-lg font-bold text-(--fg)">
                $
                {totals.total.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Fila individual de la tabla de partes
 */
function PartsTableRow({
  part,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  disabled,
}) {
  const [editData, setEditData] = useState({
    name: part.name || "",
    quantity: part.quantity || 1,
    unitCost: part.unitCost || 0,
    notes: part.notes || "",
  });

  const subtotal = (part.quantity || 0) * (part.unitCost || 0);

  if (isEditing) {
    return (
      <motion.tr layout className="bg-(--brand)/5">
        <td className="px-4 py-3">
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="h-9"
            autoFocus
          />
        </td>
        <td className="px-4 py-3">
          <Input
            type="number"
            min="1"
            value={editData.quantity}
            onChange={(e) =>
              setEditData({ ...editData, quantity: e.target.value })
            }
            className="h-9 text-center"
          />
        </td>
        <td className="px-4 py-3">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editData.unitCost}
            onChange={(e) =>
              setEditData({ ...editData, unitCost: e.target.value })
            }
            className="h-9 text-right"
          />
        </td>
        <td className="px-4 py-3 text-right text-sm font-medium text-(--fg)">
          $
          {(
            (parseFloat(editData.quantity) || 0) *
            (parseFloat(editData.unitCost) || 0)
          ).toFixed(2)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                onUpdate({
                  name: editData.name.trim(),
                  quantity: parseInt(editData.quantity) || 1,
                  unitCost: parseFloat(editData.unitCost) || 0,
                  notes: editData.notes.trim(),
                })
              }
              className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancelEdit}
              className="h-8 w-8 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </motion.tr>
    );
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="hover:bg-(--muted)/30 transition-colors"
    >
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-(--fg)">{part.name}</p>
          {part.notes && (
            <p className="text-xs text-(--muted-fg) mt-0.5">{part.notes}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm text-(--fg)">
        {part.quantity}
      </td>
      <td className="px-4 py-3 text-right text-sm text-(--fg)">
        ${(part.unitCost || 0).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium text-(--fg)">
        ${subtotal.toFixed(2)}
      </td>
      {!disabled && (
        <td className="px-4 py-3">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-(--muted-fg) hover:text-(--brand)"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-(--muted-fg) hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}
    </motion.tr>
  );
}

/**
 * Versión simplificada para formularios (estado local)
 */
export function PartsTableLocal({
  parts = [],
  onChange,
  disabled = false,
  title = "Refacciones / Partes",
}) {
  const handleAdd = (part) => {
    const newParts = [...parts, { ...part, id: Date.now().toString() }];
    onChange?.(newParts);
  };

  const handleUpdate = (id, data) => {
    const newParts = parts.map((p) =>
      (p.$id || p.id) === id ? { ...p, ...data } : p
    );
    onChange?.(newParts);
  };

  const handleDelete = (id) => {
    const newParts = parts.filter((p) => (p.$id || p.id) !== id);
    onChange?.(newParts);
  };

  return (
    <PartsTable
      parts={parts}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      disabled={disabled}
      title={title}
    />
  );
}
