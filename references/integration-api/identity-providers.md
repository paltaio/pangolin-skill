# Identity Providers

All routes require a bearer API key. Global IdP routes are root-only except `GET /v1/idp`, which intentionally has no root or action guard. Private/proprietary org-scoped routes also require a valid license; create/update additionally require subscription `tierMatrix.orgOidc`.

OIDC config objects include `idpOauthConfigId`, `idpId`, `variant`, encrypted `clientId`, encrypted `clientSecret`, `authUrl`, `tokenUrl`, `identifierPath`, `emailPath`, `namePath`, and `scopes`. Get handlers decrypt `clientId` and `clientSecret` before returning OIDC config.

Shared global OIDC create body:

```ts
{
  name: string;              // nonempty
  clientId: string;          // nonempty
  clientSecret: string;      // nonempty
  authUrl: string;           // URL
  tokenUrl: string;          // URL
  identifierPath: string;    // nonempty
  emailPath?: string;
  namePath?: string;
  scopes: string;            // nonempty
  autoProvision?: boolean;
  tags?: string;
  variant?: "oidc" | "google" | "azure"; // default "oidc"
}
```

Shared global OIDC update body: all create fields are optional; `authUrl` and `tokenUrl` are plain optional strings in the update schema, not URL-validated. `defaultRoleMapping?: string` and `defaultOrgMapping?: string` are also accepted.

## `PUT /v1/idp/oidc`

Creates a global OIDC IdP.

Auth: root API key; action `createIdp`; Limits; action audit.

Request: no path/query params; body is the shared global OIDC create body.

Response data: `{ idpId: number; redirectUrl: string }`, status `201`.

Errors include `400` for invalid body, `400` when `IDENTITY_PROVIDER_MODE === "org"`, and `500` with message `An error occurred`.

## `POST /v1/idp/:idpId/oidc`

Updates a global OIDC IdP.

Auth: root API key; action `updateIdp`; Limits; action audit.

Request: path param `idpId: number`; body is the shared global OIDC update body.

Response data: `{ idpId: number }`.

Errors include `400` for invalid params/body, `400` when `IDENTITY_PROVIDER_MODE === "org"`, `404` when the IdP is missing, `400` when the IdP is not type `oidc`, and `500` with message `An error occurred`.

## `GET /v1/idp`

Lists global IdPs.

Auth: bearer API key only; no root guard and no action permission guard.

Request: query params `limit?: nonnegative integer = 1000`, `offset?: nonnegative integer = 0`; no body.

Response data:

```ts
{
  idps: Array<{
    idpId: number;
    name: string;
    type: "oidc";
    variant: "oidc" | "google" | "azure" | null;
    orgCount: number;
    autoProvision: boolean;
    tags: string | null;
  }>;
  pagination: { total: number; limit: number; offset: number };
}
```

Errors include `400` for invalid query and `500` with message `An error occurred`.

## `GET /v1/idp/:idpId`

Gets one global IdP and its OIDC config.

Auth: root API key; action `getIdp`.

Request: path param `idpId: number`; no query params or body.

Response data:

```ts
{
  idp: {
    idpId: number;
    name: string;
    type: "oidc";
    defaultRoleMapping: string | null;
    defaultOrgMapping: string | null;
    autoProvision: boolean;
    tags: string | null;
  };
  idpOidcConfig: {
    idpOauthConfigId: number;
    idpId: number;
    variant: "oidc" | "google" | "azure";
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    identifierPath: string;
    emailPath: string | null;
    namePath: string | null;
    scopes: string;
  } | null;
}
```

Errors include `400` for invalid params, `404` when missing, and `500` with message `An error occurred`.

## `DELETE /v1/idp/:idpId`

Deletes an IdP and related OIDC config/org mappings. Private/proprietary route.

Auth: root API key; action `deleteIdp`; action audit.

Request: path param `idpId: number`; no query params or body.

Response: envelope with `data: null`, message `IdP deleted successfully`, status `200`.

Errors include `400` for invalid params, `404` when missing, and `500` with message `An error occurred`.

## `PUT /v1/idp/:idpId/org/:orgId`

Creates an org policy for an existing global IdP.

Auth: root API key; action `createIdpOrg`; Limits; action audit.

Request:

- Path params: `idpId: number`, `orgId: string`.
- Body: `{ roleMapping?: string; orgMapping?: string }`.

Response: envelope with `data: {}`, message `Idp created successfully`, status `201`.

Errors include `400` for invalid params/body, `400` when `IDENTITY_PROVIDER_MODE === "org"`, `400` when the IdP does not exist, `400` when a policy already exists, and `500` with message `An error occurred`.

