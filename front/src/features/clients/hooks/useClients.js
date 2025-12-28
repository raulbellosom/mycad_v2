import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../services/clients.service";
import { useActiveGroup } from "../../groups/hooks/useActiveGroup";

/**
 * Hook para listar todos los clientes del grupo activo
 */
export function useClients() {
  const { activeGroupId } = useActiveGroup();

  return useQuery({
    queryKey: ["clients", activeGroupId],
    queryFn: () => listClients(activeGroupId),
    enabled: !!activeGroupId,
  });
}

/**
 * Hook para obtener un cliente por ID
 */
export function useClient(id) {
  return useQuery({
    queryKey: ["client", id],
    queryFn: () => getClientById(id),
    enabled: !!id,
  });
}

/**
 * Hook para crear un nuevo cliente
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();

  return useMutation({
    mutationFn: (data) =>
      createClient({
        ...data,
        groupId: activeGroupId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients", activeGroupId]);
      toast.success("Cliente creado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el cliente");
    },
  });
}

/**
 * Hook para actualizar un cliente
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();

  return useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["clients", activeGroupId]);
      queryClient.invalidateQueries(["client", variables.id]);
      toast.success("Cliente actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el cliente");
    },
  });
}

/**
 * Hook para eliminar un cliente (soft delete)
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { activeGroupId } = useActiveGroup();

  return useMutation({
    mutationFn: (id) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients", activeGroupId]);
      toast.success("Cliente eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar el cliente");
    },
  });
}
