import React from 'react';
import { useQuery } from '@apollo/client';
import { DASHBOARD_SUMMARY_QUERY } from '../graphql/queries';

/**
 * PUBLIC_INTERFACE
 * DashboardPage: Analytics overview using GraphQL dashboard summary.
 */
export default function DashboardPage() {
  const { data, loading, error } = useQuery(DASHBOARD_SUMMARY_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const summary = data?.dashboardSummary;

  return (
    <div className="p-2 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Your analytics and management overview.</p>
      </div>

      {loading && <div>Loading dashboard…</div>}
      {error && <div className="text-error">Failed to load dashboard: {error.message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="font-medium text-gray-800 mb-2">Registrations</h3>
          <div className="h-32 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-900">
            {summary ? summary.totalRegistrations : '—'}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-medium text-gray-800 mb-2">Revenue</h3>
          <div className="h-32 bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-900">
            {summary ? `$${summary.revenue?.toLocaleString?.() ?? summary.revenue}` : '—'}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-medium text-gray-800 mb-2">Active Users</h3>
          <div className="h-32 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-lg border border-gray-100 flex items-center justify-center text-gray-900">
            {summary ? summary.activeUsers : '—'}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-medium text-gray-800 mb-2">Recent Events</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(summary?.recentEvents ?? []).map((e) => (
            <div key={e.id} className="p-3 rounded-lg border border-gray-100">
              <div className="font-medium text-gray-900">{e.title}</div>
              <div className="text-sm text-gray-600">{e.date} • {e.location}</div>
            </div>
          ))}
          {!loading && (!summary?.recentEvents || summary.recentEvents.length === 0) && (
            <div className="text-gray-600">No recent events.</div>
          )}
        </div>
      </div>
    </div>
  );
}
