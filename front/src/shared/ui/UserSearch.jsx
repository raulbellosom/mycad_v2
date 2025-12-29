import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, X, Loader2, UserPlus } from "lucide-react";
import { Query } from "appwrite";

import { databases } from "../appwrite/client";
import { env } from "../appwrite/env";
import { getAvatarUrl } from "../utils/storage";
import { Input } from "./Input";

/**
 * Componente de búsqueda de usuarios con autocompletado
 * Busca en la colección users_profile
 */
export function UserSearch({
  onSelect,
  excludeIds = [],
  placeholder = "Buscar usuario por nombre o email...",
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Búsqueda de usuarios
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["search-users", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const queries = [Query.equal("enabled", true), Query.limit(10)];

      // Buscar por múltiples campos
      const results = await Promise.all([
        databases.listDocuments(env.databaseId, env.collectionUsersProfileId, [
          ...queries,
          Query.contains("email", searchTerm.toLowerCase()),
        ]),
        databases.listDocuments(env.databaseId, env.collectionUsersProfileId, [
          ...queries,
          Query.contains("firstName", searchTerm),
        ]),
        databases.listDocuments(env.databaseId, env.collectionUsersProfileId, [
          ...queries,
          Query.contains("lastName", searchTerm),
        ]),
      ]);

      // Combinar y deduplicar
      const combined = new Map();
      results.forEach((res) => {
        res.documents.forEach((doc) => {
          if (!excludeIds.includes(doc.$id)) {
            combined.set(doc.$id, doc);
          }
        });
      });

      return Array.from(combined.values()).slice(0, 8);
    },
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 30,
  });

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm("");
    setIsOpen(false);
    onSelect(user);
  };

  const handleClear = () => {
    setSelectedUser(null);
    setSearchTerm("");
    onSelect(null);
  };

  if (selectedUser) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border border-(--brand) bg-(--brand)/5 p-3 ${className}`}
      >
        <div className="h-10 w-10 rounded-full bg-(--muted) flex items-center justify-center flex-shrink-0">
          {selectedUser.avatarFileId ? (
            <img
              src={getAvatarUrl(selectedUser.avatarFileId, 80)}
              alt={selectedUser.firstName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <User size={20} className="text-(--muted-fg)" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {selectedUser.firstName} {selectedUser.lastName}
          </p>
          <p className="text-xs text-(--muted-fg) truncate">
            {selectedUser.email}
          </p>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 rounded-lg hover:bg-(--muted) transition-colors"
        >
          <X size={16} className="text-(--muted-fg)" />
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative" ref={inputRef}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted-fg)"
          size={18}
        />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted-fg) animate-spin"
            size={18}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && searchTerm.length >= 2 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-(--border) bg-(--card) shadow-lg overflow-hidden"
          >
            {users.length === 0 ? (
              <div className="p-4 text-center text-sm text-(--muted-fg)">
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Buscando...
                  </span>
                ) : (
                  "No se encontraron usuarios"
                )}
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {users.map((user, idx) => (
                  <motion.button
                    key={user.$id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleSelect(user)}
                    className="flex w-full items-center gap-3 p-3 hover:bg-(--muted) transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-(--muted) flex items-center justify-center flex-shrink-0">
                      {user.avatarFileId ? (
                        <img
                          src={getAvatarUrl(user.avatarFileId, 80)}
                          alt={user.firstName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <User size={20} className="text-(--muted-fg)" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-(--muted-fg) truncate">
                        {user.email}
                      </p>
                    </div>
                    <UserPlus
                      size={16}
                      className="text-(--brand) flex-shrink-0"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
