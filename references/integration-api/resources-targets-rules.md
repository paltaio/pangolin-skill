# Resources, Targets, And Rules

Common `Resource` fields:

```ts
{
  resourceId: number;
  resourceGuid: string;
  orgId: string;
  niceId: string;
  name: string;
  subdomain: string | null;
  fullDomain: string | null;
  domainId: string | null;
  ssl: boolean;
  blockAccess: boolean;
  sso: boolean;
  http: boolean;
  protocol: string;
  proxyPort: number | null;
  emailWhitelistEnabled: boolean;
  applyRules: boolean;
  enabled: boolean;
  stickySession: boolean;
  tlsServerName: string | null;
  setHostHeader: string | null;
  enableProxy: boolean | null;
  skipToIdpId: number | null;
  headers: string | null;
  proxyProtocol: boolean;
  proxyProtocolVersion: number | null;
  maintenanceModeEnabled: boolean;
  maintenanceModeType: "forced" | "automatic" | null;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  maintenanceEstimatedTime: string | null;
  postAuthPath: string | null;
  health: "healthy" | "unhealthy" | "unknown" | string | null;
  wildcard: boolean;
}
```

Common `Target` fields:

```ts
{
  targetId: number;
  resourceId: number;
  siteId: number;
  ip: string;
  method: string | null;
  port: number;
  internalPort: number | null;
  enabled: boolean;
  path: string | null;
  pathMatchType: string | null;
  rewritePath: string | null;
  rewritePathType: string | null;
  priority: number;
}
```

Common health-check fields returned with target operations include `targetHealthCheckId`, `targetId`, `orgId`, `siteId`, `name`, `hcEnabled`, `hcPath`, `hcScheme`, `hcMode`, `hcHostname`, `hcPort`, `hcInterval`, `hcUnhealthyInterval`, `hcTimeout`, `hcHeaders`, `hcFollowRedirects`, `hcMethod`, `hcStatus`, `hcHealth`, `hcTlsServerName`, `hcHealthyThreshold`, and `hcUnhealthyThreshold`.

## `PUT /v1/org/:orgId/resource`

Creates a public resource.

Auth: API key with org access; action `createResource`; Limits; action audit.

Request:

- Path param `orgId: string`.
- Query params: none.

HTTP resource body, selected when `http: true`:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | 1-255 chars. |
| `subdomain` | string or null | no | Must pass subdomain or wildcard-subdomain schema when present. Wildcards require the `wildcardSubdomain` tier/license. |
| `http` | boolean | yes | Must be `true` for this body branch. |
| `protocol` | `"tcp" | "udp"` | yes | HTTP resources are stored with protocol `tcp`. |
| `domainId` | string | yes | Used with `subdomain` to construct `fullDomain`. |
| `stickySession` | boolean | no | Stored on the resource. |
| `postAuthPath` | string or null | no | Stored on the resource. |

Raw resource body, selected when `http: false`:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | 1-255 chars. |
| `http` | boolean | yes | Must be `false` for this body branch. |
| `protocol` | `"tcp" | "udp"` | yes | Stored on the resource. |
| `proxyPort` | integer | yes | 1-65535; rejected unless raw resources are allowed. |

Response: envelope with created `Resource`, status `201`. Message is `Http resource created successfully` or `Non-http resource created successfully`.

Errors include `400` for invalid params/body, missing `http`, disallowed raw resources, invalid domain construction, or unsupported custom domain namespace; `403` for missing user role or unlicensed wildcard subdomain; `404` when the org or admin role is missing; `409` for duplicate/conflicting resource domain, dashboard-domain conflict, or login-page-domain conflict; `500` for creation failure or unexpected errors.

## `PUT /v1/org/:orgId/site/:siteId/resource`

Same request and response shape as `PUT /v1/org/:orgId/resource`.

Auth: API key with org access; action `createResource`; Limits; action audit. No site-access check.

Current API behavior: the extra `siteId` path param causes a `400` validation error before resource creation.

## `GET /v1/site/:siteId/resources`

Auth: API key with site access; action `listResources`.

Current API behavior: this path returns a `400` validation error before listing because the accepted params require `orgId`, not `siteId`.

## `GET /v1/org/:orgId/resources`

Lists resources in an organization.

Auth: API key with org access; action `listResources`.

Request:

