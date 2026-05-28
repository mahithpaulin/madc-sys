import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class SystemDesignAgent extends BaseAgent {
  readonly name = "SystemDesignAgent";
  readonly stage = "DESIGN";
  readonly icon = "3.";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.rand(600, 1000));

    const slug = ctx.projectName.toLowerCase().replace(/\s+/g, "-");
    const table = slug.replace(/-/g, "_");

    const diagram = [
      `ARCHITECTURE -- ${ctx.projectName.toUpperCase()}`,
      "=".repeat(44),
      "",
      "+-------------------------------+",
      "| CLIENT / CLI / API GATEWAY    |",
      "+---------------+---------------+",
      "                |",
      "+---------------v---------------+",
      "| ORCHESTRATION LAYER           |",
      "| . Routing  . Auth  . Validate |",
      "+-------+---------------+-------+",
      "        |               |",
      "+-------v------+ +------v-------+",
      "| BUSINESS     | | EVENT/QUEUE  |",
      "| LOGIC        | | PROCESSOR    |",
      "+-------+------+ +--------------+",
      "        |",
      "+-------v-----------------------+",
      "| DATA ACCESS LAYER             |",
      "+-------+-----------------------+",
      "        |",
      "+-------v-----------------------+",
      `| PERSISTENCE (${ctx.language === "Python" ? "PostgreSQL" : "SQLite/Postgres"})      |`,
      "+-------------------------------+",
      "",
      "API CONTRACTS",
      "-".repeat(36),
      `  GET    /api/${slug}`,
      `  POST   /api/${slug}`,
      `  GET    /api/${slug}/:id`,
      `  PUT    /api/${slug}/:id`,
      `  DELETE /api/${slug}/:id`,
      `  GET    /api/${slug}/health`,
      "",
      "DATA SCHEMA",
      "-".repeat(36),
      `  TABLE: ${table}`,
      "    id         UUID PRIMARY KEY",
      "    created_at TIMESTAMPTZ DEFAULT NOW()",
      "    updated_at TIMESTAMPTZ",
      "",
      "SYSTEM BOUNDARIES",
      "-".repeat(36),
      "  - Service owns its own data exclusively",
      "  - Inter-service comms via message bus",
      "  - External APIs behind adapter interface",
      "  - Config injected via environment variables",
    ].join("\n");

    ctx.bus.publish(this.name, "CodeGenerationAgent", "DESIGN", { slug }, "COMPLETE");
    return { success: true, output: diagram, artifacts: { "architecture.md": diagram } };
  }
}
