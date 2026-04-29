import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';
import { RegisterPage } from '@/pages/RegisterPage';
function renderPage() {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(_jsx(QueryClientProvider, { client: qc, children: _jsx(MemoryRouter, { initialEntries: ['/register'], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx("div", { children: "dashboard ok" }) })] }) }) }));
}
describe('RegisterPage', () => {
    it('registers and navigates', async () => {
        renderPage();
        await userEvent.type(screen.getByLabelText(/name/i), 'Jane');
        await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => expect(screen.getByText('dashboard ok')).toBeInTheDocument());
    });
    it('shows conflict error', async () => {
        renderPage();
        await userEvent.type(screen.getByLabelText(/name/i), 'Jane');
        await userEvent.type(screen.getByLabelText(/email/i), 'taken@example.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'Passw0rd!');
        await userEvent.click(screen.getByRole('button', { name: /create account/i }));
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/already registered/i));
    });
    it('rejects weak password client-side', async () => {
        renderPage();
        await userEvent.type(screen.getByLabelText(/name/i), 'Jane');
        await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
        await userEvent.type(screen.getByLabelText(/password/i), 'short');
        await userEvent.tab();
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    it('a11y smoke', async () => {
        const { container } = renderPage();
        const results = await axe(container);
        expect(results.violations.length).toBe(0);
    });
});
