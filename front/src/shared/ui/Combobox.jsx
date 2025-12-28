import { useState, useEffect, useRef } from "react";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

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
  const buttonRef = useRef(null);

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

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full justify-between"
      >
        <span className="truncate">
          {selected ? selected[displayKey] : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-lg border border-(--border) bg-(--card) shadow-lg"
          >
            <Command className="w-full">
              <div className="flex items-center gap-2 border-b border-(--border) px-3 py-2">
                <Search size={16} className="text-(--muted-fg)" />
                <Command.Input
                  placeholder={placeholder}
                  value={search}
                  onValueChange={setSearch}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-(--muted-fg)"
                />
              </div>

              <Command.List className="max-h-[300px] overflow-y-auto p-1">
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
                      {search && (
                        <span className="font-medium">"{search}"</span>
                      )}
                    </Command.Item>
                  </>
                )}
              </Command.List>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
