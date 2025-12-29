import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../../../shared/ui/Button";
import { Input } from "../../../../shared/ui/Input";
import { Card } from "../../../../shared/ui/Card";

/**
 * Tabla interactiva para gestionar partes/refacciones
 * Diseño responsivo: tabla en desktop, tarjetas en móvil
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

  const handleAddPart = useCallback(() => {
    if (!newPart.name.trim()) return;

    onAdd?.({
      name: newPart.name.trim(),
      quantity: parseInt(newPart.quantity) || 1,
      unitCost: parseFloat(newPart.unitCost) || 0,
      notes: newPart.notes.trim(),
    });

    setNewPart({ name: "", quantity: 1, unitCost: "", notes: "" });
    setIsAdding(false);
  }, [newPart, onAdd]);

  const handleCancelAdd = useCallback(() => {
    setNewPart({ name: "", quantity: 1, unitCost: "", notes: "" });
    setIsAdding(false);
  }, []);

  // Prevenir que Enter haga submit del formulario padre
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        // Solo agregar si hay nombre
        if (newPart.name.trim()) {
          handleAddPart();
        }
      } else if (e.key === "Escape") {
        handleCancelAdd();
      }
    },
    [newPart.name, handleAddPart, handleCancelAdd]
  );

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
            type="button"
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

      {/* ============ MÓVIL: Vista de tarjetas ============ */}
      <div className="md:hidden">
        <AnimatePresence mode="popLayout">
          {/* Formulario para agregar (móvil) */}
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-(--brand)/5 border-b border-(--border)"
            >
              <div className="space-y-3">
                <Input
                  placeholder="Nombre de la pieza *"
                  value={newPart.name}
                  onChange={(e) =>
                    setNewPart({ ...newPart, name: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  className="h-12 text-base"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-(--muted-fg) mb-1 block">
                      Cantidad
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={newPart.quantity}
                      onChange={(e) =>
                        setNewPart({ ...newPart, quantity: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      className="h-12 text-base text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-(--muted-fg) mb-1 block">
                      Precio Unitario
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="$0.00"
                      value={newPart.unitCost}
                      onChange={(e) =>
                        setNewPart({ ...newPart, unitCost: e.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      className="h-12 text-base text-right"
                    />
                  </div>
                </div>
                <Input
                  placeholder="Notas (opcional)"
                  value={newPart.notes}
                  onChange={(e) =>
                    setNewPart({ ...newPart, notes: e.target.value })
                  }
                  onKeyDown={handleKeyDown}
                  className="h-10 text-sm"
                />
                <div className="flex items-center justify-between pt-2 border-t border-(--border)/50">
                  <div className="text-sm text-(--muted-fg)">
                    Subtotal:{" "}
                    <span className="font-semibold text-(--fg)">
                      $
                      {(
                        (parseFloat(newPart.quantity) || 0) *
                        (parseFloat(newPart.unitCost) || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelAdd}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleAddPart}
                      disabled={!newPart.name.trim()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tarjetas de partes existentes (móvil) */}
          {parts.map((part) => (
            <MobilePartCard
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

          {/* Empty state (móvil) */}
          {parts.length === 0 && !isAdding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <Package className="h-12 w-12 mx-auto text-(--muted-fg)/50 mb-2" />
              <p className="text-sm text-(--muted-fg)">
                No hay refacciones agregadas
              </p>
              {!disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar refacción
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============ DESKTOP: Vista de tabla ============ */}
      <div className="hidden md:block overflow-x-auto">
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
              {/* Fila para agregar nueva parte (desktop) */}
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
                      onKeyDown={handleKeyDown}
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
                      onKeyDown={handleKeyDown}
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
                      onKeyDown={handleKeyDown}
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
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleAddPart}
                        className="h-8 w-8 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
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

              {/* Partes existentes (desktop) */}
              {parts.map((part) => (
                <DesktopPartsTableRow
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

              {/* Empty state (desktop) */}
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
                        type="button"
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
 * Tarjeta de parte para vista móvil
 */
function MobilePartCard({
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

  // Prevenir que Enter haga submit del formulario padre
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (editData.name.trim()) {
          onUpdate({
            name: editData.name.trim(),
            quantity: parseInt(editData.quantity) || 1,
            unitCost: parseFloat(editData.unitCost) || 0,
            notes: editData.notes.trim(),
          });
        }
      } else if (e.key === "Escape") {
        onCancelEdit();
      }
    },
    [editData, onUpdate, onCancelEdit]
  );

  if (isEditing) {
    return (
      <motion.div
        layout
        className="p-4 bg-(--brand)/5 border-b border-(--border)"
      >
        <div className="space-y-3">
          <Input
            placeholder="Nombre de la pieza *"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            onKeyDown={handleKeyDown}
            className="h-12 text-base"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-(--muted-fg) mb-1 block">
                Cantidad
              </label>
              <Input
                type="number"
                min="1"
                value={editData.quantity}
                onChange={(e) =>
                  setEditData({ ...editData, quantity: e.target.value })
                }
                onKeyDown={handleKeyDown}
                className="h-12 text-base text-center"
              />
            </div>
            <div>
              <label className="text-xs text-(--muted-fg) mb-1 block">
                Precio Unitario
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.unitCost}
                onChange={(e) =>
                  setEditData({ ...editData, unitCost: e.target.value })
                }
                onKeyDown={handleKeyDown}
                className="h-12 text-base text-right"
              />
            </div>
          </div>
          <Input
            placeholder="Notas (opcional)"
            value={editData.notes}
            onChange={(e) =>
              setEditData({ ...editData, notes: e.target.value })
            }
            onKeyDown={handleKeyDown}
            className="h-10 text-sm"
          />
          <div className="flex items-center justify-between pt-2 border-t border-(--border)/50">
            <div className="text-sm text-(--muted-fg)">
              Subtotal:{" "}
              <span className="font-semibold text-(--fg)">
                $
                {(
                  (parseFloat(editData.quantity) || 0) *
                  (parseFloat(editData.unitCost) || 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                className="text-red-600"
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() =>
                  onUpdate({
                    name: editData.name.trim(),
                    quantity: parseInt(editData.quantity) || 1,
                    unitCost: parseFloat(editData.unitCost) || 0,
                    notes: editData.notes.trim(),
                  })
                }
                disabled={!editData.name.trim()}
              >
                <Check className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 border-b border-(--border) hover:bg-(--muted)/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-(--fg) truncate">{part.name}</p>
          {part.notes && (
            <p className="text-xs text-(--muted-fg) mt-0.5 line-clamp-2">
              {part.notes}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-(--muted-fg)">
              <span className="font-medium text-(--fg)">{part.quantity}</span> ×
              ${(part.unitCost || 0).toFixed(2)}
            </span>
            <span className="font-semibold text-(--brand)">
              = ${subtotal.toFixed(2)}
            </span>
          </div>
        </div>
        {!disabled && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-10 w-10 text-(--muted-fg) hover:text-(--brand)"
            >
              <Edit2 className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-10 w-10 text-(--muted-fg) hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Fila de tabla de partes para vista desktop
 */
function DesktopPartsTableRow({
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

  // Prevenir que Enter haga submit del formulario padre
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (editData.name.trim()) {
          onUpdate({
            name: editData.name.trim(),
            quantity: parseInt(editData.quantity) || 1,
            unitCost: parseFloat(editData.unitCost) || 0,
            notes: editData.notes.trim(),
          });
        }
      } else if (e.key === "Escape") {
        onCancelEdit();
      }
    },
    [editData, onUpdate, onCancelEdit]
  );

  if (isEditing) {
    return (
      <motion.tr layout className="bg-(--brand)/5">
        <td className="px-4 py-3">
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
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
              type="button"
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
              type="button"
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
              type="button"
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-(--muted-fg) hover:text-(--brand)"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
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
