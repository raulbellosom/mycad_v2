import {
  LayoutDashboard,
  Car,
  FolderKanban,
  Users,
  ShieldCheck,
  FileBarChart2,
  ScrollText,
  UserCog,
} from "lucide-react";

/**
 * Configuración de navegación con permisos requeridos
 *
 * requiredPermission: el permiso mínimo para VER este elemento
 * Si es null o undefined, el elemento siempre se muestra (para usuarios autenticados)
 * Si el usuario no tiene el permiso, el elemento no aparece en el sidebar
 */
export const nav = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    requiredPermission: null, // Siempre visible para usuarios autenticados
  },
  {
    to: "/vehicles",
    label: "Vehículos",
    icon: Car,
    requiredPermission: "vehicles.view",
  },
  {
    to: "/drivers",
    label: "Conductores",
    icon: Users,
    requiredPermission: "drivers.view",
  },
  {
    to: "/catalogs",
    label: "Catálogos",
    icon: FolderKanban,
    requiredPermission: "catalogs.view",
  },
  {
    to: "/groups",
    label: "Mis Grupos",
    icon: ShieldCheck,
    requiredPermission: null, // Siempre visible - el usuario necesita ver/seleccionar sus grupos
  },
  {
    to: "/users",
    label: "Usuarios",
    icon: UserCog,
    requiredPermission: "users.view",
  },
  {
    to: "/reports",
    label: "Reportes",
    icon: FileBarChart2,
    requiredPermission: "reports.view",
  },
  {
    to: "/audit",
    label: "Historial",
    icon: ScrollText,
    requiredPermission: "audit.view",
  },
];
