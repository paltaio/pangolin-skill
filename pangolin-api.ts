type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type QueryValue = string | number | boolean | null | undefined;
type Query = string | URLSearchParams | Record<string, QueryValue | QueryValue[]>;

export interface PangolinOptions {
  baseUrl?: string;
  token?: string;
  headers?: HeadersInit;
  unwrap?: boolean;
  fetch?: typeof fetch;
}

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  query?: Query;
  body?: unknown;
  unwrap?: boolean;
}

export interface RawResponse<T = unknown> {
  body: T;
  res: Response;
}

export interface PangolinEnvelope<T = unknown> {
  data: T;
  success: boolean;
  error: boolean;
  message: string;
  status: number;
}

export interface Endpoint {
  get<T = unknown>(query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T>;
  delete<T = unknown>(query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T>;
  post<T = unknown>(body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T>;
  put<T = unknown>(body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T>;
  patch<T = unknown>(body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T>;
  raw<T = unknown>(method?: Method, opts?: RequestOptions): Promise<RawResponse<T>>;
}

export class PangolinError<T = unknown> extends Error {
  readonly status: number;
  readonly body: T;
  readonly res: Response;

  constructor(message: string, status: number, body: T, res: Response) {
    super(message);
    this.name = "PangolinError";
    this.status = status;
    this.body = body;
    this.res = res;
  }
}

function env(name: string): string | undefined {
  const global = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
    Bun?: { env?: Record<string, string | undefined> };
  };
  return global.process?.env?.[name] || global.Bun?.env?.[name] || undefined;
}

function stripBase(path: string): string {
  const clean = path.trim().replace(/^https?:\/\/[^/]+/i, "");
  const withoutV1 = clean.replace(/^\/?v1(?=\/|$|\?)/, "");
  return withoutV1.startsWith("/") || withoutV1.startsWith("?") ? withoutV1 : `/${withoutV1}`;
}

function splitPath(path: string): { path: string; query?: string } {
  const [rawPath = "", ...rest] = stripBase(path).split("?");
  const normalized = rawPath === "" ? "/" : rawPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  const query = rest.length > 0 ? rest.join("?") : undefined;
  return { path: normalized, query };
}

function queryString(query?: Query): string {
  if (!query) return "";
  if (typeof query === "string") return query.startsWith("?") ? query.slice(1) : query;

  const params = query instanceof URLSearchParams ? query : new URLSearchParams();
  if (!(query instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(query)) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (item === null || typeof item === "undefined") continue;
        params.append(key, String(item));
      }
    }
  }
  return params.toString();
}

function mergeQuery(pathQuery?: string, query?: Query): string {
  const left = queryString(pathQuery);
  const right = queryString(query);
  if (!left && !right) return "";
  if (!left) return `?${right}`;
  if (!right) return `?${left}`;
  return `?${left}&${right}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEnvelope(value: unknown): value is PangolinEnvelope {
  return (
    isRecord(value) &&
    "data" in value &&
    "success" in value &&
    "error" in value &&
    "message" in value &&
    "status" in value
  );
}

function errorMessage(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === "string") return body.message;
  return fallback;
}

function encodePathValue(value: unknown): string {
  return encodeURIComponent(String(value));
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    value instanceof ReadableStream
  );
}

export class Pangolin {
  readonly baseUrl?: string;
  readonly token?: string;
  readonly unwrap: boolean;
  private readonly headers: HeadersInit;
  private readonly fetcher: typeof fetch;

  constructor(opts: PangolinOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? env("PANGOLIN_API_URL") ?? env("PANGOLIN_API_BASE_URL"))?.replace(/\/$/, "");
    this.token = opts.token ?? env("PANGOLIN_API_TOKEN");
    this.headers = opts.headers ?? {};
    this.unwrap = opts.unwrap ?? true;
    this.fetcher = opts.fetch ?? fetch;
  }

  path(strings: TemplateStringsArray, ...values: unknown[]): string {
    let out = "";
    strings.forEach((part, index) => {
      out += part;
      if (index < values.length) out += encodePathValue(values[index]);
    });
    return out;
  }

  endpoint(path: string): Endpoint {
    return {
      get: <T = unknown>(query?: Query, init?: Omit<RequestOptions, "query" | "body">) =>
        this.get<T>(path, query, init),
      delete: <T = unknown>(query?: Query, init?: Omit<RequestOptions, "query" | "body">) =>
        this.delete<T>(path, query, init),
      post: <T = unknown>(body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">) =>
        this.post<T>(path, body, query, init),
      put: <T = unknown>(body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">) =>
        this.put<T>(path, body, query, init),
      patch: <T = unknown>(body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">) =>
        this.patch<T>(path, body, query, init),
      raw: <T = unknown>(method: Method = "GET", opts: RequestOptions = {}) =>
        this.raw<T>(method, path, opts)
    };
  }

  url(path: string, query?: Query): string {
    const split = splitPath(path);
    return `${this.requiredBaseUrl()}${split.path}${mergeQuery(split.query, query)}`;
  }

  get<T = unknown>(path: string, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T> {
    return this.request<T>("GET", path, { ...init, query });
  }

  delete<T = unknown>(path: string, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T> {
    return this.request<T>("DELETE", path, { ...init, query });
  }

  post<T = unknown>(path: string, body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T> {
    return this.request<T>("POST", path, { ...init, body, query });
  }

  put<T = unknown>(path: string, body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T> {
    return this.request<T>("PUT", path, { ...init, body, query });
  }

  patch<T = unknown>(path: string, body?: unknown, query?: Query, init?: Omit<RequestOptions, "query" | "body">): Promise<T> {
    return this.request<T>("PATCH", path, { ...init, body, query });
  }

  async request<T = unknown>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
    const { body } = await this.raw<unknown>(method, path, opts);
    return ((opts.unwrap ?? this.unwrap) && isEnvelope(body) ? body.data : body) as T;
  }

  async raw<T = unknown>(method: Method, path: string, opts: RequestOptions = {}): Promise<RawResponse<T>> {
    const res = await this.send(method, path, opts);
    const body = await this.parse<T>(res);
    if (!res.ok) {
      throw new PangolinError(errorMessage(body, `${method} ${path} failed`), res.status, body, res);
    }
    return { body, res };
  }

  private async send(method: Method, inputPath: string, opts: RequestOptions): Promise<Response> {
    const split = splitPath(inputPath);
    const headers = new Headers(this.headers);
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    const { body, query: _query, unwrap: _unwrap, ...rest } = opts;
    const init: RequestInit = { ...rest, method, headers };

    if (typeof body !== "undefined") {
      if (isBodyInit(body)) {
        init.body = body;
      } else {
        headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
        init.body = JSON.stringify(body);
      }
    }

    return this.fetcher(`${this.requiredBaseUrl()}${split.path}${mergeQuery(split.query, opts.query)}`, init);
  }

  private requiredBaseUrl(): string {
    if (!this.baseUrl) {
      throw new Error("Pangolin base URL is required. Set PANGOLIN_API_URL or pass new Pangolin({ baseUrl }).");
    }
    return this.baseUrl;
  }

  private async parse<T>(res: Response): Promise<T> {
    if (res.status === 204) return null as T;

    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) return await res.json();
    if (
      contentType.startsWith("text/") ||
      contentType.includes("application/yaml") ||
      contentType.includes("text/csv")
    ) {
      return (await res.text()) as T;
    }
    return (await res.arrayBuffer()) as T;
  }
}

const api = new Pangolin();

export default api;
