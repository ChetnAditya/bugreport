import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/msw/server';
import { AuthGuard } from '@/components/auth/AuthGuard';

function renderWith(initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>login screen</div>} />
          <Route
            path="/protected"
            element={
              <AuthGuard>
                <div>secret content</div>
              </AuthGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AuthGuard', () => {
  it('renders children when authenticated', async () => {
    renderWith('/protected');
    await waitFor(() => expect(screen.getByText('secret content')).toBeInTheDocument());
  });

  it('redirects to /login when 401', async () => {
    server.use(
      http.get('http://localhost:4000/api/auth/me', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'no auth' } },
          { status: 401 },
        ),
      ),
    );
    renderWith('/protected');
    await waitFor(() => expect(screen.getByText('login screen')).toBeInTheDocument());
  });
});
