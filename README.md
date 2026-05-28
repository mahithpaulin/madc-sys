# ⚙️ MADC-SYS

**Multi-Agent Distributed Coding System**

> *"One agent = one engineering discipline. Coordination is deterministic, not conversational."*

MADC-SYS is a terminal-native, enterprise-grade distributed AI coding architecture. You give it a natural-language coding request; 10 specialized agents collaborate through a typed message bus, enforced state machine, and task DAG to design, validate, implement, and ship production-grade software — including source code, tests, Docker config, CI/CD pipelines, and a GitHub push.

```
$ pnpm --filter @workspace/scripts run madc "build a REST API for a task manager in Go"

  ⚙️  MADC-SYS  Multi-Agent Distributed Coding System
  Enterprise-grade deterministic AI engineering pipeline
  10 specialized agents · Event-driven message bus · State-gated pipeline

  ℹ Project:  rest-api-task-manager
  ℹ Language: Go
  ℹ Pipeline: 10 agents

  ▶ 🧭  PlannerAgent          STATE: INIT → PLANNING
  ✔ PlannerAgent — COMPLETE

  ▶ ❓  ClarificationAgent    STATE: PLANNING → CLARIFICATION_BLOCK
  ✔ GATE: OPEN — proceeding to System Design

  ▶ 🧱  SystemDesignAgent     STATE: CLARIFICATION_BLOCK → DESIGN
  ...
  ▶ 🚀  DeploymentAgent       STATE: TESTING → DEPLOYMENT
  ✔ DeploymentAgent — COMPLETE

  ✔ Pipeline finished. State: COMPLETE
  ℹ Artifacts: 24 files · Bus events: 10 · COMPLETE: 10
```

---

## Table of Contents

