import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/msw/server';
import { AuthGuard } from '@/components/auth/AuthGuard';
function renderWith(initialPath) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(_jsx(QueryClientProvider, { client: qc, children: _jsx(MemoryRouter, { initialEntries: [initialPath], children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx("div", { children: "login screen" }) }), _jsx(Route, { path: "/protected", element: _jsx(AuthGuard, { children: _jsx("div", { children: "secret content" }) }) })] }) }) }));
}
describe('AuthGuard', () => {
    it('renders children when authenticated', async () => {
        renderWith('/protected');
        await waitFor(() => expect(screen.getByText('secret content')).toBeInTheDocument());
    });
    it('redirects to /login when 401', async () => {
        server.use(http.get('http://localhost:4000/api/auth/me', () => HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'no auth' } }, { status: 401 })));
        renderWith('/protected');
        await waitFor(() => expect(screen.getByText('login screen')).toBeInTheDocument());
    });
});
