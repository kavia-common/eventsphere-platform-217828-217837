import React, { useMemo, useState } from 'react';
import EventCard from '../components/EventCard';
import { TextInput, DateInput, Select } from '../components/inputs';

/**
 * PUBLIC_INTERFACE
 * EventsList: Displays searchable/filterable list of events.
 */
export default function EventsList() {
  const allEvents = useMemo(
    () => [
      { id: '1', title: 'React Summit 2025', date: '2025-12-12', location: 'Online', tags: ['React', 'Frontend'], type: 'online' },
      { id: '2', title: 'GraphQL Live', date: '2025-12-20', location: 'San Francisco, CA', tags: ['GraphQL', 'API'], type: 'in-person' },
      { id: '3', title: 'Tailwind Mastery Workshop', date: '2026-01-05', location: 'Remote', tags: ['TailwindCSS', 'Design Systems'], type: 'online' },
    ],
    []
  );

  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [after, setAfter] = useState('');

  const filtered = allEvents.filter((e) => {
    const matchesQ = q ? e.title.toLowerCase().includes(q.toLowerCase()) || e.location.toLowerCase().includes(q.toLowerCase()) : true;
    const matchesType = type === 'all' ? true : e.type === type;
    const matchesDate = after ? e.date >= after : true;
    return matchesQ && matchesType && matchesDate;
  });

  return (
    <div className="p-6">
      <div className="flex items-end flex-wrap gap-4 mb-5">
        <div className="w-full sm:w-64">
          <TextInput label="Search" name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events..." />
        </div>
        <div className="w-full sm:w-52">
          <Select
            label="Type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'in-person', label: 'In-person' },
              { value: 'online', label: 'Online' },
            ]}
          />
        </div>
        <div className="w-full sm:w-56">
          <DateInput label="After date" name="after" value={after} onChange={(e) => setAfter(e.target.value)} type="date" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ev) => (
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
    </div>
  );
}
