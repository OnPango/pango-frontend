import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

export interface MockRequest {
  method: string;
  path: string;
  body: unknown;
}

export interface MockResponse {
  status: number;
  data?: unknown;
}

export type MockHandler = (request: MockRequest) => MockResponse;

/** Route table keyed by `"<METHOD> <path>"`, e.g. `"POST /auth/login"`. */
export type MockRoutes = Record<string, MockHandler>;

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

const randomLatency = () => 250 + Math.random() * 350;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Path relative to the API base URL, without query string. */
function resolvePath(config: InternalAxiosRequestConfig): string {
  let url = config.url ?? '';
  if (config.baseURL && url.startsWith(config.baseURL)) url = url.slice(config.baseURL.length);
  if (/^https?:\/\//.test(url)) url = new URL(url).pathname;
  const path = url.split('?')[0] ?? '';
  return path.startsWith('/') ? path : `/${path}`;
}

/** By the time the adapter runs, Axios has already serialized the body to a JSON string. */
function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/**
 * Axios adapter that answers requests from a route table instead of the network.
 * Everything above it (interceptors, API functions, mappers, React Query) runs for real.
 */
export function createMockAdapter(routes: MockRoutes): AxiosAdapter {
  return async (config) => {
    const method = (config.method ?? 'get').toUpperCase();
    const path = resolvePath(config);
    const handler = routes[`${method} ${path}`];

    await sleep(randomLatency());

    const result: MockResponse = handler
      ? handler({ method, path, body: parseBody(config.data) })
      : { status: 404, data: { message: `Mock: ${method} ${path} no está implementado.` } };

    const response: AxiosResponse = {
      data: result.data ?? null,
      status: result.status,
      statusText: STATUS_TEXT[result.status] ?? '',
      headers: {},
      config,
      request: {},
    };

    console.info(`[mock] ${method} ${path} → ${result.status}`);

    const validateStatus =
      config.validateStatus ?? ((status: number) => status >= 200 && status < 300);
    if (validateStatus(response.status)) return response;

    throw new AxiosError(
      `Request failed with status code ${response.status}`,
      response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    );
  };
}
