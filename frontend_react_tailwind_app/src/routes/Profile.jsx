import React from 'react';
import { useAuth } from '../auth/AuthProvider';

/**
 * PUBLIC_INTERFACE
 * Profile: Shows current user info (protected).
 */
export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="p-2">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your Profile</h1>
      <div className="card p-4 space-y-2">
        <div className="text-gray-700"><span className="font-medium">ID:</span> {user?.id || '-'}</div>
        <div className="text-gray-700"><span className="font-medium">Name:</span> {user?.name || '-'}</div>
        <div className="text-gray-700"><span className="font-medium">Email:</span> {user?.email || '-'}</div>
      </div>
    </div>
  );
}
