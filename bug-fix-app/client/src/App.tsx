import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { BugListPage } from '@/pages/BugListPage';
import { BugCreatePage } from '@/pages/BugCreatePage';
import { BugDetailPage } from '@/pages/BugDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UsersPage } from '@/pages/UsersPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { BugEditPage } from '@/pages/BugEditPage';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamDetailPage } from '@/pages/TeamDetailPage';
import { OrgChartPage } from '@/pages/OrgChartPage';
import { AppShell } from '@/components/shell/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

function Authed({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route
          path="/profile"
          element={
            <Authed>
              <ProfilePage />
            </Authed>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Authed>
              <DashboardPage />
            </Authed>
          }
        />
        <Route
          path="/users"
          element={
            <Authed>
              <RoleGuard allow={['SUPERADMIN']}>
                <UsersPage />
              </RoleGuard>
            </Authed>
          }
        />
        <Route
          path="/teams"
          element={
            <Authed>
              <RoleGuard allow={['SUPERADMIN']}>
                <TeamsPage />
              </RoleGuard>
            </Authed>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <Authed>
              <TeamDetailPage />
            </Authed>
          }
        />
        <Route
          path="/org-chart"
          element={
            <Authed>
              <RoleGuard allow={['SUPERADMIN', 'TEAMLEAD']}>
                <OrgChartPage />
              </RoleGuard>
            </Authed>
          }
        />
        <Route
          path="/analytics"
          element={
            <Authed>
              <RoleGuard allow={['SUPERADMIN', 'TEAMLEAD']}>
                <AnalyticsPage />
              </RoleGuard>
            </Authed>
          }
        />
        <Route
          path="/bugs"
          element={
            <Authed>
              <BugListPage />
            </Authed>
          }
        />
        <Route
          path="/bugs/new"
          element={
            <Authed>
              <RoleGuard allow={['TESTER', 'TEAMLEAD', 'SUPERADMIN']}>
                <BugCreatePage />
              </RoleGuard>
            </Authed>
          }
        />
        <Route
          path="/bugs/:id"
          element={
            <Authed>
              <BugDetailPage />
            </Authed>
          }
        />
        <Route
          path="/bugs/:id/edit"
          element={
            <Authed>
              <BugEditPage />
            </Authed>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
