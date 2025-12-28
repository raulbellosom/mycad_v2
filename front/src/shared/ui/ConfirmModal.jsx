import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";

const variants = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    confirmColor: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-100 dark:bg-yellow-900/20",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    confirmColor: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    confirmColor: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
}) {
  const config = variants[variant] || variants.danger;
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      footer={
        <ModalFooter align="center" className="w-full">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            className={`flex-1 ${config.confirmColor}`}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}
        >
          <Icon className={`h-8 w-8 ${config.iconColor}`} />
        </motion.div>

        <h3 className="text-lg font-semibold text-(--fg)">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-(--muted-fg) max-w-xs">
            {description}
          </p>
        )}
      </div>
    </Modal>
  );
}
