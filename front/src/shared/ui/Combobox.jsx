import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";
import clsx from "clsx";

export function Combobox({
  value,
  onChange,
  options = [],
  placeholder = "Buscar...",
  emptyText = "No se encontraron resultados",
  onCreateNew,
  createLabel = "Crear nuevo",
  displayKey = "label",
  valueKey = "value",
  searchKeys = null,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-generate searchKeys if not provided
  const effectiveSearchKeys = searchKeys || [displayKey];

  // Filter options based on search
  const filtered = options.filter((option) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return effectiveSearchKeys.some((key) => {
      const val = option[key];
      return val && val.toString().toLowerCase().includes(searchLower);
    });
  });

  // Find selected option
  const selected = options.find((opt) => opt[valueKey] === value);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 350; // Approximate max height
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if dropdown should appear above or below
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Calculate left position, ensuring it doesn't overflow viewport
    let left = rect.left;
    const minWidth = Math.max(rect.width, 280);
    if (left + minWidth > viewportWidth - 16) {
      left = viewportWidth - minWidth - 16;
    }
    if (left < 16) left = 16;

    setDropdownStyle({
      position: "fixed",
      top: showAbove ? "auto" : rect.bottom + 4,
      bottom: showAbove ? viewportHeight - rect.top + 4 : "auto",
      left,
      width: rect.width,
      minWidth,
      maxWidth: viewportWidth - 32,
    });
  };

  // Update position when open changes or on scroll/resize
  useLayoutEffect(() => {
    if (open) {
      updateDropdownPosition();

      const handleUpdate = () => updateDropdownPosition();
      window.addEventListener("scroll", handleUpdate, true);
      window.addEventListener("resize", handleUpdate);

      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
      };
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Dropdown content
  const dropdownContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={dropdownStyle}
          className="z-9999 rounded-lg border border-(--border) bg-(--card) shadow-lg"
        >
          <Command className="w-full" shouldFilter={false}>
            <div className="flex items-center gap-2 border-b border-(--border) px-3 py-2">
              <Search size={16} className="text-(--muted-fg)" />
              <Command.Input
                placeholder={placeholder}
                value={search}
                onValueChange={setSearch}
                className="flex-1 bg-transparent text-base md:text-sm outline-none placeholder:text-(--muted-fg)"
              />
            </div>

            <Command.List className="max-h-75 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <Command.Empty className="py-6 text-center text-sm text-(--muted-fg)">
                  {emptyText}
                </Command.Empty>
              ) : (
                <Command.Group>
                  {filtered.map((option) => (
                    <Command.Item
                      key={option[valueKey]}
                      value={option[valueKey]}
                      onSelect={() => {
                        onChange(option[valueKey]);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-(--muted) data-[selected=true]:bg-(--muted)"
                    >
                      <span className="truncate">{option[displayKey]}</span>
                      {option[valueKey] === value && (
                        <Check className="h-4 w-4 text-brand-600" />
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {onCreateNew && (
                <>
                  <Command.Separator className="my-1 border-t border-(--border)" />
                  <Command.Item
                    onSelect={() => {
                      onCreateNew(search);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-600 transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{createLabel}</span>
                    {search && <span className="font-medium">"{search}"</span>}
                  </Command.Item>
                </>
              )}
            </Command.List>
          </Command>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={clsx(
          "flex h-10 w-full items-center justify-between rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-base md:text-sm ring-offset-(--bg) transition-colors focus:outline-none focus:ring-2 focus:ring-(--brand) focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selected ? "text-(--muted-fg)" : "text-(--fg)"
        )}
      >
        <span className="truncate">
          {selected ? selected[displayKey] : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Render dropdown in portal */}
      {typeof document !== "undefined" &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
}
