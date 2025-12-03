import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './auth/AuthProvider';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages
const HomePage = lazy(() => import('./routes/HomePage'));
const EventsPage = lazy(() => import('./routes/EventsPage'));
const EventsList = lazy(() => import('./routes/EventsList'));
const EventDetails = lazy(() => import('./routes/EventDetails'));
const CreateEditEvent = lazy(() => import('./routes/CreateEditEvent'));
const DashboardPage = lazy(() => import('./routes/DashboardPage'));
const Profile = lazy(() => import('./routes/Profile'));
const ChatRoom = lazy(() => import('./routes/ChatRoom'));
const LoginPage = lazy(() => import('./routes/LoginPage'));
const RegisterPage = lazy(() => import('./routes/RegisterPage'));
const NotFoundPage = lazy(() => import('./routes/NotFoundPage'));

const suspenseWrap = (node) => (
  <Suspense fallback={<div className="p-6">Loading…</div>}>{node}</Suspense>
);

// PUBLIC_INTERFACE
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    ),
    errorElement: (
      <ErrorBoundary />
    ),
    children: [
      { index: true, element: suspenseWrap(<HomePage />), handle: { title: 'Home' } },
      { path: 'login', element: suspenseWrap(<LoginPage />), handle: { title: 'Login' } },
      { path: 'register', element: suspenseWrap(<RegisterPage />), handle: { title: 'Register' } },
      { path: 'events', element: suspenseWrap(<EventsPage />), handle: { title: 'Events' } },
      { path: 'events/list', element: suspenseWrap(<EventsList />), handle: { title: 'Browse Events' } },
      {
        path: 'events/new',
        element: suspenseWrap(
          <ProtectedRoute to="/login">
            <CreateEditEvent />
          </ProtectedRoute>
        ),
        handle: { title: 'Create Event' },
      },
      { path: 'events/:id', element: suspenseWrap(<EventDetails />), handle: { title: 'Event Details' } },
      {
        path: 'dashboard',
        element: suspenseWrap(
          <ProtectedRoute to="/login">
            <DashboardPage />
          </ProtectedRoute>
        ),
        handle: { title: 'Dashboard' },
      },
      {
        path: 'profile',
        element: suspenseWrap(
          <ProtectedRoute to="/login">
            <Profile />
          </ProtectedRoute>
        ),
        handle: { title: 'Profile' },
      },
      {
        path: 'chat',
        element: suspenseWrap(
          <ProtectedRoute to="/login">
            <ChatRoom />
          </ProtectedRoute>
        ),
        handle: { title: 'Chat Room' },
      },
      { path: '*', element: suspenseWrap(<NotFoundPage />), handle: { title: 'Not Found' } },
    ],
  },
]);

export default router;
