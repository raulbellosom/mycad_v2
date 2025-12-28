import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon,
  className = "",
  children,
}) {
  const I = Icon || FolderOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-(--border) bg-(--muted)/30 p-12 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 rounded-full bg-(--muted) p-6 shadow-sm"
      >
        <I size={40} className="text-(--muted-fg)" />
      </motion.div>
      <h3 className="text-xl font-semibold text-(--fg)">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-(--muted-fg)">{description}</p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </motion.div>
  );
}
