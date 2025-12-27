import { useState } from "react";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { SectionHeader } from "../../../shared/ui/SectionHeader";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { createUserWithProfile } from "../services/usersAdmin.service";

export function UsersPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithProfile({
        email: email.trim(),
        name: name.trim(),
        password,
      });
      toast.success("Solicitud enviada a Function (crear usuario + profile)");
      setEmail("");
      setName("");
      setPassword("");
    } catch (e) {
      toast.error(e?.message || "No se pudo crear usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Usuarios"
        subtitle="Gestiona el acceso de los usuarios al sistema."
      />
      <Card>
        <div className="mb-3 text-sm font-bold">Crear usuario</div>
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-3">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="md:col-span-3">
            <Button
              isLoading={loading}
              type="submit"
              className="w-full md:w-auto"
            >
              <UserPlus size={18} />
              Crear usuario
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
