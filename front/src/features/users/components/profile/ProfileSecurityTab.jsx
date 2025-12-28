import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Smartphone,
  Globe,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Card } from "../../../../shared/ui/Card";
import { Input } from "../../../../shared/ui/Input";
import { Button } from "../../../../shared/ui/Button";
import { ConfirmModal } from "../../../../shared/ui/ConfirmModal";
import {
  updateEmail,
  syncEmailToProfile,
  updatePassword,
  getActiveSessions,
  deleteSession,
  deleteOtherSessions,
} from "../../../auth/services/myProfile.service";
import { cn } from "../../../../shared/utils/cn";

export function ProfileSecurityTab({ profile, user, onUpdate }) {
  // State for email change
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // State for session management
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const queryClient = useQueryClient();

  // Query: Active sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["mySessions"],
    queryFn: getActiveSessions,
  });

  // Mutation: Change email
  const emailMutation = useMutation({
    mutationFn: async ({ newEmail, currentPassword }) => {
      // Primero actualizar en Auth
      await updateEmail(newEmail, currentPassword);
      // Luego sincronizar con profile
      await syncEmailToProfile(profile.$id, newEmail);
    },
    onSuccess: () => {
      setEmailForm({ newEmail: "", currentPassword: "" });
      onUpdate();
      toast.success("Correo actualizado correctamente");
    },
    onError: (e) => {
      if (e.message?.includes("Invalid credentials")) {
        toast.error("Contraseña incorrecta");
      } else if (e.message?.includes("already exists")) {
        toast.error("Este correo ya está en uso");
      } else {
        toast.error(e.message || "Error al cambiar correo");
      }
    },
  });

  // Mutation: Change password
  const passwordMutation = useMutation({
    mutationFn: async ({ newPassword, currentPassword }) => {
      await updatePassword(newPassword, currentPassword);
    },
    onSuccess: () => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Contraseña actualizada correctamente");
    },
    onError: (e) => {
      if (e.message?.includes("Invalid credentials")) {
        toast.error("Contraseña actual incorrecta");
      } else {
        toast.error(e.message || "Error al cambiar contraseña");
      }
    },
  });

  // Mutation: Delete single session
  const deleteSessionMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries(["mySessions"]);
      toast.success("Sesión cerrada");
    },
    onError: (e) => {
      toast.error(e.message || "Error al cerrar sesión");
    },
  });

  // Mutation: Delete all other sessions
  const deleteOtherSessionsMutation = useMutation({
    mutationFn: deleteOtherSessions,
    onSuccess: () => {
      queryClient.invalidateQueries(["mySessions"]);
      setShowLogoutAllModal(false);
      toast.success("Otras sesiones cerradas");
    },
    onError: (e) => {
      toast.error(e.message || "Error al cerrar sesiones");
    },
  });

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailForm.newEmail.trim() || !emailForm.currentPassword.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    emailMutation.mutate(emailForm);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Completa todos los campos");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    passwordMutation.mutate(passwordForm);
  };

  const sessions = sessionsData?.sessions || [];
  const currentSession = sessions.find((s) => s.current);
  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <div className="space-y-6">
      {/* Email Change Section */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <Mail size={20} className="text-(--brand)" />
          Cambiar Correo Electrónico
        </h3>

        <div className="mb-4 rounded-lg border border-(--border) bg-(--muted)/20 p-3">
          <p className="text-xs text-(--muted-fg)">Correo actual</p>
          <p className="text-sm font-medium text-(--fg)">{profile.email}</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Input
            label="Nuevo correo electrónico"
            type="email"
            value={emailForm.newEmail}
            onChange={(e) =>
              setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))
            }
            placeholder="nuevo@correo.com"
          />

          <div className="relative">
            <Input
              label="Contraseña actual (para confirmar)"
              type={showEmailPassword ? "text" : "password"}
              value={emailForm.currentPassword}
              onChange={(e) =>
                setEmailForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowEmailPassword(!showEmailPassword)}
              className="absolute right-3 top-9 text-(--muted-fg) hover:text-(--fg)"
            >
              {showEmailPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            type="submit"
            loading={emailMutation.isPending}
            disabled={!emailForm.newEmail || !emailForm.currentPassword}
          >
            <Save size={16} className="mr-2" />
            Actualizar correo
          </Button>
        </form>
      </Card>

      {/* Password Change Section */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
          <Lock size={20} className="text-(--brand)" />
          Cambiar Contraseña
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Contraseña actual"
              type={showPasswords.current ? "text" : "password"}
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((p) => ({ ...p, current: !p.current }))
              }
              className="absolute right-3 top-9 text-(--muted-fg) hover:text-(--fg)"
            >
              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Nueva contraseña"
              type={showPasswords.new ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
              className="absolute right-3 top-9 text-(--muted-fg) hover:text-(--fg)"
            >
              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength indicator */}
          {passwordForm.newPassword && (
            <PasswordStrength password={passwordForm.newPassword} />
          )}

          <div className="relative">
            <Input
              label="Confirmar nueva contraseña"
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))
              }
              className="absolute right-3 top-9 text-(--muted-fg) hover:text-(--fg)"
            >
              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {passwordForm.confirmPassword &&
            passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Las contraseñas no coinciden
              </p>
            )}

          <Button
            type="submit"
            loading={passwordMutation.isPending}
            disabled={
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword
            }
          >
            <Lock size={16} className="mr-2" />
            Cambiar contraseña
          </Button>
        </form>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-(--fg)">
            <Smartphone size={20} className="text-(--brand)" />
            Sesiones Activas
          </h3>

          {otherSessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutAllModal(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              <LogOut size={14} className="mr-1" />
              Cerrar otras
            </Button>
          )}
        </div>

        {sessionsLoading ? (
          <div className="text-center py-8 text-(--muted-fg)">
            Cargando sesiones...
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionItem
                key={session.$id}
                session={session}
                onDelete={() => deleteSessionMutation.mutate(session.$id)}
                isDeleting={deleteSessionMutation.isPending}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Logout All Modal */}
      <ConfirmModal
        isOpen={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        onConfirm={() => deleteOtherSessionsMutation.mutate()}
        title="Cerrar otras sesiones"
        description="¿Estás seguro de que deseas cerrar todas las demás sesiones? Mantendrás la sesión actual activa."
        confirmText="Cerrar sesiones"
        variant="danger"
        loading={deleteOtherSessionsMutation.isPending}
      />
    </div>
  );
}

