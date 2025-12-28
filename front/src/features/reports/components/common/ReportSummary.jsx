import { useMemo } from "react";
import { Card } from "../../../../shared/ui/Card";
import { DollarSign, Wrench, Package, Calculator } from "lucide-react";

/**
 * Componente que muestra el resumen de costos de un reporte
 * Diseño elegante con desglose visual
 */
export function ReportSummary({
  laborCost = 0,
  partsCost = 0,
  otherCosts = 0,
  className = "",
}) {
  const total = useMemo(() => {
    return (
      (parseFloat(laborCost) || 0) +
      (parseFloat(partsCost) || 0) +
      (parseFloat(otherCosts) || 0)
    );
  }, [laborCost, partsCost, otherCosts]);

  const formatCurrency = (value) => {
    return (parseFloat(value) || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });
  };

  return (
    <Card className={className} padding="none">
      <div className="p-4 border-b border-(--border) bg-(--muted)/30">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-(--brand)" />
          <h3 className="font-semibold text-(--fg)">Resumen de Costos</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Mano de obra */}
        <CostRow
          icon={Wrench}
          label="Mano de Obra"
          value={formatCurrency(laborCost)}
          color="text-blue-600 dark:text-blue-400"
        />

        {/* Refacciones */}
        <CostRow
          icon={Package}
          label="Refacciones"
          value={formatCurrency(partsCost)}
          color="text-green-600 dark:text-green-400"
        />

        {/* Otros costos (si aplica) */}
        {otherCosts > 0 && (
          <CostRow
            icon={DollarSign}
            label="Otros"
            value={formatCurrency(otherCosts)}
            color="text-purple-600 dark:text-purple-400"
          />
        )}

        {/* Separador */}
        <div className="border-t border-(--border) pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-(--muted-fg)">TOTAL</span>
            <span className="text-xl font-bold text-(--brand)">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div className="px-4 pb-4">
        <div className="h-2 rounded-full bg-(--muted) overflow-hidden flex">
          {total > 0 && (
            <>
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((laborCost || 0) / total) * 100}%` }}
              />
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${((partsCost || 0) / total) * 100}%` }}
              />
              {otherCosts > 0 && (
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${((otherCosts || 0) / total) * 100}%` }}
                />
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Legend color="bg-blue-500" label="M. Obra" />
          <Legend color="bg-green-500" label="Refacciones" />
          {otherCosts > 0 && <Legend color="bg-purple-500" label="Otros" />}
        </div>
      </div>
    </Card>
  );
}

function CostRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-(--muted) ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-(--muted-fg)">{label}</span>
      </div>
      <span className="text-sm font-medium text-(--fg)">{value}</span>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-(--muted-fg)">{label}</span>
    </div>
  );
}

/**
 * Versión compacta del resumen para cards de lista
 */
export function ReportSummaryCompact({ laborCost = 0, partsCost = 0 }) {
  const total = (parseFloat(laborCost) || 0) + (parseFloat(partsCost) || 0);

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <DollarSign className="h-4 w-4 text-(--brand)" />
      <span className="font-semibold text-(--fg)">
        {total.toLocaleString("es-MX", {
          style: "currency",
          currency: "MXN",
        })}
      </span>
    </div>
  );
}
