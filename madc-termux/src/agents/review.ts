import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class ReviewAgent extends BaseAgent {
  readonly name = "ReviewAgent";
  readonly stage = "REVIEW";
  readonly icon = "5.";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.rand(500, 900));
    const e = this.ext(ctx.language);

    const findings = [
      { sev: "INFO",  file: `src/index.${e}`,  issue: "No graceful shutdown handler",         fix: "Add SIGTERM/SIGINT handlers" },
      { sev: "WARN",  file: `src/config.${e}`,  issue: "Port has hardcoded fallback",           fix: "Read PORT exclusively from env" },
      { sev: "INFO",  file: `src/logger.${e}`,  issue: "Log level not runtime-configurable",   fix: "Read LOG_LEVEL from env" },
      { sev: "INFO",  file: "README.md",         issue: "Missing install instructions",          fix: "Add install steps to README" },
    ];

    const errors = findings.filter((f) => f.sev === "ERROR");
    const decision = errors.length === 0 ? "APPROVED" : "NEEDS_FIX";

    const out = [
      "CODE REVIEW REPORT",
      "=".repeat(44),
      `Findings: ${findings.length}  ERR: ${errors.length}  WARN: ${findings.filter((f) => f.sev === "WARN").length}`,
      "",
      ...findings.map((f) => `  [${f.sev}] ${f.file}\n         ${f.issue}\n      -> ${f.fix}`),
      "",
      `DECISION: ${decision === "APPROVED" ? "OK APPROVED" : "!! NEEDS_FIX"}`,
    ].join("\n");

    ctx.bus.publish(this.name, "SecurityAgent", "REVIEW", { decision }, errors.length === 0 ? "COMPLETE" : "FAILED");
    return { success: errors.length === 0, output: out, artifacts: { "review-report.md": out }, decision };
  }
}
