import React from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { EVENT_BY_ID_QUERY } from '../graphql/queries';
import { RSVP_EVENT_MUTATION } from '../graphql/mutations';

/**
 * PUBLIC_INTERFACE
 * EventDetails: Shows details and allows RSVP actions using GraphQL.
 */
export default function EventDetails() {
  const { id } = useParams();

  const { data, loading, error } = useQuery(EVENT_BY_ID_QUERY, {
    variables: { id },
  });

  const [rsvpMutation, { loading: rsvpLoading }] = useMutation(RSVP_EVENT_MUTATION, {
    variables: { eventId: id },
    // Update cache to reflect RSVP changes immediately
    update(cache, { data: r }) {
      const updated = r?.rsvp;
      if (!updated) return;
      cache.writeQuery({
        query: EVENT_BY_ID_QUERY,
        variables: { id },
        data: { event: updated },
      });
    },
  });

  const handleRSVP = async (status) => {
    try {
      await rsvpMutation({ variables: { eventId: id, status } });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(`Failed to RSVP: ${e.message}`);
    }
  };

  if (loading) return <div>Loading event…</div>;
  if (error) return <div className="text-error">Failed to load event: {error.message}</div>;

  const ev = data?.event;
  if (!ev) return <div>Event not found.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{ev.title}</h1>
        <p className="text-gray-600">
          {ev.date} • {ev.location} • {ev.type}
        </p>
        {ev.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {ev.tags.map((t) => (
              <span key={t} className="inline-flex items-center rounded-full bg-blue-50 text-primary px-2 py-0.5 text-xs border border-blue-100">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-gray-700 mt-3">{ev.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="btn-primary"
          disabled={rsvpLoading}
          onClick={() => handleRSVP('going')}
        >
          {ev.myRsvp === 'going' ? '✅ Going' : "I'm Going"}
        </button>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          disabled={rsvpLoading}
          onClick={() => handleRSVP('interested')}
        >
          {ev.myRsvp === 'interested' ? '⭐ Interested' : 'Interested'}
        </button>
        <div className="text-sm text-gray-600">Attendees: {ev.attendeesCount ?? '-'}</div>
      </div>
    </div>
  );
}
