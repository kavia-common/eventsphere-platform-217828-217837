"use strict";

/**
 * Auth utilities: JWT sign/verify, password hashing, role guards, and context extraction.
 * Uses env.JWT_SECRET for signing. Exposes helpers to protect resolvers with RBAC.
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// PUBLIC_INTERFACE
function signToken(payload, options = {}) {
  /** Signs a JWT with the given payload.
   * Requires process.env.JWT_SECRET to be set via .env.
   * options: jwt.sign options like expiresIn (default 7d)
   * Returns: string token
   */
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not set in environment");
  }
  const defaultOptions = { expiresIn: "7d" };
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
}

// PUBLIC_INTERFACE
function verifyToken(token) {
  /** Verifies a JWT and returns the decoded payload or throws on invalid token. */
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not set in environment");
  }
  return jwt.verify(token, secret);
}

// PUBLIC_INTERFACE
async function hashPassword(plain) {
  /** Hashes a password with bcrypt. */
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

// PUBLIC_INTERFACE
async function comparePassword(plain, hash) {
  /** Compares a plain password with a stored bcrypt hash. */
  return bcrypt.compare(plain, hash);
}

// PUBLIC_INTERFACE
function getAuthFromRequest(req) {
  /**
   * Extracts user info from Authorization header "Bearer <token>".
   * Returns { user: { id, role, email, name } | null, token | null }
   */
  try {
    const authHeader = req?.headers?.authorization || "";
    const parts = authHeader.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      const token = parts[1];
      const decoded = verifyToken(token);
      const { id, role, email, name } = decoded || {};
      if (id && role) {
        return { user: { id, role, email, name }, token };
      }
    }
    return { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}

// PUBLIC_INTERFACE
function requireAuth(ctx) {
  /** Ensures ctx.user is present; throws otherwise. */
  if (!ctx?.user?.id) {
    throw new Error("Unauthorized");
  }
  return ctx.user;
}

// PUBLIC_INTERFACE
function requireRole(ctx, roles) {
  /** Ensures user has one of the allowed roles; throws otherwise. */
  const user = requireAuth(ctx);
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return user;
}

// PUBLIC_INTERFACE
function requireOwnerOrRole(ctx, ownerId, roles = []) {
  /**
   * Ensures the user is owner (matches ownerId) or has one of roles.
   * ownerId can be ObjectId or string; we compare toString().
   */
  const user = requireAuth(ctx);
  const isOwner = ownerId && user?.id && String(ownerId) === String(user.id);
  const allowedRole = roles.length ? roles.includes(user.role) : false;
  if (!isOwner && !allowedRole) {
    throw new Error("Forbidden: not owner or insufficient role");
  }
  return user;
}

module.exports = {
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getAuthFromRequest,
  requireAuth,
  requireRole,
  requireOwnerOrRole,
};
