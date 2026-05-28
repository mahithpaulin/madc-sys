import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class PlannerAgent extends BaseAgent {
  readonly name = "PlannerAgent";
  readonly stage = "PLANNING";
  readonly icon = "1.";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.rand(500, 900));

    const phases = [
      "Phase 01  Requirements analysis & scope",
      "Phase 02  Domain modelling & entity mapping",
      "Phase 03  API contract surface design",
      "Phase 04  Data persistence layer planning",
      "Phase 05  Business logic decomposition",
      "Phase 06  Error-handling & retry strategies",
      "Phase 07  Security boundary identification",
      "Phase 08  Performance & scalability constraints",
      "Phase 09  Integration & dependency resolution",
      "Phase 10  Deployment topology & release strategy",
    ];

    const modules = this.inferModules(ctx.request);

    const out = [
      `PROJECT  : ${ctx.projectName}`,
      `LANGUAGE : ${ctx.language}`,
      "",
      "10-PHASE BLUEPRINT",
      "-".repeat(36),
      ...phases,
      "",
      "MODULE BREAKDOWN",
      "-".repeat(36),
      ...modules.map((m, i) => `  ${String(i + 1).padStart(2, "0")}. ${m}`),
    ].join("\n");

    ctx.bus.publish(this.name, "ClarificationAgent", "PLANNING", { phases, modules }, "COMPLETE");
    return { success: true, output: out, artifacts: { "plan.md": out } };
  }

  private inferModules(req: string): string[] {
    const base = [
      "Core domain model",
      "Entry-point / API gateway",
      "Business logic layer",
      "Data access layer",
      "Configuration & env management",
      "Error handling & logging",
      "Utilities & helpers",
    ];
    if (/auth|login|user/i.test(req)) base.push("Authentication module");
    if (/api|rest|http/i.test(req)) base.push("REST API routes");
    if (/db|database|sql/i.test(req)) base.push("Database schema & migrations");
    if (/deploy|docker|ci/i.test(req)) base.push("CI/CD pipeline");
    return base;
  }
}
