# Site Resources

Common `SiteResource` fields:

```ts
{
  siteResourceId: number;
  orgId: string;
  networkId: number | null;
  defaultNetworkId: number | null;
  niceId: string;
  name: string;
  ssl: boolean;
  mode: "host" | "cidr" | "http";
  scheme: "http" | "https" | null;
  proxyPort: number | null;
  destinationPort: number | null;
  destination: string;
  enabled: boolean;
  alias: string | null;
  aliasAddress: string | null;
  tcpPortRangeString: string;
  udpPortRangeString: string;
  disableIcmp: boolean;
  authDaemonPort: number | null;
  authDaemonMode: "site" | "remote" | null;
  domainId: string | null;
  subdomain: string | null;
  fullDomain: string | null;
}
```

Port range strings accept `*`, an empty string, a single port, or comma-separated ports/ranges such as `80,443,8000-9000`; ports must be `1-65535`, and range starts must be less than or equal to range ends.

## `PUT /v1/org/:orgId/site-resource`

Creates a site resource.

Auth: API key with org access; action `createSiteResource`; Limits; action audit.

Request:

- Path param `orgId: string`.
- Query params: none.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | 1-255 chars. |
| `niceId` | string | no | Generated when omitted. |
| `mode` | `"host" | "cidr" | "http"` | yes | HTTP mode requires subscription/license for `HTTPPrivateResources`. |
| `ssl` | boolean | no | Used for HTTP mode/certificate behavior. |
| `scheme` | `"http" | "https"` | no | Required by refinement when `mode` is `http`. |
| `siteIds` | integer array | conditionally | At least one of `siteIds` or deprecated `siteId` must be provided. |
| `siteId` | positive integer | conditionally | Deprecated compatibility field merged into `siteIds`. |
| `destinationPort` | positive integer | no | Required by refinement when `mode` is `http`; must be `1-65535`. |
| `destination` | string | yes | Host mode accepts IPv4 or hostname; hostname requires `alias`. CIDR mode requires IPv4/IPv6 CIDR. HTTP mode has no destination-format refinement. |
| `enabled` | boolean | no | Defaults to `true`. |
| `alias` | FQDN/wildcard string | no | Must match accepted format; trimmed before storage. Mutually exclusive with `domainId`. Required when host destination is a hostname. |
| `userIds` | string array | yes | Inserted into user-site-resource associations. |
| `roleIds` | integer array | yes | Inserted into role-site-resource associations after admin role is added. |
| `clientIds` | integer array | yes | Inserted into client-site-resource associations. |
| `tcpPortRangeString` | port range string | no | When `mode` is `http` the server forces `"443,80"` regardless of input. |
| `udpPortRangeString` | port range string | no | When `mode` is `http` the server forces `""` regardless of input. |
| `disableIcmp` | boolean | no | When `mode` is `http` the server forces `true` regardless of input; otherwise stored as provided (default `false`). |
| `authDaemonPort` | positive integer | no | Silently dropped on write unless the `sshPam` tier feature is licensed/subscribed. |
| `authDaemonMode` | `"site" | "remote"` | no | Silently dropped on write unless the `sshPam` tier feature is licensed/subscribed. |
| `domainId` | string | no | Used with `subdomain` to construct `fullDomain`; mutually exclusive with `alias`. |
| `subdomain` | string | no | Used only with `domainId`. |

Response: envelope with created `SiteResource`, message `Site resource created successfully`, status `201`.

Errors include `400` for invalid params/body, destination IP inside the org subnet or utility subnet, missing org subnet/utilitySubnet, invalid domain construction, or both `alias` and `domainId`; `403` when HTTP private resources are unavailable; `404` when any site, org, admin role, or site Newt is missing; `409` for duplicate `fullDomain` or duplicate alias in the org; `500` for creation failure or unexpected errors.

## `GET /v1/org/:orgId/site/:siteId/resources`

Lists site resources associated with one site.

Auth: API key with org access and site access; action `listSiteResources`.

Request:

