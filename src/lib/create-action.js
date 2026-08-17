import "server-only";

import { AppError, handleError } from "@/lib/utils/error";

// This app has no auth layer, so only the public tier exists.
export const createAction = {
  // Must stay an async function: Next.js rejects non-async exports from
  // "use server" modules.
  public(cb) {
    return async (...args) => handleError(() => cb(...args));
  },
};

/**
 * Server-side helper: takes the action result and falls back to a safe value,
 * so a failed action degrades the UI instead of breaking the render.
 */
export const actionData = async (result, fallback = null) => {
  const settled = await result;

  return settled.success ? (settled.data ?? fallback) : fallback;
};

/**
 * Server-side helper for when a render cannot continue without the data:
 * rethrows as an `AppError` so the nearest error boundary handles it.
 */
export const unwrapAction = async (result) => {
  const settled = await result;

  if (!settled.success) {
    const { message, statusCode, ...options } = settled.error;
    throw new AppError(statusCode ?? 500, message, options);
  }

  return settled.data;
};
