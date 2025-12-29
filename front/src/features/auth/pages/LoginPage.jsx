import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
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
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Animated Background Elements */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute left-[-15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/10 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="absolute bottom-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-orange-500/15 to-amber-400/10 blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-300/10 to-transparent blur-3xl"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-60 dark:opacity-30" />

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px]"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 blur-xl" />
              <div className="relative rounded-2xl bg-white/80 p-3 shadow-xl shadow-orange-500/10 ring-1 ring-black/5 backdrop-blur-sm dark:bg-neutral-800/80 dark:ring-white/10">
                <AppLogo size="xl" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 text-center"
            >
              <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                MyCAD
              </h1>
              <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                Sistema de Gestión de Flotillas
              </p>
            </motion.div>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="relative overflow-hidden border-0 bg-white/70 p-6 shadow-2xl shadow-neutral-900/10 ring-1 ring-black/5 backdrop-blur-xl dark:bg-neutral-900/70 dark:ring-white/10 sm:p-8">
              {/* Decorative top gradient */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />

              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Bienvenido
                  </h2>
                  <Sparkles size={18} className="text-orange-500" />
                </div>
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  Ingresa tus credenciales para acceder al panel
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-9 text-neutral-400">
                    <Mail size={18} />
                  </div>
                  <Input
                    label="Correo electrónico"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11"
                  />
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-9 text-neutral-400">
                    <Lock size={18} />
                  </div>
                  <Input
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-9 text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    to="/auth/forgot"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-base font-semibold shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/30"
                  loading={isSubmitting}
                  type="submit"
                >
                  Iniciar sesión
                  <ArrowRight size={18} />
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-xs font-medium text-neutral-400">
                  ¿Nuevo en MyCAD?
                </span>
                <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              </div>

              {/* Register Link */}
              <Link
                to="/auth/register"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-neutral-200 bg-transparent py-3 text-sm font-semibold text-neutral-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10 dark:hover:text-orange-400"
              >
                Crear una cuenta
              </Link>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-500"
          >
            © {new Date().getFullYear()} MyCAD. Todos los derechos reservados.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
