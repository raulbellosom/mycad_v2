import { useContext } from 'react'
import { ActiveGroupContext } from '../context/ActiveGroupProvider'

export function useActiveGroup() {
  const ctx = useContext(ActiveGroupContext)
  if (!ctx) throw new Error('useActiveGroup must be used within ActiveGroupProvider')
  return ctx
}
