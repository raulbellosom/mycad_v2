import { createContext, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useActiveGroup } from "../hooks/useActiveGroup";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  getUserPermissionsInGroup,
  listUserRoles,
  getGroupMembership,
} from "../services/permissions.service";

export const PermissionsContext = createContext(null);

/**
 * LISTA DE PERMISOS DEL SISTEMA
 * Estos son los permisos que se pueden asignar a roles
 * Basado en: mycad_db_appwrite_1.8.2_vnext_FULL.md
 */
export const SYSTEM_PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Grupos/Administración
  GROUPS_VIEW: "groups.view",
  GROUPS_MANAGE: "groups.manage",
  GROUPS_MEMBERS_VIEW: "groups.members.view",
  GROUPS_MEMBERS_MANAGE: "groups.members.manage",
  GROUPS_ROLES_VIEW: "groups.roles.view",
  GROUPS_ROLES_MANAGE: "groups.roles.manage",

  // Vehículos
  VEHICLES_VIEW: "vehicles.view",
  VEHICLES_CREATE: "vehicles.create",
  VEHICLES_EDIT: "vehicles.edit",
  VEHICLES_DELETE: "vehicles.delete",

  // Condiciones de vehículos (vehicle_conditions)
  VEHICLE_CONDITIONS_VIEW: "vehicle.conditions.view",
  VEHICLE_CONDITIONS_MANAGE: "vehicle.conditions.manage",

  // Archivos de vehículos (vehicle_files)
  VEHICLE_FILES_VIEW: "vehicle.files.view",
  VEHICLE_FILES_MANAGE: "vehicle.files.manage",

  // Catálogos (vehicle_types, vehicle_brands, vehicle_models, conditions)
  CATALOGS_VIEW: "catalogs.view",
  CATALOGS_MANAGE: "catalogs.manage",

  // Conductores (drivers)
  DRIVERS_VIEW: "drivers.view",
  DRIVERS_CREATE: "drivers.create",
  DRIVERS_EDIT: "drivers.edit",
  DRIVERS_DELETE: "drivers.delete",

  // Licencias de conductores (driver_licenses)
  DRIVER_LICENSES_VIEW: "driver.licenses.view",
  DRIVER_LICENSES_MANAGE: "driver.licenses.manage",

  // Archivos de conductores (driver_files)
  DRIVER_FILES_VIEW: "driver.files.view",
  DRIVER_FILES_MANAGE: "driver.files.manage",

  // Asignaciones conductor-vehículo (vehicle_driver_assignments)
  ASSIGNMENTS_VIEW: "assignments.view",
  ASSIGNMENTS_CREATE: "assignments.create",
  ASSIGNMENTS_EDIT: "assignments.edit",
  ASSIGNMENTS_DELETE: "assignments.delete",

  // Historial de servicios / Mantenimientos (service_histories)
  SERVICES_VIEW: "services.view",
  SERVICES_CREATE: "services.create",
  SERVICES_EDIT: "services.edit",
  SERVICES_DELETE: "services.delete",

  // Reportes de reparación (repair_reports)
  REPAIRS_VIEW: "repairs.view",
  REPAIRS_CREATE: "repairs.create",
  REPAIRS_EDIT: "repairs.edit",
  REPAIRS_DELETE: "repairs.delete",

  // Reportes generales (analytics, exports, etc.)
  REPORTS_VIEW: "reports.view",
  REPORTS_CREATE: "reports.create",
  REPORTS_MANAGE: "reports.manage",

  // Usuarios (users_profile)
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",

  // Auditoría
  AUDIT_VIEW: "audit.view",

  // Rentas (rentals)
  RENTALS_VIEW: "rentals.view",
  RENTALS_CREATE: "rentals.create",
  RENTALS_EDIT: "rentals.edit",
  RENTALS_DELETE: "rentals.delete",
  RENTALS_MANAGE: "rentals.manage",

  // Clientes (clients)
  CLIENTS_VIEW: "clients.view",
  CLIENTS_CREATE: "clients.create",
  CLIENTS_EDIT: "clients.edit",
  CLIENTS_DELETE: "clients.delete",

  // Archivos e imágenes (files, images)
  FILES_VIEW: "files.view",
  FILES_UPLOAD: "files.upload",
  FILES_DELETE: "files.delete",
  FILES_MANAGE: "files.manage",

  // Configuración del sistema (para platform admins)
  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",

  // Mi Perfil (permisos personales - normalmente todos los usuarios los tienen)
  PROFILE_VIEW: "profile.view",
  PROFILE_EDIT_INFO: "profile.edit.info",
  PROFILE_EDIT_AVATAR: "profile.edit.avatar",
  PROFILE_CHANGE_EMAIL: "profile.change.email",
  PROFILE_CHANGE_PASSWORD: "profile.change.password",

  // Mi Perfil como Conductor (si el usuario está vinculado a un driver)
  PROFILE_DRIVER_VIEW: "profile.driver.view",
  PROFILE_DRIVER_EDIT_INFO: "profile.driver.edit.info",
  PROFILE_DRIVER_LICENSES_VIEW: "profile.driver.licenses.view",
  PROFILE_DRIVER_LICENSES_MANAGE: "profile.driver.licenses.manage",
  PROFILE_DRIVER_FILES_VIEW: "profile.driver.files.view",
  PROFILE_DRIVER_FILES_MANAGE: "profile.driver.files.manage",
};

