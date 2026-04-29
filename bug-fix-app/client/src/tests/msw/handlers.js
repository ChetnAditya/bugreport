import { http, HttpResponse } from 'msw';
const TEST_USER = {
    id: 'u1',
    email: 'jane@example.com',
    name: 'Jane',
    role: 'TESTER',
    createdAt: new Date().toISOString(),
};
export const baseHandlers = [
    http.post('http://localhost:4000/api/auth/register', async ({ request }) => {
        const body = (await request.json());
        if (body.email === 'taken@example.com') {
            return HttpResponse.json({ error: { code: 'CONFLICT', message: 'Email already registered' } }, { status: 409 });
        }
        return HttpResponse.json({ user: { ...TEST_USER, email: body.email } }, { status: 201 });
    }),
    http.post('http://localhost:4000/api/auth/login', async ({ request }) => {
        const body = (await request.json());
        if (body.password !== 'Passw0rd!') {
            return HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } }, { status: 401 });
        }
        return HttpResponse.json({ user: { ...TEST_USER, email: body.email } });
    }),
    http.get('http://localhost:4000/api/auth/me', () => HttpResponse.json({ user: TEST_USER })),
    http.post('http://localhost:4000/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
];
