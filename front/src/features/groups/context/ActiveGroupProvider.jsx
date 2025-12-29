import { createContext, useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyGroups } from "../services/groups.service";
import { useAuth } from "../../auth/hooks/useAuth";

export const ActiveGroupContext = createContext(null);

export function ActiveGroupProvider({ children }) {
  const { profile } = useAuth();
  const [activeGroupId, setActiveGroupId] = useState(
    () => localStorage.getItem("mycad_active_group_id") || ""
  );

  const { data: groups, isLoading } = useQuery({
    queryKey: ["my-groups", profile?.$id],
    queryFn: () => listMyGroups(profile?.$id),
    enabled: !!profile?.$id, // Solo ejecutar si hay un perfil autenticado
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1,
  });

  // Update local storage when selection changes
  const handleSetActiveGroupId = (id) => {
    if (id) {
      localStorage.setItem("mycad_active_group_id", id);
    } else {
      localStorage.removeItem("mycad_active_group_id");
    }
    setActiveGroupId(id);
  };

  // Derive active group object - ⚠️ CAMBIO v2: Ahora usamos $id en lugar de teamId
  const activeGroup = useMemo(() => {
    if (!groups || !activeGroupId) return null;
    return groups.find((g) => g.$id === activeGroupId) || null;
  }, [groups, activeGroupId]);

  // Auto-select first group if none selected and groups exist
  useEffect(() => {
    if (!isLoading && groups?.length > 0 && !activeGroupId) {
      // Auto-select first group when user logs in and has groups
      handleSetActiveGroupId(groups[0].$id);
    }
  }, [groups, activeGroupId, isLoading]);

  const value = useMemo(
    () => ({
      groups: groups || [],
      isLoadingGroups: isLoading,
      activeGroupId,
      setActiveGroupId: handleSetActiveGroupId,
      activeGroup,
    }),
    [groups, isLoading, activeGroupId, activeGroup]
  );

  return (
    <ActiveGroupContext.Provider value={value}>
      {children}
    </ActiveGroupContext.Provider>
  );
}
