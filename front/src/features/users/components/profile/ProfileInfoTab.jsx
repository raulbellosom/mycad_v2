import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Save, User, Phone, AtSign, ChevronDown, Search } from "lucide-react";

import { Card } from "../../../../shared/ui/Card";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import {
  updateMyProfileInfo,
  updateAuthName,
} from "../../../auth/services/myProfile.service";
import { cn } from "../../../../shared/utils/cn";

// Ladas
import ladasData from "../../../../shared/utils/ladas.json";

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
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-(--muted) transition-colors text-left",
                      value === lada.lada && "bg-(--brand)/10 text-(--brand)"
                    )}
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

// Parsear teléfono existente para extraer lada y número
function parsePhone(phone) {
  if (!phone) return { lada: "52", number: "" };

  // Si empieza con +, extraer la lada
  const cleanPhone = phone.replace(/\s+/g, "");
  if (cleanPhone.startsWith("+")) {
    // Intentar encontrar una lada que coincida
    for (const l of sortedLadas) {
      if (cleanPhone.startsWith(`+${l.lada}`)) {
        return {
          lada: l.lada,
          number: cleanPhone.slice(l.lada.length + 1),
        };
      }
    }
  }

  // Si no tiene formato, asumir México
  return { lada: "52", number: cleanPhone.replace(/^\+/, "") };
}

export function ProfileInfoTab({ profile, user, onUpdate }) {
  const parsedPhone = parsePhone(profile.phone);

  const [formData, setFormData] = useState({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    phone: parsedPhone.number,
    lada: parsedPhone.lada,
    username: profile.username || "",
  });

  // Mutation para actualizar info básica
  const updateInfoMutation = useMutation({
    mutationFn: async (data) => {
      // Combinar lada + phone para guardar
      const fullPhone = data.phone
        ? `+${data.lada}${data.phone.replace(/\D/g, "")}`
        : "";

      // Actualizar profile en DB
      await updateMyProfileInfo(profile.$id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: fullPhone,
        username: data.username,
      });

      // Sincronizar nombre completo con Auth
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      if (fullName !== user.name) {
        await updateAuthName(fullName);
      }
    },
    onSuccess: () => {
      onUpdate();
      toast.success("Información actualizada");
    },
    onError: (e) => {
      toast.error(e.message || "Error al actualizar");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Nombre y apellido son requeridos");
      return;
    }
    updateInfoMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Personal Info Form */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <User size={20} className="text-(--brand)" />
          Información Personal
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre(s) *"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              placeholder="Ej. Juan"
            />
            <Input
              label="Apellido(s) *"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Ej. Pérez"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Teléfono con selector de lada */}
            <div>
              <label className="block text-sm font-medium text-(--fg) mb-1.5">
                Teléfono
              </label>
              <div className="flex">
                <LadaSelect
                  value={formData.lada}
                  onChange={(lada) =>
                    setFormData((prev) => ({ ...prev, lada }))
                  }
                />
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="55 1234 5678"
                    className="w-full h-10 px-3 pr-9 rounded-r-lg border border-(--border) bg-(--input) text-(--fg) placeholder:text-(--muted-fg) focus:outline-none focus:ring-2 focus:ring-(--brand)"
                  />
                  <Phone
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
                    size={16}
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              <Input
                label="Usuario (opcional)"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder="@usuario"
              />
              <AtSign
                className="absolute right-3 top-9 text-(--muted-fg)"
                size={16}
              />
            </div>
          </div>

          {/* Read-only Email */}
          <div className="rounded-lg border border-(--border) bg-(--muted)/20 p-4">
            <p className="text-xs text-(--muted-fg) mb-1">
              Correo electrónico (para cambiarlo ve a la pestaña Seguridad)
            </p>
            <p className="text-sm font-medium text-(--fg)">{profile.email}</p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={updateInfoMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Save size={16} className="mr-2" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Info (read-only) */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-(--fg)">
          Información de Cuenta
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-(--muted-fg)">ID de Usuario</p>
            <p className="font-mono text-xs text-(--fg) bg-(--muted)/20 p-2 rounded mt-1 break-all">
              {profile.$id}
            </p>
          </div>
          <div>
            <p className="text-(--muted-fg)">ID Auth</p>
            <p className="font-mono text-xs text-(--fg) bg-(--muted)/20 p-2 rounded mt-1 break-all">
              {profile.userAuthId}
            </p>
          </div>
          <div>
            <p className="text-(--muted-fg)">Creado</p>
            <p className="text-(--fg)">
              {new Date(profile.$createdAt).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-(--muted-fg)">Última actualización</p>
            <p className="text-(--fg)">
              {new Date(profile.$updatedAt).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
