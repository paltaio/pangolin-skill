# Sites

## `PUT /v1/org/:orgId/site`

Creates a site in an organization.

Auth: API key with org access; action `createSite`; Limits.

Request:

- Path param `orgId: string`.

Request body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | 1-255 chars. |
| `type` | `"newt" | "wireguard" | "local"` | yes | Cross-field rules enforced post-Zod: `wireguard` requires `subnet`, `exitNodeId`, and `pubKey` (else HTTP 400); `local` forces `subnet = "0.0.0.0/32"`, `online = true`, `dockerSocketEnabled = false`; `newt` ignores `subnet`/`exitNodeId` (chosen on connect). |
| `exitNodeId` | positive integer | no | Required for `wireguard`; also used to assign a `local` site to a node. |
| `niceId` | string | no | 1-255 chars. Defaults to a unique generated value. |
| `pubKey` | string | no | WireGuard public key. Required for `wireguard`. |
| `subnet` | string | no | CIDR within the exit node's address range. Required for `wireguard`. |
| `newtId` | string | no | Used for `newt`; generated if omitted. |
| `secret` | string | no | Used for `newt`; server generates a 48-char secret if omitted. |
| `address` | string | no | IPv4 within the org subnet. Server formats with the org block size. |

Response data:

```ts
Site & {
  newtId?: string;
  secret?: string;
}
```

The OpenAPI example body is:

```json
{
  "name": "My Site",
  "type": "newt"
}
```

## `GET /v1/org/:orgId/sites`

Lists sites in an organization.

Auth: API key with org access; action `listSites`.

Request:

- Path param `orgId: string`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `pageSize` | integer | `20` | Positive. Invalid values fall back to `20`. |
| `page` | integer | `1` | Minimum `0`. Invalid values fall back to `1`. |
| `query` | string | none | Search string. |
| `sort_by` | `"name" | "megabytesIn" | "megabytesOut"` | none | Invalid values are ignored. |
| `order` | `"asc" | "desc"` | `"asc"` | Invalid values fall back to `"asc"`. |
| `online` | boolean-like string | none | `"true"` or `"false"`; transformed to boolean. |
| `status` | `"pending" | "approved"` | none | Invalid values are ignored. |

Response data:

```ts
{
  sites: Array<{
    siteId: number;
    niceId: string;
    name: string;
    pubKey: string | null;
    subnet: string | null;
    megabytesIn: number;
    megabytesOut: number;
    orgName: string;
    type: "newt" | "wireguard" | "local"; // DB column comment says only "newt"|"wireguard"; "local" was added later — readers must expect all three.
    online?: boolean | null; // undefined for `local` sites (stripped server-side).
    address: string | null;
    newtVersion: string | null;
    exitNodeId: number | null;
    exitNodeName: string | null;
    exitNodeEndpoint: string | null;
    remoteExitNodeId: number | null;
    resourceCount: number;
    status: "pending" | "approved";
    newtUpdateAvailable?: boolean;
  }>;
  pagination: {
    total: number;
    pageSize: number;
    page: number;
  };
}
```

`pagination` uses Pangolin's shared paginated response shape.

## `GET /v1/org/:orgId/site/:niceId`

Gets a site by organization ID and site `niceId`.

Auth: API key with org access; action `getSite`.

Request:

- Path param `orgId: string`.
- Path param `niceId: string`.
- Body: none.

Response data:

```ts
Site & {
  newtId: string | null;
  newtVersion: string | null;
}
```

## `GET /v1/org/:orgId/pick-site-defaults`

Returns prerequisite/default values for creating a site.

Auth: API key with org access; action `createSite`.

Request:

- Path param `orgId: string`.
- Body: none.

Response data:

```ts
{
  exitNodeId: number;
  address: string;
  publicKey: string;
  name: string;
  listenPort: number;
  endpoint: string;
  subnet: string;
  newtId: string;
  newtSecret: string;
  clientAddress?: string;
}
```

Errors include `500` when no exit node is available.

## `GET /v1/site/:siteId`

Gets a site by numeric site ID.

Auth: API key with site access; action `getSite`.

Request:

- Path param `siteId: positive integer`.
- Body: none.

Response data:

```ts
Site & {
  newtId: string | null;
  newtVersion: string | null;
}
```

## `POST /v1/site/:siteId`

Updates a site.

Auth: API key with site access; action `updateSite`; Limits.

Request:

- Path param `siteId: positive integer`.
- Body must include at least one field.

Request body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | no | 1-255 chars. |
| `niceId` | string | no | 1-255 chars; checked for uniqueness. |
| `dockerSocketEnabled` | boolean | no | Enables/disables Docker socket integration. Forced to `false` for `local` sites at create time. |
| `status` | `"pending" | "approved"` | no | Site approval status. |

Response:

- Envelope with the updated site record.
- Errors include `400` for empty/invalid body and `409` when `niceId` is already used by another site.

## `DELETE /v1/site/:siteId`

Deletes a site and associated data.

Auth: API key with site access; action `deleteSite`.

Request:

- Path param `siteId: positive integer`.
- Body: none.

Response:

- Envelope with deleted site data.
- Errors include `404` when the site is not found.
