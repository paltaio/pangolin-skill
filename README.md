# pangolin-skill

Pangolin Integration API skill for AI agents. Ships a TypeScript client (`pangolin-api.ts`) plus per-section endpoint references.

## Install

Drop this directory into a skills path for Claude Code, Codex, etc:

```sh
git clone https://github.com/paltaio/pangolin-skill ~/.claude/skills/pangolin

# or ~/.codex/skills/pangolin
```

Or just tell your agent: "Install https://github.com/paltaio/pangolin-skill for me"

## Configure

Enable the integration API:

https://docs.pangolin.net/self-host/advanced/integration-api

Set env vars before running scripts that use the client:

```sh
export PANGOLIN_API_URL="https://api.pangolin.example.com/v1"
export PANGOLIN_API_TOKEN="..."
export PANGOLIN_ORG_ID="..."   # optional default org
```

Or if you don't want to expose your creds to the agent, ask it to make an mcp out of it.

## Usage

```ts
import api from "./pangolin-api.ts";

const sites = await api.get(`/org/${orgId}/sites`, { limit: 100 });
```

Or instantiate explicitly:

```ts
import { Pangolin } from "./pangolin-api.ts";

const api = new Pangolin({
  baseUrl: "https://api.pangolin.example.com/v1",
  token: process.env.PANGOLIN_API_TOKEN,
});
```

Errors throw `PangolinError` with `status`, `body`, `res`.

## License

MIT