import { Query } from "appwrite";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

/**
 * Dashboard Service
 * Proporciona datos agregados para el dashboard desde las colecciones de Appwrite
 */

// ============================================
// CONTADORES PRINCIPALES
// ============================================

/**
 * Obtiene el conteo total de vehículos activos
 */
export async function getVehiclesCount(groupId) {
  if (!groupId) return { total: 0, active: 0, maintenance: 0, inactive: 0 };

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehiclesId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const vehicles = res.documents;
  const active = vehicles.filter((v) => v.status === "ACTIVE").length;
  const maintenance = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const inactive = vehicles.filter(
    (v) => v.status === "INACTIVE" || v.status === "OUT_OF_SERVICE"
  ).length;

  return {
    total: res.total,
    active,
    maintenance,
    inactive,
  };
}

/**
 * Obtiene el conteo total de conductores activos
 */
export async function getDriversCount(groupId) {
  if (!groupId) return { total: 0, active: 0, inactive: 0 };

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionDriversId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const drivers = res.documents;
  const active = drivers.filter((d) => d.status === "ACTIVE").length;
  const inactive = drivers.filter((d) => d.status !== "ACTIVE").length;

  return {
    total: res.total,
    active,
    inactive,
  };
}

/**
 * Obtiene el conteo total de clientes
 */
export async function getClientsCount(groupId) {
  if (!groupId) return { total: 0 };

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionClientsId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  return {
    total: res.total,
  };
}

/**
 * Obtiene estadísticas de reportes de servicio
 */
export async function getServiceReportsStats(groupId) {
  if (!groupId)
    return { total: 0, draft: 0, finalized: 0, thisMonth: 0, totalCost: 0 };

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionServiceHistoriesId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const reports = res.documents;
  const draft = reports.filter((r) => r.status === "DRAFT").length;
  const finalized = reports.filter((r) => r.status === "FINALIZED").length;

  // Reportes de este mes
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = reports.filter(
    (r) => new Date(r.serviceDate) >= startOfMonth
  ).length;

  // Costo total
  const totalCost = reports.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  return {
    total: res.total,
    draft,
    finalized,
    thisMonth,
    totalCost,
  };
}

/**
 * Obtiene estadísticas de reportes de reparación
 */
export async function getRepairReportsStats(groupId) {
  if (!groupId)
    return {
      total: 0,
      open: 0,
      inProgress: 0,
      done: 0,
      highPriority: 0,
      totalCost: 0,
    };

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionRepairReportsId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const reports = res.documents;
  const open = reports.filter((r) => r.status === "OPEN").length;
  const inProgress = reports.filter((r) => r.status === "IN_PROGRESS").length;
  const done = reports.filter((r) => r.status === "DONE").length;
  const highPriority = reports.filter((r) => r.priority === "HIGH").length;

  // Costo total estimado
  const totalCost = reports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

  return {
    total: res.total,
    open,
    inProgress,
    done,
    highPriority,
    totalCost,
  };
}

// ============================================
// DATOS PARA GRÁFICAS
// ============================================

/**
 * Obtiene vehículos agrupados por tipo
 */
export async function getVehiclesByType(groupId) {
  if (!groupId) return [];

  // Primero obtenemos los tipos de vehículos
  const typesRes = await databases.listDocuments(
    env.databaseId,
    env.collectionVehicleTypesId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  // Luego los vehículos
  const vehiclesRes = await databases.listDocuments(
    env.databaseId,
    env.collectionVehiclesId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const vehicles = vehiclesRes.documents;

  // Agrupar por tipo
  const typeMap = {};
  typesRes.documents.forEach((t) => {
    typeMap[t.$id] = { name: t.name, count: 0 };
  });

  vehicles.forEach((v) => {
    const typeId = v.typeId || v.type?.$id;
    if (typeId && typeMap[typeId]) {
      typeMap[typeId].count++;
    }
  });

  // Agregar "Sin tipo" si hay vehículos sin tipo asignado
  const withoutType = vehicles.filter((v) => !v.typeId && !v.type).length;
  if (withoutType > 0) {
    typeMap["sin-tipo"] = { name: "Sin tipo", count: withoutType };
  }

  return Object.values(typeMap).filter((t) => t.count > 0);
}

/**
 * Obtiene vehículos agrupados por marca
 */
export async function getVehiclesByBrand(groupId) {
  if (!groupId) return [];

  // Primero obtenemos las marcas
  const brandsRes = await databases.listDocuments(
    env.databaseId,
    env.collectionVehicleBrandsId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  // Luego los vehículos
  const vehiclesRes = await databases.listDocuments(
    env.databaseId,
    env.collectionVehiclesId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const vehicles = vehiclesRes.documents;

  // Agrupar por marca
  const brandMap = {};
  brandsRes.documents.forEach((b) => {
    brandMap[b.$id] = { name: b.name, count: 0 };
  });

  vehicles.forEach((v) => {
    const brandId = v.brandId || v.brand?.$id;
    if (brandId && brandMap[brandId]) {
      brandMap[brandId].count++;
    }
  });

  return Object.values(brandMap)
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 marcas
}

/**
 * Obtiene vehículos agrupados por estado
 */
export async function getVehiclesByStatus(groupId) {
  if (!groupId) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehiclesId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const statusLabels = {
    ACTIVE: "Activo",
    MAINTENANCE: "En Mantenimiento",
    INACTIVE: "Inactivo",
    OUT_OF_SERVICE: "Fuera de Servicio",
    RENTED: "Rentado",
  };

  const statusColors = {
    ACTIVE: "#22c55e",
    MAINTENANCE: "#f59e0b",
    INACTIVE: "#6b7280",
    OUT_OF_SERVICE: "#ef4444",
    RENTED: "#3b82f6",
  };

  const statusMap = {};
  res.documents.forEach((v) => {
    const status = v.status || "ACTIVE";
    if (!statusMap[status]) {
      statusMap[status] = {
        name: statusLabels[status] || status,
        value: 0,
        color: statusColors[status] || "#6b7280",
      };
    }
    statusMap[status].value++;
  });

  return Object.values(statusMap);
}

/**
 * Obtiene reportes de servicio por mes (últimos 6 meses)
 */
export async function getServiceReportsByMonth(groupId) {
  if (!groupId) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionServiceHistoriesId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.greaterThanEqual("serviceDate", sixMonthsAgo.toISOString()),
      Query.orderAsc("serviceDate"),
    ]
  );

  // Agrupar por mes
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const monthMap = {};
  const now = new Date();

  // Inicializar últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthMap[key] = {
      name: monthNames[d.getMonth()],
      servicios: 0,
      costo: 0,
    };
  }

  res.documents.forEach((r) => {
    const d = new Date(r.serviceDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthMap[key]) {
      monthMap[key].servicios++;
      monthMap[key].costo += r.totalCost || 0;
    }
  });

  return Object.values(monthMap);
}

