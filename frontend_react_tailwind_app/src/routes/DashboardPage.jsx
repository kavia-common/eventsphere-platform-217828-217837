import React from 'react';

/**
 * PUBLIC_INTERFACE
 * DashboardPage: Analytics overview with placeholder charts.
 */
export default function DashboardPage() {
  return (
    <div className="p-2 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Your analytics and management overview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="font-medium text-gray-800 mb-2">Registrations</h3>
          <div className="h-32 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-medium text-gray-800 mb-2">Revenue</h3>
          <div className="h-32 bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-medium text-gray-800 mb-2">Active Users</h3>
          <div className="h-32 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
