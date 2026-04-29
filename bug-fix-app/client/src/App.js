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
import { AppShell } from '@/components/shell/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { RoleGuard } from '@/components/auth/RoleGuard';
function Authed({ children }) {
    return (_jsx(AuthGuard, { children: _jsx(AppShell, { children: children }) }));
}
export default function App() {
    return (_jsx(BrowserRouter, { future: { v7_startTransition: true, v7_relativeSplatPath: true }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/403", element: _jsx(ForbiddenPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(Authed, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(Authed, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/bugs", element: _jsx(Authed, { children: _jsx(BugListPage, {}) }) }), _jsx(Route, { path: "/bugs/new", element: _jsx(Authed, { children: _jsx(RoleGuard, { allow: ['TESTER', 'ADMIN'], children: _jsx(BugCreatePage, {}) }) }) }), _jsx(Route, { path: "/bugs/:id", element: _jsx(Authed, { children: _jsx(BugDetailPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }));
}