/**
 * Categorías de permisos para UI de gestión
 */
export const PERMISSION_CATEGORIES = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    permissions: [SYSTEM_PERMISSIONS.DASHBOARD_VIEW],
  },
  {
    id: "groups",
    label: "Grupos & Administración",
    icon: "Building2",
    permissions: [
      SYSTEM_PERMISSIONS.GROUPS_VIEW,
      SYSTEM_PERMISSIONS.GROUPS_MANAGE,
      SYSTEM_PERMISSIONS.GROUPS_MEMBERS_VIEW,
      SYSTEM_PERMISSIONS.GROUPS_MEMBERS_MANAGE,
      SYSTEM_PERMISSIONS.GROUPS_ROLES_VIEW,
      SYSTEM_PERMISSIONS.GROUPS_ROLES_MANAGE,
    ],
  },
  {
    id: "vehicles",
    label: "Vehículos",
    icon: "Car",
    permissions: [
      SYSTEM_PERMISSIONS.VEHICLES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLES_CREATE,
      SYSTEM_PERMISSIONS.VEHICLES_EDIT,
      SYSTEM_PERMISSIONS.VEHICLES_DELETE,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_MANAGE,
      SYSTEM_PERMISSIONS.VEHICLE_FILES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_FILES_MANAGE,
    ],
  },
  {
    id: "catalogs",
    label: "Catálogos",
    icon: "FolderTree",
    permissions: [
      SYSTEM_PERMISSIONS.CATALOGS_VIEW,
      SYSTEM_PERMISSIONS.CATALOGS_MANAGE,
    ],
  },
  {
    id: "drivers",
    label: "Conductores",
    icon: "Users",
    permissions: [
      SYSTEM_PERMISSIONS.DRIVERS_VIEW,
      SYSTEM_PERMISSIONS.DRIVERS_CREATE,
      SYSTEM_PERMISSIONS.DRIVERS_EDIT,
      SYSTEM_PERMISSIONS.DRIVERS_DELETE,
      SYSTEM_PERMISSIONS.DRIVER_LICENSES_VIEW,
      SYSTEM_PERMISSIONS.DRIVER_LICENSES_MANAGE,
      SYSTEM_PERMISSIONS.DRIVER_FILES_VIEW,
      SYSTEM_PERMISSIONS.DRIVER_FILES_MANAGE,
    ],
  },
  {
    id: "assignments",
    label: "Asignaciones",
    icon: "Link",
    permissions: [
      SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_CREATE,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_EDIT,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_DELETE,
    ],
  },
  {
    id: "services",
    label: "Servicios / Mantenimiento",
    icon: "Wrench",
    permissions: [
      SYSTEM_PERMISSIONS.SERVICES_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_CREATE,
      SYSTEM_PERMISSIONS.SERVICES_EDIT,
      SYSTEM_PERMISSIONS.SERVICES_DELETE,
    ],
  },
  {
    id: "repairs",
    label: "Reparaciones",
    icon: "Hammer",
    permissions: [
      SYSTEM_PERMISSIONS.REPAIRS_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_CREATE,
      SYSTEM_PERMISSIONS.REPAIRS_EDIT,
      SYSTEM_PERMISSIONS.REPAIRS_DELETE,
    ],
  },
  {
    id: "reports",
    label: "Reportes & Analytics",
    icon: "BarChart3",
    permissions: [
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_CREATE,
      SYSTEM_PERMISSIONS.REPORTS_MANAGE,
    ],
  },
  {
    id: "rentals",
    label: "Rentas",
    icon: "CalendarClock",
    permissions: [
      SYSTEM_PERMISSIONS.RENTALS_VIEW,
      SYSTEM_PERMISSIONS.RENTALS_CREATE,
      SYSTEM_PERMISSIONS.RENTALS_EDIT,
      SYSTEM_PERMISSIONS.RENTALS_DELETE,
      SYSTEM_PERMISSIONS.RENTALS_MANAGE,
    ],
  },
  {
    id: "clients",
    label: "Clientes",
    icon: "Contact",
    permissions: [
      SYSTEM_PERMISSIONS.CLIENTS_VIEW,
      SYSTEM_PERMISSIONS.CLIENTS_CREATE,
      SYSTEM_PERMISSIONS.CLIENTS_EDIT,
      SYSTEM_PERMISSIONS.CLIENTS_DELETE,
    ],
  },
  {
    id: "users",
    label: "Usuarios",
    icon: "UserCog",
    permissions: [
      SYSTEM_PERMISSIONS.USERS_VIEW,
      SYSTEM_PERMISSIONS.USERS_CREATE,
      SYSTEM_PERMISSIONS.USERS_EDIT,
      SYSTEM_PERMISSIONS.USERS_DELETE,
    ],
  },
  {
    id: "files",
    label: "Archivos",
    icon: "FileStack",
    permissions: [
      SYSTEM_PERMISSIONS.FILES_VIEW,
      SYSTEM_PERMISSIONS.FILES_UPLOAD,
      SYSTEM_PERMISSIONS.FILES_DELETE,
      SYSTEM_PERMISSIONS.FILES_MANAGE,
    ],
  },
  {
    id: "audit",
    label: "Auditoría",
    icon: "ScrollText",
    permissions: [SYSTEM_PERMISSIONS.AUDIT_VIEW],
  },
  {
    id: "settings",
    label: "Configuración",
    icon: "Settings",
    permissions: [
      SYSTEM_PERMISSIONS.SETTINGS_VIEW,
      SYSTEM_PERMISSIONS.SETTINGS_MANAGE,
    ],
  },
  {
    id: "profile",
    label: "Mi Perfil",
    icon: "UserCircle",
    permissions: [
      SYSTEM_PERMISSIONS.PROFILE_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_INFO,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_AVATAR,
      SYSTEM_PERMISSIONS.PROFILE_CHANGE_EMAIL,
      SYSTEM_PERMISSIONS.PROFILE_CHANGE_PASSWORD,
    ],
  },
  {
    id: "profile_driver",
    label: "Mi Perfil - Conductor",
    icon: "IdCard",
    description: "Permisos para usuarios vinculados a un conductor",
    permissions: [
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_EDIT_INFO,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_LICENSES_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_LICENSES_MANAGE,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_FILES_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_FILES_MANAGE,
    ],
  },
];

