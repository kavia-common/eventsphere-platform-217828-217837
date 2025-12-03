import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * Event schema:
 * - title, description, location, type
 * - date: single-date for the event (ISO date string is stored as Date)
 * - startDate/endDate: optional range for multi-day events
 * - imageUrl, tags[]
 * - organizer: ref to User
 *
 * Indexes:
 * - date (ascending) for sorting/upcoming
 * - startDate and endDate to support ranged queries
 * - type filter
 * - organizer for organizer's events
 * - text index on title, description, location
 */
const EventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, trim: true, maxlength: 5000 },
    location: { type: String, trim: true, maxlength: 240 },
    type: { type: String, enum: ['in-person', 'online', 'hybrid'], default: 'in-person', index: true },
    date: { type: Date, index: true },
    startDate: { type: Date, index: true },
    endDate: { type: Date, index: true },
    imageUrl: { type: String, trim: true },
    tags: { type: [String], default: [], index: true },
    organizer: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    strict: true,
    timestamps: true,
    versionKey: false,
  }
);

// Text index for search
EventSchema.index(
  { title: 'text', description: 'text', location: 'text' },
  { name: 'event_text_search', weights: { title: 5, description: 2, location: 3 } }
);

// Guard: if range is provided, ensure startDate <= endDate
EventSchema.pre('save', function validateDateRange(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error('startDate must be before or equal to endDate'));
  }
  return next();
});

export const Event = model('Event', EventSchema);
export default Event;
