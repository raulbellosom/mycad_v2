import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { useAuth } from "../../auth/hooks/useAuth";
import { databases } from "../../../shared/appwrite/client";
import { env } from "../../../shared/appwrite/env";

const COLLECTION_ID = "users_profile";

export function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "", // readonly
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        email: profile.email || "",
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      await databases.updateDocument(
        env.databaseId,
        COLLECTION_ID,
        profile.$id,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        }
      );
    },
    onSuccess: () => {
      refresh();
      toast.success("Perfil actualizado");
    },
    onError: (e) => {
      toast.error(e.message || "Error al actualizar");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-xl space-y-6">
      <SectionHeader
        title="Mi Perfil"
        subtitle="Administra tu información personal."
      />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            value={formData.email}
            disabled
            className="bg-neutral-100 dark:bg-zinc-800"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, firstName: e.target.value }))
              }
              required
            />
            <Input
              label="Apellido"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, lastName: e.target.value }))
              }
              required
            />
          </div>

          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) =>
              setFormData((p) => ({ ...p, phone: e.target.value }))
            }
          />

          <div className="pt-2">
            <Button type="submit" loading={mutation.isPending}>
              <Save size={18} className="mr-2" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
