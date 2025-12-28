import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../shell/AppShell";
import { RequireAuth } from "../../features/auth/components/RequireAuth";

import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "../../features/auth/pages/ForgotPasswordPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { VehiclesPage } from "../../features/vehicles/pages/VehiclesPage";
import { VehicleFormPage } from "../../features/vehicles/pages/VehicleFormPage";
import { VehicleDetailPage } from "../../features/vehicles/pages/VehicleDetailPage";
import { CatalogsPage } from "../../features/catalogs/pages/CatalogsPage";
import { GroupsPage } from "../../features/groups/pages/GroupsPage";
import { UsersPage } from "../../features/users/pages/UsersPage";
import { MyProfilePage } from "../../features/users/pages/MyProfilePage";
import { ReportsPage } from "../../features/reports/pages/ReportsPage";
import { AuditLogsPage } from "../../features/audit/pages/AuditLogsPage";
import { DriversPage } from "../../features/drivers/pages/DriversPage";
import { DriverFormPage } from "../../features/drivers/pages/DriverFormPage";
import { NotFoundPage } from "../../shared/pages/NotFoundPage";
import { PermissionsAdminPage } from "../../features/groups/pages/PermissionsAdminPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/new" element={<VehicleFormPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="catalogs" element={<CatalogsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="drivers/new" element={<DriverFormPage />} />
        <Route path="drivers/:id" element={<DriverFormPage />} />
        <Route path="admin/permissions" element={<PermissionsAdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
