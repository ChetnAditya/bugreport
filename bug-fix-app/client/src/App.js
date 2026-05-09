import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
function Authed({ children }) {
    return (_jsx(AuthGuard, { children: _jsx(AppShell, { children: children }) }));
}
export default function App() {
    return (_jsx(BrowserRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true }, children: _jsx(ErrorBoundary, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/403", element: _jsx(ForbiddenPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(Authed, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(Authed, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(Authed, { children: _jsx(RoleGuard, { allow: ['SUPERADMIN'], children: _jsx(UsersPage, {}) }) }) }), _jsx(Route, { path: "/teams", element: _jsx(Authed, { children: _jsx(RoleGuard, { allow: ['SUPERADMIN'], children: _jsx(TeamsPage, {}) }) }) }), _jsx(Route, { path: "/teams/:id", element: _jsx(Authed, { children: _jsx(TeamDetailPage, {}) }) }), _jsx(Route, { path: "/org-chart", element: _jsx(Authed, { children: _jsx(RoleGuard, { allow: ['SUPERADMIN', 'TEAMLEAD'], children: _jsx(OrgChartPage, {}) }) }) }), _jsx(Route, { path: "/analytics", element: _jsx(Authed, { children: _jsx(RoleGuard, { allow: ['SUPERADMIN', 'TEAMLEAD'], children: _jsx(AnalyticsPage, {}) }) }) }), _jsx(Route, { path: "/bugs", element: _jsx(Authed, { children: _jsx(BugListPage, {}) }) }), _jsx(Route, { path: "/bugs/new", element: _jsx(Authed, { children: _jsx(RoleGuard, { allow: ['TESTER', 'TEAMLEAD', 'SUPERADMIN'], children: _jsx(BugCreatePage, {}) }) }) }), _jsx(Route, { path: "/bugs/:id", element: _jsx(Authed, { children: _jsx(BugDetailPage, {}) }) }), _jsx(Route, { path: "/bugs/:id/edit", element: _jsx(Authed, { children: _jsx(BugEditPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }) }));
}
