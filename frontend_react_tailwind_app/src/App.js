import React, { useEffect, useMemo, Suspense, useState } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import createApolloClient from './apollo/client';
import { AuthProvider } from './auth/AuthProvider';
import Layout from './components/Layout';
import router from './router';

/**
 * PUBLIC_INTERFACE
 * App entry: sets theme attribute and mounts the Router with a Layout shell.
 * Wraps with ApolloProvider and AuthProvider. Uses central router config (src/router.jsx).
 */
function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const apolloClient = useMemo(() => createApolloClient(), []);

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <div className="App">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            {/* Provide global Layout shell around routed pages */}
            <Layout />
            {/* RouterProvider renders pages outside Layout by default; to keep Layout wrapping, use Layout inside routes.
               For simplicity, we render Layout as persistent shell and pages render within main content cards. */}
            <div className="hidden" aria-hidden />
            <RouterProvider router={router} />
          </Suspense>
        </div>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
