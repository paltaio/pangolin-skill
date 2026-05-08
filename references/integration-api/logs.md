# Logs And Analytics

All routes use bearer API-key authentication and `verifyApiKeyOrgAccess`.

Shared log-query fields:

- `timeStart?: ISO date string`, default seven days ago; transformed to Unix seconds.
- `timeEnd?: ISO date string`, default current time; transformed to Unix seconds.
- `limit?: positive integer`, default `1000`.
- `offset?: nonnegative integer`, default `0`.

CSV exports return `text/csv` with `Content-Disposition: attachment`; they do not use Pangolin's JSON envelope. Exports reject selections over `MAX_EXPORT_LIMIT = 50000`.

## `GET /v1/org/:orgId/logs/request`

Queries request audit logs.

Auth: API key with org access; action `viewLogs`.

Request:

- Path param `orgId: string`.
- Query params: shared log-query fields plus `action?: boolean | "true" | "false"`, `method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"`, `reason?: positive integer`, `resourceId?: positive integer`, `actor?: string`, `location?: string`, `host?: string`, and `path?: string`.
- No body.

Response data:

```ts
{
  log: Array<{
    timestamp: number;
    action: boolean;
    reason: number;
    orgId: string | null;
    actorType: "user" | "apiKey" | null; // runtime values; DB column is open string
    actor: string | null;
    actorId: string | null;
    resourceId: number | null;
    siteResourceId: number | null;
    resourceNiceId: string | null;
    resourceName: string | null;
    ip: string | null;
    location: string | null;
    userAgent: string | null;
    metadata: string | null;
    headers: string | null;
    query: string | null;
    originalRequestURL: string | null;
    scheme: string | null;
    host: string | null;
    path: string | null;
    method: string | null;
    tls: boolean | null;
  }>;
  pagination: { total: number; limit: number; offset: number };
  filterAttributes: {
    actors: string[];
    resources: Array<{ id: number; name: string | null }>;
    locations: string[];
    hosts: string[];
    paths: string[];
  };
}
```

Errors include `400` for invalid params/query, `400` if distinct filter attributes exceed the API limit, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/request/export`

Exports request audit logs as CSV.

Auth: API key with org access; action `exportLogs`; action audit.

Request: same path and query params as `GET /v1/org/:orgId/logs/request`; no body.

Response: CSV attachment named `request-audit-logs-{orgId}-{timestamp}.csv`.

Errors include `400` for invalid params/query, `400` when the export selection exceeds 50000 objects, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/analytics`

Returns request log aggregate analytics.

Auth: API key with org access; action `viewLogs`.

Request:

- Path param `orgId: string`.
- Query params: `timeStart?: ISO date string`, `timeEnd?: ISO date string`, `resourceId?: positive integer`.
- No body.

Response data:

```ts
{
  requestsPerCountry: Array<{ code: string; count: number }>;
  requestsPerDay: Array<{
    day: string;
    allowedCount: number;
    blockedCount: number;
    totalCount: number;
  }>;
  totalBlocked: number;
  totalRequests: number;
}
```

Errors include `400` for invalid params/query. The query can throw `400` with message `Too many distinct countries. Please narrow your query.`, but the route catch currently wraps all thrown errors as `500 An error occurred`.

## `GET /v1/org/:orgId/logs/action`

Queries action audit logs. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.actionLogs`; API key with org access; action `exportLogs`.

Request:

- Path param `orgId: string`.
- Query params: shared log-query fields plus `action?: string`, `actorType?: string` (only `"user"` or `"apiKey"` actually match recorded rows), `actorId?: string`, and `actor?: string`.
- No body.

Response data:

```ts
{
  log: Array<{
    orgId: string;
    action: string;
    actorType: "user" | "apiKey"; // runtime values; DB column is open string
    metadata: string | null;
    actorId: string;
    timestamp: number;
    actor: string;
  }>;
  pagination: { total: number; limit: number; offset: number };
  filterAttributes: { actors: string[]; actions: string[] };
}
```

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/action/export`

Exports action audit logs as CSV. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.logExport`; API key with org access; action `exportLogs`; action audit.

Request: same path/query params as `GET /v1/org/:orgId/logs/action`; no body.

Response: CSV attachment named `action-audit-logs-{orgId}-{timestamp}.csv`.

Errors include `400` for invalid params/query, `400` when the export selection exceeds 50000 objects, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/access`

Queries access audit logs. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.accessLogs`; API key with org access; action `exportLogs`.

Request:

- Path param `orgId: string`.
- Query params: shared log-query fields plus `action?: boolean | "true" | "false"`, `actorType?: string` (only `"user"` or `"apiKey"` actually match recorded rows), `actorId?: string`, `resourceId?: positive integer`, `actor?: string`, `type?: string`, and `location?: string`.
- No body.

Response data:

```ts
{
  log: Array<{
    orgId: string;
    action: boolean;
    actorType: "user" | "apiKey" | null; // runtime values; DB column is open string
    actorId: string | null;
    resourceId: number | null;
    resourceName: string | null;
    resourceNiceId: string | null;
    ip: string | null;
    location: string | null;
    userAgent: string | null;
    metadata: string | null;
    type: string;
    timestamp: number;
    actor: string | null;
  }>;
  pagination: { total: number; limit: number; offset: number };
  filterAttributes: {
    actors: string[];
    resources: Array<{ id: number; name: string | null }>;
    locations: string[];
  };
}
```

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/access/export`

Exports access audit logs as CSV. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.logExport`; API key with org access; action `exportLogs`; action audit.

Request: same path/query params as `GET /v1/org/:orgId/logs/access`; no body.

Response: CSV attachment named `access-audit-logs-{orgId}-{timestamp}.csv`.

Errors include `400` for invalid params/query, `400` when the export selection exceeds 50000 objects, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/connection`

Queries connection audit logs. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.connectionLogs`; API key with org access; action `exportLogs`.

Request:

- Path param `orgId: string`.
- Query params: shared log-query fields plus `protocol?: string`, `sourceAddr?: string`, `destAddr?: string`, `clientId?: positive integer`, `siteId?: positive integer`, `siteResourceId?: positive integer`, and `userId?: string`.
- No body.

Response data:

```ts
{
  log: Array<{
    sessionId: string;
    siteResourceId: number | null;
    orgId: string | null;
    siteId: number | null;
    clientId: number | null;
    userId: string | null;
    sourceAddr: string;
    destAddr: string;
    protocol: string;
    startedAt: number;
    endedAt: number | null;
    bytesTx: number | null;
    bytesRx: number | null;
    resourceName: string | null;
    resourceNiceId: string | null;
    siteName: string | null;
    siteNiceId: string | null;
    clientName: string | null;
    clientNiceId: string | null;
    clientType: string | null; // currently only `"olm"` is created; column is open varchar
    userEmail: string | null;
  }>;
  pagination: { total: number; limit: number; offset: number };
  filterAttributes: {
    protocols: string[];
    destAddrs: string[];
    clients: Array<{ id: number; name: string }>;
    resources: Array<{ id: number; name: string | null }>;
    users: Array<{ id: string; email: string | null }>;
  };
}
```

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/logs/connection/export`

Exports connection audit logs as CSV. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.logExport`; API key with org access; action `exportLogs`; action audit.

Request: same path/query params as `GET /v1/org/:orgId/logs/connection`; no body.

Response: CSV attachment named `connection-audit-logs-{orgId}-{timestamp}.csv`.

Errors include `400` for invalid params/query, `400` when the export selection exceeds 50000 objects, and `500` with message `An error occurred`.

