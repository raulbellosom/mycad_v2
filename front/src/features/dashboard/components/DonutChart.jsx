import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "../../../shared/ui/Card";

// Paleta de colores profesional
const COLORS = [
  "#f97316", // orange-500
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#6366f1", // indigo-500
];

/**
 * DonutChart - Gráfica de dona para distribución
 */
export function DonutChart({
  data,
  title,
  subtitle,
  loading = false,
  height = 280,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 90,
}) {
  const isEmpty = !data || data.length === 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-stone-900 dark:text-white">
            {item.name}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold">{item.value}</span> vehículos
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5">
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
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="h-32 w-32 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
        </div>
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
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Sin datos disponibles
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={renderLegend} />}
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/**
 * SimplePieChart - Versión simplificada sin donut
 */
export function SimplePieChart({ data, title, loading = false, height = 200 }) {
  const isEmpty = !data || data.length === 0;

  return (
    <Card className="h-full" padding="sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
        {title}
      </h3>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="h-20 w-20 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
        </div>
      ) : isEmpty ? (
        <div
          className="flex items-center justify-center text-stone-400"
          style={{ height }}
        >
          Sin datos
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              dataKey="count"
              nameKey="name"
              label={({ name, count }) => `${name}: ${count}`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [value, "Cantidad"]}
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: "0.5rem",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
