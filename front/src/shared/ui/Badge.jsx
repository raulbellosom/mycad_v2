import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Badge component para mostrar estados y etiquetas
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}) {
  const variants = {
    default: "bg-(--muted) text-(--muted-fg)",
    primary: "bg-(--brand)/10 text-(--brand)",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    amber:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
    stone: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300",
  };

  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-1 text-sm",
  };

  const dotColors = {
    default: "bg-(--muted-fg)",
    primary: "bg-(--brand)",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    amber: "bg-amber-500",
    danger: "bg-red-500",
    red: "bg-red-500",
    info: "bg-blue-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    stone: "bg-stone-500",
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx("h-1.5 w-1.5 rounded-full", dotColors[variant])}
        />
      )}
      {children}
    </motion.span>
  );
}
