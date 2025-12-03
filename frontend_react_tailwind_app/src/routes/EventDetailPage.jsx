import React from 'react';
import { useParams } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function EventDetailPage() {
  /** Event detail placeholder component using route params. */
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Event Details</h1>
      <p className="text-gray-600 mt-2">Viewing event ID: <span className="font-mono">{id}</span></p>
    </div>
  );
}