// Password Strength Component
function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ caracteres", valid: password.length >= 8 },
    { label: "Mayúscula", valid: /[A-Z]/.test(password) },
    { label: "Minúscula", valid: /[a-z]/.test(password) },
    { label: "Número", valid: /[0-9]/.test(password) },
    { label: "Carácter especial", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const validCount = checks.filter((c) => c.valid).length;
  const strength =
    validCount <= 2 ? "weak" : validCount <= 4 ? "medium" : "strong";
  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-amber-500",
    strong: "bg-green-500",
  };

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all",
              i <= validCount ? strengthColors[strength] : "bg-(--border)"
            )}
          />
        ))}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1 text-xs">
        {checks.map((check) => (
          <div
            key={check.label}
            className={cn(
              "flex items-center gap-1",
              check.valid ? "text-green-500" : "text-(--muted-fg)"
            )}
          >
            {check.valid ? (
              <CheckCircle2 size={12} />
            ) : (
              <div className="h-3 w-3 rounded-full border border-current" />
            )}
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Session Item Component
function SessionItem({ session, onDelete, isDeleting }) {
  const deviceIcon = session.deviceName?.toLowerCase().includes("mobile") ? (
    <Smartphone size={16} />
  ) : (
    <Globe size={16} />
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 transition-all",
        session.current
          ? "border-(--brand)/30 bg-(--brand)/5"
          : "border-(--border)"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            session.current
              ? "bg-(--brand)/10 text-(--brand)"
              : "bg-(--muted)/30 text-(--muted-fg)"
          )}
        >
          {deviceIcon}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-(--fg)">
              {session.clientName || "Navegador desconocido"}
            </p>
            {session.current && (
              <span className="rounded-full bg-(--brand) px-2 py-0.5 text-[10px] font-bold text-white">
                ACTUAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-(--muted-fg)">
            <span>{session.osName || "SO desconocido"}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(session.$createdAt).toLocaleDateString("es-MX")}
            </span>
          </div>
        </div>
      </div>

      {!session.current && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <LogOut size={14} />
        </Button>
      )}
    </div>
  );
}
