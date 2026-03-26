# MCPForge - Product Requirements Document

## Overview

MCPForge is a web-based code generation tool that converts REST API specifications into production-ready MCP (Model Context Protocol) server code. A developer provides an OpenAPI spec, previews and customizes the generated tool cards, and downloads a complete, runnable MCP server file. No boilerplate writing required.

## Problem Statement

Building an MCP server on top of an existing REST API requires repetitive boilerplate work: parsing the spec, mapping endpoints to tools, writing tool descriptions, handling parameters, and wiring authentication. Frameworks like FastMCP make this easier, but the developer still needs to write code that uses the framework. MCPForge eliminates that step entirely by generating the complete server code from the spec and letting the developer customize it through a visual interface before downloading.

## Target User

Developers who have an existing REST API (with an OpenAPI or Swagger spec) and want to make it accessible to AI agents via MCP, without writing boilerplate code or learning the internals of MCP server frameworks.

## Core Value Proposition

Spec goes in. Customized, runnable MCP server code comes out. The developer never writes a single line of boilerplate.

---

## User Flow

### Step 1: Provide the spec

The developer lands on MCPForge and provides their API spec through one of three input methods:

- Paste a direct spec URL (e.g., `https://api.example.com/openapi.json`)
- Paste a base server URL and let MCPForge auto-discover the spec at well-known paths (`/openapi.json`, `/swagger.json`, `/api-docs`, `/swagger/v1/swagger.json`, etc.)
- Upload a spec file (JSON or YAML)

### Step 2: Review generated tool cards

MCPForge parses the spec and generates one tool card per endpoint. Each card displays:

- Tool name (derived from the endpoint operation ID or path)
- Plain-English description (generated or derived from the spec)
- Input parameters with types
- A quality indicator (green, yellow, or red) signaling how clear and LLM-friendly the tool is
- A preview of exactly what an LLM will read when it calls this tool

### Step 3: Customize

The developer can:

- Edit the tool name inline
- Edit the tool description inline
- Toggle individual endpoints on or off
- Use the AI-assisted rewrite button on any card to get an LLM-generated improvement to the name and description, which they can accept or reject

### Step 4: Download

The developer selects their target framework and downloads a complete, runnable code file. No editing required before the first run.

---

## Feature Set

### MVP Features

These are the features required for the first working version of MCPForge.

**Spec input**
- Accept a direct OpenAPI/Swagger spec URL
- Accept a base server URL and auto-probe well-known spec paths
- Accept a file upload (JSON and YAML)
- Support OpenAPI 3.x and Swagger 2.x formats

**Tool card generation**
- Parse the spec and generate one card per endpoint
- Derive tool name from operation ID if present, fall back to path and method
- Derive description from the spec summary or description fields
- Display input parameters with names, types, and whether they are required
- Show a plain-English preview of what an LLM sees when the tool is called
- Display a quality indicator per card (green = clear name and description, yellow = description present but generic, red = missing or auto-generated description with no context)

**Customization**
- Inline editing of tool name
- Inline editing of tool description
- Toggle endpoints on or off
- AI-assisted rewrite button per card (rewrites name and description using an LLM, developer accepts or rejects)

**Code generation and download**
- Generate a complete Python file using FastMCP
- Single file download, runnable without modification
- Generated file includes authentication handling as defined in the spec (API key, Bearer token, Basic auth)

### Phase 2 Features

These features are planned but out of scope for MVP.

**Saved sessions**
- User accounts with saved specs and customizations
- Return to a previous session and update it when the spec changes
- Diff view showing which tools have changed or broken since last session

**Export options**
- TypeScript export using the official MCP SDK
- Go export
- Configurable output options (single file vs. multi-file project)

**Quality improvements**
- Batch AI rewrite across all yellow and red cards in one click
- Endpoint grouping suggestions (group related endpoints into logical tool sets)
- Parameter renaming suggestions for endpoints with cryptic parameter names

**Developer workflow**
- CLI tool mirroring the web interface for CI/CD integration
- GitHub Action for regenerating MCP server code when the spec changes

---

## Out of Scope

The following are explicitly not part of MCPForge, to keep the product focused.

- Hosting or running the generated MCP server (the developer deploys their own code)
- Supporting non-REST protocols such as GraphQL or gRPC in MVP
- Real-time collaboration or team workspaces in MVP
- A visual API builder or spec editor
- An MCP client or testing harness within the product

---

## Key Product Decisions

**Why code generation rather than a hosted runtime?**
Giving developers the code keeps them in control of deployment, security, and infrastructure. It also means MCPForge is not responsible for the uptime of their MCP server. The hosted runtime direction may be revisited in a later phase.

**Why FastMCP as the MVP output format?**
FastMCP is the most widely adopted Python framework for MCP servers and has first-class support for OpenAPI wrapping. It is the path of least resistance for most developers getting started with MCP. TypeScript support follows in Phase 2.

**Why the customize-before-download flow?**
Raw mechanical conversion of an OpenAPI spec produces tool names and descriptions that are often cryptic or poorly worded for LLM consumption. The preview and edit step ensures the developer ships an MCP server that actually works well with AI agents, not just one that technically runs.

**Why auto-discover from a base URL?**
Most developers know their API base URL by heart. Requiring them to hunt for the spec URL adds friction at the most critical moment of the user journey. Auto-discovery removes that friction for the majority of modern APIs that publish their spec at a standard path.

---

## Success Metrics (MVP)

- Time from landing page to first downloaded file under five minutes for a developer with an existing OpenAPI spec
- Generated code runs without modification on first attempt for at least 80 percent of well-formed OpenAPI 3.x specs
- Developer makes at least one customization (edit or toggle) before downloading, indicating the preview step is adding value

---

## Development Approach

MCPForge is built spec-first. The PRD drives feature scope. API contracts are defined as OpenAPI specs before implementation. Component interfaces are defined before components are built. The spec always leads; code follows.

See `CLAUDE.md` for development instructions and context for AI-assisted coding sessions.
