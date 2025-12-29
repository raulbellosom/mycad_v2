import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";
import { ScrollToTop } from "./components/ScrollToTop";

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef(null);

  return (
    <div className="h-dvh bg-(--bg)">
      <div className="mx-auto flex h-dvh w-full max-w-[1600px]">
        <AppSidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar onMenuClick={() => setMobileMenuOpen(true)} />

          <main
            ref={mainRef}
            className="min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-8"
          >
            <ScrollToTop containerRef={mainRef} />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
