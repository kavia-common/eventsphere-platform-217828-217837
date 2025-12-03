import dotenv from 'dotenv';

dotenv.config();

/**
 * PUBLIC_INTERFACE
 * getEnv: Fetch an environment variable with optional default.
 */
export function getEnv(key, def = undefined) {
  const v = process.env[key];
  return v === undefined || v === '' ? def : v;
}

/**
 * PUBLIC_INTERFACE
 * requiredEnv: Fetch an environment variable or throw a descriptive error.
 */
export function requiredEnv(key) {
  const v = process.env[key];
  if (v === undefined || v === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return v;
}

export default { getEnv, requiredEnv };
