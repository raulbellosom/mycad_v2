import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card } from "../../../shared/ui/Card";

/**
 * TrendChart - Gráfica de área para mostrar tendencias
 */
export function TrendChart({
  data,
  title,
  subtitle,
  loading = false,
  height = 280,
  areas = [
    { dataKey: "value", color: "#f97316", name: "Valor", fillOpacity: 0.3 },
  ],
  showLegend = false,
}) {
  const isEmpty = !data || data.length === 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-stone-900 dark:text-white mb-1">
            {label}
          </p>
          {payload.map((p, index) => (
            <p key={index} className="text-sm" style={{ color: p.color }}>
              {p.name}:{" "}
              <span className="font-semibold">
                {typeof p.value === "number"
                  ? p.value.toLocaleString("es-MX")
                  : p.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-stone-600 dark:text-stone-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {subtitle}
          </p>
        )}
      </div>

      {loading ? (
        <div
          className="animate-pulse bg-linear-to-t from-stone-200 dark:from-stone-700 to-transparent rounded-lg"
          style={{ height }}
        />
      ) : isEmpty ? (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ height }}
        >
          <div className="h-16 w-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
            <svg
              className="h-8 w-8 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Sin datos disponibles
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              {areas.map((area, index) => (
                <linearGradient
                  key={index}
                  id={`gradient-${area.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={area.color}
                    stopOpacity={area.fillOpacity || 0.3}
                  />
                  <stop offset="95%" stopColor={area.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-fg)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-fg)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}
            {areas.map((area, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={area.dataKey}
                stroke={area.color}
                strokeWidth={2}
                fill={`url(#gradient-${area.dataKey})`}
                name={area.name}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/**
 * ComboTrendChart - Gráfica con múltiples series
 */
export function ComboTrendChart({
  data,
  title,
  subtitle,
  loading = false,
  height = 280,
}) {
  const isEmpty = !data || data.length === 0;

  return (
    <TrendChart
      data={data}
      title={title}
      subtitle={subtitle}
      loading={loading}
      height={height}
      showLegend={true}
      areas={[
        {
          dataKey: "servicios",
          color: "#22c55e",
          name: "Servicios",
          fillOpacity: 0.2,
        },
        {
          dataKey: "reparaciones",
          color: "#f59e0b",
          name: "Reparaciones",
          fillOpacity: 0.2,
        },
      ]}
    />
  );
}
