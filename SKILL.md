---
name: pangolin
description: Pangolin Integration API reference and Bun TypeScript client helper. Use when Codex needs to call, inspect, explain, document, or generate code against Pangolin's `/v1` Integration API, including API-key auth, organizations, sites, resources, domains, users, roles, access controls, access tokens, API keys, identity providers, clients, blueprints, logs, analytics, and private/proprietary SaaS routes.
---

# Pangolin Integration API

Use this skill when working with Pangolin's Integration API. Prefer the local Bun TypeScript helper for calls, and load endpoint reference files only when schemas or auth requirements are needed.

## Workflow

1. Use `pangolin-api.ts` for API calls.
2. Read `references/integration-api.md` for authentication basics and section links.
3. Load the specific `references/integration-api/*.md` section for the endpoint family being used.
4. Treat references as API documentation, not live server state.
5. When exact behavior matters, verify against a running Pangolin Integration API before claiming it is current.

## Client Helper

Import the default client when environment variables are enough:

```ts
import api from "./pangolin-api.ts";
```

The helper reads:

- `PANGOLIN_API_TOKEN` for `Authorization: Bearer <token>`.
- `PANGOLIN_API_URL` or `PANGOLIN_API_BASE_URL` for the base URL.

Use `PANGOLIN_ORG_ID` as the default organization scope for scripts and examples that call org-scoped routes such as `/org/:orgId/sites` or `/org/:orgId/user-devices`.

No default base URL is assumed. Set one of the base URL environment variables or pass `baseUrl` to `new Pangolin(...)`.

Use `new Pangolin(...)` when the token, base URL, headers, fetch override, or unwrap behavior must be explicit:

```ts
import { Pangolin } from "./pangolin-api.ts";

const api = new Pangolin({
  baseUrl: "https://pangolin.example.com/v1",
  token: process.env.PANGOLIN_API_TOKEN
});
```

Successful Pangolin JSON envelopes are unwrapped to `data` by default. Pass `unwrap: false` in the constructor or request options to keep the full envelope.

## Call Pattern

Use literal `/v1` or non-`/v1` paths; the helper normalizes both.

```ts
const org = await api.get(`/org/${orgId}`);

const resources = await api.get(`/org/${orgId}/resources`, {
  limit: 100,
  offset: 0
});

const created = await api.put(`/org/${orgId}/client`, {
  name: "ci-client",
  olmId,
  secret,
  subnet,
  type: "olm"
});

await api.delete(`/client/${clientId}`);
```

Use `api.path` as a tagged template when path values may contain `/`, spaces, or other reserved characters:

```ts
const path = api.path`/org/${orgId}/domain/${domainId}`;
const domain = await api.get(path);
```

Use `endpoint(path)` for repeated calls to the same route:

```ts
const accessTokens = api.endpoint(`/resource/${resourceId}/access-tokens`);
const page = await accessTokens.get({ limit: 1000, offset: 0 });
```

Use `raw()` for CSV exports, OpenAPI YAML, headers, status, or any endpoint that should not be unwrapped:

```ts
const { body: csv, res } = await api.raw<string>(
  "GET",
  `/org/${orgId}/logs/request/export`,
  { query: { timeStart, timeEnd } }
);
```

Errors throw `PangolinError` with `status`, `body`, and `res`.

## Reference Map

- Public metadata and overview: `references/integration-api.md`.
- Organizations: `references/integration-api/organizations.md`.
- Sites: `references/integration-api/sites.md`.
- Site resources: `references/integration-api/site-resources.md`.
- Resources, targets, and rules: `references/integration-api/resources-targets-rules.md`.
- Domains: `references/integration-api/domains.md`.
- Users, invitations, and roles: `references/integration-api/users-invitations-roles.md`.
- Resource access controls: `references/integration-api/resource-access.md`.
- Access tokens: `references/integration-api/access-tokens.md`.
- API keys: `references/integration-api/api-keys.md`.
- Identity providers: `references/integration-api/identity-providers.md`.
- Clients: `references/integration-api/clients.md`.
- Blueprints: `references/integration-api/blueprints.md`.
- Logs and analytics: `references/integration-api/logs.md`.
- Private SaaS operations: `references/integration-api/private-saas-ops.md`.

## Guardrails

- Do not invent request or response fields. If a needed field is not in the loaded reference, verify against the API before answering.
- Distinguish public integration routes from private/proprietary routes and SaaS-only routes.
- For mutating endpoints, call out action permissions, root-only requirements, license/subscription gates, and `verifyLimits` behavior from the reference.
- For live calls, never claim a result was verified unless the request actually ran and the returned status/body were inspected.
