# Private SaaS Operations

These routes are SaaS-only. All routes use bearer API-key authentication and `verifyApiKeyIsRoot`; there are no route-level action permission checks, license checks, subscription checks, limits checks, or action audit middleware on these six routes.

## `POST /v1/org/:orgId/site/:siteId/trigger-alert`

Triggers a site alert.

Auth: root API key.

Request:

- Path params: `orgId: nonempty string`, `siteId: positive integer` (coerced from string).
- Body (validated with `z.strictObject` — extra keys reject with 400): `{ eventType: "site_online" | "site_offline" }`.

Response data: `{ success: true }`, message `Alert triggered successfully`, status `200`.

Errors include `400` for invalid params/body, `404` when the site is not in the org, and `500` with message `An error occurred`.

## `POST /v1/org/:orgId/resource/:resourceId/trigger-alert`

Triggers a resource alert.

Auth: root API key.

Request:

- Path params: `orgId: nonempty string`, `resourceId: positive integer` (coerced from string).
- Body (validated with `z.strictObject` — extra keys reject with 400): `{ eventType: "resource_healthy" | "resource_unhealthy" | "resource_degraded" | "resource_toggle" }`.

Response data: `{ success: true }`, message `Alert triggered successfully`, status `200`.

Errors include `400` for invalid params/body, `404` when the resource is not in the org, and `500` with message `An error occurred`.

## `POST /v1/org/:orgId/health-check/:healthCheckId/trigger-alert`

Triggers a health-check alert.

Auth: root API key.

Request:

- Path params: `orgId: nonempty string`, `healthCheckId: positive integer` (coerced from string).
- Body (validated with `z.strictObject` — extra keys reject with 400): `{ eventType: "health_check_healthy" | "health_check_unhealthy" }`.

Response data: `{ success: true }`, message `Alert triggered successfully`, status `200`.

Errors include `400` for invalid params/body, `404` when the health check is not in the org, and `500` with message `An error occurred`.

## `POST /v1/cert/sync-to-newts`

Pushes a certificate update to affected Newts.

Auth: root API key.

Request:

- No path or query params.
- Body: `{ domain: string; domainId?: string | null }`; `domain` must be nonempty and `domainId` defaults to `null`.

Response: plain JSON shaped like Pangolin's envelope but sent directly with `res.status(...).json(...)`; it does not include a `status` field.

```ts
{
  data: null;
  success: true;
  error: false;
  message: string; // `Certificate update pushed to affected newts for domain "<domain>"`
}
```

Errors include `400` for invalid body and `500` with message `Failed to push certificate update to affected newts`.

## `POST /v1/org/:orgId/send-usage-notification`

Sends usage-limit emails to organization admins.

Auth: root API key.

Request:

- Path param `orgId: string`.
- Body:

```ts
{
  notificationType: "approaching_70" | "approaching_90" | "reached";
  limitName: string;
  currentUsage: number;
  usageLimit: number;
}
```

Response data:

```ts
{
  success: boolean;
  emailsSent: number;
  adminEmails: string[];
}
```

Errors include `400` for invalid params/body, `404` when the organization is missing, and `500` with message `Failed to send usage notifications`. If no admin users have email addresses, the route returns `200` with `emailsSent: 0`.

## `POST /v1/org/:orgId/send-trial-notification`

Sends trial-status emails to organization admins.

Auth: root API key.

Request:

- Path param `orgId: string`.
- Body:

```ts
{
  notificationType: "trial_ending_5d" | "trial_ending_24h" | "trial_ended";
  orgName: string;
  trialEndsAt: number; // Unix seconds
  billingLink?: string;
}
```

Response data:

```ts
{
  success: boolean;
  emailsSent: number;
  adminEmails: string[];
}
```

Errors include `400` for invalid params/body, `404` when the organization is missing, and `500` with message `Failed to send trial notifications`. If no admin users have email addresses, the route returns `200` with `emailsSent: 0`.

