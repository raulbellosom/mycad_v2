import { useContext } from "react";
import { PermissionsContext } from "../context/PermissionsProvider";

/**
 * Hook para acceder al contexto de permisos
 * Provee funciones para verificar permisos del usuario actual en el grupo activo
 */
export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}
