import { createContext, useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyGroups } from "../services/groups.service";

export const ActiveGroupContext = createContext(null);

export function ActiveGroupProvider({ children }) {
  const [activeGroupId, setActiveGroupId] = useState(
    () => localStorage.getItem("mycad_active_group_id") || ""
  );

  const { data: groups, isLoading } = useQuery({
    queryKey: ["my-groups"],
    queryFn: listMyGroups,
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

  // Derive active group object
  const activeGroup = useMemo(() => {
    if (!groups || !activeGroupId) return null;
    return groups.find((g) => g.teamId === activeGroupId) || null;
  }, [groups, activeGroupId]);

  // Auto-select first group if none selected and groups exist
  useEffect(() => {
    if (!isLoading && groups?.length > 0 && !activeGroupId) {
      // Optional: Auto-select. For now we leave it empty to force user selection or explicitly select the first.
      // handleSetActiveGroupId(groups[0].teamId)
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