- Path param `orgId: string`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `pageSize` | integer | `20` | Positive; invalid values fall back to `20`. |
| `page` | integer | `1` | Minimum `0`; invalid values fall back to `1`. Runtime offset is `pageSize * (page - 1)`. |
| `query` | string | none | Searches resource name, niceId, and fullDomain. |
| `sort_by` | `"name"` | none | Invalid values are ignored. |
| `order` | `"asc" | "desc"` | `"asc"` | Invalid values fall back to `"asc"`. |
| `enabled` | `"true" | "false"` | none | Transformed to boolean; invalid values ignored. |
| `authState` | `"protected" | "not_protected" | "none"` | none | Filters by auth mechanisms or non-HTTP resources. |
| `healthStatus` | `"healthy" | "degraded" | "unhealthy" | "unknown"` | none | OpenAPI description says `offline`, but schema enum uses `unhealthy`. |
| `siteId` | positive integer | none | Filters to resources with at least one target on the site. |

Response data:

```ts
{
  resources: Array<{
    resourceId: number;
    niceId: string;
    name: string;
    ssl: boolean;
    fullDomain: string | null;
    passwordId: number | null;
    sso: boolean;
    pincodeId: number | null;
    whitelist: boolean;
    http: boolean;
    protocol: string;
    proxyPort: number | null;
    wildcard: boolean;
    enabled: boolean;
    domainId: string | null;
    headerAuthId: number | null;
    health: string | null;
    targets: Array<{
      targetId: number;
      resourceId: number;
      siteId: number;
      ip: string;
      port: number;
      enabled: boolean;
      healthStatus: "healthy" | "unhealthy" | "unknown" | null;
      hcEnabled: boolean | null;
      siteName: string | null;
      siteNiceId: string | null;
      siteOnline: boolean | null;
      siteType: string | null;
    }>;
    sites: Array<{
      siteId: number;
      siteName: string;
      siteNiceId: string;
      online?: boolean;
    }>;
  }>;
  pagination: {
    total: number;
    pageSize: number;
    page: number;
  };
}
```

Errors include `400` for invalid params/query or missing org context, `403` when a user context lacks org access, and `500` for unexpected errors.

## `GET /v1/org/:orgId/resource-names`

Lists resource IDs and names for an organization.

Auth: API key with org access; action `listResources`.

Request: path param `orgId: string`; no query params or body.

Response data:

```ts
Array<{
  resourceId: number;
  name: string;
}>
```

Errors include `400` for invalid params and `500` with message `An error occurred`.

## `GET /v1/resource/:resourceId`

Gets one resource by ID.

Auth: API key with resource access; action `getResource`.

Request: path param `resourceId: positive integer`; no query params or body.

Response: envelope with `Resource`, except `headers` is parsed from JSON string into `{ name: string; value: string }[] | null`.

Errors include `400` for invalid params, `404` when the resource is missing, and `500` for unexpected errors.

## `POST /v1/resource/:resourceId`

Updates a resource. The HTTP or raw update schema is selected based on the existing resource's `http` flag.

Auth: API key with resource access; action `updateResource`; Limits; action audit.

Request path param: `resourceId: positive integer`.

HTTP resource body fields:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | no | 1-255 chars. |
| `niceId` | string | no | 1-255 chars; letters, numbers, and dashes only; unique within org. |
| `subdomain` | string or null | no | Must pass subdomain or wildcard-subdomain schema when present. |
| `ssl` | boolean | no | Stored on the resource. |
| `sso` | boolean | no | Stored on the resource. |
| `blockAccess` | boolean | no | Stored on the resource. |
| `emailWhitelistEnabled` | boolean | no | Stored on the resource. |
| `applyRules` | boolean | no | Stored on the resource. |
| `domainId` | string | no | Recomputes domain/fullDomain. |
| `enabled` | boolean | no | Stored on the resource. |
| `stickySession` | boolean | no | Stored on the resource. |
| `tlsServerName` | string or null | no | Must pass TLS-name schema when present. |
| `setHostHeader` | string or null | no | Must pass TLS-name schema when present. |
| `skipToIdpId` | positive integer or null | no | Stored on the resource. |
| `headers` | array or null | no | Items are `{ name: string; value: string }`; names must be valid HTTP token chars; values printable ASCII/horizontal whitespace; `{{...}}` templates rejected. |
| `maintenanceModeEnabled` | boolean | no | Ignored unless maintenance page feature is licensed/subscribed. |
| `maintenanceModeType` | `"forced" | "automatic"` | no | Ignored unless maintenance page feature is licensed/subscribed. |
| `maintenanceTitle` | string or null | no | Max 255; ignored unless licensed/subscribed. |
| `maintenanceMessage` | string or null | no | Max 2000; ignored unless licensed/subscribed. |
| `maintenanceEstimatedTime` | string or null | no | Max 100; ignored unless licensed/subscribed. |
| `postAuthPath` | string or null | no | Stored on the resource. |

