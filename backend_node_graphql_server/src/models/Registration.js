import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * Registration schema:
 * - event: ref Event (required)
 * - user: ref User (required)
 * - status: 'going' | 'interested' | 'cancelled'
 * - notes: optional message from user
 *
 * Indexes:
 * - Compound unique index on { event, user } to prevent duplicates
 * - event index to quickly count/find attendees by event
 * - user index to list a user's registrations
 */
const RegistrationSchema = new Schema(
  {
    event: { type: Types.ObjectId, ref: 'Event', required: true, index: true },
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['going', 'interested', 'cancelled'], default: 'going', index: true },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  {
    strict: true,
    timestamps: true,
    versionKey: false,
  }
);

// Enforce uniqueness of a user's registration per event
RegistrationSchema.index({ event: 1, user: 1 }, { unique: true, name: 'uniq_event_user' });

export const Registration = model('Registration', RegistrationSchema);
export default Registration;
