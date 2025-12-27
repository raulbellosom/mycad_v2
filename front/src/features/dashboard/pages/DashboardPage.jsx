import { useMemo } from 'react'
import { format, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import { SectionHeader } from '../../../shared/ui/SectionHeader'
import { Card } from '../../../shared/ui/Card'
import { useActiveGroup } from '../../groups/hooks/useActiveGroup'

const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

export function DashboardPage() {
  const { activeGroup } = useActiveGroup()

  const chartData = useMemo(
    () => [
      { name: 'Lun', value: 12 },
      { name: 'Mar', value: 18 },
      { name: 'Mié', value: 10 },
      { name: 'Jue', value: 22 },
      { name: 'Vie', value: 16 },
      { name: 'Sáb', value: 28 },
      { name: 'Dom', value: 24 },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" subtitle={activeGroup ? `Resumen del grupo: ${activeGroup.name}` : 'Selecciona un grupo para ver información.'} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Vehículos</div>
          <div className="mt-2 text-2xl font-black">—</div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pendiente conectar</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Mantenimientos</div>
          <div className="mt-2 text-2xl font-black">—</div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pendiente conectar</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Reportes</div>
          <div className="mt-2 text-2xl font-black">—</div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pendiente conectar</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Auditoría</div>
          <div className="mt-2 text-2xl font-black">—</div>
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Pendiente conectar</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold">Actividad (demo)</div>
            <div className="text-xs font-semibold text-[color:var(--brand)]">Recharts</div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold">Calendario (demo)</div>
            <div className="text-xs font-semibold text-[color:var(--brand)]">react-big-calendar</div>
          </div>
          <div className="h-[320px] overflow-hidden rounded-xl border border-[color:var(--border)]">
            <Calendar localizer={localizer} events={[]} startAccessor="start" endAccessor="end" style={{ height: '100%' }} views={['month', 'week', 'day']} />
          </div>
        </Card>
      </div>
    </div>
  )
}
