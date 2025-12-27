import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export function Label({ className, children, required, ...props }) {
  return (
    <label
      className={twMerge(
        clsx(
          "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300",
          className
        )
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}
