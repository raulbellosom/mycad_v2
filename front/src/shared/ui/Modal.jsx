import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../utils/cn";

/**
 * Modal profesional y reutilizable
 *
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {function} onClose - Callback al cerrar el modal
 * @param {string} [size] - Tamaño del modal: sm, md, lg, xl, 2xl, 3xl, 4xl, full
 * @param {boolean} [dismissible=true] - Si se puede cerrar haciendo clic fuera o con Escape
 * @param {boolean} [showCloseButton=true] - Mostrar botón X para cerrar
 * @param {string} [className] - Clases adicionales para el contenedor del modal
 * @param {React.ReactNode} [header] - Contenido del header (se puede pasar título string o componente)
 * @param {React.ReactNode} [footer] - Contenido del footer (botones de acción)
 * @param {React.ReactNode} children - Contenido del modal (con scroll interno)
 */
export function Modal({
  isOpen,
  onClose,
  size = "md",
  dismissible = true,
  showCloseButton = true,
  className,
  header,
  footer,
  children,
}) {
  const onCloseRef = useRef(onClose);
  const hasInitialFocusRef = useRef(false);

  // Mantener referencia actualizada del onClose sin causar re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Manejar cierre con Escape
  const handleEscape = useCallback(
    (e) => {
      if (e.key === "Escape" && dismissible) {
        onCloseRef.current?.();
      }
    },
    [dismissible]
  );

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      hasInitialFocusRef.current = false;
    } else {
      hasInitialFocusRef.current = false;
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Manejar clic en el backdrop
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && dismissible) {
        onCloseRef.current?.();
      }
    },
    [dismissible]
  );

  // Manejar close button
  const handleCloseButton = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  // Tamaños del modal - responsivos
  const sizes = {
    sm: "max-w-sm sm:max-w-md",
    md: "max-w-md sm:max-w-lg",
    lg: "max-w-lg sm:max-w-xl lg:max-w-2xl",
    xl: "max-w-xl sm:max-w-2xl lg:max-w-3xl",
    "2xl": "max-w-2xl sm:max-w-3xl lg:max-w-4xl",
    "3xl": "max-w-3xl sm:max-w-4xl lg:max-w-5xl",
    "4xl": "max-w-4xl sm:max-w-5xl lg:max-w-6xl",
    full: "max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)]",
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Modal container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className={cn(
              "relative z-10 w-full mx-4 sm:mx-6",
              "flex flex-col",
              "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]",
              "rounded-2xl border border-(--border) bg-(--card) shadow-2xl",
              "outline-none",
              sizes[size],
              className
            )}
          >
            {/* Header - siempre visible y fijo */}
            {(header || showCloseButton) && (
              <div className="shrink-0 flex items-center justify-between gap-4 border-b border-(--border) px-6 py-4">
                <div className="flex-1 min-w-0">
                  {typeof header === "string" ? (
                    <h2 className="text-lg font-semibold text-(--fg) truncate">
                      {header}
                    </h2>
                  ) : (
                    header
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={handleCloseButton}
                    className="shrink-0 rounded-lg p-2 text-(--muted-fg) hover:bg-(--muted) hover:text-(--fg) transition-colors focus:outline-none focus:ring-2 focus:ring-(--ring)"
                    aria-label="Cerrar modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Body - con scroll interno */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {children}
            </div>

            {/* Footer - siempre visible y fijo */}
            {footer && (
              <div className="shrink-0 border-t border-(--border) px-6 py-4 bg-(--card)">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Usar portal para renderizar en el body
  if (typeof window === "undefined") return null;

  return createPortal(modalContent, document.body);
}

/**
 * Componente auxiliar para el header del modal con icono y subtítulo
 */
export function ModalHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--brand)/10 shrink-0">
          <Icon size={20} className="text-(--brand)" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        {title && (
          <h2 className="text-lg font-semibold text-(--fg) truncate">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-(--muted-fg) truncate">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * Componente auxiliar para el footer del modal con botones
 */
export function ModalFooter({ children, align = "end", className }) {
  const alignments = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn("flex items-center gap-3", alignments[align], className)}
    >
      {children}
    </div>
  );
}
