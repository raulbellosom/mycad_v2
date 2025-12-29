import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Gauge,
  Hash,
  Palette,
  FileText,
  DollarSign,
  Image as ImageIcon,
  Info,
  History,
  MoreVertical,
  Download,
  Eye,
  ChevronRight,
  MapPin,
  Tag,
  User,
  Building2,
  Clock,
  CreditCard,
  TrendingUp,
  Banknote,
  AlertCircle,
  CheckCircle2,
  Wrench,
  ShoppingCart,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { Badge } from "../../../shared/ui/Badge";
import { Tabs } from "../../../shared/ui/Tabs";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { cn } from "../../../shared/utils/cn";

import { useActiveGroup } from "../../groups/hooks/useActiveGroup";
import { usePermissions } from "../../groups/hooks/usePermissions";
import { SYSTEM_PERMISSIONS } from "../../groups/context/PermissionsProvider";
import {
  getVehicleById,
  deleteVehicle,
  listVehicleFiles,
  getFilePreview,
  getFileDownload,
} from "../services/vehicles.service";
import {
  listVehicleTypes,
  listVehicleBrands,
  listVehicleModels,
} from "../../catalogs/services/catalogs.service";

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ACTIVE: {
    label: "Activo",
    variant: "success",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  IN_MAINTENANCE: {
    label: "Mantenimiento",
    variant: "warning",
    icon: Wrench,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  INACTIVE: {
    label: "Inactivo",
    variant: "default",
    icon: AlertCircle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-500/10",
  },
  SOLD: {
    label: "Vendido",
    variant: "info",
    icon: ShoppingCart,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  RENTED: {
    label: "Rentado",
    variant: "purple",
    icon: RotateCcw,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
};

const CURRENCY_SYMBOLS = {
  MXN: "$",
  USD: "US$",
  EUR: "€",
};

const TABS = [
  { id: "info", label: "Información" },
  { id: "files", label: "Archivos" },
  { id: "history", label: "Historial" },
];

// ─────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────
function formatCurrency(value, currency = "MXN") {
  if (!value && value !== 0) return "—";
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es });
  } catch {
    return "—";
  }
}

function formatMileage(mileage, unit = "KM") {
  if (!mileage && mileage !== 0) return "—";
  return `${mileage.toLocaleString("es-MX")} ${unit}`;
}

// ─────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────

