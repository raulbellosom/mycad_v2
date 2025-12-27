import { useQuery } from '@tanstack/react-query'
import { getVehicleById } from '../services/vehicles.service'

export function useVehicle(id) {
  return useQuery({
    queryKey: ['vehicle', { id }],
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  })
}
