import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

/**
 * PUBLIC_INTERFACE
 * Placeholder login page to simulate obtaining a JWT and calling auth.login(token).
 * Replace with real form and backend mutation integration.
 */
export default function LoginPage() {
  const [fakeToken, setFakeToken] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fakeToken) return;
    await auth.login(fakeToken);
    navigate(from, { replace: true });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Login</h1>
      <p className="text-gray-600 mb-4">Enter any token to simulate login.</p>
      <form onSubmit={handleSubmit} className="space-y-4 card p-4">
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          type="text"
          placeholder="Paste JWT token..."
          value={fakeToken}
          onChange={(e) => setFakeToken(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full">Login</button>
      </form>
    </div>
  );
}
