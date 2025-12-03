import React, { useEffect, useMemo, Suspense, useState } from 'react';
import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import createApolloClient from './apollo/client';
import { AuthProvider, ProtectedRoute } from './auth/AuthProvider';
import Layout from './components/Layout';
import HomePage from './routes/HomePage';
import EventsPage from './routes/EventsPage';
import EventDetailPage from './routes/EventDetailPage';
import DashboardPage from './routes/DashboardPage';
import NotFoundPage from './routes/NotFoundPage';
import LoginPage from './routes/LoginPage';

/**
 * PUBLIC_INTERFACE
 * App entry: sets theme attribute and mounts the Router with a Layout shell.
 * Now wraps with ApolloProvider and AuthProvider for GraphQL and authentication.
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme to document for potential theming hooks
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const apolloClient = useMemo(() => createApolloClient(), []);

  // Build router with Layout as parent route to render Navbar + Sidebar
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <Layout />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'login', element: <LoginPage /> },
            { path: 'events', element: <EventsPage /> },
            { path: 'events/:id', element: <EventDetailPage /> },
            {
              path: 'dashboard',
              element: (
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              ),
            },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ]),
    []
  );

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
            <RouterProvider router={router} />
          </Suspense>
        </div>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
