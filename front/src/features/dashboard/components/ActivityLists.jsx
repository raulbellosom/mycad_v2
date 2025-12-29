import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Car,
  Wrench,
  AlertTriangle,
  Clock,
  ChevronRight,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Badge } from "../../../shared/ui/Badge";

/**
 * ActivityItem - Item individual de actividad
 */
function ActivityItem({ icon: Icon, iconColor, title, subtitle, time, to }) {
  const iconColors = {
    orange:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    emerald:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  };

  const content = (
    <motion.div
      whileHover={{ x: 2 }}
      className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          iconColors[iconColor] || iconColors.orange
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
          {title}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {time}
        </span>
        <ChevronRight className="h-4 w-4 text-stone-300 dark:text-stone-600" />
      </div>
    </motion.div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}

/**
 * RecentVehiclesList - Lista de vehículos recientes
 */
export function RecentVehiclesList({ vehicles = [], loading = false }) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
            Vehículos Recientes
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
          Vehículos Recientes
        </h3>
        <Link
          to="/vehicles"
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Car className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No hay vehículos registrados
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {vehicles.map((vehicle) => (
            <ActivityItem
              key={vehicle.$id}
              icon={Car}
              iconColor="orange"
              title={`${vehicle.brand?.name || ""} ${
                vehicle.model?.name || ""
              } ${vehicle.year || ""}`}
              subtitle={vehicle.plateNumber || "Sin placa"}
              time={formatDistanceToNow(new Date(vehicle.$createdAt), {
                addSuffix: true,
                locale: es,
              })}
              to={`/vehicles/${vehicle.$id}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * RecentServicesList - Lista de servicios recientes
 */
export function RecentServicesList({ reports = [], loading = false }) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
            Servicios Recientes
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
          Servicios Recientes
        </h3>
        <Link
          to="/reports/service"
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Wrench className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No hay servicios registrados
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {reports.map((report) => (
            <ActivityItem
              key={report.$id}
              icon={Wrench}
              iconColor="emerald"
              title={report.serviceType || "Servicio"}
              subtitle={report.description?.slice(0, 50) || "Sin descripción"}
              time={
                report.serviceDate
                  ? format(new Date(report.serviceDate), "dd MMM", {
                      locale: es,
                    })
                  : ""
              }
              to={`/reports/service/${report.$id}`}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * PendingRepairsList - Lista de reparaciones pendientes
 */
export function PendingRepairsList({ repairs = [], loading = false }) {
  const statusColors = {
    OPEN: "amber",
    IN_PROGRESS: "blue",
  };

  const priorityColors = {
    HIGH: "red",
    MEDIUM: "amber",
    LOW: "stone",
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
            Reparaciones Pendientes
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Reparaciones Pendientes
        </h3>
        <Link
          to="/reports/repair"
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      {repairs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No hay reparaciones pendientes
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            ¡Excelente! Todo en orden
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {repairs.map((repair) => (
            <Link
              key={repair.$id}
              to={`/reports/repair/${repair.$id}`}
              className="block"
            >
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 p-3 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                      {repair.reportNumber || "Sin número"}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                      {repair.damageType ||
                        repair.description?.slice(0, 40) ||
                        "Sin descripción"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={statusColors[repair.status] || "stone"}
                      size="xs"
                    >
                      {repair.status === "OPEN"
                        ? "Abierto"
                        : repair.status === "IN_PROGRESS"
                        ? "En proceso"
                        : repair.status}
                    </Badge>
                    {repair.priority === "HIGH" && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Urgente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * ExpiringLicensesList - Lista de licencias próximas a vencer
 */
export function ExpiringLicensesList({ licenses = [], loading = false }) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
            Licencias por Vencer
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-amber-500" />
          Licencias por Vencer
        </h3>
        <Link
          to="/drivers"
          className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
        >
          Ver conductores
        </Link>
      </div>

      {licenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No hay licencias por vencer
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Todas las licencias están vigentes
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {licenses.map((license) => {
            const daysLeft = Math.ceil(
              (new Date(license.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = daysLeft <= 7;

            return (
              <div
                key={license.$id}
                className={`rounded-lg border p-3 ${
                  isUrgent
                    ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                    : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      {license.driverName}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Lic: {license.licenseNumber || "N/A"} - Tipo:{" "}
                      {license.licenseType || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isUrgent
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {daysLeft} días
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {format(new Date(license.expiresAt), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/**
 * VehiclesInMaintenanceList - Vehículos en mantenimiento
 */
export function VehiclesInMaintenanceList({ vehicles = [], loading = false }) {
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
            En Mantenimiento
          </h3>
        </div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-500" />
          En Mantenimiento
        </h3>
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
          {vehicles.length}
        </span>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Car className="h-10 w-10 text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No hay vehículos en mantenimiento
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Toda la flota operativa
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.slice(0, 5).map((vehicle) => (
            <Link
              key={vehicle.$id}
              to={`/vehicles/${vehicle.$id}`}
              className="block"
            >
              <div className="flex items-center gap-3 rounded-lg border border-stone-200 dark:border-stone-700 p-3 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Car className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                    {vehicle.brand?.name || ""} {vehicle.model?.name || ""}{" "}
                    {vehicle.year || ""}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {vehicle.plateNumber || "Sin placa"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </div>
            </Link>
          ))}
          {vehicles.length > 5 && (
            <Link
              to="/vehicles?status=MAINTENANCE"
              className="block text-center text-xs font-medium text-orange-600 dark:text-orange-400 py-2 hover:underline"
            >
              Ver {vehicles.length - 5} más...
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}
