import { AppError, normalizeActionError } from "@/lib/utils/error";

export const GLOBAL_CACHE_TAG = "global";

/**
 * Prepares headers with default values.
 */
const prepareHeaders = (headersInit) => {
  const headers = new Headers(headersInit);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return headers;
};

/**
 * Processes the request body and sets appropriate Content-Type if needed.
 */
const prepareBody = (body, headers) => {
  if (body === undefined || body === null) return undefined;

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }

  if (body instanceof Blob) {
    if (body.type && !headers.has("Content-Type")) {
      headers.set("Content-Type", body.type);
    }
    return body;
  }

  if (body instanceof ArrayBuffer) {
    return body;
  }

  if (typeof body === "object") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return JSON.stringify(body);
  }

  return body;
};

/**
 * Determines the Next.js caching strategy based on the HTTP method.
 */
const getNextConfig = (method, url, customNext = {}) => {
  const urlWithParams = new URL(url);
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(
    method.toUpperCase(),
  );

  if (isMutation) {
    return { revalidate: 0, ...customNext };
  }

  const defaultTags = [
    GLOBAL_CACHE_TAG,
    urlWithParams.pathname + urlWithParams.search,
  ];

  return {
    revalidate: 5 * 60,
    ...customNext,
    tags: [...new Set([...defaultTags, ...(customNext.tags ?? [])])],
  };
};

const mergeNextConfig = (defaultNext, requestNext) => {
  const tags = [...(defaultNext?.tags ?? []), ...(requestNext?.tags ?? [])];

  return {
    ...defaultNext,
    ...requestNext,
    ...(tags.length > 0 ? { tags: [...new Set(tags)] } : {}),
  };
};

const createInterceptorManager = () => {
  const interceptors = new Map();
  let nextId = 0;

  return {
    use(interceptor) {
      const id = nextId;
      nextId += 1;
      interceptors.set(id, interceptor);
      return id;
    },
    eject(id) {
      interceptors.delete(id);
    },
    hasInterceptors() {
      return interceptors.size > 0;
    },
    async run(initialValue) {
      let value = initialValue;

      for (const interceptor of interceptors.values()) {
        value = await interceptor(value);
      }

      return value;
    },
  };
};

/**
 * Handles the response parsing and error throwing.
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorPayload;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        errorPayload = await response.json();
      } else {
        errorPayload = await response.text();
      }
    } catch {
      errorPayload = response.statusText;
    }

    const error = normalizeActionError({
      status: response.status,
      statusText: response.statusText,
      payload: errorPayload,
    });

    throw new AppError(error.statusCode ?? response.status, error.message, {
      code: error.code,
      field: error.field,
      fields: error.fields,
      details: error.details,
      source: "api",
      requestId: error.requestId,
    });
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

/**
 * Core fetch wrapper that composes the helper functions.
 */
const executeRequest = async (url, options = {}, interceptors) => {
  const {
    body,
    headers: headersInit,
    method = "GET",
    next,
    ...restOptions
  } = options;

  const headers = prepareHeaders(headersInit);
  const requestBody = prepareBody(body, headers);
  let config = {
    url,
    method,
    headers,
    body: requestBody,
    next,
    ...restOptions,
  };

  let errorResponse;

  try {
    if (interceptors) {
      config = await interceptors.request.run(config);
    }

    config.next = getNextConfig(config.method, config.url, config.next);

    const { url: requestUrl, ...requestOptions } = config;
    const response = await fetch(requestUrl, requestOptions);
    let responseContext = { config, response };

    if (interceptors) {
      responseContext = await interceptors.response.run(responseContext);
    }

    if (interceptors?.error.hasInterceptors()) {
      errorResponse = responseContext.response.clone();
    }
    return await handleResponse(responseContext.response);
  } catch (error) {
    if (interceptors) {
      await interceptors.error.run({
        config,
        error,
        response: errorResponse,
      });
    }

    throw error;
  }
};

export const fetcher = (url, options = {}) => executeRequest(url, options);

/**
 * Creates a request client with shared URL and fetch defaults.
 * Per-request options take precedence; headers and Next.js options are merged.
 */
export const createApiRequest = ({
  baseUrl,
  headers: defaultHeaders,
  next: defaultNext,
  query: defaultQuery,
  ...defaultOptions
} = {}) => {
  const interceptors = {
    request: createInterceptorManager(),
    response: createInterceptorManager(),
    error: createInterceptorManager(),
  };

  const resolveUrl = (url, requestQuery) => {
    const query = {
      ...(typeof defaultQuery === "function" ? defaultQuery() : defaultQuery),
      ...requestQuery,
    };
    const hasQuery = Object.values(query).some(
      (value) => value !== null && value !== undefined,
    );

    if (!baseUrl && !hasQuery) return url;

    const resolvedUrl = baseUrl
      ? new URL(url, `${baseUrl.replace(/\/$/, "")}/`)
      : new URL(url);

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        resolvedUrl.searchParams.set(key, String(value));
      }
    }

    return resolvedUrl.toString();
  };

  const request = (method, url, body, options = {}) => {
    const {
      headers: requestHeaders,
      next: requestNext,
      query,
      ...requestOptions
    } = options;
    const headers = new Headers(defaultHeaders);

    new Headers(requestHeaders).forEach((value, key) => {
      headers.set(key, value);
    });

    return executeRequest(
      resolveUrl(url, query),
      {
        ...defaultOptions,
        ...requestOptions,
        headers,
        next: mergeNextConfig(defaultNext, requestNext),
        method,
        body,
      },
      interceptors,
    );
  };

  return {
    interceptors,
    GET: (url, options) => request("GET", url, undefined, options),
    POST: (url, body, options) => request("POST", url, body, options),
    PUT: (url, body, options) => request("PUT", url, body, options),
    PATCH: (url, body, options) => request("PATCH", url, body, options),
    DELETE: (url, options) => request("DELETE", url, undefined, options),
  };
};

export const apiRequest = createApiRequest();
