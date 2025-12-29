import { useState, useEffect, forwardRef } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * CurrencyInput - Input para valores monetarios con formato automático
 *
 * Mientras escribes, el valor se formatea automáticamente:
 * Escribes: 5 -> $0.05
 * Escribes: 52 -> $0.52
 * Escribes: 525 -> $5.25
 * Escribes: 5250 -> $52.50
 * etc.
 */
export const CurrencyInput = forwardRef(
  (
    {
      value,
      onChange,
      label,
      error,
      currency = "MXN",
      locale = "es-MX",
      className = "",
      disabled = false,
      placeholder,
      ...props
    },
    ref
  ) => {
    // Internal state for display value
    const [displayValue, setDisplayValue] = useState("");

    // Currency symbols map
    const currencySymbols = {
      MXN: "$",
      USD: "$",
      EUR: "€",
    };

    const symbol = currencySymbols[currency] || "$";

    // Convert cents to formatted currency string
    const formatCurrency = (cents) => {
      if (cents === 0 || cents === null || cents === undefined) {
        return `${symbol}0.00`;
      }
      const amount = cents / 100;
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    // Parse display value back to number (in cents)
    const parseToCents = (str) => {
      // Remove everything except digits
      const digits = str.replace(/\D/g, "");
      return parseInt(digits, 10) || 0;
    };

    // Initialize display from value prop (value is in dollars/pesos, not cents)
    useEffect(() => {
      if (value !== undefined && value !== null && value !== "") {
        const cents = Math.round(parseFloat(value) * 100);
        setDisplayValue(formatCurrency(cents));
      } else {
        setDisplayValue("");
      }
    }, [value, currency]);

    const handleChange = (e) => {
      const input = e.target.value;

      // Get only digits from input
      const digits = input.replace(/\D/g, "");

      // Convert to cents
      const cents = parseInt(digits, 10) || 0;

      // Format and display
      if (cents === 0 && digits === "") {
        setDisplayValue("");
        onChange?.("");
      } else {
        setDisplayValue(formatCurrency(cents));
        // Return value in dollars/pesos (not cents)
        onChange?.(cents / 100);
      }
    };

    const handleFocus = (e) => {
      // Select all on focus for easy replacement
      e.target.select();
    };

    const handleKeyDown = (e) => {
      // Allow: backspace, delete, tab, escape, enter, decimal point
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];

      if (allowedKeys.includes(e.key)) {
        return;
      }

      // Allow Ctrl/Cmd + A, C, V, X
      if (
        (e.ctrlKey || e.metaKey) &&
        ["a", "c", "v", "x"].includes(e.key.toLowerCase())
      ) {
        return;
      }

      // Only allow digits
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <div className="w-full min-w-0 max-w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-(--fg)">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || `${symbol}0.00`}
          className={twMerge(
            clsx(
              "flex h-10 w-full min-w-0 max-w-full rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-base md:text-sm ring-offset-(--bg) placeholder:text-(--muted-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-(--fg) transition-colors",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
