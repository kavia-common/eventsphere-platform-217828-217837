import mongoose from 'mongoose';

const { Schema, model, Types } = mongoose;

/**
 * Message schema (for event chat rooms or global rooms):
 * - roomId: string identifier for chat room (e.g., event:<eventId> or 'general')
 * - event: optional ref to Event when the room is event-specific
 * - user: ref to User who sent the message
 * - text: message content
 *
 * Indexes:
 * - roomId + createdAt compound for fast recent message fetch per room
 * - event index for event-related queries
 * - createdAt index for chronological operations
 */
const MessageSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true, trim: true },
    event: { type: Types.ObjectId, ref: 'Event', index: true },
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  {
    strict: true,
    timestamps: true,
    versionKey: false,
  }
);

// Compound index to optimize queries: find recent messages in a room
MessageSchema.index({ roomId: 1, createdAt: -1 }, { name: 'room_recent_messages' });
// Additional createdAt index for generic chronological queries
MessageSchema.index({ createdAt: -1 });

export const Message = model('Message', MessageSchema);
export default Message;
