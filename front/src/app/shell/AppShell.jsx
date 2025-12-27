import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-(--bg)">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px]">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, type: "tween", ease: "easeOut" }}
              className="min-w-0 flex-1 px-4 pb-8 pt-4 sm:px-6 lg:px-8"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
