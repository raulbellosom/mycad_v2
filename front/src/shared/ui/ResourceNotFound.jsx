import { motion } from "framer-motion";
import { AlertCircle, Lock, FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "./Button";
import { useNavigate } from "react-router-dom";

/**
 * ResourceNotFound Component
 * Muestra un mensaje elegante cuando un recurso no existe o no hay permisos
 *
 * @param {string} resourceType - Tipo de recurso (ej: "reporte", "vehículo", "usuario")
 * @param {string} resourceId - ID del recurso buscado (opcional)
 * @param {string} reason - Razón específica: "not-found" | "no-permission" | "error"
 * @param {string} backPath - Ruta para el botón de regreso
 * @param {string} backLabel - Etiqueta del botón de regreso
 */
export function ResourceNotFound({
  resourceType = "recurso",
  resourceId,
  reason = "not-found",
  backPath,
  backLabel,
  customTitle,
  customDescription,
}) {
  const navigate = useNavigate();

  // Configuración según el tipo de error
  const config = {
    "not-found": {
      icon: FileQuestion,
      iconColor: "text-orange-500 dark:text-orange-400",
      title: customTitle || `${resourceType} no encontrado`,
      description:
        customDescription ||
        `El ${resourceType} que buscas no existe o fue eliminado.`,
    },
    "no-permission": {
      icon: Lock,
      iconColor: "text-red-500 dark:text-red-400",
      title: customTitle || "Acceso denegado",
      description:
        customDescription ||
        `No tienes permisos para acceder a este ${resourceType}.`,
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-amber-500 dark:text-amber-400",
      title: customTitle || "Error al cargar",
      description:
        customDescription ||
        `Hubo un problema al intentar cargar este ${resourceType}.`,
    },
  };

  const { icon: Icon, iconColor, title, description } = config[reason];

  const handleGoBack = () => {
    if (backPath) {
      navigate(backPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-125 items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center max-w-lg"
      >
        {/* Animated Icon Container */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 150,
            damping: 12,
          }}
          className="relative mb-8 inline-block"
        >
          {/* Glow Effect */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute inset-0 rounded-full blur-2xl ${
              reason === "not-found"
                ? "bg-orange-500/30"
                : reason === "no-permission"
                ? "bg-red-500/30"
                : "bg-amber-500/30"
            }`}
          />

          {/* Icon Background */}
          <div className="relative rounded-full bg-linear-to-br from-(--muted) to-(--muted)/50 p-8 shadow-lg border border-(--border)">
            <Icon className={`h-16 w-16 ${iconColor}`} strokeWidth={1.5} />
          </div>

          {/* Floating decorative elements */}
          <motion.div
            animate={{
              y: [-5, 5, -5],
              rotate: [-10, 10, -10],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-2 -right-2"
          >
            <div
              className={`h-3 w-3 rounded-full ${
                reason === "not-found"
                  ? "bg-orange-400"
                  : reason === "no-permission"
                  ? "bg-red-400"
                  : "bg-amber-400"
              } opacity-60`}
            />
          </motion.div>
          <motion.div
            animate={{
              y: [5, -5, 5],
              rotate: [10, -10, 10],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -bottom-2 -left-2"
          >
            <div
              className={`h-2 w-2 rounded-full ${
                reason === "not-found"
                  ? "bg-orange-300"
                  : reason === "no-permission"
                  ? "bg-red-300"
                  : "bg-amber-300"
              } opacity-50`}
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-3 text-3xl font-bold text-(--fg)"
        >
          {title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-2 text-lg text-(--muted-fg)"
        >
          {description}
        </motion.p>

        {/* Resource ID (si se proporciona) */}
        {resourceId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mb-8 text-sm font-mono text-(--muted-fg)/70"
          >
            ID: {resourceId}
          </motion.p>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Button onClick={handleGoBack} size="lg" className="gap-2 min-w-40">
              <ArrowLeft className="h-5 w-5" />
              {backLabel || "Volver"}
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/")}
              className="gap-2 min-w-40"
            >
              <Home className="h-5 w-5" />
              Ir al Inicio
            </Button>
          </motion.div>
        </motion.div>

        {/* Helpful tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 pt-6 border-t border-(--border)"
        >
          <p className="text-xs text-(--muted-fg) mb-2">Posibles soluciones:</p>
          <ul className="text-xs text-(--muted-fg)/80 space-y-1">
            {reason === "not-found" && (
              <>
                <li>• Verifica que el enlace sea correcto</li>
                <li>• El recurso pudo haber sido eliminado</li>
                <li>• Intenta buscarlo desde la lista principal</li>
              </>
            )}
            {reason === "no-permission" && (
              <>
                <li>• Contacta al administrador del grupo</li>
                <li>• Verifica que tengas los permisos necesarios</li>
                <li>• Asegúrate de estar en el grupo correcto</li>
              </>
            )}
            {reason === "error" && (
              <>
                <li>• Verifica tu conexión a internet</li>
                <li>• Intenta recargar la página</li>
                <li>• Si el problema persiste, contacta a soporte</li>
              </>
            )}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
