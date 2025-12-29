import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Car,
  Search,
  ChevronRight,
  ChevronLeft,
  Gauge,
  LayoutGrid,
  List,
  Tag,
  Edit,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { cn } from "../../../shared/utils/cn";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import {
  listVehicles,
  deleteVehicle,
  listVehicleFiles,
  getFilePreview,
} from "../services/vehicles.service";
import {
  listVehicleTypes,
  listVehicleBrands,
  listVehicleModels,
} from "../../catalogs/services/catalogs.service";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Activos" },
  { value: "IN_MAINTENANCE", label: "Mantenimiento" },
  { value: "INACTIVE", label: "Inactivos" },
  { value: "SOLD", label: "Vendidos" },
  { value: "RENTED", label: "Rentados" },
];

const STATUS_COLORS = {
  ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400",
  IN_MAINTENANCE: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  INACTIVE: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  SOLD: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  RENTED: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const STATUS_LABELS = {
  ACTIVE: "Activo",
  IN_MAINTENANCE: "Mantenimiento",
  INACTIVE: "Inactivo",
  SOLD: "Vendido",
  RENTED: "Rentado",
};

const ITEMS_PER_PAGE = 12;

export function VehiclesPage() {
  const { activeGroupId } = useActiveGroup();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [currentPage, setCurrentPage] = useState(1);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [imageViewerData, setImageViewerData] = useState({
    isOpen: false,
    images: [],
    currentImageId: null,
  });
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  // Permisos
  const canCreate = can(SYSTEM_PERMISSIONS.VEHICLES_CREATE);
  const canEdit = can(SYSTEM_PERMISSIONS.VEHICLES_EDIT);
  const canDelete = can(SYSTEM_PERMISSIONS.VEHICLES_DELETE);

  // Mutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: (vehicleId) => deleteVehicle(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles", activeGroupId]);
      setVehicleToDelete(null);
    },
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles", activeGroupId],
    queryFn: () => listVehicles(activeGroupId),
    enabled: !!activeGroupId,
  });

  // Fetch catalogs for display names
  const { data: types = [] } = useQuery({
    queryKey: ["vehicleTypes", activeGroupId],
    queryFn: () => listVehicleTypes(activeGroupId),
    enabled: !!activeGroupId,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["vehicleBrands", activeGroupId],
    queryFn: () => listVehicleBrands(activeGroupId),
    enabled: !!activeGroupId,
  });

  const { data: models = [] } = useQuery({
    queryKey: ["vehicleModels", activeGroupId],
    queryFn: () => listVehicleModels(activeGroupId, null),
    enabled: !!activeGroupId,
  });

  // Create lookup maps
  const brandMap = useMemo(
    () => Object.fromEntries(brands.map((b) => [b.$id, b])),
    [brands]
  );
  const modelMap = useMemo(
    () => Object.fromEntries(models.map((m) => [m.$id, m])),
    [models]
  );
  const typeMap = useMemo(
    () => Object.fromEntries(types.map((t) => [t.$id, t])),
    [types]
  );

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    // Reset to first page when filters change
    setCurrentPage(1);

    return vehicles.filter((vehicle) => {
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const model = modelMap[vehicle.modelId];
        const brand = brandMap[vehicle.brandId];
        const type = typeMap[vehicle.typeId];

        const searchableText = [
          vehicle.plate,
          vehicle.economicNumber,
          vehicle.serialNumber,
          vehicle.color,
          model?.name,
          brand?.name,
          type?.name,
          type?.economicGroup,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(term)) return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && vehicle.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "ALL" && vehicle.typeId !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [
    vehicles,
    searchTerm,
    statusFilter,
    typeFilter,
    modelMap,
    brandMap,
    typeMap,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage]);

  // Stats
  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === "ACTIVE").length;
    const maintenance = vehicles.filter(
      (v) => v.status === "IN_MAINTENANCE"
    ).length;
    return { total, active, maintenance };
  }, [vehicles]);

  if (!activeGroupId) {
    return (
      <PageLayout.Empty
        icon={Car}
        title="Selecciona un grupo"
        description="Para ver y gestionar vehículos, primero debes seleccionar un grupo en el menú superior."
      />
    );
  }

  return (
    <PageLayout
      title="Vehículos"
      subtitle="Gestiona la flotilla de tu grupo."
      actions={
        canCreate && (
          <Button onClick={() => nav("new")}>
            <Plus size={18} className="mr-2" /> Nuevo vehículo
          </Button>
        )
      }
    >
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand)/10">
              <Car size={20} className="text-(--brand)" />
            </div>
            <div>
              <p className="text-2xl font-bold text-(--fg)">{stats.total}</p>
              <p className="text-xs text-(--muted-fg)">Total vehículos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Car size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-(--fg)">{stats.active}</p>
              <p className="text-xs text-(--muted-fg)">Activos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Car size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-(--fg)">
                {stats.maintenance}
              </p>
              <p className="text-xs text-(--muted-fg)">En mantenimiento</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Card */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search - Full width on mobile */}
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por placa, número económico, modelo, marca, color..."
              className="h-12 w-full rounded-xl border border-(--border) bg-(--card) pl-12 pr-4 text-base focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter - Select */}
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-(--border) bg-(--card) px-3 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20 outline-none transition-all cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter - Select */}
            {types.length > 0 && (
              <div className="flex-1 min-w-[140px] max-w-[200px]">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-(--border) bg-(--card) px-3 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20 outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">Todos los tipos</option>
                  {types.map((type) => (
                    <option key={type.$id} value={type.$id}>
                      {type.economicGroup ? `${type.economicGroup} - ` : ""}
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-(--border) overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-(--brand) text-white"
                    : "bg-(--card) text-(--muted-fg) hover:bg-(--muted)"
                )}
                title="Vista en cuadrícula"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2.5 transition-colors",
                  viewMode === "list"
                    ? "bg-(--brand) text-white"
                    : "bg-(--card) text-(--muted-fg) hover:bg-(--muted)"
                )}
                title="Vista en lista"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Active filters indicator */}
          {(statusFilter !== "ALL" || typeFilter !== "ALL" || searchTerm) && (
            <div className="flex items-center gap-2 text-xs text-(--muted-fg)">
              <span>
                Mostrando {filteredVehicles.length} de {vehicles.length}{" "}
                vehículos
              </span>
              {(statusFilter !== "ALL" || typeFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setTypeFilter("ALL");
                    setSearchTerm("");
                  }}
                  className="text-(--brand) hover:underline font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <LoadingScreen label="Cargando vehículos..." />
      ) : filteredVehicles.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.$id}
                  vehicle={vehicle}
                  brandMap={brandMap}
                  modelMap={modelMap}
                  typeMap={typeMap}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => nav(`/vehicles/${vehicle.$id}/edit`)}
                  onDelete={() => setVehicleToDelete(vehicle)}
                  onOpenImages={(images, currentId) =>
                    setImageViewerData({
                      isOpen: true,
                      images,
                      currentImageId: currentId,
                    })
                  }
                />
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-(--border) bg-(--muted)/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        Vehículo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        N° Económico
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        Placa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        Kilometraje
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-(--muted-fg) uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--border)">
                    {paginatedVehicles.map((vehicle) => (
                      <VehicleRow
                        key={vehicle.$id}
                        vehicle={vehicle}
                        brandMap={brandMap}
                        modelMap={modelMap}
                        typeMap={typeMap}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onEdit={() => nav(`/vehicles/${vehicle.$id}/edit`)}
                        onDelete={() => setVehicleToDelete(vehicle)}
                        onOpenImages={(images, currentId) =>
                          setImageViewerData({
                            isOpen: true,
                            images,
                            currentImageId: currentId,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current and adjacent pages
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => {
                    // Add ellipsis if there's a gap
                    const showEllipsisBefore =
                      idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsisBefore && (
                          <span className="px-2 text-(--muted-fg)">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "h-8 min-w-8 px-2 rounded-lg text-sm font-medium transition-colors",
                            page === currentPage
                              ? "bg-(--brand) text-white"
                              : "hover:bg-(--muted) text-(--fg)"
                          )}
                        >
                          {page}
                        </button>
                      </span>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>

              <span className="ml-2 text-sm text-(--muted-fg)">
                {filteredVehicles.length} vehículo
                {filteredVehicles.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Car}
          title="No se encontraron vehículos"
          description={
            searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
              ? "Prueba ajustando los filtros de búsqueda"
              : "Comienza agregando tu primer vehículo al grupo"
          }
        >
          {canCreate && !searchTerm && statusFilter === "ALL" && (
            <Button onClick={() => nav("new")}>
              <Plus size={18} className="mr-2" />
              Agregar Vehículo
            </Button>
          )}
        </EmptyState>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        open={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={() => deleteMutation.mutate(vehicleToDelete?.$id)}
        title="Eliminar vehículo"
        description={`¿Estás seguro de que deseas eliminar el vehículo "${
          vehicleToDelete?.plate ||
          vehicleToDelete?.economicNumber ||
          "seleccionado"
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerData.isOpen}
        onClose={() =>
          setImageViewerData({
            isOpen: false,
            images: [],
            currentImageId: null,
          })
        }
        images={imageViewerData.images}
        currentImageId={imageViewerData.currentImageId}
      />
    </PageLayout>
  );
}

// Vehicle Card Component
function VehicleCard({
  vehicle,
  brandMap,
  modelMap,
  typeMap,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onOpenImages,
}) {
  const model = modelMap[vehicle.modelId];
  const brand = brandMap[vehicle.brandId];
  const type = typeMap[vehicle.typeId];

  const economicGroup = type?.economicGroup;
  const displayEconomicNumber = economicGroup
    ? `${economicGroup}-${vehicle.economicNumber}`
    : vehicle.economicNumber;

  // Fetch vehicle images
  const { data: files = [] } = useQuery({
    queryKey: ["vehicleFiles", vehicle.$id],
    queryFn: () => listVehicleFiles(vehicle.$id),
    enabled: !!vehicle.$id,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const imageFiles = useMemo(() => files.filter((f) => f.isImage), [files]);
  const hasImages = imageFiles.length > 0;
  // Use storageFileId for preview (fallback to fileId for old data)
  const getStorageId = (file) => file.storageFileId || file.fileId;
  const thumbnailUrl = hasImages
    ? getFilePreview(getStorageId(imageFiles[0]))?.href
    : null;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasImages) {
      const imageIds = imageFiles.map((f) => getStorageId(f));
      onOpenImages(imageIds, imageIds[0]);
    }
  };

  return (
    <Link to={`/vehicles/${vehicle.$id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:border-(--brand)/40 hover:shadow-md">
        {/* Image / Thumbnail Area - Más compacto */}
        <div
          className={cn(
            "relative h-28 w-full overflow-hidden bg-(--muted)/30",
            hasImages && "cursor-zoom-in"
          )}
          onClick={hasImages ? handleImageClick : undefined}
        >
          {hasImages ? (
            <>
              <img
                src={thumbnailUrl}
                alt={displayEconomicNumber}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Image count badge */}
              {imageFiles.length > 1 && (
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  <ImageIcon size={10} />
                  {imageFiles.length}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Car size={36} className="text-(--muted-fg)/30" />
            </div>
          )}

          {/* Status Badge - overlayed on image */}
          <span
            className={cn(
              "absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm",
              STATUS_COLORS[vehicle.status] || STATUS_COLORS.INACTIVE
            )}
          >
            {STATUS_LABELS[vehicle.status] || vehicle.status}
          </span>
        </div>

        {/* Content - Más compacto */}
        <div className="p-3">
          {/* Economic Number & Plate */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-bold text-(--fg) group-hover:text-(--brand) transition-colors truncate">
                {displayEconomicNumber || "Sin N°"}
              </p>
              <p className="text-xs text-(--muted-fg) truncate">
                {vehicle.plate || "Sin placa"}
              </p>
            </div>
          </div>

          {/* Model & Brand */}
          <div className="mt-1.5">
            <p className="text-xs font-medium text-(--fg) truncate">
              {brand?.name || ""} {model?.name || ""}
              {model?.year ? ` (${model.year})` : ""}
            </p>
            {type && (
              <p className="text-[11px] text-(--muted-fg) flex items-center gap-1 mt-0.5">
                <Tag size={10} className="shrink-0" />
                <span className="truncate">{type.name}</span>
              </p>
            )}
          </div>

          {/* Info Row - Compacto */}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-(--muted-fg)">
            {vehicle.mileage > 0 && (
              <span className="flex items-center gap-1">
                <Gauge size={11} />
                {vehicle.mileage.toLocaleString()} {vehicle.mileageUnit || "KM"}
              </span>
            )}
            {vehicle.color && (
              <span className="flex items-center gap-1">
                <div
                  className="h-2.5 w-2.5 rounded-full border border-(--border)"
                  style={{ backgroundColor: vehicle.color.toLowerCase() }}
                />
                {vehicle.color}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-between border-t border-(--border) pt-2">
            <div className="flex items-center gap-0.5">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="p-1 rounded hover:bg-(--muted) transition-colors text-(--muted-fg) hover:text-(--brand)"
                  title="Editar"
                >
                  <Edit size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-(--muted-fg) hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-(--brand) group-hover:underline">
              Ver detalles <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Vehicle Row Component (for table view)
function VehicleRow({
  vehicle,
  brandMap,
  modelMap,
  typeMap,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onOpenImages,
}) {
  const model = modelMap[vehicle.modelId];
  const brand = brandMap[vehicle.brandId];
  const type = typeMap[vehicle.typeId];

  const economicGroup = type?.economicGroup;
  const displayEconomicNumber = economicGroup
    ? `${economicGroup}-${vehicle.economicNumber}`
    : vehicle.economicNumber;

  // Fetch vehicle images
  const { data: files = [] } = useQuery({
    queryKey: ["vehicleFiles", vehicle.$id],
    queryFn: () => listVehicleFiles(vehicle.$id),
    enabled: !!vehicle.$id,
    staleTime: 5 * 60 * 1000,
  });

  const imageFiles = useMemo(() => files.filter((f) => f.isImage), [files]);
  const hasImages = imageFiles.length > 0;
  // Use storageFileId for preview (fallback to fileId for old data)
  const getStorageId = (file) => file.storageFileId || file.fileId;
  const thumbnailUrl = hasImages
    ? getFilePreview(getStorageId(imageFiles[0]))?.href
    : null;

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (hasImages) {
      const imageIds = imageFiles.map((f) => getStorageId(f));
      onOpenImages(imageIds, imageIds[0]);
    }
  };

  return (
    <tr className="hover:bg-(--muted)/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div
            onClick={hasImages ? handleImageClick : undefined}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden",
              hasImages ? "cursor-zoom-in" : "bg-(--brand)/10 text-(--brand)"
            )}
          >
            {hasImages ? (
              <img
                src={thumbnailUrl}
                alt={displayEconomicNumber}
                className="h-full w-full object-cover"
              />
            ) : (
              <Car size={18} />
            )}
          </div>
          <div>
            <p className="font-medium text-(--fg)">
              {brand?.name || ""} {model?.name || ""}
            </p>
            {model?.year && (
              <p className="text-xs text-(--muted-fg)">{model.year}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono font-semibold text-(--fg)">
          {displayEconomicNumber || "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-(--muted-fg)">
        {vehicle.plate || "—"}
      </td>
      <td className="px-4 py-3">
        {type ? (
          <span className="inline-flex items-center gap-1 text-xs">
            {type.economicGroup && (
              <span className="rounded bg-(--muted) px-1.5 py-0.5 font-semibold">
                {type.economicGroup}
              </span>
            )}
            {type.name}
          </span>
        ) : (
          <span className="text-sm text-(--muted-fg)">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-(--muted-fg)">
        {vehicle.mileage > 0
          ? `${vehicle.mileage.toLocaleString()} ${vehicle.mileageUnit || "KM"}`
          : "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            STATUS_COLORS[vehicle.status] || STATUS_COLORS.INACTIVE
          )}
        >
          {STATUS_LABELS[vehicle.status] || vehicle.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/vehicles/${vehicle.$id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-(--brand) hover:underline"
          >
            Ver <ChevronRight size={14} />
          </Link>
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg hover:bg-(--muted) transition-colors text-(--muted-fg) hover:text-(--brand)"
              title="Editar"
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-(--muted-fg) hover:text-red-600"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
