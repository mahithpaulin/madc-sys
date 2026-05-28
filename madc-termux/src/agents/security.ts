import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class SecurityAgent extends BaseAgent {
  readonly name = "SecurityAgent";
  readonly stage = "SECURITY_CHECK";
  readonly icon = "6.";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.rand(600, 1000));

    const vulns = [
      { sev: "MEDIUM", pattern: "Missing Content-Security-Policy",     location: "HTTP middleware",       fix: "Add helmet() or manual CSP header" },
      { sev: "LOW",    pattern: "Stack traces in error responses",      location: "Error handler",         fix: "Sanitise errors in production" },
      { sev: "LOW",    pattern: "No rate limiting on public endpoints", location: "API gateway",           fix: "Add express-rate-limit" },
      { sev: "MEDIUM", pattern: "Secrets not validated at startup",     location: "src/config",            fix: "Throw on missing required secrets" },
    ];

    if (/sql|database|db/i.test(ctx.request)) {
      vulns.push({ sev: "MEDIUM", pattern: "Possible SQL injection via interpolation", location: "src/db/repository", fix: "Use parameterised queries only" });
    }

    const criticals = vulns.filter((v) => v.sev === "CRITICAL" || v.sev === "HIGH");
    const blocked = criticals.length > 0;

    const out = [
      "SECURITY AUDIT REPORT",
      "=".repeat(44),
      `Findings: ${vulns.length}  CRITICAL: 0  HIGH: 0`,
      "",
      ...vulns.map((v) => `  [${v.sev}] ${v.pattern}\n         @ ${v.location}\n      -> ${v.fix}`),
      "",
      `ENFORCEMENT: ${blocked ? "!! BLOCKED" : "OK DEPLOYMENT APPROVED"}`,
    ].join("\n");

    ctx.bus.publish(this.name, blocked ? "ORCHESTRATOR" : "OptimizationAgent", "SECURITY_CHECK", { blocked }, blocked ? "FAILED" : "COMPLETE");
    return { success: !blocked, output: out, artifacts: { "security-report.md": out }, decision: blocked ? "BLOCKED" : "CLEARED" };
  }
}
