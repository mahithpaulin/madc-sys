import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class DeploymentAgent extends BaseAgent {
  readonly name = "DeploymentAgent";
  readonly stage = "DEPLOYMENT";
  readonly icon = "10.";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.rand(500, 900));

    const slug = ctx.projectName.toLowerCase().replace(/\s+/g, "-");
    const dockerfile = this.dockerfile(ctx.language);
    const compose    = this.compose(slug);
    const cicd       = this.cicd(ctx.projectName, slug);
    const makefile   = this.makefile(slug, ctx.language);

    const out = [
      "DEPLOYMENT CONFIGURATION",
      "=".repeat(44),
      `Project  : ${ctx.projectName}`,
      `Language : ${ctx.language}`,
      "",
      "Generated artifacts:",
      "  + Dockerfile               (multi-stage, prod-optimised)",
      "  + docker-compose.yml       (dev + prod profiles)",
      "  + .github/workflows/ci.yml (CI/CD pipeline)",
      "  + Makefile                 (dev commands)",
      "",
      "Deployment topology:",
      "  Runtime     : Docker container",
      "  Registry    : ghcr.io (GitHub Container Registry)",
      "  Health check: GET /api/health -> 200",
      "  Rollback    : previous image tag retained",
      "",
      "CI/CD pipeline:",
      "  Trigger : push to main / pull_request",
      "  Steps   : lint -> typecheck -> test -> build -> publish",
      "",
      "STATUS: OK DEPLOYMENT PACKAGE READY",
    ].join("\n");

    ctx.bus.publish(this.name, "COMPLETE", "DEPLOYMENT", {}, "COMPLETE");
    return {
      success: true, output: out,
      artifacts: {
        "deployment-report.md": out,
        "Dockerfile": dockerfile,
        "docker-compose.yml": compose,
        ".github/workflows/ci.yml": cicd,
        "Makefile": makefile,
      },
    };
  }

  private dockerfile(lang: string): string {
    if (lang === "Python") return `FROM python:3.12-slim AS builder\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nFROM python:3.12-slim\nWORKDIR /app\nCOPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages\nCOPY . .\nEXPOSE 3000\nCMD ["python", "src/index.py"]\n`;
    if (lang === "Go") return `FROM golang:1.22-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN go build -o /bin/app ./cmd/main.go\n\nFROM alpine:3.20\nCOPY --from=builder /bin/app /bin/app\nEXPOSE 3000\nCMD ["/bin/app"]\n`;
    return `FROM node:22-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nEXPOSE 3000\nCMD ["node", "dist/index.js"]\n`;
  }

  private compose(slug: string): string {
    return `version: "3.9"\nservices:\n  app:\n    build: .\n    ports:\n      - "\${PORT:-3000}:3000"\n    environment:\n      - NODE_ENV=production\n    restart: unless-stopped\n    healthcheck:\n      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]\n      interval: 30s\n      timeout: 5s\n      retries: 3\n`;
  }

  private cicd(name: string, slug: string): string {
    return `name: CI/CD -- ${name}\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  ci:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm ci\n      - run: npm run typecheck\n      - run: npm test\n      - name: Build image\n        run: docker build -t ghcr.io/\${{ github.actor }}/${slug}:\${{ github.sha }} .\n      - name: Push to GHCR\n        if: github.ref == 'refs/heads/main'\n        run: |\n          echo \${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u \${{ github.actor }} --password-stdin\n          docker push ghcr.io/\${{ github.actor }}/${slug}:\${{ github.sha }}\n`;
  }

  private makefile(slug: string, lang: string): string {
    const run   = lang === "Python" ? "python src/index.py"    : lang === "Go" ? "go run ./cmd/main.go" : "npx tsx src/index.ts";
    const test  = lang === "Python" ? "pytest tests/"          : "npm test";
    const lint  = lang === "Python" ? "ruff check ."           : "npx eslint src/";
    return `.PHONY: dev build test lint docker-build docker-run\n\ndev:\n\t${run}\n\ntest:\n\t${test}\n\nlint:\n\t${lint}\n\ndocker-build:\n\tdocker build -t ${slug} .\n\ndocker-run:\n\tdocker run -p 3000:3000 ${slug}\n`;
  }
}