- Path param `orgId: string`.
- Path param `siteId: positive integer`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `limit` | integer encoded as string | `100` | Positive. Invalid values return `400`. |
| `offset` | integer encoded as string | `0` | Non-negative. Invalid values return `400`. |
| `sort_by` | `"name"` | none | Invalid values are caught as `undefined`. |
| `order` | `"asc" | "desc"` | `"asc"` | Invalid values fall back to `"asc"`. |

Response data:

```ts
{
  siteResources: Array<{
    siteNetworks: {
      siteId: number;
      networkId: number;
    };
    networks: {
      networkId: number;
      niceId: string | null;
      name: string | null;
      scope: "global" | "resource";
      orgId: string;
    };
    siteResources: SiteResource;
  }>;
}
```

Response data uses joined site-network, network, and site-resource objects, not plain `SiteResource` objects.

Errors include `400` for invalid params/query, `404` when the site is not found in the org, and `500` for unexpected listing errors.

## `GET /v1/org/:orgId/site-resources`

Lists all site resources in an organization.

Auth: API key with org access; action `listSiteResources`.

Request:

- Path param `orgId: string`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `pageSize` | integer | `20` | Positive; invalid values fall back to `20`. |
| `page` | integer | `1` | Minimum `0`; invalid values fall back to `1`. Runtime offset is `pageSize * (page - 1)`. |
| `query` | string | none | Case-insensitive search across name, niceId, destination, alias, aliasAddress, and site name. |
| `mode` | `"host" | "cidr" | "http"` | none | Invalid values are ignored. |
| `sort_by` | `"name"` | none | Invalid values are ignored. |
| `order` | `"asc" | "desc"` | `"asc"` | Invalid values fall back to `"asc"`. |
| `siteId` | positive integer | none | Filters to site resources associated with that site. |

Response data:

```ts
{
  siteResources: Array<SiteResource & {
    siteOnlines: boolean[];
    siteIds: number[];
    siteNames: string[];
    siteNiceIds: string[];
    siteAddresses: (string | null)[];
  }>;
  pagination: {
    total: number;
    pageSize: number;
    page: number;
  };
}
```

Errors include `400` for invalid params/query and `500` for unexpected listing errors.

## `GET /v1/site-resource/:siteResourceId`

Gets one site resource.

Auth: API key with site-resource access; action `getSiteResource`.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: none.

Intended response: envelope with `SiteResource`, message `Site resource retrieved successfully`.

Known behavior: this route can return `400` before querying because `orgId` is required by validation but not present in the path.

## `POST /v1/site-resource/:siteResourceId`

Updates a site resource.

Auth: API key with site-resource access; action `updateSiteResource`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | no | 1-255 chars. |
| `siteIds` | integer array | conditionally | At least one of `siteIds` or deprecated `siteId` must be provided. |
| `siteId` | positive integer | conditionally | Deprecated compatibility field merged into `siteIds`. |
| `niceId` | string | no | 1-255 chars; letters, numbers, and dashes only. |
| `mode` | `"host" | "cidr" | "http"` | no | HTTP mode requires subscription/license for `HTTPPrivateResources`. |
| `ssl` | boolean | no | Stored on the resource. |
| `scheme` | `"http" | "https" | null` | no | Required when `mode` is `http`. |
| `destinationPort` | positive integer or null | no | Required when `mode` is `http`; must be `1-65535`. |
| `destination` | string | no | Host mode accepts IPv4 or hostname; hostname requires `alias`. CIDR mode requires IPv4/IPv6 CIDR. |
| `enabled` | boolean | no | Stored on the resource. |
| `alias` | FQDN/wildcard string or null | no | Must match accepted format when string; trimmed before storage. |
| `userIds` | string array | yes | Replaces user associations. |
| `roleIds` | integer array | yes | Replaces non-admin role associations. |
| `clientIds` | integer array | yes | Replaces client associations. |
| `tcpPortRangeString` | port range string | no | When `mode` is `http` the server forces `"443,80"` regardless of input; otherwise stored as provided. |
| `udpPortRangeString` | port range string | no | When `mode` is `http` the server forces `""` regardless of input; otherwise stored as provided. |
| `disableIcmp` | boolean | no | When `mode` is `http` the server forces `true` regardless of input; otherwise stored as provided (default `false`). |
| `authDaemonPort` | positive integer or null | no | Silently dropped on write unless the `sshPam` tier feature is licensed/subscribed. |
| `authDaemonMode` | `"site" | "remote"` | no | Silently dropped on write unless the `sshPam` tier feature is licensed/subscribed. |
| `domainId` | string | no | Used with `subdomain` to construct `fullDomain`. |
| `subdomain` | string | no | Used only with `domainId`. |

