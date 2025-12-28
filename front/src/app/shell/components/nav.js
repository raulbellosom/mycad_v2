import {
  LayoutDashboard,
  Car,
  FolderKanban,
  Users,
  ShieldCheck,
  FileBarChart2,
  ScrollText,
} from "lucide-react";

export const nav = [
  { to: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { to: "/vehicles", label: "Vehículos", icon: Car },
  { to: "/catalogs", label: "Catálogos", icon: FolderKanban },
  { to: "/groups", label: "Mis Grupos", icon: ShieldCheck },
  { to: "/users", label: "Usuarios", icon: Users },
  { to: "/reports", label: "Reportes", icon: FileBarChart2 },
  { to: "/audit", label: "Historial", icon: ScrollText },
];
