# Domains

Common `Domain` fields:

```ts
{
  domainId: string;
  baseDomain: string;
  configManaged: boolean;
  type: string | null; // "ns" | "cname" | "wildcard"
  verified: boolean;
  failed: boolean;
  tries: number;
  certResolver: string | null;
  customCertResolver: string | null;
  preferWildcardCert: boolean | null;
  errorMessage: string | null;
}
```

Common DNS record fields:

```ts
{
  id: number;
  domainId: string;
  recordType: string; // "NS" | "CNAME" | "A" | "TXT"
  baseDomain: string | null;
  value: string;
  verified: boolean;
}
```

## `GET /v1/org/:orgId/domains`

Lists domains linked to an organization.

Auth: API key with org access; action `listOrgDomains`.

Request:

- Path param `orgId: string`.
- Body: none.

Query params:

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `limit` | integer encoded as string | `1000` | Non-negative. |
| `offset` | integer encoded as string | `0` | Non-negative. |

Response data:

```ts
{
  domains: Array<{
    domainId: string;
    baseDomain: string;
    verified: boolean;
    type: string | null;
    failed: boolean;
    tries: number;
    configManaged: boolean;
    certResolver: string | null;
    preferWildcardCert: boolean | null;
    errorMessage: string | null;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
```

Errors include `400` for invalid params/query and `500` for unexpected errors.

## `GET /v1/org/:orgId/domain/:domainId`

Gets one domain.

Auth: API key with org access and domain access; action `getDomain`.

Request: path params `orgId: string`, `domainId: string`; no query params or body.

Response: envelope with `Domain`, message `Domain retrieved successfully`.

Errors include `400` for invalid params, `404` when the domain is missing or the domain-access middleware cannot find it in the org, `403` when the API key lacks org access, and `500` for unexpected errors or domain-access middleware errors.

## `PUT /v1/org/:orgId/domain`

Creates an org domain.

Auth: API key with org access; action `createOrgDomain`; action audit.

Request:

- Path param `orgId: string`.
- Query params: none.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `type` | `"ns" | "cname" | "wildcard"` | yes | OSS only supports `wildcard`; SaaS only allows `ns` and `cname`; enterprise allows all three. |
| `baseDomain` | subdomain/domain string | yes | Must pass `subdomainSchema` and `isValidDomain`. CNAME at a second-level/root domain is rejected. |
| `certResolver` | string or null | no | Stored on created domain. |
| `preferWildcardCert` | boolean or null | no | Stored as `false` when omitted/null. |

Response data:

```ts
{
  domainId: string;
  nsRecords?: string[];
  cnameRecords?: { baseDomain: string; value: string }[];
  aRecords?: { baseDomain: string; value: string }[];
  txtRecords?: { baseDomain: string; value: string }[];
  certResolver?: string | null;
  preferWildcardCert?: boolean | null;
}
```

Errors include `400` for invalid params/body, unsupported domain type for the build, invalid domain format, CNAME at zone apex, duplicate domain in org, already verified domain in another org, DNS overlap conflicts, or SaaS domain limit rejection; `404` when SaaS usage data is missing; `403` when SaaS domain limit is exceeded; `501` when OSS receives `ns` or `cname`; `500` when insertion fails or an unexpected error occurs.

## `PATCH /v1/org/:orgId/domain/:domainId`

Updates wildcard-domain settings.

Auth: API key with org access and domain access; action `updateOrgDomain`.

Request:

- Path param `orgId: string`.
- Path param `domainId: string`.
- Query params: none.

JSON body:

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `certResolver` | string or null | no | Stored when key is present. |
| `preferWildcardCert` | boolean or null | no | Stored only when not `undefined` and not `null`. |

Response data:

```ts
{
  domainId: string;
  certResolver: string | null;
  preferWildcardCert: boolean | null;
}
```

Errors include `400` for invalid params/body or non-wildcard domains, `404` when the org-domain link or domain is missing, and `500` for update failure or unexpected errors.

## `DELETE /v1/org/:orgId/domain/:domainId`

Deletes a domain from an org.

Auth: API key with org access and domain access; action `deleteOrgDomain`; action audit.

Request: path params `orgId: string`, `domainId: string`; no query params or body.

Response data:

```ts
{
  success: true;
}
```

Errors include `400` for invalid params or config-managed domains, `404` when the domain is not linked to the org, and `500` for unexpected errors.

## `GET /v1/org/:orgId/domain/:domainId/dns-records`

Lists DNS records for a domain.

Auth: API key with org access and domain access; action `getDNSRecords`.

Request: path params `orgId: string`, `domainId: string`; no query params or body.

Response: envelope with `DNSRecord[]`, message `DNS records retrieved successfully`. When a record is type `A` or has `baseDomain === "*"`, and `getServerIp()` returns an IP, the response overrides that record's `value` with the server IP.

Errors include `400` for invalid params, `404` when no DNS records exist, and `500` for unexpected errors.

## `POST /v1/org/:orgId/domain/:domainId/restart`

Restarts domain verification state by setting `failed: false` and `tries: 0`.

Auth: API key with org access and domain access; action `restartOrgDomain`; action audit.

Request: path params `orgId: string`, `domainId: string`; no query params or body.

Response data:

```ts
{
  success: true;
}
```

Errors include `400` for invalid params and `500` for unexpected errors.

