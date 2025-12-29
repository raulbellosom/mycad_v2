import { twMerge } from "tailwind-merge";
import clsx from "clsx";

/**
 * PageLayout - Componente de layout unificado para todas las páginas
 *
 * Proporciona un contenedor consistente con:
 * - Espaciado vertical uniforme (space-y-6)
 * - Estructura de header con título, subtítulo y acciones
 * - Contenido principal
 *
 * @param {Object} props
 * @param {string} props.title - Título principal de la página
 * @param {string} props.subtitle - Subtítulo o descripción
 * @param {React.ReactNode} props.actions - Botones o acciones del header
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} props.className - Clases adicionales para el contenedor
 */
export function PageLayout({ title, subtitle, actions, children, className }) {
  return (
    <div className={twMerge(clsx("space-y-6 w-full max-w-full", className))}>
      {/* Header Section */}
      {(title || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {title && (
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}

/**
 * PageLayout.Empty - Estado vacío centrado para cuando no hay grupo seleccionado
 */
PageLayout.Empty = function PageLayoutEmpty({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="grid h-[60dvh] place-items-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {Icon && (
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <Icon size={28} className="text-zinc-400 dark:text-zinc-500" />
          </div>
        )}
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};
