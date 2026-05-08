# Access Tokens

All routes use bearer API-key authentication. Access-token objects include `accessTokenId`, `orgId`, `resourceId`, `tokenHash`, `sessionLength`, `expiresAt`, `title`, `description`, and `createdAt`.

## `POST /v1/resource/:resourceId/access-token`

Generates a new resource access token.

Auth: API key with resource access; root keys pass resource access; action `generateAccessToken`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body (`strictObject`, unknown keys rejected):

```ts
{
  validForSeconds?: number; // integer, positive (seconds)
  title?: string;
  description?: string;
}
```

If `validForSeconds` is omitted, `sessionLength` defaults to `SESSION_COOKIE_EXPIRES` (`1000 * 60 * 60 * server.resource_session_length_hours` ms) and `expiresAt` is `null`. When provided, `sessionLength` is stored as `validForSeconds * 1000` (ms), so the request unit (seconds) and the stored/returned unit (ms) differ.

Response data:

```ts
{
  accessTokenId: string;       // 8-char id (generateId(8))
  orgId: string;
  resourceId: number;
  expiresAt: number | null;    // epoch ms
  sessionLength: number;       // ms (validForSeconds * 1000, or SESSION_COOKIE_EXPIRES default)
  title: string | null;
  description: string | null;
  createdAt: number;           // epoch ms
  accessToken: string;         // raw token from generateIdFromEntropySize(16)
}
```

The raw `accessToken` is returned only by this creation response. The stored `tokenHash` is not returned here.

Errors include `400` for invalid params/body, `404` when the resource is missing, `500` with message `Failed to generate access token` when insertion returns no object, and `500` with message `Failed to authenticate with resource` for unexpected errors.

## `DELETE /v1/access-token/:accessTokenId`

Deletes a resource access token.

Auth: API key with access to the token's resource organization via `verifyApiKeyAccessTokenAccess`; action `deleteAcessToken`; action audit.

Request: path param `accessTokenId: string`; no query params or body.

Response: envelope with `data: null`, message `Resource access token deleted successfully`, status `200`.

Errors include `400` for invalid params, `404` when the access token is missing, and `500` with message `An error occurred`. The access middleware can also return `401` when the API key is missing, `404` when the token or resource is missing, `403` when the API key lacks organization access, and `500` when token/resource organization state cannot be verified.

## `GET /v1/org/:orgId/access-tokens`

Lists active access tokens for resources in an organization.

Auth: API key with org access; root keys pass org access; action `listAccessTokens`.

Request:

- Path param `orgId: string`.
- Query params:
  - `limit?: nonnegative integer`, default `1000`.
  - `offset?: nonnegative integer`, default `0`.
- No body.

Response data:

```ts
{
  accessTokens: Array<{
    accessTokenId: string;       // 8-char id
    orgId: string;
    resourceId: number;
    sessionLength: number;       // ms
    expiresAt: number | null;    // epoch ms
    tokenHash: string;           // sha256 hex of the raw token
    title: string | null;
    description: string | null;
    createdAt: number;           // epoch ms
    resourceName: string | null;
    resourceNiceId: string | null;
    siteName: string | null;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

Only tokens with `expiresAt IS NULL` or `expiresAt` in the future are returned. `pagination.total` counts accessible resources, not access-token objects.

Errors include `400` for invalid query/params or missing organization ID, `403` when a user-authenticated request targets another org, and `500` with message `An error occurred`.

## `GET /v1/resource/:resourceId/access-tokens`

Lists active access tokens for one resource.

Auth: API key with resource access; root keys pass resource access; action `listAccessTokens`.

Request:

- Path param `resourceId: positive integer`.
- Query params:
  - `limit?: nonnegative integer`, default `1000`.
  - `offset?: nonnegative integer`, default `0`.
- No body.

Response data: same shape as `GET /v1/org/:orgId/access-tokens`.

Only tokens with `expiresAt IS NULL` or `expiresAt` in the future are returned. `pagination.total` counts accessible resources, not access-token objects.

Errors include `400` for invalid query/params or missing organization ID and `500` with message `An error occurred`.

