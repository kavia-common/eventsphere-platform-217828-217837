import React, { useMemo, useState } from 'react';
import EventCard from '../components/EventCard';
import Modal from '../components/Modal';
import TextInput from '../components/inputs/TextInput';
import DateInput from '../components/inputs/DateInput';
import TextArea from '../components/inputs/TextArea';
import Select from '../components/inputs/Select';

// PUBLIC_INTERFACE
export default function EventsPage() {
  // demo events
  const events = useMemo(
    () => [
      {
        id: '1',
        title: 'React Summit 2025',
        date: '2025-12-12',
        location: 'Online',
        tags: ['React', 'Frontend'],
      },
      {
        id: '2',
        title: 'GraphQL Live',
        date: '2025-12-20',
        location: 'San Francisco, CA',
        tags: ['GraphQL', 'API'],
      },
      {
        id: '3',
        title: 'Tailwind Mastery Workshop',
        date: '2026-01-05',
        location: 'Remote',
        tags: ['TailwindCSS', 'Design Systems'],
      },
    ],
    []
  );

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    type: 'in-person',
    description: '',
  });
  const [errors, setErrors] = useState({});

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title) e.title = 'Title is required';
    if (!form.date) e.date = 'Date is required';
    if (!form.location) e.location = 'Location is required';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length === 0) {
      // Replace with GraphQL mutation to create event
      // For now, just close modal
      setOpen(false);
    }
  };

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
            <button type="submit" form="create-event-form" className="btn-primary">
              Save Event
            </button>
          </div>
        }
      >
        <form id="create-event-form" onSubmit={submit} className="space-y-4">
          <TextInput
            label="Title"
            name="title"
            value={form.title}
            onChange={setField('title')}
            placeholder="e.g., React Summit 2025"
            error={errors.title}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Date"
              name="date"
              value={form.date}
              onChange={setField('date')}
              type="date"
              error={errors.date}
            />
            <TextInput
              label="Location"
              name="location"
              value={form.location}
              onChange={setField('location')}
              placeholder="City, Country or Online"
              error={errors.location}
            />
          </div>
          <Select
            label="Type"
            name="type"
            value={form.type}
            onChange={setField('type')}
            options={[
              { value: 'in-person', label: 'In-person' },
              { value: 'online', label: 'Online' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
            helper="Select the event format"
          />
          <TextArea
            label="Description"
            name="description"
            value={form.description}
            onChange={setField('description')}
            rows={4}
            helper="Add details about the event agenda, speakers, and requirements."
          />
        </form>
      </Modal>
    </div>
  );
}
