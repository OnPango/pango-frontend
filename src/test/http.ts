import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { authHttp } from '@/core/api/authHttp';
import { http } from '@/core/api/http';

/** What a stubbed endpoint answers: a body with its status, or a function of the request. */
export type StubResponse = { status?: number; data?: unknown };
type StubHandler = StubResponse | ((request: StubbedRequest) => StubResponse);

/** `'POST /auth/login/resend'`: method in capitals, path without the API base URL. */
export type StubRoutes = Record<string, StubHandler>;

export interface StubbedRequest {
  method: string;
  url: string;
  headers: Record<string, unknown>;
  body: unknown;
}

const clients = [http, authHttp];
const originalAdapters = clients.map((client) => client.defaults.adapter);

function toRequest(config: InternalAxiosRequestConfig): StubbedRequest {
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  return {
    method: (config.method ?? 'get').toUpperCase(),
    url: config.url ?? '',
    headers: config.headers.toJSON(),
    body,
  };
}

/**
 * Answers the API from `routes` instead of the network. Only the Axios adapter is replaced, so the
 * real clients, interceptors (`X-Tenant`…) and API functions still run. A request with no route
 * fails the test. Returns the requests made, in order, to assert on what was sent.
 */
export function stubApi(routes: StubRoutes): StubbedRequest[] {
  const requests: StubbedRequest[] = [];

  const adapter: AxiosAdapter = async (config) => {
    const request = toRequest(config);
    requests.push(request);
    const key = `${request.method} ${request.url}`;
    const handler = routes[key];
    if (!handler) throw new Error(`stubApi: no route for ${key}`);

    const { status = 200, data } = typeof handler === 'function' ? handler(request) : handler;
    const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
    if (config.validateStatus && !config.validateStatus(status)) {
      const code = status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST;
      throw new AxiosError(`Request failed with status ${status}`, code, config, {}, response);
    }
    return response;
  };

  for (const client of clients) client.defaults.adapter = adapter;
  return requests;
}

/** Puts the real adapters back. `setup.ts` calls it after every test. */
export function resetApiStub(): void {
  clients.forEach((client, index) => {
    client.defaults.adapter = originalAdapters[index];
  });
}
