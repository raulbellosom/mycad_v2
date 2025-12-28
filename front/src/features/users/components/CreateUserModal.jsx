import { useState, useRef, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Upload,
  ImageIcon,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  User,
  Lock,
  AtSign,
  Shield,
  Car,
  ChevronDown,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { Modal, ModalHeader, ModalFooter } from "../../../shared/ui/Modal";
import { Input } from "../../../shared/ui/Input";
import { Label } from "../../../shared/ui/Label";
import { Button } from "../../../shared/ui/Button";
import { createUserWithProfile } from "../services/usersAdmin.service";
import { createDriver } from "../../drivers/services/drivers.service";
import { storage } from "../../../shared/appwrite/client";
import { ID } from "appwrite";
import { env } from "../../../shared/appwrite/env";

// Ladas más comunes primero
import ladasData from "../../../shared/utils/ladas.json";

// Preparar ladas ordenadas con México primero
const COMMON_LADAS = [
  { name: "MEXICO", lada: "52" },
  { name: "ESTADOS UNIDOS", lada: "1" },
  { name: "CANADA", lada: "1" },
];

const sortedLadas = [
  ...COMMON_LADAS,
  ...ladasData
    .filter(
      (l) =>
        l.name &&
        l.lada &&
        l.lada.trim() !== "" &&
        !COMMON_LADAS.some((c) => c.lada === l.lada)
    )
    .sort((a, b) => a.name.localeCompare(b.name)),
];

/**
 * Componente selector de lada con búsqueda
 */
function LadaSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = sortedLadas.find((l) => l.lada === value) || sortedLadas[0];

  const filteredLadas = useMemo(() => {
    if (!search) return sortedLadas;
    const s = search.toLowerCase();
    return sortedLadas.filter(
      (l) => l.name.toLowerCase().includes(s) || l.lada.includes(s)
    );
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 h-10 px-2 rounded-l-lg border border-r-0 border-(--border) bg-(--card) text-sm hover:bg-(--muted) transition-colors min-w-[85px]"
      >
        <span className="font-medium">+{selected.lada}</span>
        <ChevronDown size={14} className="text-(--muted-fg)" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-full mt-1 w-64 max-h-64 overflow-hidden rounded-lg border border-(--border) bg-(--card) shadow-xl z-50"
            >
              {/* Búsqueda */}
              <div className="p-2 border-b border-(--border)">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-(--muted-fg)"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar país..."
                    className="w-full pl-7 pr-2 py-1.5 text-sm rounded border border-(--border) bg-(--input) focus:outline-none focus:ring-1 focus:ring-(--brand)"
                    autoFocus
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="max-h-48 overflow-y-auto">
                {filteredLadas.map((lada, idx) => (
                  <button
                    key={`${lada.lada}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(lada.lada);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-(--muted) transition-colors text-left ${
                      value === lada.lada
                        ? "bg-(--brand)/10 text-(--brand)"
                        : ""
                    }`}
                  >
                    <span className="font-medium w-12">+{lada.lada}</span>
                    <span className="truncate text-(--muted-fg)">
                      {lada.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Modal para crear un nuevo usuario
 */
export function CreateUserModal({ isOpen, onClose, defaultGroupId = null }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "", // Solo el número sin lada
    phoneLada: "52", // Lada por defecto: México
    username: "",
    isPlatformAdmin: false,
    createAsDriver: false, // Nuevo: crear también como conductor
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: async (data) => {
      let avatarFileId = null;

      // Si hay avatar, subirlo primero
      if (avatarFile && env.bucketAvatarsId) {
        try {
          const uploadedFile = await storage.createFile(
            env.bucketAvatarsId,
            ID.unique(),
            avatarFile
          );
          avatarFileId = uploadedFile.$id;
        } catch (err) {
          console.error("Error uploading avatar:", err);
          // No es crítico, continuar sin avatar
        }
      }

      // Crear usuario con profile
      const result = await createUserWithProfile({
        ...data,
        avatarFileId,
        groupId: defaultGroupId,
      });

      // Si se marcó crear como conductor, crear también el driver
      if (data.createAsDriver && defaultGroupId && result.profile) {
        try {
          await createDriver({
            groupId: defaultGroupId,
            linkedProfileId: result.profile.$id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || null,
          });
        } catch (err) {
          console.error("Error creating driver:", err);
          // Notificar pero no fallar
          toast.error(
            "Usuario creado, pero hubo un error al crear el conductor. Créalo manualmente."
          );
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["user-stats"]);
      queryClient.invalidateQueries(["drivers"]);
      toast.success(
        `Usuario "${result.profile?.firstName} ${result.profile?.lastName}" creado exitosamente`
      );
      handleClose();
    },
    onError: (err) => {
      console.error("Error creating user:", err);
      toast.error(err.message || "Error al crear el usuario");
    },
  });

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      phoneLada: "52",
      username: "",
      isPlatformAdmin: false,
      createAsDriver: false,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen no puede superar 2MB");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es obligatorio";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es obligatorio";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }
    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Validar teléfono: solo dígitos, y el total (lada + número) no debe exceder 15 dígitos
    if (formData.phoneNumber) {
      const cleanPhone = formData.phoneNumber.replace(/\D/g, "");
      const cleanLada = formData.phoneLada.replace(/\D/g, "");
      const totalDigits = cleanLada.length + cleanPhone.length;

      if (cleanPhone.length < 7) {
        newErrors.phoneNumber = "El número debe tener al menos 7 dígitos";
      } else if (totalDigits > 15) {
        newErrors.phoneNumber = `Máximo 15 dígitos en total (lada: ${cleanLada.length} + número: ${cleanPhone.length} = ${totalDigits})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Construir teléfono completo con lada
  const buildFullPhone = () => {
    if (!formData.phoneNumber) return undefined;
    const cleanPhone = formData.phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) return undefined;

    // Limpiar la lada también (puede tener + o caracteres extra)
    const cleanLada = formData.phoneLada.replace(/\D/g, "");
    const fullNumber = `+${cleanLada}${cleanPhone}`;

    // Verificar que no exceda 15 dígitos (sin contar el +)
    const totalDigits = cleanLada.length + cleanPhone.length;
    if (totalDigits > 15) {
      console.warn(`Phone number too long: ${totalDigits} digits (max 15)`);
      return undefined;
    }

    return fullNumber;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores del formulario");
      return;
    }

    const fullPhone = buildFullPhone();

    createMutation.mutate({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: fullPhone,
      username: formData.username.trim() || undefined,
      isPlatformAdmin: formData.isPlatformAdmin,
      createAsDriver: formData.createAsDriver,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      header={
        <ModalHeader
          icon={UserPlus}
          title="Crear nuevo usuario"
          subtitle="Registra un nuevo usuario en el sistema"
        />
      }
      footer={
        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Crear usuario
              </>
            )}
          </Button>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative h-24 w-24 rounded-full border-2 border-dashed border-(--border) bg-(--muted)/50 flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <AnimatePresence mode="wait">
                {avatarPreview ? (
                  <motion.img
                    key="preview"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    src={avatarPreview}
                    alt="Avatar preview"
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
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Upload size={20} className="text-white" />
              </div>
            </motion.div>

            {avatarPreview && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAvatar();
                }}
                className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={12} />
              </motion.button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />

          <p className="text-xs text-(--muted-fg)">Foto de perfil (opcional)</p>
        </div>

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" required>
              Nombre
            </Label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                placeholder="Juan"
                className="pl-9"
                error={errors.firstName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" required>
              Apellido
            </Label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleChange("lastName")}
                placeholder="Pérez"
                className="pl-9"
                error={errors.lastName}
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" required>
            Correo electrónico
          </Label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
            />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              placeholder="usuario@ejemplo.com"
              className="pl-9"
              error={errors.email}
            />
          </div>
        </div>

        {/* Password y Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password" required>
              Contraseña
            </Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange("password")}
                placeholder="Mínimo 8 caracteres"
                className="pl-9 pr-10"
                error={errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted-fg) hover:text-(--fg)"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" required>
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="Repite la contraseña"
                className="pl-9 pr-10"
                error={errors.confirmPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted-fg) hover:text-(--fg)"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Phone y Username */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="flex">
              <LadaSelect
                value={formData.phoneLada}
                onChange={(lada) =>
                  setFormData((prev) => ({ ...prev, phoneLada: lada }))
                }
              />
              <div className="relative flex-1">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  placeholder="123 456 7890"
                  className="rounded-l-none"
                  error={errors.phoneNumber}
                />
              </div>
            </div>
            {errors.phoneNumber && (
              <p className="text-xs text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="relative">
              <AtSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              />
              <Input
                id="username"
                value={formData.username}
                onChange={handleChange("username")}
                placeholder="juanperez"
                className="pl-9"
                error={errors.username}
              />
            </div>
          </div>
        </div>

        {/* Platform Admin checkbox */}
        <div className="rounded-xl border border-(--border) p-4 bg-(--muted)/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPlatformAdmin}
              onChange={handleChange("isPlatformAdmin")}
              className="mt-1 h-4 w-4 rounded border-(--border) text-(--brand) focus:ring-(--brand)"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-500" />
                <span className="font-medium text-sm">
                  Administrador de plataforma
                </span>
              </div>
              <p className="text-xs text-(--muted-fg) mt-1">
                Los administradores de plataforma tienen acceso total al sistema
                y pueden gestionar todos los grupos y usuarios.
              </p>
            </div>
          </label>
        </div>

        {/* Create as Driver checkbox */}
        {defaultGroupId && (
          <div className="rounded-xl border p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.createAsDriver}
                onChange={handleChange("createAsDriver")}
                className="mt-1 h-4 w-4 rounded border-(--border) text-blue-500 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-blue-500" />
                  <span className="font-medium text-sm">
                    Crear también como conductor
                  </span>
                </div>
                <p className="text-xs text-(--muted-fg) mt-1">
                  Se creará automáticamente un registro de conductor vinculado a
                  este usuario. Podrás completar la información adicional
                  (licencia, documentos) en la sección de Conductores.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
