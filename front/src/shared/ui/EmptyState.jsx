import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FolderOpen } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon,
  className,
  children,
}) {
  const I = Icon || FolderOpen;

  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--border) bg-zinc-50/50 p-12 text-center dark:bg-zinc-900/50",
          className
        )
      )}
    >
      <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
        <I size={32} className="text-zinc-400" />
      </div>
      <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
