import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * EventCard: Displays an event summary with title, date, location, tags, and CTA.
 * Props:
 * - id: string | number (required for link)
 * - title: string
 * - date: string (formatted)
 * - location: string
 * - tags: string[] (optional)
 * - imageUrl: string (optional)
 * - onRegister: function (optional)
 */
export default function EventCard({
  id,
  title,
  date,
  location,
  tags = [],
  imageUrl,
  onRegister,
}) {
  return (
    <article className="card overflow-hidden">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-40 w-full bg-gradient-to-r from-blue-500/10 to-gray-50" />
      )}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{title}</h3>
        <div className="text-sm text-gray-600">
          <span className="mr-3">📅 {date}</span>
          <span>📍 {location}</span>
        </div>
        {tags?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-blue-50 text-primary px-2 py-0.5 text-xs border border-blue-100"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="pt-2 flex items-center justify-between">
          <Link
            to={`/events/${id}`}
            className="text-sm text-primary hover:underline"
            aria-label={`View details for ${title}`}
          >
            View details
          </Link>
          {onRegister && (
            <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={onRegister}>
              Register
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
