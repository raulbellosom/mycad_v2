import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  User,
  ShieldAlert,
  ChevronRight,
  Filter,
} from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { getAvatarPreviewUrl } from "../../auth/services/myProfile.service";
import { env } from "../../../shared/appwrite/env";
import { cn } from "../../../shared/utils/cn";
import { listDrivers } from "../services/drivers.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";

export function DriversPage() {
  const { activeGroupId } = useActiveGroup();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const nav = useNavigate();
  const { can } = usePermissions();

  // Permisos
  const canCreate = can(SYSTEM_PERMISSIONS.DRIVERS_CREATE);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers", activeGroupId],
    queryFn: () => listDrivers(activeGroupId),
    enabled: !!activeGroupId,
  });

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      `${driver.firstName} ${driver.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (driver.email &&
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || driver.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!activeGroupId) {
    return (
      <PageLayout.Empty
        icon={Users}
        title="Selecciona un grupo"
        description="Para gestionar conductores, primero debes seleccionar un grupo en el menú superior."
      />
    );
  }

  return (
    <PageLayout
      title="Conductores"
      subtitle="Gestiona el personal y sus licencias de conducir"
      actions={
        canCreate && (
          <Button onClick={() => nav("new")}>
            <Plus size={18} className="mr-2" /> Nuevo Conductor
          </Button>
        )
      }
    >
      {/* Filters Card */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              className="h-10 w-full rounded-lg border border-(--border) bg-(--card) pl-10 pr-4 text-sm focus:border-(--brand) focus:ring-1 focus:ring-(--brand) outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter size={16} className="text-(--muted-fg) mr-1 shrink-0" />
            {[
              { value: "ALL", label: "Todos" },
              { value: "ACTIVE", label: "Activos" },
              { value: "INACTIVE", label: "Inactivos" },
              { value: "SUSPENDED", label: "Suspendidos" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all border",
                  statusFilter === opt.value
                    ? "bg-(--brand) border-(--brand) text-white shadow-sm"
                    : "bg-(--muted)/30 border-(--border) text-(--muted-fg) hover:bg-(--muted)/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingScreen label="Cargando conductores..." />
      ) : filteredDrivers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDrivers.map((driver) => (
            <Card
              key={driver.$id}
              className="group relative overflow-visible p-5 transition-all hover:border-(--brand)/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Profile Image or Icon */}
                  {driver.linkedProfile?.avatarFileId ? (
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedAvatarId(driver.linkedProfile.avatarFileId);
                        setShowAvatarViewer(true);
                      }}
                      className="h-12 w-12 shrink-0 cursor-pointer rounded-full overflow-hidden ring-2 ring-(--border) hover:ring-(--brand) transition-all"
                    >
                      <img
                        src={getAvatarPreviewUrl(
                          driver.linkedProfile.avatarFileId,
                          200
                        )}
                        alt={`${driver.firstName} ${driver.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--brand)/10 text-(--brand)">
                      <User size={24} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-(--fg) group-hover:text-(--brand) transition-colors">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-xs text-(--muted-fg)">
                      {driver.email || "Sin correo"}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    driver.status === "ACTIVE"
                      ? "bg-green-500/10 text-green-500"
                      : driver.status === "INACTIVE"
                      ? "bg-gray-500/10 text-gray-500"
                      : "bg-amber-500/10 text-amber-500"
                  )}
                >
                  {driver.status}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-(--border) pt-4">
                <div className="flex items-center gap-1.5 text-xs text-(--muted-fg)">
                  <ShieldAlert
                    size={14}
                    className={
                      driver.licensesCount > 0
                        ? "text-blue-500"
                        : "text-amber-500"
                    }
                  />
                  {driver.licensesCount || 0} Licencias
                </div>

                <Link
                  to={driver.$id}
                  className="flex items-center gap-1 text-xs font-semibold text-(--brand) hover:underline"
                >
                  Ver Perfil <ChevronRight size={14} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={User}
          title="No se encontraron conductores"
          description={
            searchTerm
              ? "Prueba con otros términos de búsqueda"
              : "Comienza agregando tu primer conductor al grupo"
          }
        />
      )}

      {/* Avatar Viewer Modal */}
      <ImageViewerModal
        isOpen={showAvatarViewer}
        onClose={() => {
          setShowAvatarViewer(false);
          setSelectedAvatarId(null);
        }}
        currentImageId={selectedAvatarId}
        images={selectedAvatarId ? [selectedAvatarId] : []}
        bucketId={env.bucketAvatarsId}
      />
    </PageLayout>
  );
}