/**
 * Roles predefinidos del sistema con sus permisos
 * Útil para inicializar un grupo con roles base
 */
export const DEFAULT_ROLES = {
  ADMIN: {
    name: "Administrador",
    description: "Acceso completo a todas las funciones del grupo",
    permissions: Object.values(SYSTEM_PERMISSIONS),
  },
  MANAGER: {
    name: "Gerente",
    description: "Puede gestionar vehículos, conductores, servicios y reportes",
    permissions: [
      SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
      SYSTEM_PERMISSIONS.GROUPS_VIEW,
      SYSTEM_PERMISSIONS.GROUPS_MEMBERS_VIEW,
      // Vehículos
      SYSTEM_PERMISSIONS.VEHICLES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLES_CREATE,
      SYSTEM_PERMISSIONS.VEHICLES_EDIT,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_MANAGE,
      SYSTEM_PERMISSIONS.VEHICLE_FILES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_FILES_MANAGE,
      // Catálogos
      SYSTEM_PERMISSIONS.CATALOGS_VIEW,
      SYSTEM_PERMISSIONS.CATALOGS_MANAGE,
      // Conductores
      SYSTEM_PERMISSIONS.DRIVERS_VIEW,
      SYSTEM_PERMISSIONS.DRIVERS_CREATE,
      SYSTEM_PERMISSIONS.DRIVERS_EDIT,
      SYSTEM_PERMISSIONS.DRIVER_LICENSES_VIEW,
      SYSTEM_PERMISSIONS.DRIVER_LICENSES_MANAGE,
      SYSTEM_PERMISSIONS.DRIVER_FILES_VIEW,
      SYSTEM_PERMISSIONS.DRIVER_FILES_MANAGE,
      // Asignaciones
      SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_CREATE,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_EDIT,
      // Servicios y reparaciones
      SYSTEM_PERMISSIONS.SERVICES_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_CREATE,
      SYSTEM_PERMISSIONS.SERVICES_EDIT,
      SYSTEM_PERMISSIONS.REPAIRS_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_CREATE,
      SYSTEM_PERMISSIONS.REPAIRS_EDIT,
      // Reportes
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_CREATE,
      // Rentas y clientes
      SYSTEM_PERMISSIONS.RENTALS_VIEW,
      SYSTEM_PERMISSIONS.RENTALS_CREATE,
      SYSTEM_PERMISSIONS.RENTALS_EDIT,
      SYSTEM_PERMISSIONS.CLIENTS_VIEW,
      SYSTEM_PERMISSIONS.CLIENTS_CREATE,
      SYSTEM_PERMISSIONS.CLIENTS_EDIT,
      // Archivos
      SYSTEM_PERMISSIONS.FILES_VIEW,
      SYSTEM_PERMISSIONS.FILES_UPLOAD,
    ],
  },
  OPERATOR: {
    name: "Operador",
    description: "Puede ver vehículos y crear servicios/reportes",
    permissions: [
      SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
      // Vehículos (solo ver)
      SYSTEM_PERMISSIONS.VEHICLES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_FILES_VIEW,
      // Catálogos (solo ver)
      SYSTEM_PERMISSIONS.CATALOGS_VIEW,
      // Conductores (solo ver)
      SYSTEM_PERMISSIONS.DRIVERS_VIEW,
      SYSTEM_PERMISSIONS.DRIVER_LICENSES_VIEW,
      SYSTEM_PERMISSIONS.DRIVER_FILES_VIEW,
      // Asignaciones (solo ver)
      SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW,
      // Servicios (ver y crear)
      SYSTEM_PERMISSIONS.SERVICES_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_CREATE,
      // Reparaciones (ver y crear)
      SYSTEM_PERMISSIONS.REPAIRS_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_CREATE,
      // Reportes
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_CREATE,
      // Archivos
      SYSTEM_PERMISSIONS.FILES_VIEW,
      SYSTEM_PERMISSIONS.FILES_UPLOAD,
    ],
  },
  MECHANIC: {
    name: "Mecánico",
    description: "Especializado en servicios y reparaciones",
    permissions: [
      SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
      SYSTEM_PERMISSIONS.VEHICLES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_VIEW,
      SYSTEM_PERMISSIONS.CATALOGS_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_CREATE,
      SYSTEM_PERMISSIONS.SERVICES_EDIT,
      SYSTEM_PERMISSIONS.REPAIRS_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_CREATE,
      SYSTEM_PERMISSIONS.REPAIRS_EDIT,
      SYSTEM_PERMISSIONS.FILES_VIEW,
      SYSTEM_PERMISSIONS.FILES_UPLOAD,
    ],
  },
  DRIVER: {
    name: "Conductor",
    description: "Puede ver sus asignaciones y reportar incidencias",
    permissions: [
      SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
      SYSTEM_PERMISSIONS.VEHICLES_VIEW,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_CREATE,
      SYSTEM_PERMISSIONS.FILES_VIEW,
      SYSTEM_PERMISSIONS.FILES_UPLOAD,
      // Mi perfil
      SYSTEM_PERMISSIONS.PROFILE_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_INFO,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_AVATAR,
      SYSTEM_PERMISSIONS.PROFILE_CHANGE_PASSWORD,
      // Mi perfil como conductor
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_LICENSES_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_DRIVER_FILES_VIEW,
    ],
  },
  VIEWER: {
    name: "Visor",
    description: "Solo puede ver información sin modificar",
    permissions: [
      SYSTEM_PERMISSIONS.DASHBOARD_VIEW,
      SYSTEM_PERMISSIONS.VEHICLES_VIEW,
      SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_VIEW,
      SYSTEM_PERMISSIONS.CATALOGS_VIEW,
      SYSTEM_PERMISSIONS.DRIVERS_VIEW,
      SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW,
      SYSTEM_PERMISSIONS.SERVICES_VIEW,
      SYSTEM_PERMISSIONS.REPAIRS_VIEW,
      SYSTEM_PERMISSIONS.REPORTS_VIEW,
      SYSTEM_PERMISSIONS.RENTALS_VIEW,
      SYSTEM_PERMISSIONS.CLIENTS_VIEW,
      SYSTEM_PERMISSIONS.FILES_VIEW,
      // Mi perfil (todos los usuarios pueden ver/editar su perfil)
      SYSTEM_PERMISSIONS.PROFILE_VIEW,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_INFO,
      SYSTEM_PERMISSIONS.PROFILE_EDIT_AVATAR,
      SYSTEM_PERMISSIONS.PROFILE_CHANGE_PASSWORD,
    ],
  },
};