Response: envelope with updated `SiteResource`, message `Site resource updated successfully`.

Errors include `400` for invalid params/body, destination IP inside the org subnet or utility subnet, missing org subnet/utilitySubnet, or invalid domain construction; `403` when HTTP private resources are unavailable; `404` when the site resource, org, site, or admin role is missing; `409` for duplicate `fullDomain` or duplicate alias in the org; `500` for unexpected update errors.

## `DELETE /v1/site-resource/:siteResourceId`

Deletes a site resource.

Auth: API key with site-resource access; action `deleteSiteResource`; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: none.

Response data:

```ts
{
  message: "Site resource deleted successfully";
}
```

Errors include `400` for invalid params, `404` when the site resource is not found, and `500` for unexpected delete errors.

## `GET /v1/site-resource/:siteResourceId/roles`

Lists roles assigned to a site resource.

Auth: API key with site-resource access; action `listResourceRoles`.

Request: path param `siteResourceId: positive integer`; no query params or body.

Response data:

```ts
{
  roles: Array<{
    roleId: number;
    name: string;
    description: string | null;
    isAdmin: boolean;
  }>;
}
```

Errors include `400` for invalid params and `500` with message `An error occurred`.

## `GET /v1/site-resource/:siteResourceId/users`

Lists users assigned to a site resource.

Auth: API key with site-resource access; action `listResourceUsers`.

Request: path param `siteResourceId: positive integer`; no query params or body.

Response data:

```ts
{
  users: Array<{
    userId: string;
    username: string;
    type: string;
    idpName: string | null;
    idpId: number | null;
    email: string | null;
  }>;
}
```

Errors include `400` for invalid params and `500` with message `An error occurred`.

## `GET /v1/site-resource/:siteResourceId/clients`

Lists clients assigned to a site resource.

Auth: API key with site-resource access; action `listResourceUsers`.

Request: path param `siteResourceId: positive integer`; no query params or body.

Response data:

```ts
{
  clients: Array<{
    clientId: number;
    name: string;
    subnet: string | null;
  }>;
}
```

Errors include `400` for invalid params and `500` with message `An error occurred`.

## `POST /v1/site-resource/:siteResourceId/roles`

Replaces non-admin roles assigned to a site resource.

Auth: API key with site-resource access and role access; action `setResourceRoles`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ roleIds: positive integer[] }`.

Response: envelope with `data: {}`, message `Roles set for site resource successfully`, status `201`.

Errors include `400` for invalid params/body or admin role assignment, `500` when the site resource is not found, and `500` with message `An error occurred` for unexpected errors. Role-access middleware can also return `404` for missing roles and `403` for cross-org or inaccessible roles.

## `POST /v1/site-resource/:siteResourceId/users`

Replaces users assigned to a site resource.

Auth: API key with site-resource access and access to every requested user; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ userIds: string[] }`.

Response: envelope with `data: {}`, message `Users set for site resource successfully`, status `201`.

Errors include `400` for invalid params/body, `500` when the site resource is not found, and `500` with message `An error occurred` for unexpected errors. The user-access middleware can return `403` when the API key cannot access one or more requested users.

## `POST /v1/site-resource/:siteResourceId/roles/add`

Adds one role to a site resource.

