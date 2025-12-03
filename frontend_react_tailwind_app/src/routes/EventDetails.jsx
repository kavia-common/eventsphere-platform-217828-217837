import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * EventDetails: Shows details and allows RSVP actions (placeholder).
 */
export default function EventDetails() {
  const { id } = useParams();

  const handleRSVP = (status) => {
    // Replace with GraphQL mutation
    alert(`RSVP '${status}' for event ${id}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Event #{id}</h1>
        <p className="text-gray-600">Detailed info about the event, speakers, schedule, etc.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={() => handleRSVP('going')}>I’m Going</button>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          onClick={() => handleRSVP('interested')}
        >
          Interested
        </button>
      </div>
    </div>
  );
}
