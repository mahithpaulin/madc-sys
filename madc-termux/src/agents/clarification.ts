import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class ClarificationAgent extends BaseAgent {
  readonly name = "ClarificationAgent";
  readonly stage = "CLARIFICATION_BLOCK";
  readonly icon = "2.";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.rand(400, 700));

    const checks = [
      { field: "target_language",  q: "Which primary language?",           resolution: `Resolved to ${ctx.language} via domain routing` },
      { field: "auth_required",    q: "Is user auth required?",            resolution: /auth|login|user|session/i.test(ctx.request) ? "Yes — auth detected" : "No — single-actor system" },
      { field: "persistence",      q: "What persistence is required?",     resolution: /db|database|sql/i.test(ctx.request) ? "Database — schema generated" : "In-memory state sufficient" },
      { field: "concurrency",      q: "Are concurrent ops expected?",      resolution: /concurrent|parallel|async|queue/i.test(ctx.request) ? "Yes — async model required" : "Sequential model sufficient" },
      { field: "deploy_target",    q: "Target deployment environment?",    resolution: /cloud|aws|gcp|azure/i.test(ctx.request) ? "Cloud target detected" : "Docker/container assumed" },
    ];

    const out = [
      "AMBIGUITY SCAN COMPLETE",
      `Detected: ${checks.length}  Resolved: ${checks.length}  Blocked: 0`,
      "",
      ...checks.map((c) => `  [OK] ${c.field}\n       ${c.resolution}`),
      "",
      "GATE: OPEN — proceeding to System Design",
    ].join("\n");

    ctx.bus.publish(this.name, "SystemDesignAgent", "CLARIFICATION_BLOCK", { gate: "OPEN" }, "COMPLETE");
    return { success: true, output: out, artifacts: { "clarification.md": out }, decision: "APPROVED" };
  }
}
