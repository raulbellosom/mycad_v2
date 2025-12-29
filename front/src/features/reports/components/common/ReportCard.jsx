import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Car,
  User,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileDown,
  Wrench,
  Hammer,
} from "lucide-react";
import { Card } from "../../../../shared/ui/Card";
import { Button } from "../../../../shared/ui/Button";
import { formatServerDate } from "../../../../shared/utils/dateUtils";
import {
  ReportStatusBadge,
  RepairStatusBadge,
  RepairPriorityBadge,
} from "./ReportStatusBadge";
import { ReportSummaryCompact } from "./ReportSummary";
import { useState, useRef, useEffect } from "react";
import { REPORT_STATUS } from "../../constants/report.constants";

/**
 * Card para mostrar un reporte en la lista
 * Diseño moderno y responsivo con acciones contextuales
 */
export function ReportCard({
  report,
  type = "service", // 'service' | 'repair'
  vehicle,
  onView,
  onEdit,
  onDelete,
  onDownloadPDF,
  canEdit = true,
  canDelete = true,
}) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isService = type === "service";
  const isFinalized =
    report.status === REPORT_STATUS.FINALIZED || report.status === "DONE";

  // Format date
  const formatDate = (date) => {
    return formatServerDate(date, { format: "short" });
  };

  // Vehicle info
  const vehicleName = vehicle
    ? [
        vehicle.brand?.name || vehicle.brandId,
        vehicle.model?.name || vehicle.modelId,
      ]
        .filter(Boolean)
        .join(" ")
    : "Vehículo";

  const handleClick = () => {
    if (onView) {
      onView(report);
    } else {
      navigate(`/reports/${type}/${report.$id}${isFinalized ? "" : "/edit"}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
        padding="none"
        onClick={handleClick}
      >
        {/* Header con gradiente */}
        <div
          className={`
          px-4 py-3 flex items-center justify-between
          ${
            isService
              ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
              : "bg-gradient-to-r from-orange-500/10 to-red-500/10"
          }
        `}
        >
          <div className="flex items-center gap-2">
            {isService ? (
              <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Hammer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            )}
            <span className="text-sm font-medium text-(--fg)">
              {isService ? "Servicio" : "Reparación"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isService ? (
              <ReportStatusBadge status={report.status} size="sm" />
            ) : (
              <>
                <RepairStatusBadge status={report.status} size="sm" />
                {report.priority && report.priority !== "NORMAL" && (
                  <RepairPriorityBadge priority={report.priority} size="sm" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-(--fg) text-lg mb-2 line-clamp-1">
            {report.title || "Sin título"}
          </h3>

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-(--muted-fg) mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(isService ? report.serviceDate : report.reportDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Car className="h-4 w-4" />
              <span className="truncate max-w-[150px]">{vehicleName}</span>
            </div>
          </div>

          {/* Description preview */}
          {report.description && (
            <p className="text-sm text-(--muted-fg) line-clamp-2 mb-3">
              {report.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-(--border)">
            <ReportSummaryCompact
              laborCost={report.laborCost}
              partsCost={report.partsCost || report.cost}
            />

            {/* Actions Menu */}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {/* Dropdown Menu */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 bottom-full mb-1 w-40 bg-(--card) border border-(--border) rounded-lg shadow-lg overflow-hidden z-10"
                >
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-(--fg) hover:bg-(--muted) transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView?.(report);
                      setShowMenu(false);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalles
                  </button>
                  {canEdit && !isFinalized && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-(--fg) hover:bg-(--muted) transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(report);
                        setShowMenu(false);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-(--fg) hover:bg-(--muted) transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadPDF?.(report);
                      setShowMenu(false);
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                    Descargar PDF
                  </button>
                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(report);
                        setShowMenu(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Lista de reportes con diseño responsivo
 */
export function ReportCardList({
  reports = [],
  type = "service",
  vehicles = [],
  onView,
  onEdit,
  onDelete,
  onDownloadPDF,
  canEdit = true,
  canDelete = true,
  isLoading = false,
  emptyMessage = "No hay reportes",
}) {
  // Map vehicles by ID for quick lookup
  const vehiclesMap = vehicles.reduce((acc, v) => {
    acc[v.$id] = v;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-(--muted) rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-(--muted) flex items-center justify-center">
          {type === "service" ? (
            <Wrench className="h-8 w-8 text-(--muted-fg)" />
          ) : (
            <Hammer className="h-8 w-8 text-(--muted-fg)" />
          )}
        </div>
        <p className="text-(--muted-fg)">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <ReportCard
          key={report.$id}
          report={report}
          type={type}
          vehicle={vehiclesMap[report.vehicleId]}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onDownloadPDF={onDownloadPDF}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ))}
    </div>
  );
}
