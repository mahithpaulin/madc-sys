import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class PlannerAgent extends BaseAgent {
  readonly name = "PlannerAgent";
  readonly stage = "PLANNING";
  readonly icon = "🧭";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(600, 1000));

    const phases = [
      "Phase 1 · Requirements analysis & scope definition",
      "Phase 2 · Domain modelling & entity mapping",
      "Phase 3 · API contract surface design",
      "Phase 4 · Data persistence layer planning",
      "Phase 5 · Business logic decomposition",
      "Phase 6 · Error-handling & retry strategies",
      "Phase 7 · Security boundary identification",
      "Phase 8 · Performance & scalability constraints",
      "Phase 9 · Integration & dependency resolution",
      "Phase 10 · Deployment topology & release strategy",
    ];

    const roadmap = phases.join("\n");
    const modules = this.inferModules(ctx.request);
    const output = [
      `PROJECT: ${ctx.projectName}`,
      `LANGUAGE: ${ctx.language}`,
      ``,
      `10-PHASE EXECUTION BLUEPRINT`,
      `${"─".repeat(40)}`,
      roadmap,
      ``,
      `MODULE BREAKDOWN`,
      `${"─".repeat(40)}`,
      modules.map((m, i) => `  ${i + 1}. ${m}`).join("\n"),
    ].join("\n");

    ctx.bus.publish(this.name, "ClarificationAgent", "PLANNING", {
      phases,
      modules,
      project: ctx.projectName,
    }, "COMPLETE");

    return {
      success: true,
      output,
      artifacts: { "plan.md": output },
    };
  }

  private inferModules(request: string): string[] {
    const base = [
      "Core domain model",
      "Entry-point / CLI / API gateway",
      "Business logic layer",
      "Data access layer",
      "Configuration & env management",
      "Error handling & logging",
      "Utilities & helpers",
    ];
    if (/auth|login|user/i.test(request)) base.push("Authentication module");
    if (/api|rest|http/i.test(request)) base.push("REST API routes");
    if (/db|database|sql|postgres|mongo/i.test(request)) base.push("Database schema & migrations");
    if (/test|spec/i.test(request)) base.push("Test harness & fixtures");
    if (/deploy|docker|ci|cd/i.test(request)) base.push("CI/CD pipeline");
    return base;
  }
}
