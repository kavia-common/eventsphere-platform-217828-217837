import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import EventCard from '../components/EventCard';
import { TextInput, DateInput, Select } from '../components/inputs';
import { EVENTS_BROWSE_QUERY } from '../graphql/queries';

/**
 * PUBLIC_INTERFACE
 * EventsList: Displays searchable/filterable list of events via GraphQL.
 */
export default function EventsList() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [after, setAfter] = useState('');

  // Map UI type to backend filter (send null/undefined when "all")
  const vars = useMemo(
    () => ({
      query: q || null,
      type: type === 'all' ? null : type,
      afterDate: after || null,
      limit: 24,
      offset: 0,
    }),
    [q, type, after]
  );

  const { data, loading, error, refetch } = useQuery(EVENTS_BROWSE_QUERY, {
    variables: vars,
    fetchPolicy: 'cache-and-network',
  });

  const events = data?.events ?? [];

  return (
    <div className="p-6">
      <div className="flex items-end flex-wrap gap-4 mb-5">
        <div className="w-full sm:w-64">
          <TextInput
            label="Search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events..."
          />
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
              { value: 'hybrid', label: 'Hybrid' },
            ]}
          />
        </div>
        <div className="w-full sm:w-56">
          <DateInput
            label="After date"
            name="after"
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            type="date"
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => refetch(vars)}
        >
          Apply
        </button>
      </div>

      {loading && <div>Loading events…</div>}
      {error && (
        <div className="text-error">
          Failed to load events: {error.message}
        </div>
      )}

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
        {!loading && events.length === 0 && (
          <div className="text-gray-600">No events found.</div>
        )}
      </div>
    </div>
  );
}
