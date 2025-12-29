import { useState, useRef, useEffect } from "react";
import {
  format,
  parse,
  isValid,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  setMonth,
  setYear,
  getMonth,
  getYear,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function generateYears(range = 50) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear + 5; i >= currentYear - range; i--) {
    years.push(i);
  }
  return years;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className = "",
  minDate,
  maxDate,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parsed = parse(value, "yyyy-MM-dd", new Date());
      return isValid(parsed) ? parsed : new Date();
    }
    return new Date();
  });
  const containerRef = useRef(null);

  const parsedValue = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const isValidValue = parsedValue && isValid(parsedValue);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Update viewDate when value changes
  useEffect(() => {
    if (isValidValue) {
      setViewDate(parsedValue);
    }
  }, [value]);

  const handleDateSelect = (date) => {
    const formatted = format(date, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => addMonths(prev, 1));
  };

  const handleMonthChange = (e) => {
    setViewDate((prev) => setMonth(prev, parseInt(e.target.value)));
  };

  const handleYearChange = (e) => {
    setViewDate((prev) => setYear(prev, parseInt(e.target.value)));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    handleDateSelect(today);
  };

  // Generate calendar days
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  // Check if date is in range
  const isDateDisabled = (date) => {
    if (minDate && date < parse(minDate, "yyyy-MM-dd", new Date())) return true;
    if (maxDate && date > parse(maxDate, "yyyy-MM-dd", new Date())) return true;
    return false;
  };

  const isSelected = (date) => {
    if (!isValidValue) return false;
    return format(date, "yyyy-MM-dd") === value;
  };

  const isToday = (date) => {
    return format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  };

  const displayValue = isValidValue
    ? format(parsedValue, "d 'de' MMMM, yyyy", { locale: es })
    : "";

  return (
    <div className={`w-full min-w-0 max-w-full ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-(--fg)">
          {label}
        </label>
      )}
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            "flex h-10 w-full min-w-0 max-w-full items-center justify-between rounded-lg border bg-(--card) px-3 py-2 text-base md:text-sm ring-offset-(--bg) transition-colors focus:outline-none focus:ring-2 focus:ring-(--brand) focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-500" : "border-(--border)",
            !displayValue ? "text-(--muted-fg)" : "text-(--fg)"
          )}
        >
          <span className="truncate flex items-center gap-2">
            <CalendarIcon size={16} className="text-(--muted-fg) shrink-0" />
            {displayValue || placeholder}
          </span>
          {displayValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
              className="ml-2 rounded p-0.5 hover:bg-(--muted) text-(--muted-fg) hover:text-(--fg) cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-2 left-0 right-0 w-full max-w-full rounded-lg border border-(--border) bg-(--card) p-3 shadow-lg box-border"
            >
              {/* Header with Month/Year selectors */}
              <div className="flex items-center justify-between mb-3 gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="rounded-md p-1.5 hover:bg-(--muted) transition-colors shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 justify-center">
                  <select
                    value={getMonth(viewDate)}
                    onChange={handleMonthChange}
                    className="rounded-md border border-(--border) bg-(--card) px-1 sm:px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-(--brand) min-w-0 max-w-[90px] sm:max-w-none"
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select
                    value={getYear(viewDate)}
                    onChange={handleYearChange}
                    className="rounded-md border border-(--border) bg-(--card) px-1 sm:px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-(--brand) min-w-0 w-[70px]"
                  >
                    {generateYears().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="rounded-md p-1.5 hover:bg-(--muted) transition-colors shrink-0"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-(--muted-fg) py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Empty cells for start offset */}
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {/* Day cells */}
                {days.map((day) => {
                  const dayDisabled = isDateDisabled(day);
                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => !dayDisabled && handleDateSelect(day)}
                      disabled={dayDisabled}
                      className={clsx(
                        "h-8 w-full rounded-md text-sm transition-colors",
                        dayDisabled && "opacity-30 cursor-not-allowed",
                        selected && "bg-(--brand) text-white font-medium",
                        !selected &&
                          today &&
                          "bg-(--brand)/10 text-(--brand) font-medium",
                        !selected &&
                          !today &&
                          !dayDisabled &&
                          "hover:bg-(--muted)"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-(--border) flex justify-between">
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs text-(--brand) hover:underline"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-(--muted-fg) hover:text-(--fg)"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
