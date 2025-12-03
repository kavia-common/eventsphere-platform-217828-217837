import React from 'react';
import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function NotFoundPage() {
  /** 404 not found route component. */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Page Not Found</h1>
      <p className="text-gray-600 mt-2">The page you are looking for does not exist.</p>
      <Link className="inline-block mt-4 text-primary underline" to="/">Go Home</Link>
    </div>
  );
}
