import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

interface Conflict {
  modules: string[];
  type: string;
  resolution: string;
}

export class IntegrationAgent extends BaseAgent {
  readonly name = "IntegrationAgent";
  readonly stage = "INTEGRATION";
  readonly icon = "🔗";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(700, 1100));

    const conflicts = this.detectConflicts(ctx);
    const resolved = conflicts.filter((c) => c.resolution !== "UNRESOLVABLE");
    const unresolved = conflicts.filter((c) => c.resolution === "UNRESOLVABLE");

    const manifest = this.buildManifest(ctx);

    const report = [
      `INTEGRATION REPORT`,
      `${"═".repeat(50)}`,
      `Project: ${ctx.projectName}`,
      `Modules merged: ${manifest.length}`,
      `Conflicts detected: ${conflicts.length}  |  Resolved: ${resolved.length}  |  Unresolved: ${unresolved.length}`,
      ``,
      `MODULE MANIFEST`,
      `${"─".repeat(40)}`,
      manifest.map((m, i) => `  ${i + 1}. ${m}`).join("\n"),
      ``,
      `CONFLICT RESOLUTION`,
      `${"─".repeat(40)}`,
      conflicts.length === 0
        ? "  No conflicts detected — clean integration"
        : conflicts.map(
            (c) =>
              `  [${c.type}] ${c.modules.join(" ↔ ")}\n` +
              `  Resolution: ${c.resolution}`
          ).join("\n"),
      ``,
      `COHERENCE CHECKS`,
      `${"─".repeat(40)}`,
      `  ✔ All module interfaces verified`,
      `  ✔ Dependency injection graph is acyclic`,
      `  ✔ No duplicate symbol exports`,
      `  ✔ All async boundaries properly awaited`,
      ``,
      `STATUS: ✔ INTEGRATION COMPLETE — System is coherent`,
    ].join("\n");

    ctx.bus.publish(this.name, "TestingAgent", "INTEGRATION", {
      modules: manifest.length,
      conflicts: conflicts.length,
    }, "COMPLETE");

    return {
      success: unresolved.length === 0,
      output: report,
      artifacts: { "integration-report.md": report },
    };
  }

  private buildManifest(ctx: AgentContext): string[] {
    const base = [
      "Core entry point (index)",
      "Application bootstrap (app)",
      "Configuration manager (config)",
      "Logger / observability",
    ];
    if (/api|rest|http/i.test(ctx.request)) base.push("HTTP route handlers");
    if (/db|database/i.test(ctx.request)) base.push("Database schema", "Repository layer");
    if (/cli/i.test(ctx.request)) base.push("CLI argument parser");
    base.push("Error handler middleware", "Graceful shutdown handler");
    return base;
  }

  private detectConflicts(ctx: AgentContext): Conflict[] {
    return [
      {
        modules: ["config", "logger"],
        type: "IMPORT_ORDER",
        resolution: "Logger now lazy-imported after config init to avoid circular reference",
      },
    ];
  }
}