/**
 * Traducciones de permisos para la UI
 */
export const PERMISSION_LABELS = {
  // Dashboard
  [SYSTEM_PERMISSIONS.DASHBOARD_VIEW]: "Ver dashboard",

  // Grupos
  [SYSTEM_PERMISSIONS.GROUPS_VIEW]: "Ver grupos",
  [SYSTEM_PERMISSIONS.GROUPS_MANAGE]: "Gestionar grupos",
  [SYSTEM_PERMISSIONS.GROUPS_MEMBERS_VIEW]: "Ver miembros",
  [SYSTEM_PERMISSIONS.GROUPS_MEMBERS_MANAGE]: "Gestionar miembros",
  [SYSTEM_PERMISSIONS.GROUPS_ROLES_VIEW]: "Ver roles",
  [SYSTEM_PERMISSIONS.GROUPS_ROLES_MANAGE]: "Gestionar roles",

  // Vehículos
  [SYSTEM_PERMISSIONS.VEHICLES_VIEW]: "Ver vehículos",
  [SYSTEM_PERMISSIONS.VEHICLES_CREATE]: "Crear vehículos",
  [SYSTEM_PERMISSIONS.VEHICLES_EDIT]: "Editar vehículos",
  [SYSTEM_PERMISSIONS.VEHICLES_DELETE]: "Eliminar vehículos",
  [SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_VIEW]: "Ver condiciones de vehículos",
  [SYSTEM_PERMISSIONS.VEHICLE_CONDITIONS_MANAGE]:
    "Gestionar condiciones de vehículos",
  [SYSTEM_PERMISSIONS.VEHICLE_FILES_VIEW]: "Ver archivos de vehículos",
  [SYSTEM_PERMISSIONS.VEHICLE_FILES_MANAGE]: "Gestionar archivos de vehículos",

  // Catálogos
  [SYSTEM_PERMISSIONS.CATALOGS_VIEW]: "Ver catálogos",
  [SYSTEM_PERMISSIONS.CATALOGS_MANAGE]: "Gestionar catálogos",

  // Conductores
  [SYSTEM_PERMISSIONS.DRIVERS_VIEW]: "Ver conductores",
  [SYSTEM_PERMISSIONS.DRIVERS_CREATE]: "Crear conductores",
  [SYSTEM_PERMISSIONS.DRIVERS_EDIT]: "Editar conductores",
  [SYSTEM_PERMISSIONS.DRIVERS_DELETE]: "Eliminar conductores",
  [SYSTEM_PERMISSIONS.DRIVER_LICENSES_VIEW]: "Ver licencias de conducir",
  [SYSTEM_PERMISSIONS.DRIVER_LICENSES_MANAGE]:
    "Gestionar licencias de conducir",
  [SYSTEM_PERMISSIONS.DRIVER_FILES_VIEW]: "Ver archivos de conductores",
  [SYSTEM_PERMISSIONS.DRIVER_FILES_MANAGE]: "Gestionar archivos de conductores",

  // Asignaciones
  [SYSTEM_PERMISSIONS.ASSIGNMENTS_VIEW]: "Ver asignaciones",
  [SYSTEM_PERMISSIONS.ASSIGNMENTS_CREATE]: "Crear asignaciones",
  [SYSTEM_PERMISSIONS.ASSIGNMENTS_EDIT]: "Editar asignaciones",
  [SYSTEM_PERMISSIONS.ASSIGNMENTS_DELETE]: "Eliminar asignaciones",

  // Servicios / Mantenimientos
  [SYSTEM_PERMISSIONS.SERVICES_VIEW]: "Ver servicios",
  [SYSTEM_PERMISSIONS.SERVICES_CREATE]: "Crear servicios",
  [SYSTEM_PERMISSIONS.SERVICES_EDIT]: "Editar servicios",
  [SYSTEM_PERMISSIONS.SERVICES_DELETE]: "Eliminar servicios",

  // Reparaciones
  [SYSTEM_PERMISSIONS.REPAIRS_VIEW]: "Ver reparaciones",
  [SYSTEM_PERMISSIONS.REPAIRS_CREATE]: "Crear reparaciones",
  [SYSTEM_PERMISSIONS.REPAIRS_EDIT]: "Editar reparaciones",
  [SYSTEM_PERMISSIONS.REPAIRS_DELETE]: "Eliminar reparaciones",

  // Reportes
  [SYSTEM_PERMISSIONS.REPORTS_VIEW]: "Ver reportes",
  [SYSTEM_PERMISSIONS.REPORTS_CREATE]: "Crear reportes",
  [SYSTEM_PERMISSIONS.REPORTS_MANAGE]: "Gestionar reportes",

  // Usuarios
  [SYSTEM_PERMISSIONS.USERS_VIEW]: "Ver usuarios",
  [SYSTEM_PERMISSIONS.USERS_CREATE]: "Crear usuarios",
  [SYSTEM_PERMISSIONS.USERS_EDIT]: "Editar usuarios",
  [SYSTEM_PERMISSIONS.USERS_DELETE]: "Eliminar usuarios",

  // Auditoría
  [SYSTEM_PERMISSIONS.AUDIT_VIEW]: "Ver auditoría",

  // Rentas
  [SYSTEM_PERMISSIONS.RENTALS_VIEW]: "Ver rentas",
  [SYSTEM_PERMISSIONS.RENTALS_CREATE]: "Crear rentas",
  [SYSTEM_PERMISSIONS.RENTALS_EDIT]: "Editar rentas",
  [SYSTEM_PERMISSIONS.RENTALS_DELETE]: "Eliminar rentas",
  [SYSTEM_PERMISSIONS.RENTALS_MANAGE]: "Gestionar rentas",

  // Clientes
  [SYSTEM_PERMISSIONS.CLIENTS_VIEW]: "Ver clientes",
  [SYSTEM_PERMISSIONS.CLIENTS_CREATE]: "Crear clientes",
  [SYSTEM_PERMISSIONS.CLIENTS_EDIT]: "Editar clientes",
  [SYSTEM_PERMISSIONS.CLIENTS_DELETE]: "Eliminar clientes",

  // Archivos
  [SYSTEM_PERMISSIONS.FILES_VIEW]: "Ver archivos",
  [SYSTEM_PERMISSIONS.FILES_UPLOAD]: "Subir archivos",
  [SYSTEM_PERMISSIONS.FILES_DELETE]: "Eliminar archivos",
  [SYSTEM_PERMISSIONS.FILES_MANAGE]: "Gestionar archivos",

  // Configuración
  [SYSTEM_PERMISSIONS.SETTINGS_VIEW]: "Ver configuración",
  [SYSTEM_PERMISSIONS.SETTINGS_MANAGE]: "Gestionar configuración",

  // Mi Perfil
  [SYSTEM_PERMISSIONS.PROFILE_VIEW]: "Ver mi perfil",
  [SYSTEM_PERMISSIONS.PROFILE_EDIT_INFO]: "Editar información personal",
  [SYSTEM_PERMISSIONS.PROFILE_EDIT_AVATAR]: "Cambiar foto de perfil",
  [SYSTEM_PERMISSIONS.PROFILE_CHANGE_EMAIL]: "Cambiar correo electrónico",
  [SYSTEM_PERMISSIONS.PROFILE_CHANGE_PASSWORD]: "Cambiar contraseña",

  // Mi Perfil - Conductor
  [SYSTEM_PERMISSIONS.PROFILE_DRIVER_VIEW]: "Ver mi perfil de conductor",
  [SYSTEM_PERMISSIONS.PROFILE_DRIVER_EDIT_INFO]: "Editar info de conductor",
  [SYSTEM_PERMISSIONS.PROFILE_DRIVER_LICENSES_VIEW]: "Ver mis licencias",
  [SYSTEM_PERMISSIONS.PROFILE_DRIVER_LICENSES_MANAGE]:
    "Gestionar mis licencias",
  [SYSTEM_PERMISSIONS.PROFILE_DRIVER_FILES_VIEW]:
    "Ver mis documentos de conductor",
  [SYSTEM_PERMISSIONS.PROFILE_DRIVER_FILES_MANAGE]: "Gestionar mis documentos",
};

