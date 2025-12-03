import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * User schema:
 * - name: optional display name
 * - email: unique identifier (required, indexed)
 * - passwordHash: hashed password (required for auth workflows)
 * - avatarUrl: optional profile avatar
 * - role: user role (e.g., 'user', 'admin')
 *
 * Notes:
 * - timestamps adds createdAt and updatedAt
 * - strict mode prevents undeclared fields
 * - indexes: unique index on email, and text index on name+email for search
 */
const UserSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  },
  {
    strict: true,
    timestamps: true,
    versionKey: false,
  }
);

// Helpful compound text index for search
UserSchema.index({ name: 'text', email: 'text' }, { name: 'user_text_search' });

export const User = model('User', UserSchema);
export default User;
