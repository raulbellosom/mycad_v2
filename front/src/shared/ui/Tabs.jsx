import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function Tabs({ tabs, activeTab, onChange, className }) {
  // tabs: { id: string, label: string }[]
  return (
    <div className={twMerge(clsx("border-b border-(--border)", className))}>
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={clsx(
                "group relative whitespace-nowrap px-1 py-4 text-sm font-medium transition-colors",
                isActive
                  ? "text-(--brand)"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-(--brand)"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
