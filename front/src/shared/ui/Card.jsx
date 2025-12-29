import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function Card({ className, children, padding = "md", ...props }) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // If onClick is provided, we make it interactive
  const isInteractive = !!props.onClick;

  return (
    <motion.div
      whileHover={
        isInteractive
          ? { y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }
          : undefined
      }
      transition={{ duration: 0.2 }}
      className={twMerge(
        clsx(
          "rounded-2xl border border-(--border) bg-(--card) text-(--card-fg) shadow-sm dark:shadow-none box-border w-full min-w-0 max-w-full overflow-hidden",
          isInteractive && "cursor-pointer",
          paddings[padding],
          className
        )
      )}
      {...props}
    >
      <div className="w-full min-w-0 max-w-full">{children}</div>
    </motion.div>
  );
}
