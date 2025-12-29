import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-dvh bg-(--bg)">
      <div className="mx-auto flex h-dvh w-full max-w-[1600px]">
        <AppSidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar onMenuClick={() => setMobileMenuOpen(true)} />

          <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
