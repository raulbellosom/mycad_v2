import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Check,
  X,
  AlertCircle,
  Loader2,
  LogIn,
  Clock,
  Shield,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { AppLogo } from "../../../shared/ui/AppLogo";
import { useAuth } from "../hooks/useAuth";
import {
  getInvitationByToken,
  acceptInvitation,
  rejectInvitation,
} from "../../groups/services/invitations.service";

const ROLE_LABELS = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
  VIEWER: "Visualizador",
};

export function AcceptInvitationPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, profile, isLoading: isAuthLoading } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [status, setStatus] = useState("loading"); // loading, valid, expired, used, not_found, error, success, rejected
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Cargar invitación
  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setStatus("not_found");
        return;
      }

      try {
        const inv = await getInvitationByToken(token);

        if (!inv) {
          setStatus("not_found");
          return;
        }

        // Verificar estado
        if (inv.status === "ACCEPTED") {
          setStatus("used");
          setInvitation(inv);
          return;
        }

        if (inv.status === "REJECTED" || inv.status === "CANCELLED") {
          setStatus("used");
          setInvitation(inv);
          return;
        }

        // Verificar expiración
        if (new Date(inv.expiresAt) < new Date()) {
          setStatus("expired");
          setInvitation(inv);
          return;
        }

        setInvitation(inv);
        setStatus("valid");
      } catch (err) {
        console.error("Error loading invitation:", err);
        setStatus("error");
        setError(err.message);
      }
    }

    loadInvitation();
  }, [token]);

  // Verificar si el usuario logueado coincide con la invitación
  const canAccept = useMemo(() => {
    if (!invitation || !profile) return false;

    // Si la invitación tiene un profileId específico, verificar que coincida
    if (invitation.invitedProfileId) {
      return invitation.invitedProfileId === profile.$id;
    }

    // Si no tiene profileId, verificar por email
    return (
      invitation.invitedEmail.toLowerCase() === profile.email?.toLowerCase()
    );
  }, [invitation, profile]);

  const handleAccept = async () => {
    if (!profile) {
      // Redirigir a login si no está autenticado
      nav("/login", {
        state: { from: `/invitations/accept?token=${token}` },
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await acceptInvitation(token, profile.$id);
      setStatus("success");

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        nav("/dashboard", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await rejectInvitation(token);
      setStatus("rejected");
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  // Loading state
  if (status === "loading" || isAuthLoading) {
    return (
      <InvitationLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-neutral-500 dark:text-neutral-400">
            Cargando invitación...
          </p>
        </div>
      </InvitationLayout>
    );
  }

  // Not found
  if (status === "not_found") {
    return (
      <InvitationLayout>
        <StatusCard
          icon={AlertCircle}
          iconColor="text-red-500"
          title="Invitación no encontrada"
          description="El enlace de invitación no es válido o ha sido eliminado."
        >
          <Link to="/login">
            <Button variant="outline" className="mt-4">
              <LogIn className="mr-2 h-4 w-4" />
              Ir a iniciar sesión
            </Button>
          </Link>
        </StatusCard>
      </InvitationLayout>
    );
  }

  // Expired
  if (status === "expired") {
    return (
      <InvitationLayout>
        <StatusCard
          icon={Clock}
          iconColor="text-amber-500"
          title="Invitación expirada"
          description="Esta invitación ha expirado. Contacta al administrador del grupo para recibir una nueva invitación."
        >
          {invitation?.group?.name && (
            <p className="mt-2 text-sm text-neutral-500">
              Grupo: <strong>{invitation.group.name}</strong>
            </p>
          )}
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              Ir al dashboard
            </Button>
          </Link>
        </StatusCard>
      </InvitationLayout>
    );
  }

  // Already used
  if (status === "used") {
    return (
      <InvitationLayout>
        <StatusCard
          icon={AlertCircle}
          iconColor="text-amber-500"
          title="Invitación ya procesada"
          description={`Esta invitación ya fue ${
            invitation?.status === "ACCEPTED"
              ? "aceptada"
              : invitation?.status === "REJECTED"
              ? "rechazada"
              : "cancelada"
          }.`}
        >
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              Ir al dashboard
            </Button>
          </Link>
        </StatusCard>
      </InvitationLayout>
    );
  }

  // Success
  if (status === "success") {
    return (
      <InvitationLayout>
        <StatusCard
          icon={Check}
          iconColor="text-green-500"
          title="¡Te has unido al grupo!"
          description={`Ahora eres parte de ${
            invitation?.group?.name || "el grupo"
          }. Serás redirigido al dashboard...`}
        >
          <div className="mt-4 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Redirigiendo...</span>
          </div>
        </StatusCard>
      </InvitationLayout>
    );
  }

  // Rejected
  if (status === "rejected") {
    return (
      <InvitationLayout>
        <StatusCard
          icon={X}
          iconColor="text-neutral-500"
          title="Invitación rechazada"
          description="Has rechazado la invitación al grupo."
        >
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              Ir al dashboard
            </Button>
          </Link>
        </StatusCard>
      </InvitationLayout>
    );
  }

  // Error
  if (status === "error") {
    return (
      <InvitationLayout>
        <StatusCard
          icon={AlertCircle}
          iconColor="text-red-500"
          title="Error al cargar"
          description={error || "Ocurrió un error al procesar la invitación."}
        >
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4">
              Ir al dashboard
            </Button>
          </Link>
        </StatusCard>
      </InvitationLayout>
    );
  }

  // Valid invitation - show details
  return (
    <InvitationLayout>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Invitación a grupo</h2>
          <p className="mt-1 text-orange-100">Has sido invitado a unirte</p>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Group info */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Grupo
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
              {invitation?.group?.name || "Grupo"}
            </p>
          </div>

          {/* Role */}
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Rol asignado
              </p>
              <p className="mt-1 font-medium text-neutral-900 dark:text-white">
                {ROLE_LABELS[invitation?.role] || invitation?.role}
              </p>
            </div>
            <Shield className="h-5 w-5 text-orange-500" />
          </div>

          {/* Inviter */}
          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Invitado por:{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {invitation?.invitedBy?.firstName}{" "}
              {invitation?.invitedBy?.lastName}
            </span>
          </div>

          {/* Message */}
          {invitation?.message && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Mensaje
              </p>
              <p className="mt-2 text-sm italic text-neutral-600 dark:text-neutral-300">
                "{invitation.message}"
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          {!user ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                Inicia sesión para aceptar esta invitación
              </p>
              <Link
                to={`/login?redirect=${encodeURIComponent(
                  `/invitations/accept?token=${token}`
                )}`}
                className="block"
              >
                <Button className="w-full" size="lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </Button>
              </Link>
              <p className="text-center text-xs text-neutral-400">
                ¿No tienes cuenta?{" "}
                <Link
                  to={`/register?redirect=${encodeURIComponent(
                    `/invitations/accept?token=${token}`
                  )}`}
                  className="text-orange-500 hover:underline"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          ) : !canAccept ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900 dark:bg-amber-950/50">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Esta invitación fue enviada a{" "}
                <strong>{invitation?.invitedEmail}</strong>. Estás conectado
                como <strong>{profile?.email}</strong>.
              </p>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                Cierra sesión e inicia con la cuenta correcta.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </>
                )}
              </Button>
              <Button
                className="flex-1"
                onClick={handleAccept}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Aceptar
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Expiration notice */}
          <p className="text-center text-xs text-neutral-400">
            Esta invitación expira el{" "}
            {new Date(invitation?.expiresAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </Card>
    </InvitationLayout>
  );
}

// Layout wrapper
function InvitationLayout({ children }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute left-[-15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/10 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-orange-500/15 to-amber-400/10 blur-3xl"
        />
      </div>

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 flex flex-col items-center"
          >
            <Link to="/">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 blur-xl" />
                <div className="relative rounded-2xl bg-white/80 p-3 shadow-xl shadow-orange-500/10 ring-1 ring-black/5 backdrop-blur-sm dark:bg-neutral-800/80 dark:ring-white/10">
                  <AppLogo size="xl" />
                </div>
              </div>
            </Link>
          </motion.div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}

// Status card component
function StatusCard({ icon: Icon, iconColor, title, description, children }) {
  return (
    <Card className="p-8 text-center">
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 ${iconColor}`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {children}
    </Card>
  );
}
