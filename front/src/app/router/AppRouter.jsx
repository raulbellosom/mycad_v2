import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../shell/AppShell";
import { RequireAuth } from "../../features/auth/components/RequireAuth";
import { RequirePermission } from "../../features/groups/components/RequirePermission";
import { SYSTEM_PERMISSIONS } from "../../features/groups/context/PermissionsProvider";

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
import {
  ReportsPage,
  ServiceReportCreatePage,
  ServiceReportEditPage,
  ServiceReportViewPage,
  RepairReportCreatePage,
  RepairReportEditPage,
  RepairReportViewPage,
} from "../../features/reports/pages";
import { AuditLogsPage } from "../../features/audit/pages/AuditLogsPage";
import { DriversPage } from "../../features/drivers/pages/DriversPage";
import { DriverFormPage } from "../../features/drivers/pages/DriverFormPage";
import { ClientsPage } from "../../features/clients/pages/ClientsPage";
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

        {/* Vehicles - protegido por permisos */}
        <Route
          path="vehicles"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.VEHICLES_VIEW}
              fallbackPath="/dashboard"
            >
              <VehiclesPage />
            </RequirePermission>
          }
        />
        <Route
          path="vehicles/new"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.VEHICLES_CREATE}
              fallbackPath="/vehicles"
            >
              <VehicleFormPage />
            </RequirePermission>
          }
        />
        <Route
          path="vehicles/:id"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.VEHICLES_VIEW}
              fallbackPath="/vehicles"
            >
              <VehicleDetailPage />
            </RequirePermission>
          }
        />
        <Route
          path="vehicles/:id/edit"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.VEHICLES_EDIT}
              fallbackPath="/vehicles"
            >
              <VehicleFormPage />
            </RequirePermission>
          }
        />

        {/* Catalogs - protegido por permisos */}
        <Route
          path="catalogs"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.CATALOGS_VIEW}
              fallbackPath="/dashboard"
            >
              <CatalogsPage />
            </RequirePermission>
          }
        />

        {/* Users - protegido por permisos */}
        <Route
          path="users"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.USERS_VIEW}
              fallbackPath="/dashboard"
            >
              <UsersPage />
            </RequirePermission>
          }
        />
        <Route path="profile" element={<MyProfilePage />} />

        {/* Reports Module Routes - protegido por permisos */}
        <Route
          path="reports"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_VIEW}
              fallbackPath="/dashboard"
            >
              <ReportsPage />
            </RequirePermission>
          }
        />
        <Route
          path="reports/service/new"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_CREATE}
              fallbackPath="/reports"
            >
              <ServiceReportCreatePage />
            </RequirePermission>
          }
        />
        <Route
          path="reports/service/:id"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_VIEW}
              fallbackPath="/reports"
            >
              <ServiceReportViewPage />
            </RequirePermission>
          }
        />
        <Route
          path="reports/service/:id/edit"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_CREATE}
              fallbackPath="/reports"
            >
              <ServiceReportEditPage />
            </RequirePermission>
          }
        />
        <Route
          path="reports/repair/new"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_CREATE}
              fallbackPath="/reports"
            >
              <RepairReportCreatePage />
            </RequirePermission>
          }
        />
        <Route
          path="reports/repair/:id"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_VIEW}
              fallbackPath="/reports"
            >
              <RepairReportViewPage />
            </RequirePermission>
          }
        />
        <Route
          path="reports/repair/:id/edit"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.REPORTS_CREATE}
              fallbackPath="/reports"
            >
              <RepairReportEditPage />
            </RequirePermission>
          }
        />

        {/* Audit - protegido por permisos */}
        <Route
          path="audit"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.AUDIT_VIEW}
              fallbackPath="/dashboard"
            >
              <AuditLogsPage />
            </RequirePermission>
          }
        />

        {/* Drivers - protegido por permisos */}
        <Route
          path="drivers"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.DRIVERS_VIEW}
              fallbackPath="/dashboard"
            >
              <DriversPage />
            </RequirePermission>
          }
        />
        <Route
          path="drivers/new"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.DRIVERS_CREATE}
              fallbackPath="/drivers"
            >
              <DriverFormPage />
            </RequirePermission>
          }
        />
        <Route
          path="drivers/:id"
          element={
            <RequirePermission
              permission={[
                SYSTEM_PERMISSIONS.DRIVERS_VIEW,
                SYSTEM_PERMISSIONS.DRIVERS_EDIT,
              ]}
              fallbackPath="/drivers"
            >
              <DriverFormPage />
            </RequirePermission>
          }
        />

        {/* Clients - protegido por permisos */}
        <Route
          path="clients"
          element={
            <RequirePermission
              permission={SYSTEM_PERMISSIONS.CLIENTS_VIEW}
              fallbackPath="/dashboard"
            >
              <ClientsPage />
            </RequirePermission>
          }
        />

        <Route path="admin/permissions" element={<PermissionsAdminPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
