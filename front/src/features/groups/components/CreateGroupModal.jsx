import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Upload,
  ImageIcon,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Label } from "../../../shared/ui/Label";
import { Button } from "../../../shared/ui/Button";
import { createGroup } from "../services/groups.service";
import { useAuth } from "../../auth/hooks/useAuth";

/**
 * Modal para crear un nuevo grupo
 */
export function CreateGroupModal({ isOpen, onClose }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries(["my-groups"]);
      toast.success(`Grupo "${newGroup.name}" creado exitosamente`);
      handleClose();
    },
    onError: (err) => {
      console.error("Error creating group:", err);
      toast.error(err.message || "Error al crear el grupo");
    },
  });

  const handleClose = () => {
    setName("");
    setDescription("");
    setLogoFile(null);
    setLogoPreview(null);
    onClose();
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen no puede superar 2MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (!profile?.$id) {
      toast.error("No se pudo obtener el perfil del usuario");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      ownerProfileId: profile.$id,
      logoFile,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      header={
        <ModalHeader
          icon={Building2}
          title="Crear nuevo grupo"
          subtitle="Configura tu nuevo espacio de trabajo"
        />
      }
      footer={
        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Building2 size={16} />
                Crear grupo
              </>
            )}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative h-28 w-28 rounded-2xl border-2 border-dashed border-(--border) bg-(--muted)/50 flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <AnimatePresence mode="wait">
                {logoPreview ? (
                  <motion.img
                    key="preview"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-1 text-(--muted-fg)"
                  >
                    <ImageIcon size={28} />
                    <span className="text-xs">Logo</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={24} className="text-white" />
              </div>
            </motion.div>

            {logoPreview && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLogo();
                }}
                className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoSelect}
            className="hidden"
          />

          <p className="text-xs text-(--muted-fg)">PNG, JPG o WEBP. Máx. 2MB</p>
        </div>

        {/* Form fields */}
        <div className="grid gap-5 sm:grid-cols-1">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name" required>
              Nombre del grupo
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mi Empresa, Flotilla Norte..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description">Descripción</Label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve del grupo (opcional)"
              rows={3}
              className="w-full rounded-lg border border-(--border) bg-(--input) px-3 py-2 text-sm placeholder:text-(--muted-fg) focus:outline-none focus:ring-2 focus:ring-(--ring) resize-none"
            />
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-(--muted)/50 p-4 border border-(--border)">
          <div className="flex gap-3">
            <Sparkles size={20} className="text-(--brand) shrink-0 mt-0.5" />
            <div className="text-sm text-(--muted-fg)">
              <p className="font-medium text-(--foreground) mb-2">
                ¿Qué incluye un grupo?
              </p>
              <ul className="space-y-1.5 list-disc list-inside marker:text-(--brand)">
                <li>Espacio de trabajo aislado</li>
                <li>Gestión de miembros y roles</li>
                <li>Vehículos, conductores y reportes propios</li>
                <li>Catálogos personalizados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
