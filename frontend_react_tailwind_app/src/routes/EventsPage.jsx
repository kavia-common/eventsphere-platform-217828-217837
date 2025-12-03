import React, { useMemo, useState } from 'react';
import EventCard from '../components/EventCard';
import Modal from '../components/Modal';
import CreateEditEvent from './CreateEditEvent';

// PUBLIC_INTERFACE
export default function EventsPage() {
  // demo events
  const events = useMemo(
    () => [
      { id: '1', title: 'React Summit 2025', date: '2025-12-12', location: 'Online', tags: ['React', 'Frontend'] },
      { id: '2', title: 'GraphQL Live', date: '2025-12-20', location: 'San Francisco, CA', tags: ['GraphQL', 'API'] },
      { id: '3', title: 'Tailwind Mastery Workshop', date: '2026-01-05', location: 'Remote', tags: ['TailwindCSS', 'Design Systems'] },
    ],
    []
  );

  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Browse all upcoming events.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + Create Event
        </button>
      </div>

      {/* Grid of events */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((ev) => (
          <EventCard
            key={ev.id}
            id={ev.id}
            title={ev.title}
            date={ev.date}
            location={ev.location}
            tags={ev.tags}
            onRegister={() => alert(`Registered for ${ev.title}`)}
          />
        ))}
      </div>

      {/* Create Event Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create New Event"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                // hook to submit inside CreateEditEvent (placeholder)
                const form = document.querySelector('#create-edit-event-form');
                form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                setOpen(false);
              }}
            >
              Save Event
            </button>
          </div>
        }
      >
        <CreateEditEvent />
      </Modal>
    </div>
  );
}
