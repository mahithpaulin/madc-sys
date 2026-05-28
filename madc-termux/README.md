# ⚙️ MADC-SYS for Termux

**Multi-Agent Distributed Coding System — Android / Phone edition**

> Run a full 10-agent AI engineering pipeline directly from your phone.

MADC-SYS takes a natural-language coding request and runs it through 10 specialized agents — Planner, Clarification gate, System Design, Code Generation, Review, Security, Optimization, Integration, Testing, and Deployment — producing a complete set of production-ready source files, tests, Docker config, and CI/CD pipelines, then pushing everything to a new GitHub repository.

```
$ node dist/madc.cjs "build a Python REST API for a task manager"

+================================================================+
|   MADC-SYS  Multi-Agent Distributed Coding                     |
|   Deterministic AI Engineering Pipeline                        |
|   10 agents | Message bus | State machine                      |
+================================================================+

[..] Project : python-rest-api-task
[..] Language: Python
[..] Agents  : 10

1. PlannerAgent
----------------------------------------------------------------
     STATE INIT -> PLANNING
[*] PlannerAgent executing… done
     PROJECT  : python-rest-api-task
     10-PHASE BLUEPRINT
     Phase 01  Requirements analysis & scope
     Phase 02  Domain modelling & entity mapping
     ...

2. ClarificationAgent
     GATE: OPEN — proceeding to System Design

...

10. DeploymentAgent
[*] DeploymentAgent executing… done
     Dockerfile, docker-compose.yml, CI/CD, Makefile generated

+================================================================+
|   MADC-SYS COMPLETE                                            |
|   Project  : python-rest-api-task                              |
|   Language : Python                                            |
|   Artifacts: 24 files                                          |
|   Output   : ~/madc-output/python-rest-api-task                |
+================================================================+
```

---

## Install on Termux

### Prerequisites

