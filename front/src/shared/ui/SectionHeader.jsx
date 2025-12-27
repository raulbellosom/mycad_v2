import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export function SectionHeader({ title, subtitle, className, children }) {
  return (
    <div
      className={twMerge(
        clsx(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          className
        )
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