/**
 * PermissionsProvider
 * Provee el contexto de permisos basado en el grupo activo y el perfil del usuario
 */
export function PermissionsProvider({ children }) {
  const { profile } = useAuth();
  const { activeGroupId, activeGroup } = useActiveGroup();

  const profileId = profile?.$id;

  // Query: Permisos del usuario en el grupo activo
  const {
    data: permissions = [],
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ["user-permissions", activeGroupId, profileId],
    queryFn: () => getUserPermissionsInGroup(activeGroupId, profileId),
    enabled: !!activeGroupId && !!profileId,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // Query: Roles del usuario en el grupo activo
  const {
    data: userRoles = [],
    isLoading: isLoadingRoles,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ["user-roles", activeGroupId, profileId],
    queryFn: () => listUserRoles(activeGroupId, profileId),
    enabled: !!activeGroupId && !!profileId,
    staleTime: 1000 * 60 * 5,
  });

  // Query: Membresía del usuario en el grupo
  const { data: membership, isLoading: isLoadingMembership } = useQuery({
    queryKey: ["group-membership", activeGroupId, profileId],
    queryFn: () => getGroupMembership(activeGroupId, profileId),
    enabled: !!activeGroupId && !!profileId,
    staleTime: 1000 * 60 * 5,
  });

  // Set de permission keys para búsqueda rápida
  const permissionKeys = useMemo(
    () => new Set(permissions.map((p) => p.key)),
    [permissions]
  );

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback(
    (permissionKey) => {
      // Platform admin tiene todos los permisos
      if (profile?.isPlatformAdmin) return true;

      // Owner del grupo tiene todos los permisos
      if (activeGroup?.ownerProfileId === profileId) return true;

      // Membership role OWNER o ADMIN tiene todos los permisos
      if (membership?.role === "OWNER" || membership?.role === "ADMIN") {
        return true;
      }

      return permissionKeys.has(permissionKey);
    },
    [profile, activeGroup, profileId, membership, permissionKeys]
  );

  /**
   * Verifica si el usuario tiene ALGUNO de los permisos dados
   */
  const hasAnyPermission = useCallback(
    (permissionKeysArray) => {
      return permissionKeysArray.some((key) => hasPermission(key));
    },
    [hasPermission]
  );

  /**
   * Verifica si el usuario tiene TODOS los permisos dados
   */
  const hasAllPermissions = useCallback(
    (permissionKeysArray) => {
      return permissionKeysArray.every((key) => hasPermission(key));
    },
    [hasPermission]
  );

  /**
   * Verifica si el usuario es admin del grupo
   */
  const isGroupAdmin = useMemo(() => {
    if (profile?.isPlatformAdmin) return true;
    if (activeGroup?.ownerProfileId === profileId) return true;
    if (membership?.role === "OWNER" || membership?.role === "ADMIN")
      return true;
    return false;
  }, [profile, activeGroup, profileId, membership]);

  /**
   * Verifica si el usuario es owner del grupo
   */
  const isGroupOwner = useMemo(() => {
    if (activeGroup?.ownerProfileId === profileId) return true;
    if (membership?.role === "OWNER") return true;
    return false;
  }, [activeGroup, profileId, membership]);

  /**
   * Refrescar todos los datos de permisos
   */
  const refreshPermissions = useCallback(() => {
    refetchPermissions();
    refetchRoles();
  }, [refetchPermissions, refetchRoles]);

  const value = useMemo(
    () => ({
      // Data
      permissions,
      permissionKeys: [...permissionKeys],
      userRoles,
      membership,

      // Loading states
      isLoading: isLoadingPermissions || isLoadingRoles || isLoadingMembership,
      isLoadingPermissions,
      isLoadingRoles,

      // Methods
      hasPermission,
      can: hasPermission, // Alias para compatibilidad con AppSidebar y otros componentes
      hasAnyPermission,
      hasAllPermissions,

      // Helpers
      isGroupAdmin,
      isGroupOwner,
      isPlatformAdmin: !!profile?.isPlatformAdmin,

      // Actions
      refreshPermissions,

      // Constants
      SYSTEM_PERMISSIONS,
      PERMISSION_LABELS,
      PERMISSION_CATEGORIES,
      DEFAULT_ROLES,
    }),
    [
      permissions,
      permissionKeys,
      userRoles,
      membership,
      isLoadingPermissions,
      isLoadingRoles,
      isLoadingMembership,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isGroupAdmin,
      isGroupOwner,
      profile?.isPlatformAdmin,
      refreshPermissions,
    ]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}