Auth: API key with site-resource access and role access; action `setResourceRoles`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ roleId: positive integer }`.

Response: envelope with `data: {}`, message `Role added to site resource successfully`, status `201`.

Errors include `400` for invalid params/body or admin role assignment, `404` when the site resource is missing or the role is missing/not in the same org, `409` when the role is already assigned, and `500` with message `An error occurred`.

## `POST /v1/site-resource/:siteResourceId/roles/remove`

Removes one role from a site resource.

Auth: API key with site-resource access and role access; action `setResourceRoles`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ roleId: positive integer }`.

Response: envelope with `data: {}`, message `Role removed from site resource successfully`.

Errors include `400` for invalid params/body or admin role removal, `404` when the site resource, role, or role assignment is missing, and `500` with message `An error occurred`.

## `POST /v1/site-resource/:siteResourceId/users/add`

Adds one user to a site resource.

Auth: API key with site-resource access and access to the requested user; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ userId: string }`.

Response: envelope with `data: {}`, message `User added to site resource successfully`, status `201`.

Errors include `400` for invalid params/body, `404` when the site resource is missing, `409` when the user is already assigned, and `500` with message `An error occurred`. The user-access middleware can return `403` when the API key cannot access the requested user.

## `POST /v1/site-resource/:siteResourceId/users/remove`

Removes one user from a site resource.

Auth: API key with site-resource access and access to the requested user; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ userId: string }`.

Response: envelope with `data: {}`, message `User removed from site resource successfully`.

Errors include `400` for invalid params/body, `404` when the site resource or assignment is missing, and `500` with message `An error occurred`. The user-access middleware can return `403` when the API key cannot access the requested user.

## `POST /v1/site-resource/:siteResourceId/clients`

Replaces machine clients assigned to a site resource.

Auth: API key with site-resource access and access to every requested client; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ clientIds: positive integer[] }`.

Response: envelope with `data: {}`, message `Clients set for site resource successfully`, status `201`.

Errors include `400` for invalid params/body or when any requested client is associated with a user, `500` when the site resource is not found, and `500` with message `An error occurred`. The client-access middleware can return `403` when the API key cannot access one or more requested clients.

## `POST /v1/site-resource/:siteResourceId/clients/add`

Adds one machine client to a site resource.

Auth: API key with site-resource access and client access; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ clientId: positive integer }`.

Response: envelope with `data: {}`, message `Client added to site resource successfully`, status `201`.

Errors include `400` for invalid params/body or a client associated with a user, `404` when the site resource or client is missing, `409` when the client is already assigned, and `500` with message `An error occurred`.

## `POST /v1/site-resource/:siteResourceId/clients/remove`

Removes one machine client from a site resource.

Auth: API key with site-resource access and client access; action `setResourceUsers`; Limits; action audit.

Request:

- Path param `siteResourceId: positive integer`.
- Query params: none.
- Body: `{ clientId: positive integer }`.

Response: envelope with `data: {}`, message `Client removed from site resource successfully`.

Errors include `400` for invalid params/body or a client associated with a user, `404` when the site resource, client, or assignment is missing, and `500` with message `An error occurred`.

## `POST /v1/client/:clientId/site-resources`

Adds one machine client to multiple site resources.

Auth: bearer API key; action `setResourceUsers`; Limits; action audit. This route does not use `verifyApiKeyClientAccess` or `verifyApiKeySetResourceClients`; the API performs API-key, org, site-resource, and client checks.

Request:

- Path param `clientId: positive integer`.
- Query params: none.
- Body: `{ siteResourceIds: positive integer[] }`, minimum one item.

Response data:

```ts
{
  addedCount: number;
  skippedCount: number;
  siteResourceIds: number[];
}
```

Response message is `Client added to N site resource(s) successfully`; status is `201`.

Errors include `401` when no API key is present, `400` for invalid params/body, cross-org site resources for non-root keys, or a user-associated client, `403` when a non-root key cannot access the site-resource org or client, `404` when one or more site resources or the client are missing, `409` when the client is already assigned to all specified site resources, and `500` with message `An error occurred`.

