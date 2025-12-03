import React, { useEffect, useMemo, Suspense, useState } from 'react';
import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './routes/HomePage';
import EventsPage from './routes/EventsPage';
import EventDetailPage from './routes/EventDetailPage';
import DashboardPage from './routes/DashboardPage';
import NotFoundPage from './routes/NotFoundPage';

/**
 * PUBLIC_INTERFACE
 * App entry: sets theme attribute and mounts the Router with a Layout shell.
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme to document for potential theming hooks
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Build router with Layout as parent route to render Navbar + Sidebar
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <Layout />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'events', element: <EventsPage /> },
            { path: 'events/:id', element: <EventDetailPage /> },
            { path: 'dashboard', element: <DashboardPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ]),
    []
  );

  return (
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
  );
}

export default App;
