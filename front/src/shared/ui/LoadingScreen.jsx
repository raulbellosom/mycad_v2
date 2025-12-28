import { Loader2 } from "lucide-react";

export function LoadingScreen({ label = "Cargando...", fullscreen = false }) {
  const heightClass = fullscreen ? "h-dvh" : "h-full";

  return (
    <div
      className={`flex ${heightClass} w-full flex-col items-center justify-center gap-4 bg-(--bg) text-(--fg)`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-(--brand)" />
      <p className="animate-pulse text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}