## `POST /v1/idp/:idpId/org/:orgId`

Updates an org policy for a global IdP.

Auth: root API key; action `updateIdpOrg`; Limits; action audit.

Request:

- Path params: `idpId: number`, `orgId: string`.
- Body: `{ roleMapping?: string; orgMapping?: string }`.

Response: envelope with `data: {}`, message `Policy updated successfully`.

Errors include `400` for invalid params/body, `400` when `IDENTITY_PROVIDER_MODE === "org"`, `400` when the IdP does not exist, `400` when the policy does not exist, and `500` with message `An error occurred`.

## `DELETE /v1/idp/:idpId/org/:orgId`

Deletes an org policy from a global IdP.

Auth: root API key; action `deleteIdpOrg`; action audit.

Request: path params `idpId: number`, `orgId: string`; no query params or body.

Response: envelope with `data: null`, message `Policy deleted successfully`.

Errors include `400` for invalid params, `400` when the IdP does not exist, `400` when the policy does not exist, and `500` with message `An error occurred`.

## `GET /v1/idp/:idpId/org`

Lists org policies for a global IdP.

Auth: root API key; action `listIdpOrgs`.

Request: path param `idpId: number`; query params `limit?: nonnegative integer = 1000`, `offset?: nonnegative integer = 0`; no body.

Response data:

```ts
{
  policies: Array<{
    idpId: number;
    orgId: string;
    roleMapping: string | null;
    orgMapping: string | null;
  }>;
  pagination: { total: number; limit: number; offset: number };
}
```

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

## `PUT /v1/org/:orgId/idp/oidc`

Creates an org-scoped OIDC IdP. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.orgOidc`; API key with org access; action `createIdp`; Limits; action audit.

Request:

- Path param `orgId: nonempty string`.
- Body: shared global OIDC create fields plus `roleMapping?: string` and `orgMapping?: string | null | undefined`.

Response data: `{ idpId: number; redirectUrl: string }`, status `201`.

Errors include `400` for invalid params/body and `500` with message `An error occurred`.

## `POST /v1/org/:orgId/idp/:idpId/oidc`

Updates an org-scoped OIDC IdP. Private/proprietary route.

Auth: valid license; subscription `tierMatrix.orgOidc`; API key with org access and IdP access; action `updateIdp`; Limits; action audit.

Request:

- Path params: `orgId: nonempty string`, `idpId: number`.
- Body: optional `name`, `clientId`, `clientSecret`, `authUrl`, `tokenUrl`, `identifierPath`, `emailPath`, `namePath`, `scopes`, `autoProvision`, `roleMapping`, `orgMapping: string | null | undefined`, and `tags`.

Response data: `{ idpId: number }`.

Errors include `400` for invalid params/body, `404` when the IdP is missing, `404` when the IdP is not linked to the org, `400` when the IdP is not type `oidc`, and `500` with message `An error occurred`.

## `DELETE /v1/org/:orgId/idp/:idpId`

Deletes an org-scoped IdP. Private/proprietary route.

Auth: valid license; API key with org access and IdP access; action `deleteIdp`; action audit.

Request: path params `orgId: string`, `idpId: number`; no query params or body.

Response: envelope with `data: null`, message `IdP deleted successfully`, status `200`.

Errors include `400` for invalid params, `404` when missing, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/idp/:idpId`

Gets an org-scoped IdP and redirect URL. Private/proprietary route.

Auth: valid license; API key with org access and IdP access; action `getIdp`.

Request: path params `orgId: nonempty string`, `idpId: number`; no query params or body.

Response data: same `idp` and `idpOidcConfig` shape as `GET /v1/idp/:idpId`, plus `idpOrg` policy fields and `redirectUrl: string`.

Errors include `400` for invalid params, `404` when missing, and `500` with message `An error occurred`.

## `GET /v1/org/:orgId/idp`

Lists org-scoped IdPs. Private/proprietary route.

Auth: valid license; API key with org access; action `listIdps`.

Request: path param `orgId: nonempty string`; query params `limit?: nonnegative integer = 1000`, `offset?: nonnegative integer = 0`; no body.

Response data:

```ts
{
  idps: Array<{
    idpId: number;
    orgId: string;
    name: string;
    type: "oidc";
    variant: "oidc" | "google" | "azure";
    tags: string | null;
  }>;
  pagination: { total: number; limit: number; offset: number };
}
```

Errors include `400` for invalid params/query and `500` with message `An error occurred`.

