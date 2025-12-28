import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  StickyNote,
  Save,
  X,
  Building2,
} from "lucide-react";
import { Modal, ModalFooter } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { cn } from "../../../shared/utils/cn";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  notes: "",
};

export function ClientFormModal({
  isOpen,
  onClose,
  onSubmit,
  client = null,
  loading = false,
}) {
  const isEdit = Boolean(client);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        notes: client.notes || "",
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [client, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un correo válido";
    }

    if (formData.phone && formData.phone.length < 8) {
      newErrors.phone = "Ingresa un teléfono válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanData = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      notes: formData.notes.trim() || null,
    };

    onSubmit(cleanData);
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormState);
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      dismissible={!loading}
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--brand)/10">
            <Building2 className="h-5 w-5 text-(--brand)" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-(--fg)">
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <p className="text-xs text-(--muted-fg)">
              {isEdit
                ? "Actualiza la información del cliente"
                : "Registra un nuevo cliente en el sistema"}
            </p>
          </div>
        </div>
      }
      footer={
        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="min-w-[120px]"
          >
            <Save size={16} className="mr-2" />
            {isEdit ? "Guardar" : "Crear Cliente"}
          </Button>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre - Required */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-(--fg)">
            <User size={14} className="text-(--muted-fg)" />
            Nombre del Cliente <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nombre completo o razón social"
            error={errors.name}
            autoFocus
          />
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500"
            >
              {errors.name}
            </motion.p>
          )}
        </div>

        {/* Email & Phone Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-(--fg)">
              <Mail size={14} className="text-(--muted-fg)" />
              Correo Electrónico
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="cliente@ejemplo.com"
              error={errors.email}
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-(--fg)">
              <Phone size={14} className="text-(--muted-fg)" />
              Teléfono
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+52 (123) 456-7890"
              error={errors.phone}
            />
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500"
              >
                {errors.phone}
              </motion.p>
            )}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-(--fg)">
            <StickyNote size={14} className="text-(--muted-fg)" />
            Notas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Información adicional del cliente..."
            rows={3}
            className={cn(
              "w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-3 text-sm text-(--fg)",
              "placeholder:text-(--muted-fg)",
              "focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20 focus:outline-none",
              "transition-all resize-none"
            )}
            maxLength={800}
          />
          <p className="text-xs text-(--muted-fg) text-right">
            {formData.notes.length}/800 caracteres
          </p>
        </div>
      </form>
    </Modal>
  );
}