/**
 * Obtiene reportes de reparación por mes (últimos 6 meses)
 */
export async function getRepairReportsByMonth(groupId) {
  if (!groupId) return [];

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionRepairReportsId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.greaterThanEqual("reportDate", sixMonthsAgo.toISOString()),
      Query.orderAsc("reportDate"),
    ]
  );

  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const monthMap = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthMap[key] = {
      name: monthNames[d.getMonth()],
      reparaciones: 0,
      costo: 0,
    };
  }

  res.documents.forEach((r) => {
    const d = new Date(r.reportDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthMap[key]) {
      monthMap[key].reparaciones++;
      monthMap[key].costo += r.estimatedCost || 0;
    }
  });

  return Object.values(monthMap);
}

// ============================================
// LISTAS RECIENTES Y ALERTAS
// ============================================

/**
 * Obtiene los últimos vehículos agregados
 */
export async function getRecentVehicles(groupId, limit = 5) {
  if (!groupId) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehiclesId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]
  );

  return res.documents;
}

/**
 * Obtiene los últimos reportes de servicio
 */
export async function getRecentServiceReports(groupId, limit = 5) {
  if (!groupId) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionServiceHistoriesId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]
  );

  return res.documents;
}

/**
 * Obtiene reportes de reparación pendientes/urgentes
 */
export async function getPendingRepairs(groupId, limit = 5) {
  if (!groupId) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionRepairReportsId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.notEqual("status", "DONE"),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]
  );

  return res.documents;
}

/**
 * Obtiene vehículos en mantenimiento
 */
export async function getVehiclesInMaintenance(groupId) {
  if (!groupId) return [];

  const res = await databases.listDocuments(
    env.databaseId,
    env.collectionVehiclesId,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.equal("status", "MAINTENANCE"),
    ]
  );

  return res.documents;
}

/**
 * Obtiene licencias de conductores próximas a vencer (30 días)
 */
export async function getExpiringLicenses(groupId, daysAhead = 30) {
  if (!groupId) return [];

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  // Primero obtenemos los conductores del grupo
  const driversRes = await databases.listDocuments(
    env.databaseId,
    env.collectionDriversId,
    [Query.equal("groupId", groupId), Query.equal("enabled", true)]
  );

  const driverIds = driversRes.documents.map((d) => d.$id);
  if (driverIds.length === 0) return [];

  // Luego las licencias que vencen pronto
  const licensesRes = await databases.listDocuments(
    env.databaseId,
    env.collectionDriverLicensesId,
    [
      Query.equal("enabled", true),
      Query.lessThanEqual("expiresAt", futureDate.toISOString()),
      Query.greaterThanEqual("expiresAt", now.toISOString()),
    ]
  );

  // Filtrar solo las licencias de conductores del grupo
  const licenses = licensesRes.documents.filter((l) =>
    driverIds.includes(l.driverId)
  );

  // Enriquecer con datos del conductor
  return licenses.map((l) => {
    const driver = driversRes.documents.find((d) => d.$id === l.driverId);
    return {
      ...l,
      driverName: driver?.fullName || driver?.name || "Desconocido",
    };
  });
}

// ============================================
// RESUMEN COMPLETO
// ============================================

/**
 * Obtiene todos los datos del dashboard en una sola llamada
 */
export async function getDashboardSummary(groupId) {
  if (!groupId) {
    return {
      vehicles: { total: 0, active: 0, maintenance: 0, inactive: 0 },
      drivers: { total: 0, active: 0, inactive: 0 },
      clients: { total: 0 },
      serviceReports: {
        total: 0,
        draft: 0,
        finalized: 0,
        thisMonth: 0,
        totalCost: 0,
      },
      repairReports: {
        total: 0,
        open: 0,
        inProgress: 0,
        done: 0,
        highPriority: 0,
        totalCost: 0,
      },
    };
  }

  // Ejecutar todas las consultas en paralelo
  const [vehicles, drivers, clients, serviceReports, repairReports] =
    await Promise.all([
      getVehiclesCount(groupId),
      getDriversCount(groupId),
      getClientsCount(groupId),
      getServiceReportsStats(groupId),
      getRepairReportsStats(groupId),
    ]);

  return {
    vehicles,
    drivers,
    clients,
    serviceReports,
    repairReports,
  };
}
