# Resource Access Controls

All routes use bearer API-key authentication. `verifyApiKeyResourceAccess` loads the resource by `resourceId`, allows root keys, and otherwise requires API-key access to the resource's organization.

## `GET /v1/resource/:resourceId/roles`

Lists roles assigned to a resource.

Auth: API key with resource access; action `listResourceRoles`.

Request: path param `resourceId: positive integer`; no query params or body.

Response data:

```ts
{
  roles: Array<{
    roleId: number;
    name: string;
    description: string | null;
    isAdmin: boolean | null;
  }>;
}
```

Errors include `400` for invalid params and `500` with message `An error occurred`.

## `GET /v1/resource/:resourceId/users`

Lists users assigned directly to a resource.

Auth: API key with resource access; action `listResourceUsers`.

Request: path param `resourceId: positive integer`; no query params or body.

Response data:

```ts
{
  users: Array<{
    userId: string;
    username: string;
    type: "internal" | "oidc";
    idpName: string | null;
    idpId: number | null;
    email: string | null;
  }>;
}
```

Errors include `400` for invalid params and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/roles`

Replaces non-admin roles assigned to a resource.

Auth: API key with resource access and role access; action `setResourceRoles`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ roleIds: positive integer[] }`.

Response: envelope with `data: {}`, message `Roles set for resource successfully`, status `201`.

Errors include `400` for invalid params/body or admin role assignment, `500` when the resource is not found, and `500` with message `An error occurred` for unexpected errors. Role-access middleware can also return `404` for missing roles and `403` for cross-org or inaccessible roles.

## `POST /v1/resource/:resourceId/users`

Replaces users assigned directly to a resource.

Auth: API key with resource access and access to every requested user; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ userIds: string[] }`.

Response: envelope with `data: {}`, message `Users set for resource successfully`, status `201`.

Errors include `400` for invalid params/body and `500` with message `An error occurred`. The user-access middleware can return `403` when the API key cannot access one or more requested users.

## `POST /v1/resource/:resourceId/roles/add`

Adds one non-admin role to a resource.

Auth: API key with resource access and role access; action `setResourceRoles`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ roleId: positive integer }`.

Response: envelope with `data: {}`, message `Role added to resource successfully`, status `201`.

Errors include `400` for invalid params/body or admin role assignment, `404` when the resource is missing or role is missing/not in the resource org, `409` when already assigned, and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/roles/remove`

Removes one non-admin role from a resource.

Auth: API key with resource access and role access; action `setResourceRoles`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ roleId: positive integer }`.

Response: envelope with `data: {}`, message `Role removed from resource successfully`.

Errors include `400` for invalid params/body or admin role removal, `404` when the resource, role, or role assignment is missing, and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/users/add`

Adds one user to a resource.

Auth: API key with resource access and access to the requested user; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ userId: string }`.

Response: envelope with `data: {}`, message `User added to resource successfully`, status `201`.

Errors include `400` for invalid params/body, `404` when the resource is missing, `409` when already assigned, and `500` with message `An error occurred`. The user-access middleware can return `403` when the API key cannot access the requested user.

## `POST /v1/resource/:resourceId/users/remove`

Removes one user from a resource.

Auth: API key with resource access and access to the requested user; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ userId: string }`.

Response: envelope with `data: {}`, message `User removed from resource successfully`.

Errors include `400` for invalid params/body, `404` when the resource or assignment is missing, and `500` with message `An error occurred`. The user-access middleware can return `403` when the API key cannot access the requested user.

## `POST /v1/resource/:resourceId/password`

Sets or removes a resource password.

Auth: API key with resource access; action `setResourcePassword`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ password: string | null }`; string must be 4-100 chars. `null` removes the password.

Response: envelope with `data: {}`, message `Resource password set successfully`, status `201`.

Errors include `400` for invalid params/body and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/pincode`

Sets or removes a 6-digit resource PIN code.

Auth: API key with resource access; action `setResourcePincode`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ pincode: string | null }`; string must match exactly six digits. `null` removes the PIN.

Response: envelope with `data: {}`, message `Resource PIN code set successfully`, status `201`.

Errors include `400` for invalid params/body and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/header-auth`

Sets or removes header authentication.

Auth: API key with resource access; action `setResourceHeaderAuth`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body:

```ts
{
  user: string | null; // 4-100 chars when string
  password: string | null; // 4-100 chars when string
  extendedCompatibility: boolean | null;
}
```

Existing header auth is cleared first. New header auth is inserted only when `user`, `password`, and non-null `extendedCompatibility` are all provided.

Response: envelope with `data: {}`, message `Header Authentication set successfully`, status `201`.

Errors include `400` for invalid params/body and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/whitelist`

Replaces the email whitelist for a resource.

Auth: API key with resource access; action `setResourceWhitelist`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ emails: string[] }`; max 50 entries. Each entry must be an email address or wildcard domain address where `*` is the entire local part, such as `*@example.com`. Entries are lowercased.

Response: envelope with `data: {}`, message `Whitelist set for resource successfully`, status `201`.

Errors include `400` for invalid params/body or when `emailWhitelistEnabled` is false on the resource, `404` when the resource is missing, and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/whitelist/add`

Adds one email or wildcard-domain email to the resource whitelist.

Auth: API key with resource access; action `setResourceWhitelist`; Limits.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ email: string }`; email or wildcard domain address with `*` as the whole local part. Lowercased.

Response: envelope with `data: {}`, message `Email added to whitelist successfully`, status `201`.

Errors include `400` for invalid params/body or whitelist disabled, `404` when the resource is missing, `409` when the email already exists, and `500` with message `An error occurred`.

## `POST /v1/resource/:resourceId/whitelist/remove`

Removes one email or wildcard-domain email from the resource whitelist.

Auth: API key with resource access; action `setResourceWhitelist`; Limits.

Request:

- Path param `resourceId: positive integer`.
- Body: `{ email: string }`; email or wildcard domain address with `*` as the whole local part. Lowercased.

Response: envelope with `data: {}`, message `Email removed from whitelist successfully`.

Errors include `400` for invalid params/body or whitelist disabled, `404` when the resource or email entry is missing, and `500` with message `An error occurred`.

## `GET /v1/resource/:resourceId/whitelist`

Gets whitelist emails for a resource.

Auth: API key with resource access; action `getResourceWhitelist`.

Request: path param `resourceId: positive integer`; no query params or body.

Response data:

```ts
{
  whitelist: Array<{
    email: string;
  }>;
}
```

Errors include `400` for invalid params and `500` with message `An error occurred`.
