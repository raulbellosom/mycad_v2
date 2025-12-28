import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  StickyNote,
  Edit2,
  Trash2,
  MoreVertical,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { cn } from "../../../shared/utils/cn";
import { useState, useRef, useEffect } from "react";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

function ActionMenu({ onEdit, onDelete, isOpen, onToggle, menuRef }) {
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "rounded-lg p-2 transition-all",
          "text-(--muted-fg) hover:text-(--fg) hover:bg-(--muted)/50",
          isOpen && "bg-(--muted)/50 text-(--fg)"
        )}
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-(--border) bg-(--card) py-1 shadow-lg"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              onToggle();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
          >
            <Edit2 size={14} />
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              onToggle();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </motion.div>
      )}
    </div>
  );
}

export function ClientCard({ client, index, onEdit, onDelete, onSelect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card
        padding="none"
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "hover:border-(--brand)/40 hover:shadow-lg hover:shadow-(--brand)/5",
          "cursor-pointer h-full flex flex-col"
        )}
        onClick={() => onSelect?.(client)}
      >
        {/* Header con avatar y acciones */}
        <div className="flex items-start justify-between gap-3 p-4 pb-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              "bg-(--brand)/10 text-(--brand) font-bold text-lg",
              "group-hover:bg-(--brand)/15 transition-colors"
            )}
          >
            {client.name?.charAt(0)?.toUpperCase() || "C"}
          </div>

          <ActionMenu
            isOpen={menuOpen}
            onToggle={() => setMenuOpen(!menuOpen)}
            onEdit={() => onEdit(client)}
            onDelete={() => onDelete(client)}
            menuRef={menuRef}
          />
        </div>

        {/* Nombre - permite 2 líneas */}
        <div className="px-4 pb-3">
          <h3
            className={cn(
              "font-semibold text-(--fg) text-[15px] leading-snug",
              "group-hover:text-(--brand) transition-colors",
              "line-clamp-2"
            )}
            title={client.name}
          >
            {client.name}
          </h3>
        </div>

        {/* Info del cliente */}
        <div className="px-4 pb-4 space-y-2 flex-1">
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-(--muted-fg)">
              <Mail size={14} className="shrink-0 opacity-60" />
              <span className="truncate" title={client.email}>
                {client.email}
              </span>
            </div>
          )}

          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-(--muted-fg)">
              <Phone size={14} className="shrink-0 opacity-60" />
              <span>{client.phone}</span>
            </div>
          )}

          {client.notes && (
            <div className="flex items-start gap-2 text-xs text-(--muted-fg)">
              <StickyNote size={13} className="shrink-0 mt-0.5 opacity-60" />
              <span
                className="line-clamp-2 leading-relaxed"
                title={client.notes}
              >
                {client.notes}
              </span>
            </div>
          )}

          {/* Placeholder si no hay contacto */}
          {!client.email && !client.phone && !client.notes && (
            <p className="text-xs text-(--muted-fg)/50 italic">
              Sin información de contacto
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 mt-auto",
            "border-t border-(--border) bg-(--muted)/10"
          )}
        >
          <div className="flex items-center gap-1.5 text-xs text-(--muted-fg)">
            <Calendar size={12} />
            {formatDate(client.$createdAt) || "Sin fecha"}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(client);
            }}
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              "text-(--brand) hover:underline"
            )}
          >
            Ver detalles <ChevronRight size={14} />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

// Versión compacta para listas
export function ClientListItem({ client, onEdit, onDelete, onSelect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={() => onSelect?.(client)}
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-xl",
        "border border-(--border) bg-(--card)",
        "hover:border-(--brand)/40 hover:shadow-md transition-all",
        "cursor-pointer group"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            "bg-(--brand)/10 text-(--brand) font-semibold"
          )}
        >
          {client.name?.charAt(0)?.toUpperCase() || "C"}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-medium text-(--fg) group-hover:text-(--brand) transition-colors line-clamp-1"
            title={client.name}
          >
            {client.name}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-(--muted-fg) mt-0.5">
            {client.email && (
              <span
                className="flex items-center gap-1.5 truncate max-w-[220px]"
                title={client.email}
              >
                <Mail size={11} className="shrink-0 opacity-60" />{" "}
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={11} className="shrink-0 opacity-60" />{" "}
                {client.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <ActionMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        onEdit={() => onEdit(client)}
        onDelete={() => onDelete(client)}
        menuRef={menuRef}
      />
    </div>
  );
}
