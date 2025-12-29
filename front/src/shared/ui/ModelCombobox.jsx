import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Plus, Search, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

/**
 * ModelCombobox - A specialized combobox for vehicle models
 * Features:
 * - Advanced filtering by type, brand, economic group
 * - Composite display with brand, type, year info
 * - Economic group prefix display
 */
export function ModelCombobox({
  value,
  onChange,
  options = [],
  placeholder = "Buscar modelo...",
  emptyText = "No se encontraron modelos",
  onCreateNew,
  createLabel = "Crear modelo",
  disabled = false,
  className = "",
  // Filter options
  types = [],
  brands = [],
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterEconomicGroup, setFilterEconomicGroup] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get unique economic groups from types
  const economicGroups = useMemo(() => {
    const groups = new Set();
    types.forEach((t) => {
      if (t.economicGroup) groups.add(t.economicGroup);
    });
    return Array.from(groups).sort();
  }, [types]);

  // Create lookup maps
  const brandMap = useMemo(
    () => Object.fromEntries(brands.map((b) => [b.$id, b])),
    [brands]
  );
  const typeMap = useMemo(
    () => Object.fromEntries(types.map((t) => [t.$id, t])),
    [types]
  );

  // Filter options based on search and filters
  const filtered = useMemo(() => {
    return options.filter((option) => {
      // Text search - search in multiple fields
      if (search) {
        const searchLower = search.toLowerCase().trim();

        // Get brand and type names from maps if not in option
        const brandName =
          option.brandName || brandMap[option.brandId]?.name || "";
        const typeName = option.typeName || typeMap[option.typeId]?.name || "";
        const economicGroup =
          option.economicGroup || typeMap[option.typeId]?.economicGroup || "";

        const searchMatch =
          option.label?.toLowerCase().includes(searchLower) ||
          option.searchText?.toLowerCase().includes(searchLower) ||
          brandName.toLowerCase().includes(searchLower) ||
          typeName.toLowerCase().includes(searchLower) ||
          economicGroup.toLowerCase().includes(searchLower) ||
          option.year?.toString().includes(searchLower);
        if (!searchMatch) return false;
      }

      // Type filter
      if (filterType && option.typeId !== filterType) return false;

      // Brand filter
      if (filterBrand && option.brandId !== filterBrand) return false;

      // Economic group filter
      if (filterEconomicGroup) {
        const type = typeMap[option.typeId];
        if (!type || type.economicGroup !== filterEconomicGroup) return false;
      }

      return true;
    });
  }, [options, search, filterType, filterBrand, filterEconomicGroup, typeMap]);

  // Find selected option
  const selected = options.find((opt) => opt.value === value);

  // Get type info for selected option
  const selectedType = selected ? typeMap[selected.typeId] : null;
  const selectedBrand = selected ? brandMap[selected.brandId] : null;

  // Active filters count
  const activeFiltersCount = [
    filterType,
    filterBrand,
    filterEconomicGroup,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterType("");
    setFilterBrand("");
    setFilterEconomicGroup("");
  };

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 400; // Approximate max height
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if dropdown should appear above or below
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Calculate left position, ensuring it doesn't overflow viewport
    let left = rect.left;
    const minWidth = Math.max(rect.width, 350);
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
        setShowFilters(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Display text for the selected option
  const displayText = selected
    ? `${selected.label}${selectedBrand ? ` - ${selectedBrand.name}` : ""}${
        selectedType ? ` (${selectedType.name})` : ""
      }`
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={clsx(
          "flex h-auto min-h-10 w-full items-center justify-between rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm ring-offset-(--bg) transition-colors focus:outline-none focus:ring-2 focus:ring-(--brand) focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selected ? "text-(--muted-fg)" : "text-(--fg)"
        )}
      >
        <div className="flex-1 text-left">
          {selected ? (
            <div className="space-y-0.5">
              <div className="font-medium flex items-center gap-2">
                {selectedType?.economicGroup && (
                  <span className="inline-flex items-center rounded bg-(--brand)/10 px-1.5 py-0.5 text-xs font-semibold text-(--brand)">
                    {selectedType.economicGroup}
                  </span>
                )}
                {selected.label}
              </div>
              <div className="text-xs text-(--muted-fg) flex flex-wrap gap-x-2">
                {selectedBrand && <span>{selectedBrand.name}</span>}
                {selectedType && (
                  <span className="opacity-70">• {selectedType.name}</span>
                )}
                {selected.year && (
                  <span className="opacity-70">• {selected.year}</span>
                )}
              </div>
            </div>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Render dropdown in portal */}
      {typeof document !== "undefined" &&
        createPortal(
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
                  <div className="border-b border-(--border) p-2 space-y-2">
                    {/* Search input */}
                    <div className="flex items-center gap-2 px-1">
                      <Search size={16} className="text-(--muted-fg)" />
                      <input
                        type="text"
                        placeholder="Buscar modelo, marca, tipo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-base md:text-sm outline-none placeholder:text-(--muted-fg) text-(--fg)"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                          "rounded-md p-1.5 transition-colors relative",
                          showFilters || activeFiltersCount > 0
                            ? "bg-(--brand)/10 text-(--brand)"
                            : "hover:bg-(--muted) text-(--muted-fg)"
                        )}
                      >
                        <Filter size={16} />
                        {activeFiltersCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-(--brand) text-[10px] text-white">
                            {activeFiltersCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Filters panel */}
                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 space-y-2 border-t border-(--border)">
                            <div className="grid grid-cols-3 gap-2">
                              {/* Type filter */}
                              <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
                              >
                                <option value="">Todos los tipos</option>
                                {types.map((t) => (
                                  <option key={t.$id} value={t.$id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>

                              {/* Brand filter */}
                              <select
                                value={filterBrand}
                                onChange={(e) => setFilterBrand(e.target.value)}
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
                              >
                                <option value="">Todas las marcas</option>
                                {brands.map((b) => (
                                  <option key={b.$id} value={b.$id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>

                              {/* Economic group filter */}
                              <select
                                value={filterEconomicGroup}
                                onChange={(e) =>
                                  setFilterEconomicGroup(e.target.value)
                                }
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
                              >
                                <option value="">Grupo Económico</option>
                                {economicGroups.map((g) => (
                                  <option key={g} value={g}>
                                    {g}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {activeFiltersCount > 0 && (
                              <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-(--brand) hover:underline"
                              >
                                <X size={12} />
                                Limpiar filtros
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Command.List className="max-h-75 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                      <Command.Empty className="py-6 text-center text-sm text-(--muted-fg)">
                        {emptyText}
                      </Command.Empty>
                    ) : (
                      <Command.Group>
                        {filtered.map((option) => {
                          const optType = typeMap[option.typeId];
                          const optBrand = brandMap[option.brandId];

                          return (
                            <Command.Item
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                                onChange(option.value);
                                setOpen(false);
                                setSearch("");
                              }}
                              className="flex cursor-pointer items-start justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-(--muted) data-[selected=true]:bg-(--muted)"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  {optType?.economicGroup && (
                                    <span className="inline-flex items-center rounded bg-(--muted) px-1.5 py-0.5 text-xs font-semibold text-(--muted-fg)">
                                      {optType.economicGroup}
                                    </span>
                                  )}
                                  <span className="font-medium">
                                    {option.label}
                                  </span>
                                </div>
                                <div className="text-xs text-(--muted-fg) flex flex-wrap gap-x-2">
                                  {optBrand && <span>{optBrand.name}</span>}
                                  {optType && (
                                    <span className="opacity-70">
                                      • {optType.name}
                                    </span>
                                  )}
                                  {option.year && (
                                    <span className="opacity-70">
                                      • {option.year}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {option.value === value && (
                                <Check className="h-4 w-4 text-brand-600 mt-1" />
                              )}
                            </Command.Item>
                          );
                        })}
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
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
