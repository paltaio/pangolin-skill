# Organizations

Common `Org` fields:

```ts
{
  orgId: string;
  name: string;
  subnet: string | null;
  utilitySubnet: string | null;
  createdAt: string | null;
  requireTwoFactor: boolean | null;
  maxSessionLengthHours: number | null;
  passwordExpiryDays: number | null;
  settingsLogRetentionDaysRequest: number;
  settingsLogRetentionDaysAccess: number;
  settingsLogRetentionDaysAction: number;
  settingsLogRetentionDaysConnection: number;
  sshCaPrivateKey: string | null;
  sshCaPublicKey: string | null;
  isBillingOrg: boolean | null;
  billingOrgId: string | null;
}
```

## `GET /v1/org/checkId`

Checks whether an organization ID already exists.

Auth: root API key; action `checkOrgId`.

Request:

- Query: `orgId: string`.
- Body: none.

Response:

- Envelope with `data: {}`.
- `200` and message `Organization ID already exists` when found.
- `404` and message `Organization ID is available` when not found. The response still sets `success: true`.

## `PUT /v1/org`

Creates an organization.

Auth: root API key; action `createOrg`.

Request body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `orgId` | string | yes | 1-32 chars; lowercase letters, numbers, underscores, and single hyphens; no leading, trailing, or consecutive hyphens. |
| `name` | string | yes | 1-255 chars. |
| `subnet` | IPv4 CIDR string | yes | Must pass Pangolin CIDR validation. |
| `utilitySubnet` | IPv4 CIDR string | yes | Must pass Pangolin CIDR validation and must not overlap `subnet`. |

Response:

- Envelope with created `Org` data. Creation also creates default owner/admin/member role state, domain links for config-managed domains, and owner membership.
- Errors include `400` for validation or overlapping CIDRs, `403` when org creation is restricted or SaaS org limits are exceeded, `404` when usage data is missing, `409` when `orgId` already exists, and `500` when required setup records such as server admin or role creation are missing.

## `GET /v1/orgs`

Lists all organizations.

Auth: root API key; action `listOrgs`.

Request:

- Query `limit`: positive integer encoded as string; optional; default `1000`.
- Query `offset`: non-negative integer encoded as string; optional; default `0`.
- Body: none.

Response data:

```ts
{
  orgs: Org[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

## `GET /v1/org/:orgId`

Gets one organization.

Auth: API key with org access; action `getOrg`.

Request:

- Path param `orgId: string`.
- Body: none.

Response data:

```ts
{
  org: Org;
}
```

Errors include `404` when the organization is not found.

## `POST /v1/org/:orgId`

Updates an organization.

Auth: API key with org access; action `updateOrg`; Limits.

Request:

- Path param `orgId: string`.
- Body must include at least one field.

Request body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | no | 1-255 chars. |
| `requireTwoFactor` | boolean | no | Ignored unless the org has the two-factor enforcement feature. |
| `maxSessionLengthHours` | number or null | no | Ignored unless the org has the session duration policies feature. |
| `passwordExpiryDays` | number or null | no | Ignored unless the org has the password expiration policies feature. |
| `settingsLogRetentionDaysRequest` | number | no | Minimum is `0` on SaaS, `-1` otherwise. SaaS tiers cap the maximum. |
| `settingsLogRetentionDaysAccess` | number | no | Minimum is `0` on SaaS, `-1` otherwise. SaaS tiers cap the maximum. |
| `settingsLogRetentionDaysAction` | number | no | Minimum is `0` on SaaS, `-1` otherwise. SaaS tiers cap the maximum. |
| `settingsLogRetentionDaysConnection` | number | no | Minimum is `0` on SaaS, `-1` otherwise. SaaS tiers cap the maximum. |

Response:

- Envelope with the updated organization record.
- Errors include `400` for empty/invalid body and `403` when a requested SaaS log-retention value exceeds the subscription tier cap.

## `DELETE /v1/org/:orgId`

Deletes an organization.

Auth: root API key; action `deleteOrg`.

Request:

- Path param `orgId: string`.
- Body: none.

Response:

- Envelope with `data: null`, message `Organization deleted successfully`.
- Errors include `404` when not found, `403` when the caller is not an owner in the underlying operation, and `400` for primary billing organizations.

## `POST /v1/org/:orgId/reset-bandwidth`

Resets bandwidth counters for all sites in an organization.

Auth: API key with org access; action `resetSiteBandwidth`.

Request:

- Path param `orgId: string`.
- Body: none.

Response:

- Envelope with `data: {}`, message `Sites bandwidth reset successfully`.
- Errors include `404` when no sites exist in the organization.

## `GET /v1/org/:orgId/user-resources`

Lists resources available to users in an organization.

Auth: API key with org access. No action permission check is applied.

Request:

- Path param `orgId: string`.
- Query params: none.
- Body: none.

Response data:

```ts
{
  resources: Array<{
    resourceId: number;
    name: string;
    domain: string;
    enabled: boolean;
    protected: boolean;
    protocol: string;
    sso: boolean;
    password: boolean;
    pincode: boolean;
    whitelist: boolean;
  }>;
  siteResources: Array<{
    siteResourceId: number;
    name: string;
    destination: string;
    mode: string;
    protocol: string | null;
    enabled: boolean;
    alias: string | null;
    aliasAddress: string | null;
    type: "site";
  }>;
}
```

Returns only enabled resources and enabled site resources that the authenticated user can access directly or through org roles. `domain` is built as `http://` or `https://` plus the resource `fullDomain`.

Response message: `User resources retrieved successfully`.

Errors include `401` when no authenticated user is present, `403` when the user is not in the organization, and `500` for unexpected errors. The org-access middleware can also return `401` for an unauthenticated key, `400` for a missing organization ID, `403` when the API key has no access to the organization, and `500` for middleware errors.

