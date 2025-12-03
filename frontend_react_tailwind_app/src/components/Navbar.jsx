import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

/**
 * PUBLIC_INTERFACE
 * Navbar component for top-level navigation and quick actions.
 * - Shows brand, primary nav links for top-level pages, and auth actions.
 * - Emits onMenuClick for mobile to toggle sidebar.
 */
export default function Navbar({ onMenuClick }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={onMenuClick}
            aria-label="Toggle sidebar menu"
          >
            ☰
          </button>
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-soft">
              E
            </span>
            <span className="font-semibold text-gray-900">EventSphere</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-gray-700 hover:text-primary transition">
            Home
          </Link>
          <Link to="/events" className="text-sm text-gray-700 hover:text-primary transition">
            Events
          </Link>
          <Link to="/events/list" className="text-sm text-gray-700 hover:text-primary transition">
            Browse
          </Link>
          <Link to="/dashboard" className="text-sm text-gray-700 hover:text-primary transition">
            Dashboard
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/events/new" className="text-sm text-gray-700 hover:text-primary transition">
                New Event
              </Link>
              <Link to="/chat" className="text-sm text-gray-700 hover:text-primary transition">
                Chat
              </Link>
              <Link to="/profile" className="text-sm text-gray-700 hover:text-primary transition">
                Profile
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-700">
                Hi, {user?.name || user?.email}
              </span>
              <button
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
