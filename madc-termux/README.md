# MADC-SYS for Termux

Multi-Agent Distributed Coding System — runs on your Android phone via Termux.

## Quick Install (Termux)

```bash
# 1. Install Termux from F-Droid (not Play Store)
# 2. Open Termux and run:
pkg install git nodejs
git clone https://github.com/mahithpaulin/madc-sys
cd madc-sys/madc-termux
npm install
npm run build
npm install -g .
```

## Usage

```bash
# Interactive mode (prompts for your request)
madc

# Inline mode
madc "build a Python REST API for a todo app"
madc "create a Go CLI tool for file encryption"
madc "write a TypeScript Discord bot"
```

## First Run

On first launch MADC-SYS will ask for your GitHub PAT (Personal Access Token).
It is saved to `~/.madc/config.json` so you only need to enter it once.

To reset: `rm ~/.madc/config.json`

## Requirements

| Tool    | Version  | Install               |
|---------|----------|-----------------------|
| Termux  | Latest   | F-Droid               |
| Node.js | 18+      | `pkg install nodejs`  |
| npm     | 9+       | bundled with Node     |
| git     | any      | `pkg install git`     |

## Output

Generated files land in `~/madc-output/<project-name>/`:

```
~/madc-output/my-project/
  src/index.ts         ← entry point
  src/app.ts           ← app class
  src/config.ts        ← config module
  src/logger.ts        ← logger
  src/routes/...       ← API routes (if applicable)
  tests/...            ← test suites
  Dockerfile           ← container config
  docker-compose.yml   ← compose file
  .github/workflows/   ← CI/CD pipeline
  Makefile             ← dev commands
  architecture.md      ← system design
  security-report.md   ← security audit
  madc-meta.json       ← run metadata
```

## The 10 Agents

```
1. PlannerAgent        10-phase blueprint
2. ClarificationAgent  Ambiguity gate (HARD STOP)
3. SystemDesignAgent   Architecture + API contracts
4. CodeGenerationAgent Language-routed source files
5. ReviewAgent         Static analysis
6. SecurityAgent       CVE scan (blocks on CRITICAL/HIGH)
7. OptimizationAgent   Performance improvements
8. IntegrationAgent    Module merge + coherence
9. TestingAgent        Unit/integration/edge tests
10. DeploymentAgent    Docker + CI/CD + Makefile
```

## Language Routing

| Request contains       | Language   |
|------------------------|------------|
| python / script        | Python     |
| go / golang            | Go         |
| rust                   | Rust       |
| c++ / cpp / game / ml  | C++        |
| bash / shell           | Shell      |
| sql / schema / db      | SQL        |
| anything else          | TypeScript |
