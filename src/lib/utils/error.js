import { capitalizeFirst } from "./string";

/**
 * @typedef {Record<string, string[]>} ErrorFields
 * @typedef {Object} ActionError
 * @property {string} message
 * @property {number} [statusCode]
 * @property {string} [code]
 * @property {string} [field]
 * @property {ErrorFields} [fields]
 * @property {unknown} [details]
 * @property {"api" | "app" | "unknown"} [source]
 * @property {string} [requestId]
 */

const STATUS_TEXT = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  408: "Request Timeout",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

function isServer() {
  return typeof window === "undefined";
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function getNumber(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isInteger(parsed)) return parsed;
    }
  }

  return undefined;
}

function capitalizeErrorFields(fields) {
  if (!fields) return undefined;

  return Object.fromEntries(
    Object.entries(fields).map(([field, messages]) => [
      field,
      messages.map(capitalizeFirst),
    ]),
  );
}

function capitalizeActionErrorMessageAndFields(error) {
  return {
    ...error,
    message: capitalizeFirst(error.message),
    fields: capitalizeErrorFields(error.fields),
  };
}

function normalizeFields(input) {
  if (Array.isArray(input)) {
    const fields = {};

    for (const item of input) {
      if (!isRecord(item)) continue;

      const field =
        getString(item, ["field", "path", "name", "param"]) ??
        (Array.isArray(item.path)
          ? item.path.filter((part) => typeof part === "string").join(".")
          : undefined);
      const message = getString(item, ["message", "error", "msg"]);

      if (field && message) {
        fields[field] = [...(fields[field] ?? []), message];
      }
    }

    return Object.keys(fields).length > 0 ? fields : undefined;
  }

  if (!isRecord(input)) return undefined;

  const fields = {};
  const walk = (record, path) => {
    for (const [key, value] of Object.entries(record)) {
      const nextPath = [...path, key];
      if (typeof value === "string") {
        fields[nextPath.join(".")] = [value];
      } else if (Array.isArray(value)) {
        const messages = value.filter((message) => typeof message === "string");
        if (messages.length > 0) fields[nextPath.join(".")] = messages;
      } else if (isRecord(value)) {
        walk(value, nextPath);
      }
    }
  };
  walk(input, []);

  return Object.keys(fields).length > 0 ? fields : undefined;
}

function getFields(record) {
  return (
    normalizeFields(record.fields) ??
    normalizeFields(record.fieldErrors) ??
    normalizeFields(record.field_errors) ??
    normalizeFields(record.errors)
  );
}

function parseJsonMessage(message) {
  try {
    const parsed = JSON.parse(message);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function fromRecord(record) {
  const nestedError = isRecord(record.error) ? record.error : undefined;
  const payload = isRecord(record.payload)
    ? record.payload
    : (nestedError ?? record);
  const payloadText =
    typeof record.payload === "string" && record.payload.trim().length > 0
      ? record.payload
      : undefined;
  const statusCode =
    getNumber(record, ["statusCode", "status"]) ??
    getNumber(payload, ["statusCode", "status"]);
  const statusText =
    getString(record, ["statusText"]) ?? getString(payload, ["statusText"]);
  const message =
    // `status_message` is TMDB's error field.
    getString(payload, ["message", "error", "status_message"]) ??
    getString(record, ["message", "error", "status_message"]) ??
    payloadText ??
    statusText ??
    (statusCode ? STATUS_TEXT[statusCode] : undefined) ??
    "Unknown error";
  const field = getString(payload, ["field", "cause"]);
  const fields = getFields(payload);

  return {
    message,
    statusCode,
    code: getString(payload, ["code", "errorCode", "error_code"]),
    field,
    fields: fields ?? (field ? { [field]: [message] } : undefined),
    details: payload.details ?? payload.errors,
    source: statusCode ? "api" : "unknown",
    requestId: getString(payload, ["requestId", "request_id", "traceId"]),
  };
}

// A lightweight custom error class
export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    // If no message is provided, it falls back to the standard text (e.g., "Conflict" for 409)
    super(message || STATUS_TEXT[statusCode] || "Unknown Error");
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code;
    this.field = options.field;
    this.fields = options.fields;
    this.details = options.details;
    this.source = options.source ?? "app";
    this.requestId = options.requestId;
  }
}

export function normalizeActionError(error) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      field: error.field,
      fields:
        error.fields ??
        (error.field ? { [error.field]: [error.message] } : undefined),
      details: error.details,
      source: error.source ?? "app",
      requestId: error.requestId,
    };
  }

  if (error instanceof Error) {
    const parsed = parseJsonMessage(error.message);
    if (parsed) return fromRecord(parsed);

    return {
      message: error.message,
      source: "unknown",
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      source: "unknown",
    };
  }

  if (isRecord(error)) {
    return fromRecord(error);
  }

  return {
    message: "Unknown error",
    source: "unknown",
  };
}

export async function handleError(fn) {
  try {
    const result = typeof fn === "function" ? await fn() : await fn;
    return { success: true, data: result };
  } catch (error) {
    const normalizedError = capitalizeActionErrorMessageAndFields(
      normalizeActionError(error),
    );

    if (isServer()) {
      console.error(normalizedError);
    }

    return { success: false, error: normalizedError };
  }
}
