import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  User,
  Shield,
  Car,
  Camera,
  Mail,
  Phone,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";

import { Card } from "../../../shared/ui/Card";
import { PageLayout } from "../../../shared/ui/PageLayout";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  getMyDriverRecord,
  getAvatarPreviewUrl,
  uploadAvatar,
  updateAvatar,
  deleteAvatar,
} from "../../auth/services/myProfile.service";
import { cn } from "../../../shared/utils/cn";

import { ProfileInfoTab } from "../components/profile/ProfileInfoTab";
import { ProfileSecurityTab } from "../components/profile/ProfileSecurityTab";
import { ProfileDriverTab } from "../components/profile/ProfileDriverTab";

const TABS = [
  { id: "info", label: "Información", icon: User },
  { id: "security", label: "Seguridad", icon: Shield },
  { id: "driver", label: "Conductor", icon: Car },
];

export function MyProfilePage() {
  const { user, profile, isLoading: authLoading, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAvatarMenu(false);
      }
    };
    if (showAvatarMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAvatarMenu]);

  // Check if user is also a driver
  const { data: driverRecord, isLoading: driverLoading } = useQuery({
    queryKey: ["myDriverRecord", profile?.$id],
    queryFn: () => getMyDriverRecord(profile.$id),
    enabled: !!profile?.$id,
  });

  // Mutation para eliminar avatar
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      const oldFileId = profile.avatarFileId;
      await updateAvatar(profile.$id, null);
      if (oldFileId) {
        await deleteAvatar(oldFileId);
      }
    },
    onSuccess: () => {
      refresh();
      setShowAvatarMenu(false);
      toast.success("Foto eliminada");
    },
    onError: (e) => {
      toast.error(e.message || "Error al eliminar foto");
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    setShowAvatarMenu(false);
    const toastId = toast.loading("Subiendo foto...");

    try {
      const oldFileId = profile.avatarFileId;
      const uploaded = await uploadAvatar(file);
      await updateAvatar(profile.$id, uploaded.$id);
      if (oldFileId) {
        await deleteAvatar(oldFileId);
      }
      refresh();
      toast.success("Foto actualizada", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Error al subir foto", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Filter tabs based on whether user is a driver
  const availableTabs = TABS.filter((tab) => {
    if (tab.id === "driver") {
      return !!driverRecord;
    }
    return true;
  });

  if (authLoading) {
    return <LoadingScreen label="Cargando perfil..." />;
  }

  if (!user || !profile) {
    return (
      <PageLayout.Empty
        icon={User}
        title="Error al cargar perfil"
        description="No se pudo cargar la información del perfil"
      />
    );
  }

  const avatarUrl = getAvatarPreviewUrl(profile.avatarFileId, 200);

  return (
    <PageLayout title="Mi Perfil">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header with Avatar */}
        <Card className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-(--brand) to-(--brand)/60" />

          <div className="relative px-6 pb-6 pt-16">
            {/* Avatar */}
            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4">
              <div className="relative" ref={menuRef}>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                <div
                  className={cn(
                    "h-28 w-28 rounded-2xl border-4 border-(--card) bg-(--card) shadow-xl overflow-hidden",
                    isUploadingAvatar && "opacity-50"
                  )}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-(--brand)/10 text-(--brand)">
                      <User size={48} />
                    </div>
                  )}
                </div>

                {/* Loading overlay */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}

                {/* Camera button - triggers file input or shows menu */}
                <button
                  onClick={() => {
                    if (avatarUrl) {
                      setShowAvatarMenu(!showAvatarMenu);
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-(--brand) text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {avatarUrl ? (
                    <MoreVertical size={16} />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>

                {/* Avatar menu */}
                <AnimatePresence>
                  {showAvatarMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 4 }}
                      className="absolute top-full left-0 mt-2 w-44 rounded-xl border border-(--border) bg-(--card) shadow-xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setShowAvatarMenu(false);
                          fileInputRef.current?.click();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-(--fg) hover:bg-(--muted)/50 transition-colors"
                      >
                        <Upload size={16} className="text-(--brand)" />
                        Cambiar foto
                      </button>
                      <div className="h-px bg-(--border)" />
                      <button
                        onClick={() => deleteAvatarMutation.mutate()}
                        disabled={deleteAvatarMutation.isPending}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Eliminar foto
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-center sm:text-left flex-1 pb-2">
                <h1 className="text-2xl font-bold text-(--fg)">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm text-(--muted-fg)">
                  <span className="flex items-center gap-1">
                    <Mail size={14} />
                    {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {profile.phone}
                    </span>
                  )}
                </div>
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  {profile.isPlatformAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-500">
                      <Shield size={12} />
                      Admin Plataforma
                    </span>
                  )}
                  {driverRecord && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                      <Car size={12} />
                      Conductor
                    </span>
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                      profile.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {profile.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="border-b border-(--border)">
          <nav className="flex gap-1" aria-label="Tabs">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all rounded-t-lg",
                    isActive
                      ? "text-(--brand) bg-(--brand)/5"
                      : "text-(--muted-fg) hover:text-(--fg) hover:bg-(--muted)/20"
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="profileActiveTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--brand)"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "info" && (
              <ProfileInfoTab
                profile={profile}
                user={user}
                onUpdate={refresh}
              />
            )}
            {activeTab === "security" && (
              <ProfileSecurityTab
                profile={profile}
                user={user}
                onUpdate={refresh}
              />
            )}
            {activeTab === "driver" && driverRecord && (
              <ProfileDriverTab
                profile={profile}
                driverRecord={driverRecord}
                onUpdate={refresh}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageLayout>
  );
}
