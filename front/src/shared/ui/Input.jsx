import clsx from "clsx";
import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export const Input = forwardRef(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-(--fg)">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              "flex h-10 w-full rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-base md:text-sm ring-offset-(--bg) file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-(--muted-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-(--fg) transition-colors",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
