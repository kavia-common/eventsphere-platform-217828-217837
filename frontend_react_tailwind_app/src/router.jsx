import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Lazy load pages for code-splitting and performance
const HomePage = lazy(() => import('./routes/HomePage'));
const EventsPage = lazy(() => import('./routes/EventsPage'));
const EventDetailPage = lazy(() => import('./routes/EventDetailPage'));
const DashboardPage = lazy(() => import('./routes/DashboardPage'));
const NotFoundPage = lazy(() => import('./routes/NotFoundPage'));

// PUBLIC_INTERFACE
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    handle: { title: 'Home' }
  },
  {
    path: '/events',
    element: <EventsPage />,
    handle: { title: 'Events' }
  },
  {
    path: '/events/:id',
    element: <EventDetailPage />,
    handle: { title: 'Event Details' }
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    handle: { title: 'Dashboard' }
  },
  {
    path: '*',
    element: <NotFoundPage />,
    handle: { title: 'Not Found' }
  },
]);

export default router;
