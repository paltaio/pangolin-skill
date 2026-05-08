# Users, Invitations, And Roles

Common user fields exposed by these handlers include `userId`, `email`, `username`, `name`, `type`, `idpId`, `idpName`, `twoFactorEnabled`, `twoFactorSetupRequested`, `emailVerified`, `serverAdmin`, `dateCreated`, and org-level fields such as `orgId`, `isOwner`, `autoProvisioned`, `roleIds`, and `roles`.

Common role fields include `roleId`, `orgId`, `isAdmin`, `name`, `description`, `requireDeviceApproval`, `sshSudoMode`, `sshSudoCommands`, `sshCreateHomeDir`, and `sshUnixGroups`.

## `GET /v1/org/:orgId/invitations`

Lists invitations in an organization.

Auth: API key with org access; action `listInvitations`.

Request: path param `orgId: string`; no body.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `limit` | integer encoded as string | `1000` | Non-negative. |
| `offset` | integer encoded as string | `0` | Non-negative. |

Response data:

```ts
{
  invitations: Array<{
    inviteId: string;
    email: string;
    expiresAt: number;
    roles: { roleId: number; roleName: string | null }[];
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

Errors include `400` for invalid params/query and `500` for unexpected errors.

## `POST /v1/org/:orgId/create-invite`

Creates or regenerates an invitation.

Auth: API key with org access; action `inviteUser`; Limits; action audit.

Request path param: `orgId: string`.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `email` | email string | yes | Lowercased. |
| `roleIds` | positive integer array | conditionally | At least one `roleIds` item or `roleId` is required; de-duplicated. |
| `roleId` | positive integer | conditionally | Legacy single-role field. |
| `validHours` | number | yes | Greater than `0`, less than or equal to `168`. |
| `sendEmail` | boolean | no | Sends invite email when true. |
| `regenerate` | boolean | no | Allows replacing token/expiry for an existing invite. |

Response data:

```ts
{
  inviteLink: string;
  expiresAt: number;
}
```

Response status is `200`; message is `User invited successfully` or `Invitation regenerated successfully`.

Errors include `400` for invalid params/body or role IDs outside the org, `403` for user limit or multi-role feature limits, `404` for missing org or SaaS usage data, `409` when the user is already an org member or an invitation already exists without `regenerate`, `429` after 3 regenerations per hour per email, and `500` for unexpected errors.

## `DELETE /v1/org/:orgId/invitations/:inviteId`

Removes an invitation.

Auth: API key with org access; action `removeInvitation`; action audit.

Request: path params `orgId: string`, `inviteId: string`; no query params or body.

Response: envelope with `data: null`, message `Invitation removed successfully`.

Errors include `400` for invalid params, `404` when the invite is not found in the org, and `500` for unexpected errors.

## `GET /v1/org/:orgId/user/:userId`

Gets a user in an organization by user ID, with email fallback.

Auth: API key with org access; action `getOrgUser`.

Request: path params `orgId: string`, `userId: string`; no query params or body.

Intended response data:

```ts
{
  orgId: string;
  userId: string;
  email: string | null;
  username: string;
  name: string | null;
  type: "internal" | "oidc";
  isOwner: boolean;
  twoFactorEnabled: boolean;
  autoProvisioned: boolean | null;
  idpId: number | null;
  idpName: string | null;
  idpType: "oidc" | null;
  idpVariant: "oidc" | "google" | "azure" | null;
  idpAutoProvision: boolean | null;
  isAdmin: boolean;
  roleIds: number[];
  roles: { roleId: number; name: string }[];
}
```

Known behavior: API-key calls may return `403` before querying when user-org context is absent.

Other visible errors include `400` for invalid params, `404` when the user is not in the org, and `500` for unexpected errors.

## `GET /v1/org/:orgId/user-by-username`

Gets a user in an organization by username.

Auth: API key with org access; action `getOrgUser`.

Request:

- Path param `orgId: string`.
- Body: none.

Query params:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `username` | string | yes | Minimum 1 char. |
| `idpId` | positive integer string | no | Empty string becomes undefined. If omitted, only internal users are searched. |

Response: same shape as `GET /v1/org/:orgId/user/:userId`.

Errors include `400` for invalid params/query or multiple external users matching without `idpId`, `404` when no matching user is found, and `500` for unexpected errors.

## `POST /v1/user/:userId/2fa`

Updates internal-user 2FA setup state.

Auth: root API key; action `updateUser`; Limits; action audit.

Request:

- Path param `userId: string`.
- Body: `{ twoFactorSetupRequested: boolean }`.

Response data:

```ts
{
  userId: string;
  twoFactorRequested: boolean;
}
```

Errors include `400` for invalid params/body or external users, `404` when the user is missing, and `500` for unexpected errors.

## `GET /v1/user/:userId`

Gets a user by ID.

Auth: root API key; action `getUser`.

Request: path param `userId: non-empty string`; no query params or body.

Response data includes `userId`, `email`, `username`, `name`, `type`, `twoFactorEnabled`, `twoFactorSetupRequested`, `emailVerified`, `serverAdmin`, `idpName`, `idpId`, and `dateCreated`.

Errors include `400` for invalid user ID, `404` when the user is missing, and `500` for unexpected errors.

## `GET /v1/org/:orgId/users`

Lists users in an organization.

Auth: API key with org access; action `listUsers`.

Request: path param `orgId: string`; no body.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `pageSize` | integer | `20` | Positive; invalid values fall back to `20`. |
| `page` | integer | `1` | Minimum `0`; invalid values fall back to `1`. |
| `query` | string | none | Searches name, username, email. |
| `sort_by` | `"username"` | none | Invalid values ignored. |
| `order` | `"asc" | "desc"` | `"asc"` | Invalid values fall back to `"asc"`. |
| `idp_id` | `"internal"` or positive integer | none | Numeric ID must be linked to the org. |
| `role_id` | repeated positive integer query param | none | Up to 50 IDs; all must belong to org. |

Response data:

```ts
{
  users: Array<{
    id: string;
    email: string | null;
    emailVerified: boolean;
    dateCreated: string;
    orgId: string;
    username: string;
    name: string | null;
    type: "internal" | "oidc";
    isOwner: boolean;
    idpName: string | null;
    idpId: number | null;
    idpType: "oidc" | null;
    idpVariant: "oidc" | "google" | "azure" | null;
    twoFactorEnabled: boolean;
    roles: { roleId: number; roleName: string }[];
  }>;
  pagination: { total: number; page: number; pageSize: number };
}
```

Errors include `400` for invalid params/query, idp not linked to org, or invalid role filters, and `500` for unexpected errors.

## `PUT /v1/org/:orgId/user`

Creates or attaches an OIDC org user.

Auth: API key with org access; action `createOrgUser`; Limits; action audit.

Request path param: `orgId: non-empty string`.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `email` | email string | no | Lowercased. |
| `username` | string | yes | Non-empty, lowercased. |
| `name` | string | no | Stored on new user. |
| `type` | `"internal" | "oidc"` | no | `internal` returns `400`; `oidc` is implemented. |
| `idpId` | number | for OIDC | Must exist and be OIDC. |
| `roleIds` | positive integer array | conditionally | At least one `roleIds` item or `roleId` is required; de-duplicated. |
| `roleId` | positive integer | conditionally | Legacy single-role field. |

Response: envelope with `data: {}`, message `Org user created successfully`, status `201`.

Errors include `400` for invalid params/body, internal users, missing/invalid IDP, existing user already in org, or role IDs outside org; `403` for SaaS plan limits, org OIDC subscription, or multi-role feature limits; `404` for missing org or SaaS usage; and `500` for unexpected errors.

## `POST /v1/org/:orgId/user/:userId`

Updates org-user metadata.

Auth: API key with org access and user access; action `updateOrgUser`; Limits; action audit.

Request path params: `orgId: string`, `userId: string`.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `autoProvisioned` | boolean | no | Body must contain at least one key. |

Response: envelope with updated `userOrgs` object, message `Org user updated successfully`.

Errors include `400` for invalid params/body, `404` when the user is not in the org, and `500` for unexpected errors.

## `DELETE /v1/org/:orgId/user/:userId`

Removes a user from an organization.

Auth: API key with org access and user access; action `removeUser`; action audit.

Request path params: `orgId: string`, `userId: string`; no query params or body.

Response: envelope with `data: null`, message `User removed from org successfully`.

Errors include `400` for invalid params or attempting to remove the org owner, `404` when the user or org is missing, and `500` for unexpected errors.

## `PUT /v1/org/:orgId/role`

Creates a role.

Auth: API key with org access; action `createRole`; Limits; action audit.

Request path param: `orgId: string`.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | 1-255 chars; unique within org. |
| `description` | string | no | Stored on role. |
| `requireDeviceApproval` | boolean | no | Ignored unless device approvals are licensed/subscribed. |
| `allowSsh` | boolean | no | Adds `signSshKey` action when true. |
| `sshSudoMode` | `"none" | "full" | "commands"` | no | Stored only when `sshPam` is licensed/subscribed. |
| `sshSudoCommands` | string array | no | JSON-stringified when licensed. |
| `sshCreateHomeDir` | boolean | no | Stored only when licensed. |
| `sshUnixGroups` | string array | no | JSON-stringified when licensed. |

Response: envelope with created `Role`, message `Role created successfully`, status `201`.

Errors include `400` for invalid params/body or duplicate role name and `500` for unexpected errors.

## `POST /v1/role/:roleId`

Updates a role.

Auth: API key with role access; action `updateRole`; Limits; action audit.

Request path param: `roleId: positive integer`.

Body fields match role creation, but all are optional and at least one key is required. Admin roles ignore `name` and `description` updates. `allowSsh: true` adds `signSshKey`; `allowSsh: false` removes it.

Response: envelope with updated `Role`, message `Role updated successfully`.

Errors include `400` for invalid params/body or role without org ID, `404` when the role is missing, and `500` for unexpected errors.

## `GET /v1/org/:orgId/roles`

Lists roles in an organization.

Auth: API key with org access; action `listRoles`.

Query params: `pageSize` positive integer default `20`, `page` integer min `0` default `1`, optional `query`, optional `sort_by: "name"`, and `order: "asc" | "desc"` default `asc`.

Response data:

```ts
{
  roles: Array<Role & {
    orgName: string | null;
    allowSsh: boolean;
  }>;
  pagination: { total: number; page: number; pageSize: number };
}
```

Errors include `400` for invalid params/query and `500` for unexpected errors.

## `DELETE /v1/role/:roleId`

Deletes a role after reassigning users to another role.

Auth: API key with role access; action `deleteRole`; action audit.

Request:

- Path param `roleId: positive integer` for role to delete.
- Body: `{ roleId: positive integer }` where body `roleId` is the replacement role.

Response: envelope with `data: null`, message `Role deleted successfully`.

Errors include `400` for invalid params/body or deleting into the same role, `403` for admin role deletion, `404` when either role is missing, and `500` for unexpected errors.

## `GET /v1/role/:roleId`

Gets a role.

Auth: API key with role access; action `getRole`.

Request: path param `roleId: positive integer`; no query params or body.

Response: envelope with `Role`, message `Role retrieved successfully`.

Errors include `400` for invalid params, `404` when the role is missing, and `500` for unexpected errors.

## `POST /v1/role/:roleId/add/:userId`

Legacy endpoint that replaces all of a user's org roles with exactly one role.

Auth: API key with role access and user access; action `addUserRole`; Limits; action audit.

Request: path params `roleId: number`, `userId: string`; no query params or body.

Response: envelope with the existing `userOrgs` row plus `roleId`, message `Role added to user successfully`.

Errors include `400` for invalid params or invalid role ID, `403` when changing an owner role, `404` when the user is not in the role's org or the role is not in the org, and `500` for unexpected errors.

## `POST /v1/user/:userId/add-role/:roleId` private/proprietary

Adds one role to a user without replacing existing roles.

Auth: API key with role access and user access; action `addUserRole`; Limits; action audit.

Request: path params `userId: string`, `roleId: number`; no query params or body.

Response: envelope with inserted `{ userId, orgId, roleId }`, or the same object when the assignment already existed due `onConflictDoNothing`; message `Role added to user successfully`.

Errors include `400` for invalid params or invalid role ID, `403` when changing an owner role, `404` when the user is not in the role's org or the role is not in the org, and `500` for unexpected errors.

## `DELETE /v1/user/:userId/remove-role/:roleId` private/proprietary

Removes one role from a user.

Auth: API key with role access and user access; action `removeUserRole`; Limits; action audit.

Request: path params `userId: string`, `roleId: number`; no query params or body.

Response: envelope with `{ userId, orgId, roleId }`, message `Role removed from user successfully`.

Errors include `400` for invalid params or invalid role ID, `403` when changing an owner role or removing the user's last role in the org, `404` when the user is not in the role's org, and `500` for unexpected errors.
