import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Car, Wrench, MapPin, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

/**
 * Página 404 - Not Found
 * Diseño moderno con animaciones y opciones de navegación
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-gradient-to-br from-(--bg) via-(--bg) to-(--muted)/20 px-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-(--brand)/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 5,
          }}
          className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-tl from-(--brand)/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative text-center max-w-2xl mx-auto"
      >
        {/* Animated 404 Illustration */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 120,
            damping: 15,
          }}
          className="mb-8 relative"
        >
          {/* Main 404 Container */}
          <div className="relative">
            {/* Glow Effect */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-r from-(--brand)/30 via-(--brand)/50 to-(--brand)/30 blur-2xl rounded-full"
            />

            {/* 404 Text with gradient */}
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative text-9xl md:text-[12rem] font-black bg-gradient-to-br from-(--brand) via-(--brand-dark) to-(--brand) bg-clip-text text-transparent"
              style={{
                textShadow: "0 0 80px var(--brand-rgb)",
              }}
            >
              404
            </motion.h1>

            {/* Floating Icons */}
            <motion.div
              animate={{
                y: [-10, 10, -10],
                rotate: [-5, 5, -5],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-12 top-1/4 hidden md:block"
            >
              <Car className="h-12 w-12 text-(--brand)/40" />
            </motion.div>
            <motion.div
              animate={{
                y: [10, -10, 10],
                rotate: [5, -5, 5],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -right-12 top-1/3 hidden md:block"
            >
              <Wrench className="h-10 w-10 text-(--brand)/30" />
            </motion.div>
            <motion.div
              animate={{
                y: [-8, 8, -8],
                rotate: [-3, 3, -3],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute left-1/4 -top-8 hidden md:block"
            >
              <MapPin className="h-8 w-8 text-(--brand)/35" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title with stagger animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-(--fg) mb-2 flex items-center justify-center gap-2">
            Oops! Página no encontrada
            <motion.div
              animate={{ rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6 text-(--brand)" />
            </motion.div>
          </h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-10 text-lg md:text-xl text-(--muted-fg) max-w-lg mx-auto"
        >
          La página que buscas parece haber tomado un desvío.
          <br />
          <span className="text-sm mt-2 inline-block">
            Pero no te preocupes, te ayudamos a encontrar el camino de vuelta.
          </span>
        </motion.p>

        {/* Action Buttons - Staggered Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Button asChild size="lg" className="gap-2 min-w-[160px]">
              <Link to="/">
                <Home className="h-5 w-5" />
                Ir al Inicio
              </Link>
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
              onClick={handleGoBack}
              className="gap-2 min-w-[160px]"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver Atrás
            </Button>
          </motion.div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 pt-8 border-t border-(--border)"
        >
          <p className="mb-4 text-sm font-medium text-(--muted-fg) uppercase tracking-wide">
            Enlaces Rápidos
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { to: "/vehicles", label: "Vehículos", icon: Car },
              { to: "/reports", label: "Reportes", icon: Wrench },
              { to: "/groups", label: "Grupos", icon: MapPin },
            ].map((link, index) => (
              <motion.div
                key={link.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                <Link
                  to={link.to}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-(--brand) hover:bg-(--brand)/10 transition-all duration-200 border border-transparent hover:border-(--brand)/20"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
