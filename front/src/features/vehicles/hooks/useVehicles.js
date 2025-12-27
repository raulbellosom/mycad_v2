import { useQuery } from '@tanstack/react-query'
import { listVehicles } from '../services/vehicles.service'

export function useVehicles(groupId) {
  return useQuery({
    queryKey: ['vehicles', { groupId }],
    queryFn: () => listVehicles(groupId),
    enabled: !!groupId,
  })
}
