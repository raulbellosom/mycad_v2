import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { account } from "../../../shared/appwrite/client";
import { Card } from "../../../shared/ui/Card";
import { Input } from "../../../shared/ui/Input";
import { Button } from "../../../shared/ui/Button";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await account.createRecovery(
        email.trim(),
        window.location.origin + "/auth/login"
      );
      setEmailSent(true);
    } catch (e) {
      toast.error(e?.message || "No se pudo iniciar recuperación");
    } finally {
      setLoading(false);
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
      </div>

      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-60 dark:opacity-30" />

      <div className="relative flex min-h-dvh items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[480px]"
        >
          <Card className="relative overflow-hidden border-0 bg-white/70 p-6 shadow-2xl shadow-neutral-900/10 ring-1 ring-black/5 backdrop-blur-xl dark:bg-neutral-900/70 dark:ring-white/10 sm:p-8">
            {/* Decorative top gradient */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />

            {!emailSent ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Recuperar contraseña
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Ingresa tu correo electrónico y te enviaremos un enlace para
                    restablecer tu contraseña.
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
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11"
                    />
                  </div>

                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-base font-semibold shadow-lg shadow-orange-500/25 transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/30"
                    loading={loading}
                    type="submit"
                  >
                    Enviar enlace de recuperación
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    to="/auth/login"
                  >
                    <ArrowLeft size={16} />
                    Volver al login
                  </Link>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                    <CheckCircle2
                      size={48}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                </div>

                {/* Success Message */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    ¡Correo enviado!
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Hemos enviado un enlace de recuperación a:
                  </p>
                  <p className="mt-1 font-semibold text-orange-600 dark:text-orange-400">
                    {email}
                  </p>
                </div>

                {/* Instructions */}
                <div className="space-y-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-start gap-3">
                    <Mail
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    />
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-semibold">
                        Revisa tu bandeja de entrada
                      </p>
                      <p className="mt-1">
                        Busca un correo de MyCAD con el asunto "Recuperación de
                        contraseña".
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                    />
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-semibold">
                        No olvides revisar tu carpeta de spam
                      </p>
                      <p className="mt-1">
                        Si no encuentras el correo en tu bandeja principal,
                        revisa en:
                      </p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                        <li>Correo no deseado / Spam</li>
                        <li>Promociones</li>
                        <li>Otras carpetas de filtrado</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <strong>Nota:</strong> El enlace de recuperación expirará en
                    un tiempo limitado. Si no recibiste el correo después de
                    unos minutos, puedes intentar nuevamente.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setEmailSent(false)}
                  >
                    Enviar nuevamente
                  </Button>

                  <Link
                    to="/auth/login"
                    className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <ArrowLeft size={16} />
                    Volver al login
                  </Link>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
