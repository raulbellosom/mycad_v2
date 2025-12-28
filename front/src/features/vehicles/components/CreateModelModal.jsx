import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Car } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "../../../shared/ui/Button";
import { Input } from "../../../shared/ui/Input";
import { Combobox } from "../../../shared/ui/Combobox";
import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import {
  createVehicleModel,
  updateVehicleModel,
  createVehicleBrand,
  createVehicleType,
  listVehicleBrands,
  listVehicleTypes,
} from "../../catalogs/services/catalogs.service";

export function CreateModelModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  initialSearch = "",
  editingModel = null,
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: initialSearch,
    year: new Date().getFullYear(),
    brandId: "",
    typeId: "",
  });

  // Sync with editingModel
  useEffect(() => {
    if (editingModel) {
      setFormData({
        name: editingModel.name || "",
        year: editingModel.year || new Date().getFullYear(),
        brandId: editingModel.brandId || "",
        typeId: editingModel.typeId || "",
      });
    } else {
      setFormData({
        name: initialSearch,
        year: new Date().getFullYear(),
        brandId: "",
        typeId: "",
      });
    }
  }, [editingModel, initialSearch, isOpen]);

  // Quick create states
  const [showBrandCreate, setShowBrandCreate] = useState(false);
  const [showTypeCreate, setShowTypeCreate] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  // Fetch existing brands and types
  const { data: brands = [] } = useQuery({
    queryKey: ["vehicleBrands", groupId],
    queryFn: () => listVehicleBrands(groupId),
    enabled: !!groupId && isOpen,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["vehicleTypes", groupId],
    queryFn: () => listVehicleTypes(groupId),
    enabled: !!groupId && isOpen,
  });

  // Create model mutation
  const createModelMutation = useMutation({
    mutationFn: (data) => createVehicleModel({ groupId, ...data }),
    onSuccess: (newModel) => {
      queryClient.invalidateQueries(["vehicleModels"]);
      toast.success("Modelo creado exitosamente");
      onSuccess(newModel);
      handleClose();
    },
    onError: (err) => toast.error(err.message || "Error al crear modelo"),
  });

  // Update model mutation
  const updateModelMutation = useMutation({
    mutationFn: (data) => updateVehicleModel(editingModel.$id, data),
    onSuccess: (updatedModel) => {
      queryClient.invalidateQueries(["vehicleModels"]);
      toast.success("Modelo actualizado exitosamente");
      onSuccess(updatedModel);
      handleClose();
    },
    onError: (err) => toast.error(err.message || "Error al actualizar modelo"),
  });

  // Create brand mutation
  const createBrandMutation = useMutation({
    mutationFn: (name) => createVehicleBrand(groupId, name),
    onSuccess: (newBrand) => {
      queryClient.invalidateQueries(["vehicleBrands"]);
      setFormData((prev) => ({ ...prev, brandId: newBrand.$id }));
      setShowBrandCreate(false);
      setNewBrandName("");
      toast.success("Marca creada");
    },
    onError: (err) => toast.error(err.message || "Error al crear marca"),
  });

  // Create type mutation
  const createTypeMutation = useMutation({
    mutationFn: (name) => createVehicleType(groupId, name),
    onSuccess: (newType) => {
      queryClient.invalidateQueries(["vehicleTypes"]);
      setFormData((prev) => ({ ...prev, typeId: newType.$id }));
      setShowTypeCreate(false);
      setNewTypeName("");
      toast.success("Tipo creado");
    },
    onError: (err) => toast.error(err.message || "Error al crear tipo"),
  });

  const handleClose = () => {
    setFormData({
      name: "",
      year: new Date().getFullYear(),
      brandId: "",
      typeId: "",
    });
    setShowBrandCreate(false);
    setShowTypeCreate(false);
    setNewBrandName("");
    setNewTypeName("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre del modelo es requerido");
      return;
    }
    if (!formData.brandId) {
      toast.error("La marca es requerida");
      return;
    }
    if (!formData.typeId) {
      toast.error("El tipo de vehículo es requerido");
      return;
    }

    if (editingModel) {
      updateModelMutation.mutate(formData);
    } else {
      createModelMutation.mutate(formData);
    }
  };

  const brandOptions = brands.map((b) => ({ label: b.name, value: b.$id }));
  const typeOptions = types.map((t) => ({ label: t.name, value: t.$id }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      header={
        <ModalHeader
          icon={Car}
          title={editingModel ? "Editar Modelo" : "Crear Modelo de Vehículo"}
          subtitle={
            editingModel
              ? "Modifica la información del modelo"
              : "Agrega un nuevo modelo de vehículo al catálogo"
          }
        />
      }
      footer={
        <ModalFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            loading={
              createModelMutation.isPending || updateModelMutation.isPending
            }
          >
            {editingModel ? <Save size={18} /> : <Plus size={18} />}
            {editingModel ? "Guardar Cambios" : "Crear Modelo"}
          </Button>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del Modelo *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Corolla, F-150, Civic..."
          required
        />

        <Input
          label="Año del Modelo"
          type="number"
          min="1900"
          max="2100"
          value={formData.year}
          onChange={(e) =>
            setFormData({
              ...formData,
              year: parseInt(e.target.value) || new Date().getFullYear(),
            })
          }
        />

        {/* Brand Selection/Creation */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--fg)">
            Marca *
          </label>
          {showBrandCreate ? (
            <div className="flex gap-2">
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Nombre de la marca"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() =>
                  newBrandName.trim() &&
                  createBrandMutation.mutate(newBrandName.trim())
                }
                loading={createBrandMutation.isPending}
                disabled={!newBrandName.trim()}
              >
                Crear
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowBrandCreate(false);
                  setNewBrandName("");
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Combobox
              value={formData.brandId}
              onChange={(value) => setFormData({ ...formData, brandId: value })}
              options={brandOptions}
              placeholder="Selecciona una marca"
              emptyText="No se encontraron marcas"
              onCreateNew={(search) => {
                setNewBrandName(search || "");
                setShowBrandCreate(true);
              }}
              createLabel="Crear nueva marca"
            />
          )}
        </div>

        {/* Type Selection/Creation */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-(--fg)">
            Tipo de Vehículo *
          </label>
          {showTypeCreate ? (
            <div className="flex gap-2">
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Nombre del tipo"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() =>
                  newTypeName.trim() &&
                  createTypeMutation.mutate(newTypeName.trim())
                }
                loading={createTypeMutation.isPending}
                disabled={!newTypeName.trim()}
              >
                Crear
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowTypeCreate(false);
                  setNewTypeName("");
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Combobox
              value={formData.typeId}
              onChange={(value) => setFormData({ ...formData, typeId: value })}
              options={typeOptions}
              placeholder="Selecciona un tipo"
              emptyText="No se encontraron tipos"
              onCreateNew={(search) => {
                setNewTypeName(search || "");
                setShowTypeCreate(true);
              }}
              createLabel="Crear nuevo tipo"
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
