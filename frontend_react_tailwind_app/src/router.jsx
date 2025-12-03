import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './auth/AuthProvider';
import Layout from './components/Layout';

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

// PUBLIC_INTERFACE
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage />, handle: { title: 'Home' } },
      { path: 'login', element: <LoginPage />, handle: { title: 'Login' } },
      { path: 'register', element: <RegisterPage />, handle: { title: 'Register' } },
      { path: 'events', element: <EventsPage />, handle: { title: 'Events' } },
      { path: 'events/list', element: <EventsList />, handle: { title: 'Browse Events' } },
      {
        path: 'events/new',
        element: (
          <ProtectedRoute to="/login">
            <CreateEditEvent />
          </ProtectedRoute>
        ),
        handle: { title: 'Create Event' },
      },
      { path: 'events/:id', element: <EventDetails />, handle: { title: 'Event Details' } },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute to="/login">
            <DashboardPage />
          </ProtectedRoute>
        ),
        handle: { title: 'Dashboard' },
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute to="/login">
            <Profile />
          </ProtectedRoute>
        ),
        handle: { title: 'Profile' },
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute to="/login">
            <ChatRoom />
          </ProtectedRoute>
        ),
        handle: { title: 'Chat Room' },
      },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Not Found' } },
    ],
  },
]);

export default router;
