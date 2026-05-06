# Clients

All routes use bearer API-key authentication. Org routes use `verifyApiKeyOrgAccess`; client routes use `verifyApiKeyClientAccess`, which allows root keys and otherwise requires API-key access to the client's organization.

Client objects include `clientId`, `orgId`, `exitNodeId`, `userId`, `niceId`, `olmId`, `name`, `pubKey`, `subnet`, `megabytesIn`, `megabytesOut`, `lastBandwidthUpdate`, `lastPing`, `type`, `online`, `lastHolePunch`, `maxConnections`, `archived`, `blocked`, and `approvalState`.

## `GET /v1/org/:orgId/pick-client-defaults`

Returns generated values used before creating a client.

Auth: API key with org access; action `createClient`.

Request: path param `orgId: string`; no query params or body.

Response data:

```ts
{
  olmId: string;
  olmSecret: string;
  subnet: string;
}
```

Errors include `400` for invalid params, `500` with message `No available subnet found`, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/clients`

Lists machine clients for an organization (`userId IS NULL`).

Auth: API key with org access; action `listClients`.

Request:

- Path param `orgId: string`.
- Query params:
  - `pageSize?: positive integer`, default `20`, invalid values catch to `20`.
  - `page?: integer >= 0`, default `1`, invalid values catch to `1`.
  - `query?: string`, matches client `name` or `niceId`.
  - `sort_by?: "name" | "megabytesIn" | "megabytesOut"`.
  - `order?: "asc" | "desc"`, default `asc`.
  - `online?: "true" | "false"`.
  - `status?: comma-separated "active" | "blocked" | "archived"`, default `active`.
- No body.

Response data:

```ts
{
  clients: Array<{
    clientId: number;
    orgId: string;
    name: string;
    pubKey: string | null;
    subnet: string;
    megabytesIn: number | null;
    megabytesOut: number | null;
    orgName: string | null;
    type: string;
    online: boolean;
    olmVersion: string | null;
    userId: string | null;
    username: string | null;
    userEmail: string | null;
    niceId: string;
    agent: string | null;
    approvalState: "pending" | "approved" | "denied" | null;
    olmArchived: boolean | null;
    archived: boolean;
    blocked: boolean;
    sites: Array<{ siteId: number; siteName: string | null; siteNiceId: string | null }>;
  }>;
  pagination: { total: number; page: number; pageSize: number };
}
```

Errors include `400` for invalid params/query, `403` when a user-authenticated request targets another org, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/user-devices`

Lists user devices for an organization (`userId IS NOT NULL`).

Auth: API key with org access; action `listClients`.

Request:

- Path param `orgId: string`.
- Query params:
  - `pageSize?: positive integer`, default `20`, invalid values catch to `20`.
  - `page?: integer >= 0`, default `1`, invalid values catch to `1`.
  - `query?: string`, matches client `name`, `niceId`, or user `email`.
  - `sort_by?: "megabytesIn" | "megabytesOut"`.
  - `order?: "asc" | "desc"`, default `asc`.
  - `online?: "true" | "false"`.
  - `agent?: "windows" | "android" | "cli" | "olm" | "macos" | "ios" | "ipados" | "unknown"`.
  - `status?: comma-separated "active" | "pending" | "denied" | "blocked" | "archived"`, default `active,pending`.
- No body.

Response data: envelope with `devices` array and `pagination: { total, page, pageSize }`. Device objects include the base client/list fields plus `userType`, `idpName`, `idpVariant`, fingerprint fields (`fingerprintPlatform`, `fingerprintOsVersion`, `fingerprintKernelVersion`, `fingerprintArch`, `fingerprintSerialNumber`, `fingerprintUsername`, `fingerprintHostname`), `deviceModel`, and `olmUpdateAvailable: false`.

Errors include `400` for invalid params/query, `403` when a user-authenticated request targets another org, and `500` with message `An error occurred`.

## `GET /v1/client/:clientId`

Gets one client by numeric ID.

Auth: API key with client access; action `getClient`.

