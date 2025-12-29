import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

/**
 * StatCard - Tarjeta de estadística para el dashboard
 * Muestra un valor numérico con título, icono y cambio opcional
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
  onClick,
  className,
  loading = false,
}) {
  const variants = {
    default: {
      bg: "bg-white dark:bg-stone-900",
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-600 dark:text-stone-400",
    },
    primary: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
      iconBg: "bg-orange-500",
      iconColor: "text-white",
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20",
      iconBg: "bg-emerald-500",
      iconColor: "text-white",
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
    },
    danger: {
      bg: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
      iconBg: "bg-red-500",
      iconColor: "text-white",
    },
    info: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
      iconBg: "bg-blue-500",
      iconColor: "text-white",
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <motion.div
      whileHover={onClick ? { y: -2, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={twMerge(
        clsx(
          "relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm",
          style.bg,
          onClick && "cursor-pointer",
          className
        )
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-linear-to-br from-stone-200/20 to-stone-300/10 dark:from-stone-700/10 dark:to-stone-600/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
              {typeof value === "number"
                ? value.toLocaleString("es-MX")
                : value}
            </p>
          )}

          {subtitle && (
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 truncate">
              {subtitle}
            </p>
          )}

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={clsx(
                  "text-xs font-semibold",
                  trend > 0 && "text-emerald-600 dark:text-emerald-400",
                  trend < 0 && "text-red-600 dark:text-red-400",
                  trend === 0 && "text-stone-500 dark:text-stone-400"
                )}
              >
                {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={twMerge(
              clsx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                style.iconBg
              )
            )}
          >
            <Icon className={twMerge(clsx("h-6 w-6", style.iconColor))} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * MiniStatCard - Versión compacta de StatCard
 */
export function MiniStatCard({
  label,
  value,
  icon: Icon,
  color = "stone",
  loading = false,
}) {
  const colors = {
    stone: "text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800",
    orange:
      "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
    emerald:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    amber:
      "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
    red: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 p-3">
      {Icon && (
        <div
          className={twMerge(
            clsx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              colors[color]
            )
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
          {label}
        </p>
        {loading ? (
          <div className="mt-0.5 h-5 w-12 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
        ) : (
          <p className="text-lg font-bold text-stone-900 dark:text-white">
            {typeof value === "number" ? value.toLocaleString("es-MX") : value}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * StatGrid - Grid responsivo para StatCards
 */
export function StatGrid({ children, cols = 4 }) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className={twMerge(clsx("grid gap-4", gridCols[cols] || gridCols[4]))}>
      {children}
    </div>
  );
}