Raw resource body fields:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `name` | string | no | 1-255 chars. |
| `niceId` | string | no | 1-255 chars; unique within org. |
| `proxyPort` | integer | no | 1-65535; rejected unless raw resources are allowed. |
| `stickySession` | boolean | no | Stored on the resource. |
| `enabled` | boolean | no | Stored on the resource. |
| `proxyProtocol` | boolean | no | Stored on the resource. |
| `proxyProtocolVersion` | integer | no | Minimum 1. |

Both body schemas require at least one field.

Response: envelope with updated `Resource`. Message is `HTTP resource updated successfully` or `Non-http Resource updated successfully`.

Errors include `400` for invalid params/body, invalid domain construction, invalid custom domain namespace, or disallowed proxyPort changes; `403` for unlicensed wildcard subdomain; `404` when the resource is missing; `409` for duplicate niceId, duplicate/conflicting fullDomain, dashboard-domain conflict, or login-page-domain conflict; `500` for unexpected errors.

## `DELETE /v1/resource/:resourceId`

Deletes a resource and removes related targets by cascade.

Auth: API key with resource access; action `deleteResource`; action audit.

Request: path param `resourceId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Resource deleted successfully`.

Errors include `400` for invalid params, `404` when the resource or a target site is missing, and `500` for unexpected errors.

## `PUT /v1/resource/:resourceId/target`

Creates a target for a resource.

Auth: API key with resource access; action `createTarget`; Limits; action audit.

Request path param: `resourceId: positive integer`.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `siteId` | positive integer | yes | Target site. |
| `ip` | string | yes | Must pass `isTargetValid`. WireGuard sites also require IP within site subnet. |
| `method` | string or null | no | Stored on target. |
| `port` | integer | yes | 1-65535. |
| `enabled` | boolean | no | Defaults to `true`. |
| `hcEnabled` | boolean | no | Defaults health check enabled false. |
| `hcPath` | string or null | no | Min 1 when string. |
| `hcScheme`, `hcMode`, `hcHostname`, `hcTlsServerName` | string or null | no | Stored on health check. |
| `hcPort`, `hcInterval`, `hcUnhealthyInterval`, `hcTimeout`, `hcHealthyThreshold`, `hcUnhealthyThreshold` | positive integer or null | no | Minimum 1 when present. |
| `hcHeaders` | array or null | no | Items are `{ name: string; value: string }`; stored as JSON string. |
| `hcFollowRedirects` | boolean or null | no | Stored on health check. |
| `hcMethod` | string or null | no | Min 1 when string. |
| `hcStatus` | integer or null | no | Stored on health check. |
| `path` | string or null | no | Stored on target. |
| `pathMatchType` | `"exact" | "prefix" | "regex" | null` | no | Stored on target. |
| `rewritePath` | string or null | no | Stored on target. |
| `rewritePathType` | `"exact" | "prefix" | "regex" | "stripPrefix" | null` | no | Stored on target. |
| `priority` | integer or null | no | 1-1000; defaults to `100`. |

Response: envelope with combined `Target & TargetHealthCheck`, message `Target created successfully`, status `201`.

Errors include `400` for invalid params/body, target IP outside WireGuard site subnet, or no available internal port; `404` when the resource or site is missing; `500` for unexpected errors.

## `GET /v1/resource/:resourceId/targets`

Lists targets for a resource.

Auth: API key with resource access; action `listTargets`.

Request:

- Path param `resourceId: positive integer`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `limit` | integer encoded as string | `1000` | Positive. |
| `offset` | integer encoded as string | `0` | Non-negative. |

Response data:

