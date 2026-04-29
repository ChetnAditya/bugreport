import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { axe } from 'jest-axe';
import { server } from '@/tests/msw/server';
import { LoginPage } from '@/pages/LoginPage';
function renderPage() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(_jsx(QueryClientProvider, { client: qc, children: _jsx(MemoryRouter, { initialEntries: ['/login'], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx("div", { children: "dashboard ok" }) })] }) }) }));
}
describe('LoginPage', () => {
    it('logs in and navigates to /dashboard', async () => {
        renderPage();
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        await waitFor(() => expect(screen.getByText('dashboard ok')).toBeInTheDocument());
    });
    it('shows server error on bad creds', async () => {
        renderPage();
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalid credentials/i));
    });
    it('shows network error toast on 5xx', async () => {
        server.use(http.post('http://localhost:4000/api/auth/login', () => HttpResponse.json({ error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 })));
        renderPage();
        await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
        await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i));
    });
    it('passes a11y smoke', async () => {
        const { container } = renderPage();
        const results = await axe(container);
        expect(results.violations.length).toBe(0);
    });
});