Request: path param `clientId: positive integer`; no query params or body.

Response data: a client row with OLM/user metadata:

```ts
{
  clientId: number;
  orgId: string;
  exitNodeId: number | null;
  userId: string | null;
  niceId: string;
  olmId: string | null;
  name: string;
  pubKey: string | null;
  subnet: string;
  megabytesIn: number | null;
  megabytesOut: number | null;
  lastBandwidthUpdate: string | null;
  lastPing: number | null;
  type: string;
  online: boolean;
  lastHolePunch: number | null;
  maxConnections: number | null;
  archived: boolean;
  blocked: boolean;
  approvalState: "pending" | "approved" | "denied" | null;
  agent: string | null;
  olmVersion: string | null;
  userEmail: string | null;
  userName: string | null;
  userUsername: string | null;
  fingerprint: object | null;
  posture: object | null;
  userType: string | null;
  idpName: string | null;
  idpVariant: string | null;
}
```

Posture values are returned only when the org is licensed/subscribed for `tierMatrix.devicePosture`; otherwise present posture keys are masked as `"-"`.

Errors include `400` for invalid params, `404` when missing, and `500` with message `An error occurred`.

## `PUT /v1/org/:orgId/client`

Creates a machine client and associated OLM.

Auth: API key with org access; action `createClient`; Limits; action audit.

Request:

- Path param `orgId: string`.
- Body:

```ts
{
  name: string;    // 1-255 chars
  olmId: string;
  secret: string;
  subnet: string;  // single IP; org subnet prefix length is added
  type: "olm";
}
```

Response data: created client object, status `201`.

Errors include `400` for invalid params/body, invalid IP, missing org subnet, or IP outside org CIDR; `403` when a user-authenticated request has no org roles; `404` when the org, exit node, or admin role is missing; `409` when the derived subnet conflicts with an existing client or site, or the OLM ID already exists; and `500` with message `An error occurred`.

## `DELETE /v1/client/:clientId`

Deletes a machine client.

Auth: API key with client access; action `deleteClient`; action audit.

Request: path param `clientId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Client deleted successfully`, status `200`.

Errors include `400` for invalid params, `404` when missing, `400` when the client is a user client, and `500` with message `An error occurred`.

## `POST /v1/client/:clientId/archive`

Archives a client.

Auth: API key with client access; action `archiveClient`; Limits; action audit.

Request: path param `clientId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Client archived successfully`, status `200`.

Errors include `400` for invalid params or already archived, `404` when missing, and `500` with message `Failed to archive client`.

## `POST /v1/client/:clientId/unarchive`

Unarchives a client.

Auth: API key with client access; action `unarchiveClient`; Limits; action audit.

Request: path param `clientId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Client unarchived successfully`, status `200`.

Errors include `400` for invalid params or not archived, `404` when missing, and `500` with message `Failed to unarchive client`.

## `POST /v1/client/:clientId/block`

Blocks a client and sets `approvalState` to `denied`.

Auth: API key with client access; action `blockClient`; Limits; action audit.

Request: path param `clientId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Client blocked successfully`, status `200`.

Errors include `400` for invalid params or already blocked, `404` when missing, and `500` with message `Failed to block client`.

## `POST /v1/client/:clientId/unblock`

Unblocks a client and clears `approvalState`.

Auth: API key with client access; action `unblockClient`; Limits; action audit.

Request: path param `clientId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Client unblocked successfully`, status `200`.

Errors include `400` for invalid params or not blocked, `404` when missing, and `500` with message `Failed to unblock client`.

## `POST /v1/client/:clientId`

Updates a client's display fields.

Auth: API key with client access; action `updateClient`; Limits; action audit.

Request:

- Path param `clientId: positive integer`.
- Body: `{ name?: string; niceId?: string }`; each present string must be 1-255 chars.

Response: envelope with `data` set to the array returned by Drizzle `.returning()`, message `Client updated successfully`, status `200`.

Errors include `400` for invalid params/body, `404` when missing, `409` when the requested `niceId` is already in use, and `500` with message `An error occurred`.