/** Info Item - Small reusable field display */
function InfoItem({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--muted)/50">
          <Icon size={16} className="text-(--muted-fg)" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-(--muted-fg)">{label}</p>
        <p className="font-medium text-(--fg) break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

/** Detail Card - Grouped information section */
function DetailCard({ title, icon: Icon, children, className = "" }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-(--border) bg-(--muted)/30 px-4 py-3">
        {Icon && <Icon size={18} className="text-(--brand)" />}
        <h3 className="font-semibold text-(--fg)">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}

/** File Card - Individual file display */
function FileCard({ file, onView, onDownload }) {
  const isImage = file.isImage || file.mimeType?.startsWith("image/");
  // Use storageFileId for preview (from enriched data)
  const storageId = file.storageFileId || file.fileId;
  const previewUrl =
    isImage && storageId ? getFilePreview(storageId)?.href : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-xl border border-(--border) bg-(--card) transition-shadow hover:shadow-lg"
    >
      {/* Preview Area */}
      <div
        className={cn(
          "relative flex h-32 items-center justify-center overflow-hidden",
          isImage ? "bg-gray-100 dark:bg-gray-800" : "bg-(--muted)/50"
        )}
      >
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <FileText size={40} className="text-(--muted-fg)" />
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onView(file)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            title="Ver"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onDownload(file)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            title="Descargar"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* File Info */}
      <div className="p-3">
        <p
          className="truncate text-sm font-medium text-(--fg)"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="text-xs text-(--muted-fg)">
          {file.sizeBytes
            ? file.sizeBytes >= 1024 * 1024
              ? `${(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
              : `${(file.sizeBytes / 1024).toFixed(1)} KB`
            : "—"}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();
  const { can } = usePermissions();

  const [activeTab, setActiveTab] = useState("info");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Permissions
  const canEdit = can(SYSTEM_PERMISSIONS.VEHICLES_EDIT);
  const canDelete = can(SYSTEM_PERMISSIONS.VEHICLES_DELETE);

  // Fetch vehicle
  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  });

  // Fetch vehicle files
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["vehicleFiles", id],
    queryFn: () => listVehicleFiles(id),
    enabled: !!id,
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
  const typeMap = useMemo(
    () => Object.fromEntries(types.map((t) => [t.$id, t])),
    [types]
  );
  const brandMap = useMemo(
    () => Object.fromEntries(brands.map((b) => [b.$id, b])),
    [brands]
  );
  const modelMap = useMemo(
    () => Object.fromEntries(models.map((m) => [m.$id, m])),
    [models]
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["vehicles"]);
      navigate("/vehicles");
    },
  });

  // Computed values
  const vehicleType = vehicle?.typeId ? typeMap[vehicle.typeId] : null;
  const vehicleBrand = vehicle?.brandId ? brandMap[vehicle.brandId] : null;
  const vehicleModel = vehicle?.modelId ? modelMap[vehicle.modelId] : null;
  const statusConfig = STATUS_CONFIG[vehicle?.status] || STATUS_CONFIG.ACTIVE;
  const StatusIcon = statusConfig.icon;

  // Separate images and documents
  const imageFiles = files.filter(
    (f) => f.isImage || f.mimeType?.startsWith("image/")
  );
  const documentFiles = files.filter(
    (f) => !f.isImage && !f.mimeType?.startsWith("image/")
  );
  // Use storageFileId for image viewer
  const imageIds = imageFiles.map((f) => f.storageFileId || f.fileId);

  // Build display title
  const vehicleTitle = useMemo(() => {
    const parts = [];
    if (vehicleBrand?.name) parts.push(vehicleBrand.name);
    if (vehicleModel?.name) parts.push(vehicleModel.name);
    if (vehicleModel?.year) parts.push(`(${vehicleModel.year})`);
    return parts.length > 0 ? parts.join(" ") : "Vehículo";
  }, [vehicleBrand, vehicleModel]);

  // Economic number with prefix
  const fullEconomicNumber = useMemo(() => {
    if (!vehicle?.economicNumber) return "—";
    const prefix = vehicleType?.economicGroup || "";
    return prefix
      ? `${prefix}-${vehicle.economicNumber}`
      : vehicle.economicNumber;
  }, [vehicle, vehicleType]);

  // Handlers
  const handleViewImage = (file) => {
    // Use storageFileId for the image viewer
    setSelectedImageId(file.storageFileId || file.fileId);
    setViewerOpen(true);
  };

  const handleDownload = (file) => {
    // Use storageFileId for download
    const url = getFileDownload(file.storageFileId || file.fileId);
    window.open(url, "_blank");
  };

  // Loading state
  if (vehicleLoading) {
    return <LoadingScreen label="Cargando detalles del vehículo..." />;
  }

  // Not found
  if (!vehicle) {
    return (
      <PageLayout
        title="Vehículo no encontrado"
        subtitle="El vehículo solicitado no existe o fue eliminado."
      >
        <div className="flex flex-col items-center justify-center py-16">
          <Car size={64} className="mb-4 text-(--muted-fg)" />
          <Button onClick={() => navigate("/vehicles")}>
            <ArrowLeft size={18} className="mr-2" />
            Volver a vehículos
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-(--bg)">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-(--brand)/5 via-(--bg) to-(--muted)/20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Back Button */}
            <Link
              to="/vehicles"
              className="mb-6 inline-flex items-center gap-2 text-sm text-(--muted-fg) transition-colors hover:text-(--fg)"
            >
              <ArrowLeft size={16} />
              <span>Volver a vehículos</span>
            </Link>

            {/* Hero Content */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              {/* Left: Vehicle Info */}
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Vehicle Icon/Image */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl sm:h-24 sm:w-24",
                    statusConfig.bg
                  )}
                >
                  {imageFiles.length > 0 ? (
                    <img
                      src={
                        getFilePreview(
                          imageFiles[0].storageFileId || imageFiles[0].fileId
                        )?.href
                      }
                      alt={vehicleTitle}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <Car size={40} className={statusConfig.color} />
                  )}
                </motion.div>

                {/* Title & Meta */}
                <div>
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-2xl font-bold text-(--fg) sm:text-3xl"
                  >
                    {vehicleTitle}
                  </motion.h1>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-2 flex flex-wrap items-center gap-2 text-sm"
                  >
                    {/* Economic Number */}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-(--brand)/10 px-3 py-1 font-mono font-semibold text-(--brand)">
                      <Hash size={14} />
                      {fullEconomicNumber}
                    </span>

                    {/* Status Badge */}
                    <Badge variant={statusConfig.variant} dot>
                      {statusConfig.label}
                    </Badge>

                    {/* Type */}
                    {vehicleType && (
                      <span className="text-(--muted-fg)">
                        {vehicleType.name}
                      </span>
                    )}
                  </motion.div>

                  {/* Plate & Serial */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 flex flex-wrap gap-4 text-sm text-(--muted-fg)"
                  >
                    {vehicle.plate && (
                      <span className="flex items-center gap-1.5">
                        <Tag size={14} />
                        Placa:{" "}
                        <strong className="text-(--fg)">{vehicle.plate}</strong>
                      </span>
                    )}
                    {vehicle.serialNumber && (
                      <span className="flex items-center gap-1.5">
                        <FileText size={14} />
                        Serie:{" "}
                        <strong className="text-(--fg)">
                          {vehicle.serialNumber}
                        </strong>
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-2"
              >
                {canEdit && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/vehicles/${id}/edit`)}
                  >
                    <Edit size={18} className="mr-2" />
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Tabs */}
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            {/* ─────────────────────────────────────────────────────
                Tab: Información
            ───────────────────────────────────────────────────── */}
            {activeTab === "info" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* General Info */}
                <DetailCard title="Identificación" icon={Info}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem icon={Tag} label="Placa" value={vehicle.plate} />
                    <InfoItem
                      icon={Hash}
                      label="No. Económico"
                      value={fullEconomicNumber}
                    />
                    <InfoItem
                      icon={FileText}
                      label="No. Serie"
                      value={vehicle.serialNumber}
                    />
                    <InfoItem
                      icon={Palette}
                      label="Color"
                      value={vehicle.color}
                    />
                  </div>
                </DetailCard>

                {/* Vehicle Specs */}
                <DetailCard title="Especificaciones" icon={Car}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Car}
                      label="Tipo"
                      value={vehicleType?.name}
                    />
                    <InfoItem
                      icon={Building2}
                      label="Marca"
                      value={vehicleBrand?.name}
                    />
                    <InfoItem
                      icon={Tag}
                      label="Modelo"
                      value={vehicleModel?.name}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Año"
                      value={vehicleModel?.year}
                    />
                    <InfoItem
                      icon={Gauge}
                      label="Kilometraje"
                      value={formatMileage(
                        vehicle.mileage,
                        vehicle.mileageUnit
                      )}
                    />
                    <InfoItem
                      icon={Tag}
                      label="Grupo Económico"
                      value={vehicleType?.economicGroup}
                    />
                  </div>
                </DetailCard>

                {/* Financial Info */}
                <DetailCard title="Información Financiera" icon={DollarSign}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={CreditCard}
                      label="Costo de Adquisición"
                      value={formatCurrency(
                        vehicle.acquisitionCost,
                        vehicle.acquisitionCostCurrency
                      )}
                    />
                    <InfoItem
                      icon={TrendingUp}
                      label="Valor en Libros"
                      value={formatCurrency(
                        vehicle.bookValue,
                        vehicle.bookValueCurrency
                      )}
                    />
                    <InfoItem
                      icon={DollarSign}
                      label="Valor de Mercado"
                      value={formatCurrency(
                        vehicle.marketValue,
                        vehicle.marketValueCurrency
                      )}
                    />
                  </div>
                </DetailCard>

                {/* Dates & Status */}
                <DetailCard title="Fechas y Estado" icon={Calendar}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      icon={Calendar}
                      label="Fecha de Adquisición"
                      value={formatDate(vehicle.acquisitionDate)}
                    />
                    <InfoItem
                      icon={Clock}
                      label="Fecha de Registro"
                      value={formatDate(vehicle.$createdAt)}
                    />
                    <InfoItem
                      icon={StatusIcon}
                      label="Estado"
                      value={
                        <Badge variant={statusConfig.variant} size="sm" dot>
                          {statusConfig.label}
                        </Badge>
                      }
                    />
                    <InfoItem
                      icon={Eye}
                      label="Visibilidad"
                      value={
                        vehicle.visibility === "GROUP" ? "Grupo" : "Privado"
                      }
                    />
                  </div>
                </DetailCard>

                {/* Notes */}
                {vehicle.notes && (
                  <DetailCard
                    title="Notas"
                    icon={FileText}
                    className="lg:col-span-2"
                  >
                    <p className="whitespace-pre-wrap text-(--muted-fg)">
                      {vehicle.notes}
                    </p>
                  </DetailCard>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────
                Tab: Archivos
            ───────────────────────────────────────────────────── */}
            {activeTab === "files" && (
              <div className="space-y-8">
                {filesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2
                      size={32}
                      className="animate-spin text-(--brand)"
                    />
                  </div>
                ) : files.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--muted)/50">
                      <ImageIcon size={32} className="text-(--muted-fg)" />
                    </div>
                    <h3 className="text-lg font-semibold text-(--fg)">
                      Sin archivos
                    </h3>
                    <p className="mt-1 text-sm text-(--muted-fg)">
                      Este vehículo no tiene fotos ni documentos adjuntos.
                    </p>
                    {canEdit && (
                      <Button
                        variant="secondary"
                        className="mt-4"
                        onClick={() => navigate(`/vehicles/${id}/edit`)}
                      >
                        <Edit size={16} className="mr-2" />
                        Agregar archivos
                      </Button>
                    )}
                  </Card>
                ) : (
                  <>
                    {/* Images Section */}
                    {imageFiles.length > 0 && (
                      <section>
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                          <ImageIcon size={20} className="text-(--brand)" />
                          Fotos ({imageFiles.length})
                        </h3>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {imageFiles.map((file) => (
                            <FileCard
                              key={file.$id}
                              file={file}
                              onView={handleViewImage}
                              onDownload={handleDownload}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Documents Section */}
                    {documentFiles.length > 0 && (
                      <section>
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--fg)">
                          <FileText size={20} className="text-(--brand)" />
                          Documentos ({documentFiles.length})
                        </h3>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {documentFiles.map((file) => (
                            <FileCard
                              key={file.$id}
                              file={file}
                              onView={handleDownload}
                              onDownload={handleDownload}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────
                Tab: Historial
            ───────────────────────────────────────────────────── */}
            {activeTab === "history" && (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--muted)/50">
                  <History size={32} className="text-(--muted-fg)" />
                </div>
                <h3 className="text-lg font-semibold text-(--fg)">
                  Historial de servicio
                </h3>
                <p className="mt-1 max-w-sm text-sm text-(--muted-fg)">
                  El registro de mantenimientos, reparaciones y condiciones del
                  vehículo aparecerá aquí próximamente.
                </p>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Eliminar vehículo"
        description={`¿Estás seguro de que deseas eliminar "${vehicleTitle}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        currentImageId={selectedImageId}
        images={imageIds}
      />
    </>
  );
}
