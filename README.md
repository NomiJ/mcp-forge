# MCPForge

Convert any REST API spec into a production-ready MCP server in seconds.

Paste your OpenAPI or Swagger spec, review the generated tool cards, toggle endpoints on or off, and download a complete Python MCP server — no boilerplate required.

---

## How it works

1. **Provide your spec** — paste a direct spec URL, enter a base server URL for auto-discovery, or upload a `.json` / `.yaml` file
2. **Review tool cards** — MCPForge generates one card per endpoint with a name, description, parameters, and a quality indicator
3. **Customize** — edit names and descriptions inline, toggle endpoints on or off
4. **Download** — get a single runnable Python file ready to deploy

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | FastAPI, Python 3.12 |
| Generated code | [FastMCP](https://github.com/jlowin/fastmcp), Python 3.10+ |
| Containerization | Docker, Docker Compose |

---

## Local development

### Prerequisites

- Python 3.12+
- Node.js 20+ and [pnpm](https://pnpm.io)

### Backend

```bash
cd src/backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then fill in ANTHROPIC_API_KEY
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd src/frontend
pnpm install
pnpm dev
```

Frontend runs at `http://localhost:3000`.

---

## Docker deployment

### 1. Set environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required: your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-...

# URL the browser uses to reach the backend
# On a remote server, replace with your public IP or domain
NEXT_PUBLIC_API_URL=http://your-server-ip:8000

# Must match where the frontend is served from
ALLOWED_ORIGINS=http://your-server-ip:3000
```

### 2. Build and start

```bash
docker compose up --build -d
```

- Frontend: `http://your-server:3000`
- Backend: `http://your-server:8000`

### 3. Stop

```bash
docker compose down
```

---

## Project structure

```
/docs
  PRD.md               Product requirements (source of truth)
  architecture.md      System design and component breakdown
  api-spec.yaml        Internal API contract
/src
  /backend             FastAPI app — spec parsing, code generation
    app/
      modules/         spec_parser, code_generator, quality_scorer, auto_discovery
      templates/       Jinja2 template for generated MCP server
    tests/             Pytest test suite
    main.py
    requirements.txt
    Dockerfile
  /frontend            Next.js app — spec input, tool card review, download
    src/
      app/
      components/      SpecInputPage, ToolCardGrid, ToolCard, DownloadBar
      state/           reducer and types
    Dockerfile
  /test
    storefront-sample.yaml   Sample OpenAPI spec for testing
docker-compose.yml
.env.example
```

---

## Running tests

```bash
cd src/backend
source .venv/bin/activate
python -m pytest tests/ -v
```

---

## Generated server usage

The downloaded file requires Python 3.10+ and two packages:

```bash
pip install fastmcp httpx
```

Set auth credentials as environment variables (names are shown in the file header), then run:

```bash
python your_api_mcp_server.py
```

---

## Supported spec formats

| Format | Versions |
|---|---|
| OpenAPI | 3.0, 3.1 |
| Swagger | 2.x |
| File types | `.json`, `.yaml`, `.yml` |

Authentication schemes supported in generated code: API key, Bearer token, Basic auth.