- **Termux** — install from [F-Droid](https://f-droid.org/packages/com.termux/) (not Play Store — that version is outdated)
- **Node.js 18+** — installed via Termux package manager
- A **GitHub Personal Access Token** with `repo` scope — [create one here](https://github.com/settings/tokens)

### Quick install

```bash
# 1. Install system dependencies (one time)
pkg update && pkg install git nodejs

# 2. Clone the repo
git clone https://github.com/mahithpaulin/madc-sys
cd madc-sys/madc-termux

# 3. Install npm dependencies and build the bundle
npm install
npm run build

# 4. Run
node dist/madc.cjs "build a Python REST API for a todo app"
```

### Or use the setup script

```bash
cd madc-sys/madc-termux
bash setup.sh
```

### Global install (run `madc` from anywhere)

```bash
cd madc-sys/madc-termux
npm install -g .

# Now from any directory:
madc "build a Go CLI for managing Kubernetes namespaces"
```

---

## Usage

### Interactive mode

```bash
node dist/madc.cjs
# Prompts: "Enter your coding request:"
```

### Inline mode

```bash
node dist/madc.cjs "build a REST API for a blog in TypeScript"
node dist/madc.cjs "create a Python script for CSV processing"
node dist/madc.cjs "write a Rust library for file encryption"
node dist/madc.cjs "create a Go CLI tool for file management"
```

### After global install

```bash
madc "build a Discord bot in TypeScript"
madc "create a Python web scraper"
```

---

## GitHub PAT Setup

On first run, if no GitHub PAT is found, MADC-SYS will ask for it:

```
[..] No GitHub PAT found.
[..] Create one at: github.com/settings/tokens
[..] Required scope: repo

  Paste your GitHub PAT (or press Enter to skip):
  > ghp_...

  Save PAT to ~/.madc/config.json for future runs? [Y/n]: y
[OK] PAT saved to ~/.madc/config.json
```

After saving, every future run skips the prompt and goes straight to the pipeline.

**To reset your saved PAT:**

```bash
rm ~/.madc/config.json
```

**PAT lookup order:**

1. `$GITHUB_PAT` environment variable
2. `~/.madc/config.json`
3. Interactive prompt

---

## The 10 Agents

```
#   Agent                   Role                                    Gate?
--  ----------------------  ------------------------------------    -----
01  PlannerAgent            10-phase blueprint + module map
02  ClarificationAgent      Ambiguity detection — HARD STOP         YES
03  SystemDesignAgent       Architecture, APIs, DB schema
04  CodeGenerationAgent     Language-routed source files
05  ReviewAgent             Static analysis — approve/reject        YES
06  SecurityAgent           CVE scan — blocks on CRITICAL/HIGH      YES
07  OptimizationAgent       Time / memory / scalability
08  IntegrationAgent        Module merge + coherence check
09  TestingAgent            Unit / integration / edge tests
10  DeploymentAgent         Dockerfile + docker-compose + CI/CD
```

---

## Language Routing

MADC-SYS picks the language automatically from your request:

```
"python"  / "flask"   / "django"   →  Python
"go"      / "golang"               →  Go
"rust"                             →  Rust
"c++"     / "cpp" / "game" / "ml"  →  C++
"bash"    / "shell"                →  Shell
"sql"     / "schema" / "database"  →  SQL
(anything else)                    →  TypeScript
```

---

## Output Structure

Every run saves a complete project tree to `~/madc-output/<project-name>/`:

```
~/madc-output/<project>/
├── src/
│   ├── index.py / index.ts / main.go   ← Entry point
│   ├── app.py / app.ts                 ← App class
│   ├── config.py / config.ts           ← Config module
│   ├── logger.py / logger.ts           ← Logger
│   ├── routes/<slug>.py/.ts            ← REST routes (if API)
│   └── db/
│       ├── schema.sql                  ← Database schema
│       └── repository.py/.ts           ← Data access layer
├── tests/
│   ├── core-app.test.ts
│   ├── config.test.ts
│   └── edge-cases.test.ts
├── .github/
│   └── workflows/
│       └── ci.yml                      ← GitHub Actions CI/CD
├── Dockerfile                          ← Multi-stage production build
├── docker-compose.yml                  ← Dev + prod profiles
├── Makefile                            ← dev / build / test targets
├── README.md                           ← Project readme
├── plan.md                             ← Planner blueprint
├── architecture.md                     ← System design diagram
├── review-report.md                    ← Code review findings
├── security-report.md                  ← Security audit
├── optimization-report.md              ← Performance improvements
├── integration-report.md               ← Module merge log
├── test-report.md                      ← Test suite summary
├── deployment-report.md                ← Deployment details
└── madc-meta.json                      ← Run metadata (DAG, states)
```

---

## State Machine

The pipeline is enforced by a strict state machine — no agent can skip another:

```
INIT → PLANNING → CLARIFICATION_BLOCK → DESIGN → IMPLEMENTATION
  → REVIEW → SECURITY_CHECK → OPTIMIZATION → INTEGRATION
  → TESTING → DEPLOYMENT → COMPLETE
```

Any gate failure (Clarification, Review, Security) transitions to `ROLLBACK` and re-routes back to `CLARIFICATION_BLOCK`.

---

## Why Termux vs Desktop?

| Feature          | Desktop version              | This Termux edition               |
|-----------------|------------------------------|-----------------------------------|
| Spinner          | `ora` (ANSI cursor control)  | ASCII `[/\-\|]` — all terminals   |
| PAT storage      | `GITHUB_PAT` env var only    | Env var + `~/.madc/config.json`   |
| Output dir       | `scripts/madc-output/`       | `~/madc-output/` (home dir)       |
| Distribution     | pnpm workspace               | Single 194kb bundled `.cjs` file  |
| Output width     | 72 chars                     | 64 chars (phone screen friendly)  |
| Install method   | pnpm workspaces              | `npm install && npm run build`    |
| Global install   | via pnpm script              | `npm install -g .`                |

---

## Troubleshooting

**`pkg: command not found`**
> You are not in Termux. This edition is designed for Termux on Android.

**`node: not found`**
> Run `pkg install nodejs` in Termux.

**`Permission denied: dist/madc.cjs`**
> Run `chmod +x dist/madc.cjs` or use `node dist/madc.cjs` instead.

**GitHub push fails with 401**
> Your PAT may have expired. Delete `~/.madc/config.json` and re-enter a fresh token.

**GitHub push fails with "name already exists"**
> The repo name is taken. Choose a different name at the prompt.

**Screen is too wide / narrow**
> Output is fixed at 64 chars wide. Termux supports adjusting font size — pinch to zoom.

---

## Requirements

| Requirement | Version  | How to get                                    |
|-------------|----------|-----------------------------------------------|
| Termux      | Latest   | [F-Droid](https://f-droid.org/packages/com.termux/) |
| Node.js     | 18+      | `pkg install nodejs`                          |
| npm         | 9+       | Bundled with Node.js                          |
| git         | any      | `pkg install git`                             |
| GitHub PAT  | any      | [github.com/settings/tokens](https://github.com/settings/tokens) (`repo` scope) |

---

## License

MIT — part of [madc-sys](https://github.com/mahithpaulin/madc-sys).
