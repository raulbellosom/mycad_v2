import { forwardRef } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { Slot } from "@radix-ui/react-slot";

export const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

    const variants = {
      primary:
        "bg-(--brand) text-white hover:bg-(--brand-600) active:bg-(--brand-700) shadow-sm hover:shadow-md",
      secondary: "bg-(--muted) text-(--fg) hover:bg-(--border) shadow-sm",
      outline:
        "border-2 border-(--border) bg-transparent hover:bg-(--muted) hover:border-(--brand-300) text-(--fg)",
      ghost: "hover:bg-(--muted) text-(--muted-fg) hover:text-(--fg)",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10",
    };

    const classes = twMerge(
      clsx(baseStyles, variants[variant], sizes[size], className)
    );

    // When using asChild, render with Slot and don't modify children
    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      );
    }

    // Regular button rendering
    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
