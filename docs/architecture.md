# MCPForge - System Architecture

## Overview

MCPForge is a web application with a clear frontend and backend separation. The MVP is fully stateless -- no database is required. All customization state lives in the browser until the user downloads their generated file. This keeps the architecture simple, fast to build, and easy to deploy.

---

## High-Level Component Diagram

```
+------------------+        HTTPS         +----------------------+
|                  |  POST /api/v1/parse  |                      |
|   Next.js        | -------------------> |   FastAPI Backend    |
|   Frontend       | <------------------- |                      |
|                  |     ToolCards[]      |  +----------------+  |
|  - Spec input    |                      |  | Spec Parser    |  |
|  - Tool cards    |  POST /api/v1/rewrite|  +----------------+  |
|  - Customization | -------------------> |  | Quality Scorer |  |
|  - Download      | <------------------- |  +----------------+  |
|                  |   improved card      |  | AI Rewrite Svc |  |
|                  |                      |  +----------------+  |
|                  |  POST /api/v1/generate  | Code Generator |  |
|                  | -------------------> |  +----------------+  |
|                  | <--- .py file        |  | Auto-Discovery |  |
+------------------+                      |  +----------------+  |
                                          +----------+-----------+
                                                     |
                                                     | Claude API
                                                     v
                                          +----------------------+
                                          |  Anthropic Claude    |
                                          |  (AI rewrite calls)  |
                                          +----------------------+
```

---

## Components

### Frontend (Next.js)

A single-page React application handling the full four-step user flow: spec input, tool card preview, customization, and download.

All customization state (edited names, edited descriptions, toggled endpoints) lives in React state via `useReducer`. Nothing is persisted to the server during editing. The frontend only calls the backend at three points: to parse the spec, to request an AI rewrite of a single card, and to generate the final code file.

Key pages and components:

- `SpecInputPage` -- URL input field, file upload, base URL with auto-discovery trigger
- `ToolCardGrid` -- renders one `ToolCard` component per endpoint
- `ToolCard` -- displays tool name, description, parameters, quality indicator, LLM preview, inline edit fields, toggle switch, AI rewrite button
- `DownloadBar` -- framework selector (FastMCP only in MVP) and download button

### Backend API (FastAPI / Python)

Python is chosen over Node.js deliberately. The output format is Python/FastMCP, so using Python on the backend means the code generation module can import FastMCP directly to validate that generated code is syntactically correct before returning it. This reduces the risk of shipping broken output.

The backend is stateless. No session storage, no database in MVP. Each request is self-contained.

#### API Endpoints

**POST /api/v1/discover**

Takes a base server URL and probes well-known spec paths in parallel. Returns the first found spec URL.

```
Request:  { "baseUrl": "https://api.example.com" }
Response: { "specUrl": "https://api.example.com/openapi.json" }
     or   { "error": "No spec found at standard paths" }
```

Probed paths (in order): `/openapi.json`, `/openapi.yaml`, `/swagger.json`, `/swagger.yaml`, `/api-docs`, `/api-docs.json`, `/swagger/v1/swagger.json`, `/docs/openapi.json`

**POST /api/v1/parse**

Accepts either a spec URL or raw spec content (from file upload). Fetches, parses, and normalizes the spec into an array of ToolCard objects. Also runs the quality scorer on each card.

```
Request:  { "specUrl": "https://..." }
     or   { "specContent": "...", "specFormat": "json" | "yaml" }

Response: {
  "metadata": { "title": "...", "version": "...", "baseUrl": "..." },
  "toolCards": [ ToolCard, ... ]
}
```

**POST /api/v1/rewrite**

Takes a single ToolCard and returns an LLM-improved tool name and description. Calls Claude Haiku for speed and cost efficiency.

```
Request:  { "toolCard": ToolCard }
Response: { "toolName": "...", "description": "..." }
```

**POST /api/v1/generate**

Takes the full array of customized ToolCard objects and generates a complete, runnable Python file using FastMCP. Returns the file as a download.

```
Request:  {
  "toolCards": [ ToolCard, ... ],
  "metadata": { "title": "...", "baseUrl": "..." },
  "options":  { "framework": "fastmcp" }
}
Response: file download (application/x-python)
```

---

## Internal Modules

### Spec Parser

Handles OpenAPI 3.x (JSON and YAML) and Swagger 2.x. Normalizes both formats into the internal `ToolCard` data model. Uses `pyyaml` for YAML parsing and `openapi-spec-validator` for validation before processing.

Mapping rules:
- Tool name derives from `operationId` if present, otherwise from `{method}_{path_segments}`
- Description derives from `summary` if present, falls back to `description`, falls back to empty string
- Parameters are normalized from path, query, header, and cookie locations
- Authentication schemes are extracted from the spec's `securitySchemes` and matched to each endpoint's `security` field

### Quality Scorer

Scores each ToolCard as green, yellow, or red based on three rules applied in order:

