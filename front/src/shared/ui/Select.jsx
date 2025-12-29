import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function Select({
  className,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled,
  error,
  label,
  ...props
}) {
  return (
    <div className="w-full min-w-0 max-w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-(--fg)">
          {label}
        </label>
      )}
      <select
        className={twMerge(
          clsx(
            "flex h-10 w-full min-w-0 max-w-full rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-base md:text-sm text-(--fg) ring-offset-(--bg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
