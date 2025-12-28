import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  StickyNote,
  Calendar,
  X,
  Edit2,
  Trash2,
  Building2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Modal, ModalFooter } from "../../../shared/ui/Modal";
import { Button } from "../../../shared/ui/Button";
import { cn } from "../../../shared/utils/cn";
import toast from "react-hot-toast";

function InfoRow({ icon: Icon, label, value, copyable = false }) {
  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="flex items-start gap-3 group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--muted)/50">
        <Icon size={14} className="text-(--muted-fg)" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-(--muted-fg) mb-0.5">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-(--fg) break-words">{value}</p>
          {copyable && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-(--muted)/50 transition-all"
            >
              <Copy size={12} className="text-(--muted-fg)" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClientDetailModal({
  isOpen,
  onClose,
  client,
  onEdit,
  onDelete,
}) {
  if (!client) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = () => {
    onClose();
    onEdit?.(client);
  };

  const handleDelete = () => {
    onClose();
    onDelete?.(client);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      header={
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-(--brand)/20 to-(--brand)/5",
              "text-(--brand) font-bold text-xl"
            )}
          >
            {client.name?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-(--fg)">{client.name}</h2>
            <p className="text-xs text-(--muted-fg)">
              Cliente desde {formatDate(client.$createdAt)?.split(",")[0]}
            </p>
          </div>
        </div>
      }
      footer={
        <ModalFooter className="justify-between">
          {onDelete ? (
            <Button
              variant="ghost"
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
              onClick={handleDelete}
            >
              <Trash2 size={16} className="mr-2" />
              Eliminar
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {onEdit && (
              <Button onClick={handleEdit}>
                <Edit2 size={16} className="mr-2" />
                Editar
              </Button>
            )}
          </div>
        </ModalFooter>
      }
    >
      <div className="space-y-6">
        {/* Información de contacto */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-(--fg) flex items-center gap-2">
            <Building2 size={14} className="text-(--brand)" />
            Información de Contacto
          </h4>

          <div className="space-y-3 pl-2">
            <InfoRow icon={User} label="Nombre" value={client.name} copyable />
            <InfoRow
              icon={Mail}
              label="Correo Electrónico"
              value={client.email}
              copyable
            />
            <InfoRow
              icon={Phone}
              label="Teléfono"
              value={client.phone}
              copyable
            />
          </div>
        </div>

        {/* Notas */}
        {client.notes && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-(--fg) flex items-center gap-2">
              <StickyNote size={14} className="text-(--brand)" />
              Notas
            </h4>
            <div className="rounded-xl bg-(--muted)/30 p-4">
              <p className="text-sm text-(--fg) whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-(--border)">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-(--muted-fg)">Creado</p>
              <p className="text-(--fg) font-medium">
                {formatDate(client.$createdAt)}
              </p>
            </div>
            <div>
              <p className="text-(--muted-fg)">Última actualización</p>
              <p className="text-(--fg) font-medium">
                {formatDate(client.$updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
