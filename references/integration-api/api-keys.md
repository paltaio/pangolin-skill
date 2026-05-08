# API Keys

All routes use bearer API-key authentication and `verifyApiKeyIsRoot`; only root API keys can call them. API key objects include `apiKeyId`, `name`, `apiKeyHash`, `lastChars`, `createdAt`, and `isRoot`. The raw API key secret is returned only by creation handlers.

## `GET /v1/org/:orgId/api-keys`

Lists non-root API keys linked to an organization.

Auth: root API key; action `listApiKeys`.

Request:

- Path param `orgId: string`.
- Query params (string-encoded over the wire, coerced to int):
  - `limit?: positive integer`, default `1000`.
  - `offset?: nonnegative integer`, default `0`.
- No body.

Response data:

```ts
{
  apiKeys: Array<{
    apiKeyId: string;
    orgId: string;
    lastChars: string;
    createdAt: string;
    name: string;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

`pagination.total` is the returned page length, not a separate total count query.

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

## `POST /v1/org/:orgId/api-key/:apiKeyId/actions`

Replaces the actions assigned to an API key.

Auth: root API key; action `setApiKeyActions`; Limits; action audit.

Request:

- Path params: path params: `orgId: string` and `apiKeyId: nonempty string`.
- Body: `{ actionIds: [ApiKeyActionId, ...ApiKeyActionId[]] }` (at least one); duplicates are removed before writing. Each `actionId` must be a member of `ActionsEnum` (see `API_KEY_ACTION_IDS` in `types.ts`) AND exist in the `actions` table — the route runs `select ... from actions where actionId in (...)` and returns `400 "One or more actions do not exist"` if any are missing.

Response: envelope with `data: {}`, message `API key actions updated successfully`, status `200`.

Errors include `400` for invalid body/params or when one or more requested actions do not exist, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/api-key/:apiKeyId/actions`

Lists actions assigned to an API key.

Auth: root API key; action `listApiKeyActions`.

Request:

- Path params: path params: `orgId: string` and `apiKeyId: nonempty string`.
- Query params (string-encoded over the wire, coerced to int):
  - `limit?: positive integer`, default `1000`.
  - `offset?: nonnegative integer`, default `0`.
- No body.

Response data:

```ts
{
  actions: Array<{
    actionId: ApiKeyActionId; // member of ActionsEnum; see API_KEY_ACTION_IDS
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

`pagination.total` is the returned page length, not a separate total count query.

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

## `PUT /v1/org/:orgId/api-key`

Creates a non-root API key linked to an organization.

Auth: root API key; action `createApiKey`; Limits; action audit.

Request:

- Path param `orgId: nonempty string`.
- Body: `{ name: string }`; `name` length must be 1..255.

Response data:

```ts
{
  apiKeyId: string;
  name: string;
  apiKey: string;
  lastChars: string;
  createdAt: string;
}
```

`apiKey` is the raw secret and is returned only in this creation response.

Errors include `400` for invalid params/body and `500` with message `Failed to create API key` for unexpected errors after insertion. Insert failures.

## `DELETE /v1/org/:orgId/api-key/:apiKeyId`

Deletes an API key.

Auth: root API key; action `deleteApiKey`; action audit.

Request: path params: path params `orgId: string` and `apiKeyId: nonempty string`; no query params or body.

Response: envelope with `data: null`, message `API key deleted successfully`, status `200`.

Errors include `400` for invalid params, `404` when the API key is missing, and `500` with message `An error occurred`.

