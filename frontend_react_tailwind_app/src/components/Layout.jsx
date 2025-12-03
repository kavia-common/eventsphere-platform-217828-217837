import React, { Suspense, startTransition, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';

/**
 * PUBLIC_INTERFACE
 * Layout component providing Navbar + responsive Sidebar.
 * - Uses dedicated Navbar and Sidebar components for consistency and reuse.
 * - Main: scrollable content area rendering nested routes via <Outlet />
 */
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    startTransition(() => setSidebarOpen((v) => !v));
  };

  const closeSidebar = () => {
    startTransition(() => setSidebarOpen(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500/10 to-gray-50">
      <Navbar onMenuClick={toggleSidebar} />

      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Main Content */}
        <main className="md:col-span-9 lg:col-span-10">
          <div className="rounded-xl bg-white shadow-soft border border-gray-200">
            <div className="p-6">
              <ErrorBoundary>
                <Suspense fallback={<div>Loading…</div>}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
