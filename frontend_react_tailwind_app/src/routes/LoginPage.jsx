import React, { startTransition, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useAuth } from '../auth/AuthProvider';
import { LOGIN_MUTATION } from '../graphql/mutations';

/**
 * PUBLIC_INTERFACE
 * Login page integrated with GraphQL login mutation.
 */
export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    try {
      const { data } = await loginMutation({ variables: { email: form.email, password: form.password } });
      const token = data?.login?.token;
      if (token) {
        await auth.login(token);
        // Transition the navigation to avoid synchronous input suspends
        startTransition(() => {
          navigate(from, { replace: true });
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4 card p-4">
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
