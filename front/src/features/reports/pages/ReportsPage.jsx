import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Wrench, Hammer, Plus, FileText, Car } from "lucide-react";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { Tabs } from "../../../shared/ui/Tabs";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ServiceReportsList } from "../components/service/ServiceReportsList";
import { RepairReportsList } from "../components/repair/RepairReportsList";
import {
  useServiceReports,
  useDeleteServiceReport,
} from "../hooks/useServiceReports";
import {
  useRepairReports,
  useDeleteRepairReport,
} from "../hooks/useRepairReports";
import { listVehicles } from "../../vehicles/services/vehicles.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";

/**
 * Página principal del módulo de reportes
 * Muestra tabs para reportes de servicio y reparación
 */
export function ReportsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGroupId } = useActiveGroup();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("service");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,
    id: null,
  });

  // Permisos
  const canCreate = can(SYSTEM_PERMISSIONS.REPORTS_CREATE);
  const canManage = can(SYSTEM_PERMISSIONS.REPORTS_MANAGE);

  // Queries
  const { data: serviceReportsData, isLoading: isLoadingService } =
    useServiceReports(activeGroupId);
  const { data: repairReportsData, isLoading: isLoadingRepair } =
    useRepairReports(activeGroupId);
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });

  // Mutations
  const deleteServiceMutation = useDeleteServiceReport();
  const deleteRepairMutation = useDeleteRepairReport();

  const serviceReports = serviceReportsData || [];
  const repairReports = repairReportsData || [];
  const vehiclesList = vehicles || [];

  // Si no hay grupo seleccionado
  if (!activeGroupId) {
    return (
      <PageLayout
        title="Reportes"
        subtitle="Gestiona los reportes de servicio y reparación"
      >
        <EmptyState
          icon={Car}
          title="Selecciona un grupo"
          description="Para ver y gestionar reportes, primero debes seleccionar un grupo en el menú superior."
        />
      </PageLayout>
    );
  }

  // Handlers para reportes de servicio
  const handleCreateServiceReport = () => {
    navigate("/reports/service/new");
  };

  const handleViewServiceReport = (id) => {
    navigate(`/reports/service/${id}`);
  };

  const handleEditServiceReport = (id) => {
    navigate(`/reports/service/${id}/edit`);
  };

  const handleDeleteServiceReport = (id) => {
    setDeleteModal({ open: true, type: "service", id });
  };

  const handleDownloadServicePdf = (id) => {
    // TODO: Implementar descarga de PDF
    console.log("Download service PDF:", id);
  };

  // Handlers para reportes de reparación
  const handleCreateRepairReport = () => {
    navigate("/reports/repair/new");
  };

  const handleViewRepairReport = (id) => {
    navigate(`/reports/repair/${id}`);
  };

  const handleEditRepairReport = (id) => {
    navigate(`/reports/repair/${id}/edit`);
  };

  const handleDeleteRepairReport = (id) => {
    setDeleteModal({ open: true, type: "repair", id });
  };

  const handleDownloadRepairPdf = (id) => {
    // TODO: Implementar descarga de PDF
    console.log("Download repair PDF:", id);
  };

  // Confirmar eliminación
  const confirmDelete = async () => {
    if (deleteModal.type === "service") {
      await deleteServiceMutation.mutateAsync(deleteModal.id);
    } else {
      await deleteRepairMutation.mutateAsync(deleteModal.id);
    }
    setDeleteModal({ open: false, type: null, id: null });
  };

  const tabs = [
    {
      id: "service",
      label: "Servicio / Mantenimiento",
      icon: Wrench,
      badge: serviceReports.length,
    },
    {
      id: "repair",
      label: "Reparaciones",
      icon: Hammer,
      badge: repairReports.length,
    },
  ];

  return (
    <PageLayout
      title="Reportes de Vehículos"
      subtitle="Gestiona los reportes de servicio, mantenimiento y reparaciones de tu flota"
    >
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Servicios Totales"
          value={serviceReports.length}
          icon={Wrench}
          color="blue"
        />
        <StatsCard
          title="Reparaciones Totales"
          value={repairReports.length}
          icon={Hammer}
          color="orange"
        />
        <StatsCard
          title="Reportes Este Mes"
          value={
            serviceReports.filter(
              (r) => new Date(r.reportDate).getMonth() === new Date().getMonth()
            ).length +
            repairReports.filter(
              (r) => new Date(r.reportDate).getMonth() === new Date().getMonth()
            ).length
          }
          icon={FileText}
          color="green"
        />
        <StatsCard
          title="Vehículos"
          value={vehiclesList.length}
          icon={Car}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "service" ? (
          <ServiceReportsList
            reports={serviceReports}
            vehicles={vehiclesList}
            onCreateNew={handleCreateServiceReport}
            onView={handleViewServiceReport}
            onEdit={handleEditServiceReport}
            onDelete={handleDeleteServiceReport}
            onDownloadPdf={handleDownloadServicePdf}
            canCreate={canCreate}
            canEdit={canCreate}
            canDelete={canManage}
            isLoading={isLoadingService || isLoadingVehicles}
          />
        ) : (
          <RepairReportsList
            reports={repairReports}
            vehicles={vehiclesList}
            onCreateNew={handleCreateRepairReport}
            onView={handleViewRepairReport}
            onEdit={handleEditRepairReport}
            onDelete={handleDeleteRepairReport}
            onDownloadPdf={handleDownloadRepairPdf}
            canCreate={canCreate}
            canEdit={canCreate}
            canDelete={canManage}
            isLoading={isLoadingRepair || isLoadingVehicles}
          />
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: null, id: null })}
        onConfirm={confirmDelete}
        title="Eliminar Reporte"
        description="¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={
          deleteServiceMutation.isPending || deleteRepairMutation.isPending
        }
      />
    </PageLayout>
  );
}

/**
 * Card de estadísticas
 */
function StatsCard({ title, value, icon: Icon, color, description }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    orange:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    green:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-(--muted-fg)">{title}</p>
          <p className="text-2xl font-bold text-(--fg)">{value}</p>
          {description && (
            <p className="text-xs text-(--muted-fg)">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
