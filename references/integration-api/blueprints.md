# Blueprints

All routes use bearer API-key authentication and `verifyApiKeyOrgAccess`. Blueprint objects include `blueprintId`, `orgId`, `name`, `source` (`"API" | "UI" | "NEWT" | "CLI"`), `createdAt`, `succeeded`, `contents`, and `message`. Blueprints applied through this `PUT /v1/org/:orgId/blueprint` endpoint are always recorded with `source: "API"`; the other values appear only when blueprints are applied internally.

## `PUT /v1/org/:orgId/blueprint`

Applies a base64-encoded JSON blueprint to an organization.

Auth: API key with org access; action `applyBlueprint`; Limits; action audit.

Request:

- Path param `orgId: string`.
- Body: `{ blueprint: string }`; the string is base64-decoded and parsed as JSON.

Response: envelope with `data: null`, message `Blueprint applied successfully`, status `201`.

Errors include `400` for invalid params/body, `400` with message `Failed to update database from config: ...` for base64/JSON/apply failures, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/blueprint/:blueprintId`

Gets one blueprint for an organization.

Auth: API key with org access; action `getBlueprint`.

Request: path params `orgId: string`, `blueprintId: positive integer`; no query params or body.

Response data:

```ts
{
  blueprintId: number;
  name: string;
  source: "API" | "UI" | "NEWT" | "CLI";
  succeeded: boolean;
  orgId: string;
  createdAt: number;
  message: string | null;
  contents: string;
}
```

Success message is `Client retrieved successfully` (copy-paste from the clients router; not a typo on your side). Errors include `400` for invalid params, `404` with message `Client not found` when the blueprint is missing, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/blueprints`

Lists blueprints for an organization.

Auth: API key with org access; action `listBlueprints`.

Request:

- Path param `orgId: string`.
- Query params:
  - `limit?: nonnegative integer`, default `1000`.
  - `offset?: nonnegative integer`, default `0`.
- No body.

Response data:

```ts
{
  blueprints: Array<{
    blueprintId: number;
    name: string;
    source: "API" | "UI" | "NEWT" | "CLI";
    succeeded: boolean;
    orgId: string;
    createdAt: number;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

