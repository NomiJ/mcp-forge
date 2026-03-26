# MCPForge

MCPForge is a web-based code generation tool that converts REST API specs (OpenAPI/Swagger) into production-ready MCP server code. Developers provide a spec, customize generated tool cards in a visual interface, and download a complete runnable file.

## Full Product Spec

All product decisions, user flows, feature scope, and out-of-scope items are documented in:

```
docs/PRD.md
```

Before making any implementation decision, check the PRD. Never add a feature that is not in the spec without flagging it first.

## Development Approach

This project is built spec-first:

- The PRD drives feature scope
- API contracts are defined as OpenAPI specs before implementation
- Component interfaces are defined before components are built
- The spec always leads, code follows

## Project Structure

```
/docs
  PRD.md              Product requirements (source of truth)
  architecture.md     System design and component breakdown (added in Phase 2)
  api-spec.yaml       Internal API contract (added in Phase 2)
/src
  /frontend           Web interface (spec input, tool card preview, customization)
  /backend            Spec parsing, code generation, AI rewrite
CLAUDE.md             This file
```

## Tech Stack

To be defined in `docs/architecture.md`. Do not make technology assumptions before that document exists.

## Key Constraints

- Generated code must run without modification on first attempt for well-formed OpenAPI 3.x specs
- MVP output format is Python using FastMCP
- The product does not host or run MCP servers, it only generates code
- Time from landing page to first downloaded file should be under five minutes

## Working with This Codebase

- Always read `docs/PRD.md` before starting a new feature or making a significant change
- When a feature is ambiguous, default to the simpler interpretation and flag the ambiguity
- Do not generate code for Phase 2 features until Phase 1 is complete and stable
