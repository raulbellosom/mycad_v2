import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listGroupInvitations,
  listGroupPendingInvitations,
  listMyPendingInvitations,
  createGroupInvitation,
  cancelInvitation,
  resendInvitation,
} from "../services/invitations.service";

const INVITATIONS_KEY = "invitations";

/**
 * Hook para listar todas las invitaciones de un grupo
 */
export function useGroupInvitations(groupId) {
  return useQuery({
    queryKey: [INVITATIONS_KEY, "group", groupId],
    queryFn: () => listGroupInvitations(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para listar invitaciones pendientes de un grupo
 */
export function useGroupPendingInvitations(groupId) {
  return useQuery({
    queryKey: [INVITATIONS_KEY, "group", groupId, "pending"],
    queryFn: () => listGroupPendingInvitations(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 60,
  });
}

/**
 * Hook para listar mis invitaciones pendientes
 */
export function useMyPendingInvitations(profileId) {
  return useQuery({
    queryKey: [INVITATIONS_KEY, "my", profileId],
    queryFn: () => listMyPendingInvitations(profileId),
    enabled: !!profileId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para crear una invitación
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupInvitation,
    onSuccess: (_, variables) => {
      // Invalidar invitaciones del grupo
      queryClient.invalidateQueries({
        queryKey: [INVITATIONS_KEY, "group", variables.groupId],
      });
    },
  });
}

/**
 * Hook para cancelar una invitación
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => {
      // Invalidar todas las queries de invitaciones
      queryClient.invalidateQueries({
        queryKey: [INVITATIONS_KEY],
      });
    },
  });
}

/**
 * Hook para reenviar una invitación
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, inviterName, groupName }) =>
      resendInvitation(invitationId, inviterName, groupName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [INVITATIONS_KEY],
      });
    },
  });
}
