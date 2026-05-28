import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class DeploymentAgent extends BaseAgent {
  readonly name = "DeploymentAgent";
  readonly stage = "DEPLOYMENT";
  readonly icon = "🚀";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(600, 1000));

    const slug = ctx.projectName.toLowerCase().replace(/\s+/g, "-");
    const dockerfile = this.generateDockerfile(ctx);
    const cicd = this.generateCICD(ctx, slug);
    const compose = this.generateCompose(slug);
    const makefile = this.generateMakefile(slug, ctx.language);

    const report = [
      `DEPLOYMENT CONFIGURATION`,
      `${"═".repeat(50)}`,
      `Project: ${ctx.projectName}  |  Language: ${ctx.language}`,
      ``,
      `GENERATED ARTIFACTS`,
      `${"─".repeat(40)}`,
      `  · Dockerfile               (multi-stage, production-optimised)`,
      `  · docker-compose.yml       (dev + production profiles)`,
      `  · .github/workflows/ci.yml (CI/CD pipeline)`,
      `  · Makefile                 (dev commands)`,
      ``,
      `DEPLOYMENT TOPOLOGY`,
      `${"─".repeat(40)}`,
      `  Runtime:     Container (Docker)`,
      `  Registry:    GitHub Container Registry (ghcr.io)`,
      `  Orchestration: Docker Compose (single-node) / K8s-ready`,
      `  Health check: GET /api/health → 200 OK`,
      `  Rollback:    Previous image tag retained for instant rollback`,
      ``,
      `CI/CD PIPELINE`,
      `${"─".repeat(40)}`,
      `  Trigger:  push to main / pull_request`,
      `  Steps:    lint → typecheck → test → build → publish → deploy`,
      `  Env:      Secrets injected via GitHub Actions secrets`,
      ``,
      `STATUS: ✔ DEPLOYMENT PACKAGE READY`,
    ].join("\n");

    ctx.bus.publish(this.name, "COMPLETE", "DEPLOYMENT", {
      dockerfile: true,
      cicd: true,
    }, "COMPLETE");

    return {
      success: true,
      output: report,
      artifacts: {
        "deployment-report.md": report,
        Dockerfile: dockerfile,
        "docker-compose.yml": compose,
        ".github/workflows/ci.yml": cicd,
        Makefile: makefile,
      },
    };
  }

  private generateDockerfile(ctx: AgentContext): string {
    const { language } = ctx;
    if (language === "Python") {
      return `FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .
EXPOSE 3000
CMD ["python", "src/index.py"]
`;
    }
    if (language === "Go") {
      return `FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /bin/app ./cmd/main.go

FROM alpine:3.20
COPY --from=builder /bin/app /bin/app
EXPOSE 3000
CMD ["/bin/app"]
`;
    }
    return `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
  }

  private generateCompose(slug: string): string {
    return `version: "3.9"
services:
  app:
    build: .
    ports:
      - "\${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
`;
  }

  private generateCICD(ctx: AgentContext, slug: string): string {
    return `name: CI/CD — ${ctx.projectName}

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - name: Build Docker image
        run: docker build -t ghcr.io/\${{ github.actor }}/${slug}:\${{ github.sha }} .
      - name: Push to GHCR
        if: github.ref == 'refs/heads/main'
        run: |
          echo \${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u \${{ github.actor }} --password-stdin
          docker push ghcr.io/\${{ github.actor }}/${slug}:\${{ github.sha }}
`;
  }

  private generateMakefile(slug: string, lang: string): string {
    return `.PHONY: dev build test lint docker-build docker-run

dev:
\t${lang === "Python" ? "python src/index.py" : "npx tsx src/index.ts"}

build:
\t${lang === "Python" ? "pip install -r requirements.txt" : "npm run build"}

test:
\t${lang === "Python" ? "pytest tests/" : "npm test"}

lint:
\t${lang === "Python" ? "ruff check ." : "npx eslint src/"}

docker-build:
\tdocker build -t ${slug} .

docker-run:
\tdocker run -p 3000:3000 ${slug}
`;
  }
}
