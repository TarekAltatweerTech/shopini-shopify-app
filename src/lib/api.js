const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

/**
 * Thrown for any non-2xx response. `body` carries the backend's JSON, which for
 * a 422 holds `errors` keyed by field name.
 */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body ?? {};
  }

  /** Field-keyed validation messages from a 422, or an empty object. */
  get fieldErrors() {
    const errors = this.body.errors ?? {};
    return Object.fromEntries(
      Object.entries(errors).map(([field, messages]) => [
        field,
        Array.isArray(messages) ? messages[0] : String(messages),
      ]),
    );
  }
}

/**
 * True once App Bridge has initialised. False means the page was opened
 * outside the Shopify admin, which is a different problem from a failed
 * request and has to be reported differently.
 */
export function hasAppBridge() {
  return typeof window !== 'undefined' && typeof window.shopify?.idToken === 'function';
}

/**
 * Call the Laravel backend.
 *
 * Authentication is an App Bridge session token in the Authorization header and
 * nothing else. The token lives about a minute, so it is fetched per request:
 * holding one in state guarantees intermittent 401s once a merchant leaves the
 * tab open. There is no cookie and no stored credential anywhere in this app —
 * third-party storage is blocked inside the admin iframe regardless.
 *
 * The shop is never sent by us. The backend reads it out of the signed token,
 * so a shop parameter in a body or query string would be ignored.
 */
export async function api(path, options = {}) {
  if (!hasAppBridge()) {
    throw new ApiError('App Bridge is not available.', 0, {});
  }

  const token = await window.shopify.idToken();

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    // The backend authenticates by bearer token only and refuses credentialed
    // origins. Sending cookies here would break CORS outright.
    credentials: 'omit',
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body.message ?? 'Request failed.', response.status, body);
  }

  return body;
}

export function get(path) {
  return api(path);
}

export function post(path, payload) {
  return api(path, { method: 'POST', body: JSON.stringify(payload) });
}

/* -------------------------------------------------------------------------- */
/*                                  Endpoints                                  */
/* -------------------------------------------------------------------------- */

/**
 * Must be the first call on every load. Besides reporting state, this is what
 * completes installation: on the first open the backend trades the session
 * token for a Shopify access token.
 */
export const fetchSession = () => get('/api/shopify/session');

export const fetchOnboardingOptions = () => get('/api/shopify/onboarding/options');

export const submitOnboarding = (payload) => post('/api/shopify/onboarding', payload);

export const linkExistingAccount = (payload) => post('/api/shopify/link', payload);

export const fetchOrders = ({ status, page = 1, perPage = 20 } = {}) => {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (status) params.set('status', status);
  return get(`/api/shopify/orders?${params}`);
};

export const fetchOrder = (id) => get(`/api/shopify/orders/${id}`);
