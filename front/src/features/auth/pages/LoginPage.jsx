import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";
import { AppLogo } from "../../../shared/ui/AppLogo";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = useMemo(() => loc?.state?.from || "/dashboard", [loc]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      nav(redirectTo, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-[-120px] top-[-120px] h-[380px] w-[380px] rounded-full bg-(--brand)/20 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-140px] h-[420px] w-[420px] rounded-full bg-(--brand)/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex items-center justify-center gap-3">
          <AppLogo />
          <div className="text-center">
            <div className="text-lg font-black tracking-tight">MyCAD</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Admin Console
            </div>
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-4">
            <div className="text-xl font-black">Inicia sesión</div>
            <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Accede a tu panel para gestionar vehículos y permisos.
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-9 text-neutral-400">
                <Mail size={16} />
              </div>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-9 text-neutral-400">
                <Lock size={16} />
              </div>
              <Input
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Link
                className="text-sm font-semibold text-neutral-700 hover:underline dark:text-neutral-200"
                to="/auth/forgot"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <Link
                className="text-sm font-semibold text-(--brand) hover:underline"
                to="/auth/register"
              >
                Crear cuenta
              </Link>
            </div>

            <Button className="w-full" loading={isSubmitting} type="submit">
              Entrar <ArrowRight size={18} />
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