- **Red**: no description, or description is fewer than five words, or tool name is a raw path string like `get_v2_usr_upd`
- **Yellow**: description is present but fewer than fifteen words, or tool name is generic (e.g., `createObject`, `updateItem`)
- **Green**: tool name is a meaningful verb-noun phrase and description is fifteen or more words

### AI Rewrite Service

Wraps the Anthropic Claude API. Sends the tool name, description, and parameter list in a structured prompt asking for an improved name (snake_case verb-noun) and a one to two sentence plain-English description suitable for an LLM agent. Uses `claude-haiku-4-5` for low latency and cost.

Rate limiting: maximum ten AI rewrite calls per session (tracked by a session token issued at parse time) to prevent abuse without requiring user accounts.

### Code Generator

Uses Jinja2 templates to produce the final Python file. The template handles:

- FastMCP imports and server instantiation
- Authentication setup (API key header, Bearer token, or Basic auth depending on the spec)
- One `@mcp.tool()` decorated function per enabled ToolCard
- Function signature derived from the card's parameter list
- Docstring derived from the card's (possibly customized) description
- HTTP call to the original API endpoint using `httpx`

The generator imports FastMCP and runs a syntax check on the output before returning it. If the check fails, it returns a structured error so the frontend can surface it rather than silently shipping broken code.

### Auto-Discovery Module

Sends parallel HTTP HEAD requests (with a two-second timeout) to all well-known spec paths under the provided base URL. Returns the first path that responds with a 200 status and a content type of `application/json` or `text/yaml`. Falls back gracefully if nothing is found.

---

## Data Models

### ToolCard

```
ToolCard:
  id:            string       UUID, assigned at parse time
  enabled:       boolean      true by default
  toolName:      string       editable by developer
  description:   string       editable by developer
  method:        string       HTTP method (GET, POST, PUT, DELETE, PATCH)
  path:          string       original endpoint path
  parameters:    Parameter[]
  requestBody:   RequestBody | null
  auth:          AuthScheme | null
  qualityScore:  "green" | "yellow" | "red"
  llmPreview:    string       computed, shown in card preview
```

### Parameter

```
Parameter:
  name:        string
  in:          "path" | "query" | "header" | "cookie"
  required:    boolean
  type:        string
  description: string
```

### AuthScheme

```
AuthScheme:
  type:     "apiKey" | "bearer" | "basic"
  location: "header" | "query" | "cookie"
  name:     string    header or query param name (e.g. "X-API-Key")
```

---

## Deployment

**Frontend**: Vercel. Next.js deploys natively on Vercel with zero configuration. The frontend environment variable `NEXT_PUBLIC_API_URL` points to the backend.

**Backend**: Railway or Render. FastAPI is containerized with Docker. A single `Dockerfile` in `/backend` is sufficient for MVP. Environment variables: `ANTHROPIC_API_KEY`, `ALLOWED_ORIGINS` (for CORS).

**Domain**: `mcpforge.dev` (or similar). Frontend on apex domain, backend API on `api.mcpforge.dev`.

---

## Trade-off Analysis

**Stateless MVP vs. persistent sessions**

A stateless MVP means no database, no auth system, and no session management to build. The trade-off is that if the developer refreshes the page mid-customization they lose their edits. This is acceptable for MVP because the workflow is short (typically under five minutes) and the spec is re-parsable. User accounts and saved sessions are Phase 2.

**Python backend (FastAPI) vs. Node.js**

Python aligns with the output format. The code generator can import and validate FastMCP directly without a subprocess or language boundary. The trade-off is running two runtimes (Node.js for frontend, Python for backend) instead of one. This is standard and well-supported by both Vercel and Railway. A full Node.js stack would require a Python subprocess for code validation, which is more complex than just using Python natively.

**Claude Haiku for AI rewrite vs. Claude Sonnet**

Haiku is significantly faster and cheaper per call, which matters because the AI rewrite button is called interactively (the developer is waiting for a response). The trade-off is output quality. Starting with Haiku keeps costs low during early usage. If quality complaints arise, switching to Sonnet is a one-line change.

**Jinja2 templates for code generation vs. AST construction**

Jinja2 templates are readable, easy to modify, and fast to build. The trade-off is that templates are harder to reason about for complex edge cases (deeply nested parameters, multiple auth schemes). For MVP, Jinja2 is the right call. If edge cases accumulate, replacing the template layer with an AST-based generator (using Python's `ast` module) is a contained change.

---

## What to Revisit as the Product Grows

- Add a database (PostgreSQL) and user accounts when saved sessions become a priority in Phase 2
- Replace the session-token rate limiter on AI rewrites with proper auth-based limits once user accounts exist
- Consider a job queue (e.g., Redis + Celery) if spec parsing becomes slow for very large specs
- Evaluate moving to Claude Sonnet for AI rewrites if user feedback indicates quality issues
- Add a CDN layer in front of the backend if the spec fetcher becomes a bottleneck for popular public APIs
