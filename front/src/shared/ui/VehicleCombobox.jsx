import { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search, Filter, X, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { env } from "../appwrite/env";
import { getFilePreviewUrl } from "../utils/storage";

/**
 * VehicleCombobox - A specialized combobox for vehicle selection
 * Features:
 * - Advanced filtering by type, brand, model, economic group
 * - Search by plates, economic number, serial number, color, year
 * - Compact display with image preview
 * - Economic group prefix display
 */
export function VehicleCombobox({
  value,
  onChange,
  vehicles = [],
  placeholder = "Buscar vehículo...",
  emptyText = "No se encontraron vehículos",
  disabled = false,
  className = "",
  // Catalog data for filters
  types = [],
  brands = [],
  models = [],
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterModel, setFilterModel] = useState("");
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
  const modelMap = useMemo(
    () => Object.fromEntries(models.map((m) => [m.$id, m])),
    [models]
  );

  // Build options from vehicles
  const options = useMemo(() => {
    return vehicles.map((v) => {
      const brand = brandMap[v.brandId];
      const type = typeMap[v.typeId];
      const model = modelMap[v.modelId];
      const economicGroup = type?.economicGroup || "";

      // Build vehicle display name
      const vehicleName = [brand?.name, model?.name, model?.year]
        .filter(Boolean)
        .join(" ");

      // Build composite economic number
      const compositeEconomicNumber = economicGroup
        ? `${economicGroup}-${v.economicNumber || ""}`
        : v.economicNumber || "";

      // Build search text for fuzzy matching
      const searchText = [
        v.plate,
        v.economicNumber,
        compositeEconomicNumber,
        v.serialNumber,
        v.color,
        brand?.name,
        type?.name,
        model?.name,
        model?.year?.toString(),
        economicGroup,
        vehicleName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return {
        value: v.$id,
        vehicle: v,
        vehicleName,
        brand,
        type,
        model,
        economicGroup,
        compositeEconomicNumber,
        searchText,
      };
    });
  }, [vehicles, brandMap, typeMap, modelMap]);

  // Filter options based on search and filters
  const filtered = useMemo(() => {
    return options.filter((option) => {
      // Text search - search in multiple fields
      if (search) {
        const searchLower = search.toLowerCase().trim();
        if (!option.searchText.includes(searchLower)) return false;
      }

      // Type filter
      if (filterType && option.vehicle.typeId !== filterType) return false;

      // Brand filter
      if (filterBrand && option.vehicle.brandId !== filterBrand) return false;

      // Model filter
      if (filterModel && option.vehicle.modelId !== filterModel) return false;

      // Economic group filter
      if (filterEconomicGroup && option.economicGroup !== filterEconomicGroup)
        return false;

      return true;
    });
  }, [
    options,
    search,
    filterType,
    filterBrand,
    filterModel,
    filterEconomicGroup,
  ]);

  // Find selected option
  const selected = options.find((opt) => opt.value === value);

  // Active filters count
  const activeFiltersCount = [
    filterType,
    filterBrand,
    filterModel,
    filterEconomicGroup,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterType("");
    setFilterBrand("");
    setFilterModel("");
    setFilterEconomicGroup("");
  };

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 450; // Approximate max height for vehicle combobox
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Determine if dropdown should appear above or below
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    // Calculate left position, ensuring it doesn't overflow viewport
    let left = rect.left;
    const minWidth = Math.max(rect.width, 400);
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

  // Get vehicle image
  const getVehicleImage = (vehicle, size = 100) => {
    if (vehicle?.files && vehicle.files.length > 0) {
      const imageFile = vehicle.files.find((f) => f.isImage);
      if (imageFile) {
        return getFilePreviewUrl(env.bucketVehiclesId, imageFile.fileId, {
          width: size,
          height: size,
        });
      }
    }
    return null;
  };

  return (
    <div className={`relative ${className}`} ref={buttonRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={clsx(
          "flex h-auto min-h-10 w-full items-center justify-between rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-base md:text-sm ring-offset-(--bg) transition-colors focus:outline-none focus:ring-2 focus:ring-(--brand) focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !selected ? "text-(--muted-fg)" : "text-(--fg)"
        )}
      >
        <div className="flex-1 text-left">
          {selected ? (
            <div className="flex items-center gap-3">
              {/* Vehicle Image */}
              <div className="h-10 w-10 rounded-lg bg-(--muted) flex items-center justify-center overflow-hidden shrink-0">
                {getVehicleImage(selected.vehicle) ? (
                  <img
                    src={getVehicleImage(selected.vehicle, 80)}
                    alt={selected.vehicleName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Car className="h-5 w-5 text-(--muted-fg)" />
                )}
              </div>

              {/* Vehicle Info */}
              <div className="min-w-0 flex-1">
                <div className="font-medium flex items-center gap-2 flex-wrap">
                  {selected.economicGroup && (
                    <span className="inline-flex items-center rounded bg-(--brand)/10 px-1.5 py-0.5 text-xs font-semibold text-(--brand)">
                      {selected.compositeEconomicNumber}
                    </span>
                  )}
                  <span className="truncate">{selected.vehicleName}</span>
                </div>
                <div className="text-xs text-(--muted-fg) flex flex-wrap gap-x-2">
                  {selected.vehicle.plate && (
                    <span>{selected.vehicle.plate}</span>
                  )}
                  {selected.type && (
                    <span className="opacity-70">• {selected.type.name}</span>
                  )}
                </div>
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
                        placeholder="Buscar por placa, N° económico, marca, modelo..."
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
                            <div className="grid grid-cols-2 gap-2">
                              {/* Type filter */}
                              <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-base md:text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
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
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-base md:text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
                              >
                                <option value="">Todas las marcas</option>
                                {brands.map((b) => (
                                  <option key={b.$id} value={b.$id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>

                              {/* Model filter */}
                              <select
                                value={filterModel}
                                onChange={(e) => setFilterModel(e.target.value)}
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-base md:text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
                              >
                                <option value="">Todos los modelos</option>
                                {models.map((m) => (
                                  <option key={m.$id} value={m.$id}>
                                    {m.name} {m.year ? `(${m.year})` : ""}
                                  </option>
                                ))}
                              </select>

                              {/* Economic group filter */}
                              <select
                                value={filterEconomicGroup}
                                onChange={(e) =>
                                  setFilterEconomicGroup(e.target.value)
                                }
                                className="rounded-md border border-(--border) bg-(--card) px-2 py-1.5 text-base md:text-xs focus:outline-none focus:ring-1 focus:ring-(--brand)"
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

                  <Command.List className="max-h-88 overflow-y-auto p-1">
                    {filtered.length === 0 ? (
                      <Command.Empty className="py-6 text-center text-sm text-(--muted-fg)">
                        {emptyText}
                      </Command.Empty>
                    ) : (
                      <Command.Group>
                        {filtered.map((option) => {
                          const imageUrl = getVehicleImage(option.vehicle, 80);

                          return (
                            <Command.Item
                              key={option.value}
                              value={option.value}
                              onSelect={() => {
                                onChange(option.value);
                                setOpen(false);
                                setSearch("");
                              }}
                              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-(--muted) data-[selected=true]:bg-(--muted)"
                            >
                              {/* Vehicle Image */}
                              <div className="h-12 w-12 rounded-lg bg-(--muted) flex items-center justify-center overflow-hidden shrink-0">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={option.vehicleName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Car className="h-6 w-6 text-(--muted-fg)" />
                                )}
                              </div>

                              {/* Vehicle Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {option.economicGroup && (
                                    <span className="inline-flex items-center rounded bg-(--brand)/10 px-1.5 py-0.5 text-xs font-semibold text-(--brand)">
                                      {option.compositeEconomicNumber}
                                    </span>
                                  )}
                                  <span className="font-medium truncate">
                                    {option.vehicleName || "Sin nombre"}
                                  </span>
                                </div>
                                <div className="text-xs text-(--muted-fg) flex flex-wrap gap-x-2">
                                  {option.vehicle.plate && (
                                    <span className="font-medium">
                                      {option.vehicle.plate}
                                    </span>
                                  )}
                                  {!option.economicGroup &&
                                    option.vehicle.economicNumber && (
                                      <span>
                                        • {option.vehicle.economicNumber}
                                      </span>
                                    )}
                                  {option.type && (
                                    <span className="opacity-70">
                                      • {option.type.name}
                                    </span>
                                  )}
                                </div>
                                {/* Additional info line */}
                                <div className="text-xs text-(--muted-fg) opacity-70 truncate">
                                  {[
                                    option.vehicle.color,
                                    option.vehicle.mileage
                                      ? `${option.vehicle.mileage.toLocaleString()} ${
                                          option.vehicle.mileageUnit || "km"
                                        }`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </div>
                              </div>

                              {/* Check mark */}
                              {option.value === value && (
                                <Check className="h-4 w-4 text-(--brand) shrink-0" />
                              )}
                            </Command.Item>
                          );
                        })}
                      </Command.Group>
                    )}
                  </Command.List>

                  {/* Results count */}
                  <div className="border-t border-(--border) px-3 py-2 text-xs text-(--muted-fg)">
                    {filtered.length} de {vehicles.length} vehículos
                  </div>
                </Command>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
