import React from 'react';
import { NavLink } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Sidebar component for secondary navigation.
 * - Collapsible on mobile; persistent on md+.
 * - Accepts isOpen (mobile), onClose, and additional children zones if needed.
 */
export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navItemClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 transition ${
      isActive ? 'bg-blue-50 text-primary' : 'text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <aside
      className={`md:col-span-3 lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-soft p-4 h-fit ${isOpen ? 'block' : 'hidden'} md:block`}
      aria-label="Sidebar"
    >
      <div className="md:hidden mb-2 flex justify-end">
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>
      <nav className="space-y-1">
        <NavLink to="/" end className={navItemClass}>
          Home
        </NavLink>
        <NavLink to="/events" className={navItemClass}>
          Events
        </NavLink>
        <NavLink to="/dashboard" className={navItemClass}>
          Dashboard
        </NavLink>
      </nav>
    </aside>
  );
}
