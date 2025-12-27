import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { account } from "../../../shared/appwrite/client";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await account.createRecovery(
        email.trim(),
        window.location.origin + "/auth/login"
      );
      toast.success("Revisa tu correo para recuperar tu contraseña.");
    } catch (e) {
      toast.error(e?.message || "No se pudo iniciar recuperación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden px-6">
      <Card className="w-full max-w-md p-5">
        <div className="text-xl font-black">Recuperar contraseña</div>
        <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Te enviaremos un enlace de recuperación.
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button className="w-full" loading={loading} type="submit">
            Enviar enlace
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            className="text-sm font-semibold hover:underline"
            to="/auth/login"
          >
            Volver al login
          </Link>
        </div>
      </Card>
    </div>
  );
}
