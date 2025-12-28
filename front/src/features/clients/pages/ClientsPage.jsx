import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Users,
  SortAsc,
  SortDesc,
  RefreshCw,
} from "lucide-react";

import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from "../hooks/useClients";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";

import { PageLayout } from "../../../shared/ui/PageLayout";
import { Card } from "../../../shared/ui/Card";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { ConfirmModal } from "../../../shared/ui/ConfirmModal";

import { ClientCard, ClientListItem } from "../components/ClientCard";
import { ClientFormModal } from "../components/ClientFormModal";
import { ClientDetailModal } from "../components/ClientDetailModal";
import { cn } from "../../../shared/utils/cn";

const VIEW_MODES = {
  GRID: "grid",
  LIST: "list",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes", icon: SortDesc },
  { value: "oldest", label: "Más antiguos", icon: SortAsc },
  { value: "name_asc", label: "Nombre A-Z", icon: SortAsc },
  { value: "name_desc", label: "Nombre Z-A", icon: SortDesc },
];

export function ClientsPage() {
  const { activeGroupId } = useActiveGroup();
  const { data: clients = [], isLoading, refetch, isRefetching } = useClients();

  // Estado del UI
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Mutations
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  // Filtrar y ordenar clientes
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (client) =>
          client.name?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term) ||
          client.phone?.includes(term)
      );
    }

    // Ordenar
    switch (sortBy) {
      case "oldest":
        result.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
        break;
      case "name_asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name_desc":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
        break;
    }

    return result;
  }, [clients, searchTerm, sortBy]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedClient(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleOpenDetail = (client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
  };

  const handleOpenDelete = (client) => {
    setSelectedClient(client);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  const handleSubmitForm = (data) => {
    if (selectedClient) {
      updateMutation.mutate(
        { id: selectedClient.$id, data },
        {
          onSuccess: () => setShowFormModal(false),
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => setShowFormModal(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient.$id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSelectedClient(null);
        },
      });
    }
  };

  // Sin grupo seleccionado
  if (!activeGroupId) {
    return (
      <PageLayout.Empty
        icon={Building2}
        title="Selecciona un grupo"
        description="Para gestionar clientes, primero debes seleccionar un grupo en el menú superior."
      />
    );
  }

  return (
    <PageLayout
      title="Clientes"
      subtitle="Gestiona la información de tus clientes"
      actions={
        <Button onClick={handleOpenCreate}>
          <Plus size={18} className="mr-2" /> Nuevo Cliente
        </Button>
      }
    >
      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o teléfono..."
              className={cn(
                "h-10 w-full rounded-xl border border-(--border) bg-(--bg)",
                "pl-10 pr-4 text-sm focus:border-(--brand) focus:ring-2 focus:ring-(--brand)/20",
                "outline-none transition-all placeholder:text-(--muted-fg)"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Contador */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--muted)/30 text-sm">
              <Users size={14} className="text-(--muted-fg)" />
              <span className="font-medium text-(--fg)">
                {filteredClients.length}
              </span>
              <span className="text-(--muted-fg)">clientes</span>
            </div>

            {/* Ordenar */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border)",
                  "text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
                )}
              >
                <Filter size={14} />
                Ordenar
              </button>

              <AnimatePresence>
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-(--border) bg-(--card) py-1 shadow-lg"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors",
                          sortBy === option.value
                            ? "bg-(--brand)/10 text-(--brand)"
                            : "text-(--fg) hover:bg-(--muted)/50"
                        )}
                      >
                        <option.icon size={14} />
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Toggle Vista */}
            <div className="flex rounded-lg border border-(--border) overflow-hidden">
              <button
                onClick={() => setViewMode(VIEW_MODES.GRID)}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === VIEW_MODES.GRID
                    ? "bg-(--brand) text-white"
                    : "text-(--muted-fg) hover:bg-(--muted)/50"
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === VIEW_MODES.LIST
                    ? "bg-(--brand) text-white"
                    : "text-(--muted-fg) hover:bg-(--muted)/50"
                )}
              >
                <List size={16} />
              </button>
            </div>

            {/* Refrescar */}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className={cn(
                "p-2 rounded-lg border border-(--border) text-(--muted-fg)",
                "hover:bg-(--muted)/50 hover:text-(--fg) transition-colors",
                isRefetching && "animate-spin"
              )}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <LoadingScreen label="Cargando clientes..." />
      ) : filteredClients.length > 0 ? (
        <AnimatePresence mode="wait">
          {viewMode === VIEW_MODES.GRID ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredClients.map((client, index) => (
                <ClientCard
                  key={client.$id}
                  client={client}
                  index={index}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onSelect={handleOpenDetail}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filteredClients.map((client) => (
                <ClientListItem
                  key={client.$id}
                  client={client}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onSelect={handleOpenDetail}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <EmptyState
          icon={Building2}
          title={searchTerm ? "Sin resultados" : "No hay clientes"}
          description={
            searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Comienza agregando tu primer cliente al sistema"
          }
          action={
            !searchTerm && (
              <Button onClick={handleOpenCreate} className="mt-4">
                <Plus size={18} className="mr-2" />
                Agregar Cliente
              </Button>
            )
          }
        />
      )}

      {/* Modales */}
      <ClientFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmitForm}
        client={selectedClient}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <ClientDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        client={selectedClient}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cliente?"
        description={`Estás a punto de eliminar a "${selectedClient?.name}". Esta acción se puede deshacer contactando al administrador.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      {/* Click outside handler para dropdown */}
      {showSortDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </PageLayout>
  );
}
