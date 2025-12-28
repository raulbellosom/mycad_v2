import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { Card } from "../../../shared/ui/Card";

/**
 * RequirePermission - Componente para proteger secciones que requieren permisos específicos
 *
 * @param {Object} props
 * @param {string|string[]} props.permission - Permiso(s) requerido(s)
 * @param {boolean} props.requireAll - Si true, requiere TODOS los permisos. Si false, requiere AL MENOS UNO
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene permisos
 * @param {string} props.fallbackPath - Ruta a redirigir si no tiene permisos (opcional)
 * @param {React.ReactNode} props.fallback - Componente alternativo si no tiene permisos (opcional)
 * @param {boolean} props.showAccessDenied - Si mostrar mensaje de acceso denegado (default: true)
 */
export function RequirePermission({
  permission,
  requireAll = false,
  children,
  fallbackPath,
  fallback,
  showAccessDenied = true,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  // Mientras carga los permisos
  if (isLoading) {
    return <LoadingScreen label="Verificando permisos..." />;
  }

  // Verificar permisos
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  // Si tiene acceso, mostrar contenido
  if (hasAccess) {
    return children;
  }

  // Si hay ruta de fallback, redirigir
  if (fallbackPath) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si hay componente fallback personalizado, mostrarlo
  if (fallback) {
    return fallback;
  }

  // Mostrar mensaje de acceso denegado
  if (showAccessDenied) {
    return <AccessDenied permissions={permissions} />;
  }

  // No renderizar nada
  return null;
}

/**
 * Componente de acceso denegado
 */
function AccessDenied({ permissions }) {
  return (
    <Card className="mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Acceso Denegado</h2>
      <p className="mb-4 text-sm text-(--muted-fg)">
        No tienes los permisos necesarios para ver esta sección.
      </p>
      <div className="rounded-lg bg-(--muted) p-3">
        <p className="text-xs text-(--muted-fg)">Permisos requeridos:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {permissions.map((p) => (
            <span
              key={p}
              className="rounded-full bg-(--bg) px-2 py-1 text-xs font-mono"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Hook para usar en lógica condicional
 * Útil cuando necesitas verificar permisos sin renderizar un componente wrapper
 */
export function useRequirePermission(permission, requireAll = false) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return { hasAccess, isLoading };
}

/**
 * PermissionGate - Componente inline para mostrar/ocultar elementos basados en permisos
 * No muestra mensaje de error, simplemente no renderiza el contenido
 *
 * @example
 * <PermissionGate permission="vehicles.create">
 *   <Button>Crear Vehículo</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  if (isLoading) return null;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? children : fallback;
}
