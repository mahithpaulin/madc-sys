import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class SystemDesignAgent extends BaseAgent {
  readonly name = "SystemDesignAgent";
  readonly stage = "DESIGN";
  readonly icon = "🧱";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(700, 1100));

    const name = ctx.projectName;
    const schema = this.generateSchema(ctx.request, name);
    const apis = this.generateAPIs(ctx.request, name);
    const boundaries = this.generateBoundaries(name);

    const diagram = [
      `SYSTEM ARCHITECTURE — ${name.toUpperCase()}`,
      `${"═".repeat(50)}`,
      ``,
      `┌─────────────────────────────────────────────┐`,
      `│  CLIENT / CLI / API GATEWAY                 │`,
      `└───────────────────┬─────────────────────────┘`,
      `                    │`,
      `┌───────────────────▼─────────────────────────┐`,
      `│  ORCHESTRATION LAYER                        │`,
      `│  · Request routing  · Auth middleware       │`,
      `│  · Rate limiting    · Request validation    │`,
      `└───────────────────┬─────────────────────────┘`,
      `                    │`,
      `         ┌──────────┴──────────┐`,
      `         │                     │`,
      `┌────────▼────────┐   ┌────────▼────────┐`,
      `│  BUSINESS LOGIC │   │  EVENT / QUEUE  │`,
      `│  SERVICES       │   │  PROCESSOR      │`,
      `└────────┬────────┘   └────────┬────────┘`,
      `         │                     │`,
      `┌────────▼─────────────────────▼────────┐`,
      `│  DATA ACCESS LAYER (Repository)       │`,
      `└────────────────────┬──────────────────┘`,
      `                     │`,
      `┌────────────────────▼──────────────────┐`,
      `│  PERSISTENCE  (${ctx.language === "Python" ? "PostgreSQL" : "SQLite / Postgres"})          │`,
      `└───────────────────────────────────────┘`,
      ``,
      `API CONTRACTS`,
      `${"─".repeat(40)}`,
      apis.map((a) => `  ${a}`).join("\n"),
      ``,
      `DATA SCHEMA`,
      `${"─".repeat(40)}`,
      schema,
      ``,
      `SYSTEM BOUNDARIES`,
      `${"─".repeat(40)}`,
      boundaries.map((b) => `  · ${b}`).join("\n"),
    ].join("\n");

    ctx.bus.publish(this.name, "CodeGenerationAgent", "DESIGN", {
      diagram,
      apis,
      schema,
    }, "COMPLETE");

    return {
      success: true,
      output: diagram,
      artifacts: { "architecture.md": diagram },
    };
  }

  private generateSchema(request: string, name: string): string {
    const table = name.toLowerCase().replace(/\s+/g, "_");
    const lines = [
      `  TABLE: ${table}`,
      `    id          UUID PRIMARY KEY`,
      `    created_at  TIMESTAMP DEFAULT NOW()`,
      `    updated_at  TIMESTAMP`,
    ];
    if (/user|auth|login/i.test(request)) {
      lines.push("  TABLE: users", "    id UUID PK", "    email TEXT UNIQUE", "    role TEXT");
    }
    if (/event|log|audit/i.test(request)) {
      lines.push("  TABLE: events", "    id UUID PK", "    type TEXT", "    payload JSONB");
    }
    return lines.join("\n");
  }

  private generateAPIs(request: string, name: string): string[] {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const base = [
      `GET  /api/${slug}          — list resources`,
      `POST /api/${slug}          — create resource`,
      `GET  /api/${slug}/:id      — get by ID`,
      `PUT  /api/${slug}/:id      — update by ID`,
      `DELETE /api/${slug}/:id   — delete by ID`,
      `GET  /api/${slug}/health  — health check`,
    ];
    if (/search|filter/i.test(request)) base.push(`GET  /api/${slug}/search  — search/filter`);
    if (/export|report/i.test(request)) base.push(`GET  /api/${slug}/export  — export CSV/JSON`);
    return base;
  }

  private generateBoundaries(name: string): string[] {
    return [
      `${name} service owns its own data — no direct DB access from outside`,
      "All inter-service communication via message bus events",
      "External APIs behind an adapter interface",
      "Configuration injected via environment variables",
      "Secrets never logged or serialized",
    ];
  }
}