```ts
{
  targets: Array<Target & {
    siteType: string | null;
    siteName: string | null;
    hcEnabled: boolean | null;
    hcPath: string | null;
    hcScheme: string | null;
    hcMode: string | null;
    hcHostname: string | null;
    hcPort: number | null;
    hcInterval: number | null;
    hcUnhealthyInterval: number | null;
    hcTimeout: number | null;
    hcHeaders: { name: string; value: string }[] | string | null;
    hcFollowRedirects: boolean | null;
    hcMethod: string | null;
    hcStatus: number | null;
    hcHealth: string | null;
    hcTlsServerName: string | null;
    hcHealthyThreshold: number | null;
    hcUnhealthyThreshold: number | null;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

Errors include `400` for invalid params/query and `500` for unexpected errors.

## `GET /v1/target/:targetId`

Gets one target.

Auth: API key with target access; action `getTarget`.

Request: path param `targetId: positive integer`; no query params or body.

Response: envelope with combined target and optional health-check fields. `hcHeaders` is parsed from JSON into `{ name: string; value: string }[] | null`; parse failures return `null`.

Errors include `400` for invalid params, `404` when the target is missing, and `500` for unexpected errors.

## `POST /v1/target/:targetId`

Updates one target and its health check.

Auth: API key with target access; action `updateTarget`; Limits; action audit.

Request path param: `targetId: positive integer`.

Body fields are the same as target creation, except:

- `siteId: positive integer` is required.
- `ip: string` is required.
- `port` is optional.
- `method` is 1-10 chars when string.
- The body must contain at least one key.

Response: envelope with combined updated target and health-check fields, message `Target updated successfully`.

Errors include `400` for invalid params/body or no available internal port, `404` when the target, resource, site, or health check is missing, and `500` for unexpected errors.

## `DELETE /v1/target/:targetId`

Deletes one target and its health check.

Auth: API key with target access; action `deleteTarget`; action audit.

Request: path param `targetId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Target deleted successfully`.

Errors include `400` for invalid params, `404` when the target, resource, or site is missing, and `500` for unexpected errors.

## `PUT /v1/resource/:resourceId/rule`

Creates a resource rule.

Auth: API key with resource access; action `createResourceRule`; Limits; action audit.

Request:

- Path param `resourceId: positive integer`.
- Query params: none.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `action` | `"ACCEPT" | "DROP" | "PASS"` | yes | Stored on rule. |
| `match` | `"CIDR" | "IP" | "PATH" | "COUNTRY" | "ASN" | "REGION"` | yes | `CIDR`, `IP`, `PATH`, and `REGION` have extra validation. |
| `value` | string | yes | Min 1; validated according to `match` for CIDR/IP/PATH/REGION. |
| `priority` | integer | yes | Stored on rule. |
| `enabled` | boolean | no | Defaults to true. |

Response: envelope with created `ResourceRule`, message `Resource rule created successfully`, status `201`.

Errors include `400` for invalid params/body, non-HTTP resources, or invalid match value; `404` when the resource is missing; `500` for unexpected errors.

## `GET /v1/resource/:resourceId/rules`

Lists resource rules.

Auth: API key with resource access; action `listResourceRules`.

Request:

- Path param `resourceId: positive integer`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `limit` | integer encoded as string | `1000` | Positive. |
| `offset` | integer encoded as string | `0` | Non-negative. |

Response data:

```ts
{
  rules: Array<{
    ruleId: number;
    resourceId: number;
    action: string;
    match: string;
    value: string;
    priority: number;
    enabled: boolean;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

Rules are sorted by `priority` ascending after pagination.

Errors include `400` for invalid params/query, `404` when the resource is missing, and `500` for unexpected errors.

## `POST /v1/resource/:resourceId/rule/:ruleId`

Updates a resource rule.

Auth: API key with resource access; action `updateResourceRule`; Limits; action audit.

Request path params: `resourceId: positive integer`, `ruleId: positive integer`.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `action` | `"ACCEPT" | "DROP" | "PASS"` | no | Stored on rule. |
| `match` | `"CIDR" | "IP" | "PATH" | "COUNTRY" | "ASN" | "REGION"` | no | Used with `value` validation. |
| `value` | string | no | Min 1; when provided, validated against new `match` or existing rule match for CIDR/IP/PATH/REGION. |
| `priority` | integer | yes | Required by zod despite the "at least one field" refinement. |
| `enabled` | boolean | no | Stored on rule. |

Response: envelope with updated `ResourceRule`, message `Resource rule updated successfully`.

Errors include `400` for invalid params/body, non-HTTP resources, or invalid match value; `403` when the rule does not belong to the resource; `404` when the resource or rule is missing; `500` for unexpected errors.

## `DELETE /v1/resource/:resourceId/rule/:ruleId`

Deletes a resource rule.

Auth: API key with resource access; action `deleteResourceRule`; action audit.

Request path params: `resourceId: positive integer`, `ruleId: positive integer`; no query params or body.

Response: envelope with `data: null`, message `Resource rule deleted successfully`.

Errors include `400` for invalid params, `404` when the rule is missing, and `500` for unexpected errors.

