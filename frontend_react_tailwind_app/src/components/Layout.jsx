import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Layout component providing Navbar + responsive Sidebar.
 * - Navbar: sticky, shows brand and mobile menu button
 * - Sidebar: collapsible on mobile, persistent on md+ screens
 * - Main: scrollable content area rendering nested routes via <Outlet />
 */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItemClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 transition ${
      isActive ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500/10 to-gray-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-soft">E</span>
              <span className="font-semibold text-gray-900">EventSphere</span>
            </Link>
          </div>
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside
          className={`md:col-span-3 lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-soft p-4 h-fit md:block ${
            sidebarOpen ? 'block' : 'hidden'
          } md:block`}
        >
          <nav className="space-y-1">
            <NavLink to="/" end className={navItemClass}>Home</NavLink>
            <NavLink to="/events" className={navItemClass}>Events</NavLink>
            <NavLink to="/dashboard" className={navItemClass}>Dashboard</NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="md:col-span-9 lg:col-span-10">
          <div className="rounded-xl bg-white shadow-soft border border-gray-200">
            <div className="p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
