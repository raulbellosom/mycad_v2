import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function Button({
  className,
  variant = "primary", // primary | secondary | outline | ghost | destructive
  size = "md", // sm | md | lg
  loading = false,
  disabled,
  children,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-(--brand) text-white hover:bg-(--brand-600) active:bg-(--brand-700) shadow-sm",
    secondary:
      "bg-(--muted) text-(--fg) hover:bg-(--border) dark:bg-(--muted) dark:text-(--fg) dark:hover:bg-(--border)",
    outline:
      "border border-(--border) bg-transparent hover:bg-(--muted) text-(--fg)",
    ghost: "hover:bg-(--muted) text-(--muted-fg) hover:text-(--fg)",
    destructive:
      "bg-(--destructive) text-(--destructive-fg) hover:bg-red-600 shadow-sm",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={twMerge(
        clsx(baseStyles, variants[variant], sizes[size], className)
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