- [Architecture](#architecture)
- [The 10 Agents](#the-10-agents)
- [State Machine](#state-machine)
- [Message Bus](#message-bus)
- [Task DAG](#task-dag)
- [Language Routing](#language-routing)
- [Getting Started](#getting-started)
- [Termux / Android](#termux--android)
- [Output Structure](#output-structure)
- [Error Handling & Gates](#error-handling--gates)
- [Project Structure](#project-structure)
- [Examples](#examples)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                         │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │      ORCHESTRATION CORE     │
          │   Task Decomposition Brain  │
          │   Language Router           │
          │   Project Name Inference    │
          └──────────────┬──────────────┘
                         │
     ┌───────────────────▼───────────────────┐
     │        MESSAGE BUS  (EventEmitter)    │
     │  Typed messages · Status tracking     │
     │  Agent handoffs · Error broadcasting  │
     └───┬───────────┬───────────┬───────────┘
         │           │           │
    ┌────▼────┐ ┌────▼────┐ ┌───▼─────┐
    │ Agent 1 │ │ Agent N │ │ State   │
    │ Planner │ │  ...    │ │ Machine │
    └─────────┘ └─────────┘ └─────────┘
                         │
          ┌──────────────▼──────────────┐
          │        TASK DAG             │
          │  Dependency graph per run   │
          │  Node status tracking       │
          └──────────────┬──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │     ARTIFACT ASSEMBLY       │
          │  Merge · Save · GitHub Push │
          └─────────────────────────────┘
```

---

## The 10 Agents

Agents execute in **strict linear order**. No agent may skip another. Gate agents will hard-stop the pipeline on failure.

```
┌────┬────────────────────────┬───────────────────────────────────────┬──────────┐
│ #  │ Agent                  │ Responsibility                        │ Gate?    │
├────┼────────────────────────┼───────────────────────────────────────┼──────────┤
│ 01 │ 🧭 PlannerAgent        │ 10-phase blueprint + module breakdown │          │
│ 02 │ ❓ ClarificationAgent  │ Ambiguity detection — HARD STOP       │ ✔ YES    │
│ 03 │ 🧱 SystemDesignAgent   │ Architecture diagram, APIs, schema    │          │
│ 04 │ 💻 CodeGenerationAgent │ Language-routed production source     │          │
│ 05 │ 🧪 ReviewAgent         │ Static analysis — approve/reject      │ ✔ YES    │
│ 06 │ 🔐 SecurityAgent       │ CVE scan — blocks on CRITICAL/HIGH    │ ✔ YES    │
│ 07 │ ⚡ OptimizationAgent   │ Time / memory / scalability / modules │          │
│ 08 │ 🔗 IntegrationAgent    │ Module merge + coherence check        │          │
│ 09 │ 🧪 TestingAgent        │ Unit / integration / edge test suites │          │
│ 10 │ 🚀 DeploymentAgent     │ Dockerfile, docker-compose, CI/CD     │          │
└────┴────────────────────────┴───────────────────────────────────────┴──────────┘
```

### Agent Details

**01 · PlannerAgent** — Converts the user request into a 10-phase execution blueprint and module breakdown. Infers project structure from the request.

**02 · ClarificationAgent** — Scans for ambiguities (language, auth, persistence, concurrency, deployment target). **HARD STOP** if any ambiguity cannot be resolved. No assumptions allowed.

**03 · SystemDesignAgent** — Produces a full architecture diagram, API contract surface (REST routes), data schema, and system boundary definitions.

**04 · CodeGenerationAgent** — Generates production-grade source files routed by language (see [Language Routing](#language-routing)). Includes entry point, app class, config, logger, routes, schema, repository, and CLI if applicable.

**05 · ReviewAgent** — Static analysis pass. Detects logical errors, unsafe patterns, missing handlers. Returns `APPROVED`, `NEEDS_FIX`, or `REJECTED`. Blocks pipeline on `ERROR`-severity findings.

**06 · SecurityAgent** — CVE and pattern scan: injection risks, missing security headers, unsafe execution, insecure deserialization. **Blocks deployment on CRITICAL or HIGH findings.**

**07 · OptimizationAgent** — Proposes time complexity improvements, memory reductions, scalability enhancements, and modularity refactors with before/after comparisons.

**08 · IntegrationAgent** — Merges all generated modules, resolves import conflicts, validates the dependency injection graph is acyclic, and confirms coherence.

**09 · TestingAgent** — Generates unit, integration, and edge-case test suites with per-suite coverage estimates. Creates test files in the correct language framework.

**10 · DeploymentAgent** — Outputs a multi-stage Dockerfile, docker-compose.yml, GitHub Actions CI/CD workflow, and a project Makefile.

---

## State Machine

The pipeline is governed by a **deterministic finite state machine**. Transitions are validated — any illegal jump halts execution immediately.

```
   INIT
    │
    ▼
 PLANNING ──────────────────────────────► FAILED
    │
    ▼
 CLARIFICATION_BLOCK ───────────────────► FAILED
    │
    ▼
 DESIGN
    │
    ▼
 IMPLEMENTATION
    │
    ▼
 REVIEW ─────────────────────────────────► ROLLBACK ─► CLARIFICATION_BLOCK
    │
    ▼
 SECURITY_CHECK ─────────────────────────► ROLLBACK ─► CLARIFICATION_BLOCK
    │
    ▼
 OPTIMIZATION
    │
    ▼
 INTEGRATION
    │
    ▼
 TESTING
    │
    ▼
 DEPLOYMENT
    │
    ▼
 COMPLETE
```

---

## Message Bus

Every agent handoff is recorded as a typed message on the event bus:

```json
{
  "task_id": "3f8a2c1d-...",
  "from_agent": "ReviewAgent",
  "to_agent": "SecurityAgent",
  "stage": "REVIEW",
  "payload": { "findings": 4, "errors": 0, "decision": "APPROVED" },
  "status": "COMPLETE",
  "timestamp": "2026-05-28T07:00:00.000Z"
}
```

Statuses: `PENDING` → `IN_PROGRESS` → `COMPLETE` / `FAILED`

The bus is an `EventEmitter` — agents can subscribe to `agent:<name>` events for reactive coordination.

---

## Task DAG

Each project run generates a dependency graph (DAG) capturing execution order and inter-module dependencies:

```json
{
  "nodes": ["design_api", "build_backend", "build_frontend", "write_tests", "security_scan", "optimize", "integrate", "deploy"],
  "edges": [
    ["design_api",    "build_backend"],
    ["design_api",    "build_frontend"],
    ["build_backend", "write_tests"],
    ["build_frontend","write_tests"],
    ["write_tests",   "security_scan"],
    ["security_scan", "optimize"],
    ["optimize",      "integrate"],
    ["integrate",     "deploy"]
  ]
}
```

The DAG is saved as part of `madc-meta.json` in every output directory.

---

## Language Routing

MADC-SYS selects the implementation language from keywords in your request:

| Keywords in request            | Language   |
|-------------------------------|------------|
| `python`, `flask`, `django`   | Python     |
| `go`, `golang`                | Go         |
| `rust`                        | Rust       |
| `c++`, `cpp`, `game`, `ml`    | C++        |
| `bash`, `shell`               | Shell      |
| `sql`, `schema`, `database`   | SQL        |
| *(anything else)*             | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- `GITHUB_PAT` environment secret (repo scope)

### Install

```bash
git clone https://github.com/mahithpaulin/madc-sys
cd madc-sys
pnpm install
```

### Run

```bash
# Interactive — prompts for your request
pnpm --filter @workspace/scripts run madc

# Inline request
pnpm --filter @workspace/scripts run madc "build a REST API for a task manager in Go"
pnpm --filter @workspace/scripts run madc "create a Python script for CSV processing"
pnpm --filter @workspace/scripts run madc "write a Rust CLI for file encryption"
```

After the pipeline completes, MADC-SYS will prompt for a GitHub repo name and push all generated files atomically via the GitHub API.

### Other commands

```bash
pnpm run typecheck          # Full TypeScript check across all packages
pnpm --filter @workspace/api-server run dev   # Start the API server (port 5000)
```

---

## Termux / Android

MADC-SYS ships a fully self-contained edition for Android via Termux — no pnpm workspace required, bundled to a single 194kb CJS file.

### Install on Termux

```bash
# Step 1: Install dependencies (once)
pkg install git nodejs

# Step 2: Clone and build
git clone https://github.com/mahithpaulin/madc-sys
cd madc-sys/madc-termux
npm install
npm run build

# Step 3: Run
node dist/madc.cjs "build a Python REST API for a todo app"

# Optional: install globally so `madc` works from anywhere
npm install -g .
madc
```

### Termux differences

| Feature         | Desktop                     | Termux                          |
|----------------|-----------------------------|---------------------------------|
| Spinner         | `ora` (ANSI cursor control) | ASCII `[/\-\|]` — all terminals |
| PAT storage     | `GITHUB_PAT` env var        | Env var **or** `~/.madc/config.json` (saved on first run) |
| Output dir      | `scripts/madc-output/`      | `~/madc-output/`                |
| Distribution    | pnpm workspace              | Single bundled `madc.cjs`       |
| Output width    | 72 chars                    | 64 chars (phone-friendly)       |

On first run, if no PAT is found, MADC-SYS prompts for it and offers to save it to `~/.madc/config.json` so you only enter it once.

---

## Output Structure

Every run produces a full project tree saved locally and pushed to GitHub:

```
madc-output/<project-name>/
├── src/
│   ├── index.ts           ← Entry point
│   ├── app.ts             ← App class
│   ├── config.ts          ← Config module
│   ├── logger.ts          ← Logger (singleton)
│   ├── routes/            ← REST route handlers
│   │   └── <slug>.ts
│   ├── db/
│   │   ├── schema.sql     ← Database schema
│   │   └── repository.ts  ← Data access layer
│   └── cli.ts             ← CLI parser (if applicable)
├── tests/
│   ├── core-app.test.ts
│   ├── config.test.ts
│   ├── http-routes.test.ts
│   └── edge-cases.test.ts
├── .github/
│   └── workflows/
│       └── ci.yml         ← GitHub Actions CI/CD
├── Dockerfile             ← Multi-stage production build
├── docker-compose.yml     ← Dev + prod profiles
├── Makefile               ← dev / build / test / docker targets
├── README.md              ← Project readme
├── plan.md                ← Planner output
├── architecture.md        ← System design diagram
├── review-report.md       ← Code review findings
├── security-report.md     ← Security audit results
├── optimization-report.md ← Performance improvements
├── integration-report.md  ← Module merge log
├── test-report.md         ← Test suite summary
├── deployment-report.md   ← Deployment package details
└── madc-meta.json         ← Run metadata (DAG, states, timestamps)
```

---

## Error Handling & Gates

### Hard Stop (ClarificationAgent)

If MADC-SYS cannot resolve an ambiguity, it issues a **HARD STOP** and prints the blocking questions. The pipeline will not proceed until the request is clarified.

### Review Gate

The ReviewAgent blocks progression if any `ERROR`-severity finding is present. `WARN`-severity findings are logged but do not block.

### Security Gate

The SecurityAgent **blocks deployment** on any `CRITICAL` or `HIGH` vulnerability. `MEDIUM` and `LOW` findings are reported but do not block.

### Rollback

On gate failure (Review or Security), the state machine transitions to `ROLLBACK` and then back to `CLARIFICATION_BLOCK` for a re-run from a safe checkpoint.

### Failure Recovery

```
Failure detected
  │
  ▼
Identify responsible agent
  │
  ▼
Rollback to previous stable state
  │
  ▼
Trigger ClarificationAgent
  │
  ▼
Re-run pipeline from checkpoint
```

---

## Project Structure

```
madc-sys/
├── scripts/                        ← @workspace/scripts (desktop CLI)
│   └── src/
│       └── madc/
│           ├── index.ts            ← CLI entry point
│           ├── orchestrator.ts     ← 10-agent pipeline runner
│           ├── message-bus.ts      ← Typed EventEmitter bus
│           ├── state-machine.ts    ← Deterministic FSM
│           ├── dag.ts              ← Task graph model
│           ├── github.ts           ← GitHub push (Octokit tree API)
│           ├── ui/
│           │   └── banner.ts       ← Terminal renderer (chalk + ora)
│           └── agents/
│               ├── base-agent.ts
│               ├── planner.ts
│               ├── clarification.ts
│               ├── system-design.ts
│               ├── code-generation.ts
│               ├── review.ts
│               ├── security.ts
│               ├── optimization.ts
│               ├── integration.ts
│               ├── testing.ts
│               └── deployment.ts
│
├── madc-termux/                    ← Standalone Termux/Android edition
│   ├── src/                        ← Same agent logic, Termux-adapted UI
│   ├── dist/
│   │   └── madc.cjs               ← Single bundled file (194kb, esbuild)
│   ├── setup.sh                   ← One-command Termux install script
│   ├── package.json               ← npm bin: "madc" → dist/madc.cjs
│   └── README.md                  ← Termux-specific docs
│
├── artifacts/
│   └── api-server/                ← Express API server (port 5000)
│
├── replit.md                      ← Project overview & preferences
└── README.md                      ← This file
```

---

## Examples

### TypeScript REST API

```bash
madc "build a REST API for a blog platform with authentication"
```

Generates: TypeScript + Express routes, auth middleware, PostgreSQL schema, Drizzle repository, Jest tests, multi-stage Dockerfile, GitHub Actions.

### Python Automation Script

```bash
madc "write a Python script for processing CSV files and uploading to S3"
```

Generates: Python + boto3, argparse CLI, config loader, pytest suite, requirements.txt, Dockerfile.

### Go Infrastructure Tool

```bash
madc "create a Go CLI tool for managing Kubernetes namespaces"
```

Generates: Go + cobra CLI, kubeconfig reader, unit tests, Makefile, multi-arch Dockerfile.

### Rust Systems Program

```bash
madc "build a Rust library for safe file encryption"
```

Generates: Rust crate structure, safe crypto wrappers, doc tests, Cargo.toml, CI pipeline.

---

## Global Control Rules

```
No agent can skip another agent
No execution without ClarificationAgent approval
No code merge without ReviewAgent + SecurityAgent approval
Any failure → rollback to previous stable state
Zero assumption policy — every ambiguity must be resolved
```

---

## Stack

| Layer          | Technology                                    |
|---------------|-----------------------------------------------|
| Runtime        | Node.js 22 / Node.js 18+ (Termux)            |
| Language       | TypeScript 5.9 (strict)                       |
| CLI            | tsx, chalk, ora, readline                     |
| GitHub API     | @octokit/rest (tree/blob atomic commits)      |
| Bus            | Node.js EventEmitter (typed)                  |
| Package mgr    | pnpm workspaces (desktop) / npm (Termux)      |
| Bundler        | esbuild (Termux single-file distribution)     |

---

## License

MIT — built with MADC-SYS.
