import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "../../../shared/ui/Card";

/**
 * HorizontalBarChart - Gráfica de barras horizontales
 */
export function HorizontalBarChart({
  data,
  title,
  subtitle,
  loading = false,
  height = 280,
  dataKey = "count",
  nameKey = "name",
  color = "#f97316",
}) {
  const isEmpty = !data || data.length === 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 shadow-lg">
          <p className="text-sm font-medium text-stone-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            <span className="font-semibold">{payload[0].value}</span> vehículos
          </p>
        </div>
      );
    }
    return null;
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
        <div className="space-y-3" style={{ height }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-16 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <div
                className="h-6 animate-pulse rounded bg-stone-200 dark:bg-stone-700"
                style={{ width: `${80 - i * 15}%` }}
              />
            </div>
          ))}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Sin datos disponibles
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-fg)" }}
            />
            <YAxis
              type="category"
              dataKey={nameKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-fg)" }}
              width={80}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/**
 * VerticalBarChart - Gráfica de barras verticales
 */
export function VerticalBarChart({
  data,
  title,
  subtitle,
  loading = false,
  height = 280,
  bars = [{ dataKey: "value", color: "#f97316", name: "Valor" }],
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
              {p.name}: <span className="font-semibold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
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
        <div className="flex items-end justify-around gap-2" style={{ height }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-10 animate-pulse rounded-t bg-stone-200 dark:bg-stone-700"
              style={{ height: `${40 + Math.random() * 50}%` }}
            />
          ))}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Sin datos disponibles
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
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
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />
            {bars.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.color}
                name={bar.name}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
