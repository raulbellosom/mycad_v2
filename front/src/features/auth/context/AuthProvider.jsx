import { createContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { account } from "../../../shared/appwrite/client";
import { getMyProfile } from "../services/profile.service";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const u = await account.get();
      setUser(u);

      try {
        const p = await getMyProfile(u.$id);
        setProfile(p);
      } catch (e) {
        console.warn("Profile sync error:", e);
        setProfile(null);
        // We do NOT clear user here. Allow session to persist even if profile is missing/failed.
      }
    } catch {
      // If account.get() fails, then we are truly not logged in
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      try {
        await account.createEmailPasswordSession(email, password);
      } catch (e) {
        if (e.message?.includes("prohibited when a session is active")) {
          await account.deleteSession("current");
          await account.createEmailPasswordSession(email, password);
        } else {
          throw e;
        }
      }
      await refresh();
      toast.success("Sesión iniciada");
    } catch (e) {
      toast.error(e?.message || "No se pudo iniciar sesión");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);
      setProfile(null);
      toast.success("Sesión cerrada");
    } catch (e) {
      toast.error(e?.message || "No se pudo cerrar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({ user, profile, isLoading, refresh, login, logout }),
    [user, profile, isLoading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
