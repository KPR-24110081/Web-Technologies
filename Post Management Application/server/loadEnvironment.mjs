/**
 * Minimal .env loader written from scratch so the project needs no `dotenv`
 * dependency. Two rules that matter:
 *
 *  1. A missing .env file is NOT an error. The process may be configured purely
 *     through real environment variables (Docker, CI, hosting platforms).
 *  2. Real environment variables always WIN over .env values, so a single value
 *     can be overridden on the command line without editing the file.
 */
import process from 'node:process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// This file lives at server/loadEnvironment.mjs, so its own directory IS the
// server root. (Resolving '..' here would wrongly point one level too high.)
const serverRoot = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(serverRoot, '.env');

/**
 * Parses the contents of a .env file into a plain object.
 * Supports `KEY=value`, `#` comments, inline comments and quoted values.
 * @param {string} contents
 * @returns {Record<string, string>}
 */
export function parseEnv(contents) {
  const parsed = {};

  for (const rawLine of String(contents).split(/\r?\n/)) {
    const line = rawLine.trim();

    // Skip blank lines and full-line comments.
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (!key) continue;

    let value = line.slice(separator + 1).trim();

    // Strip a matching pair of surrounding quotes so values may contain spaces/#.
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value);

    if (quoted) {
      value = quoted[2];
      // Allow escaped newlines/tabs inside double quotes.
      if (quoted[1] === '"') {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"');
      }
    } else {
      // Unquoted values end at an inline ` #` comment.
      value = value.replace(/\s+#.*$/, '').trim();
    }

    parsed[key] = value;
  }

  return parsed;
}

/**
 * Populates process.env from a .env file without clobbering existing values.
 * @param {string} [filePath]
 * @returns {{ loaded: boolean, path: string, applied: string[] }}
 */
export function loadEnvironment(filePath = envFile) {
  if (!existsSync(filePath)) {
    console.warn(`[env] No .env at ${filePath} - falling back to ambient env variables.`);
    return { loaded: false, path: filePath, applied: [] };
  }

  const parsed = parseEnv(readFileSync(filePath, 'utf8'));

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return { loaded: true, path: filePath, applied: Object.keys(parsed) };
}

/** Reads a required variable, failing fast with an actionable message. */
export function requireEnv(key, fallback) {
  const value = process.env[key] ?? fallback;

  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable ${key}. Add it to server/.env (see .env.example).`,
    );
  }

  return value;
}

/** Reads an optional variable with a default. */
export function optionalEnv(key, fallback = '') {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

/** Parses a boolean-ish environment value ("1", "true", "yes", "on"). */
export function boolEnv(key, fallback = false) {
  const value = process.env[key];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export { envFile, serverRoot };
