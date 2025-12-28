import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "../ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-(--bg) px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Animated 404 Illustration */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="mb-8"
        >
          <svg
            className="mx-auto h-64 w-64"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Circle */}
            <motion.circle
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              cx="100"
              cy="100"
              r="80"
              className="fill-brand-50 dark:fill-brand-900/20"
            />

            {/* 404 Text */}
            <motion.text
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              x="100"
              y="115"
              className="fill-brand-600 dark:fill-brand-400 text-6xl font-bold"
              textAnchor="middle"
              fontFamily="Outfit, sans-serif"
            >
              404
            </motion.text>

            {/* Decorative Elements */}
            <motion.circle
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              cx="40"
              cy="60"
              r="8"
              className="fill-brand-300 dark:fill-brand-700"
            />
            <motion.circle
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              cx="160"
              cy="140"
              r="6"
              className="fill-brand-400 dark:fill-brand-600"
            />
            <motion.circle
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              cx="150"
              cy="50"
              r="10"
              className="fill-brand-200 dark:fill-brand-800"
            />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-4 text-4xl font-bold text-(--fg)"
        >
          Página no encontrada
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8 max-w-md text-lg text-(--muted-fg)"
        >
          Lo sentimos, la página que buscas no existe o fue movida a otra
          ubicación.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link to="/dashboard">
              <Home size={18} className="mr-2" />
              Ir al Inicio
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link to="/vehicles">
              <Search size={18} className="mr-2" />
              Ver Vehículos
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} className="mr-2" />
            Regresar
          </Button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <p className="mb-3 text-sm font-medium text-(--muted-fg)">
            Enlaces útiles:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              to="/catalogs"
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              Catálogos
            </Link>
            <Link
              to="/groups"
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              Mis Grupos
            </Link>
            <Link
              to="/profile"
              className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              Mi Perfil
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
