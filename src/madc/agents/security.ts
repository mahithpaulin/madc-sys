import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

interface Vulnerability {
  cve?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  pattern: string;
  location: string;
  mitigation: string;
}

export class SecurityAgent extends BaseAgent {
  readonly name = "SecurityAgent";
  readonly stage = "SECURITY_CHECK";
  readonly icon = "🔐";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(700, 1100));

    const vulns = this.scanForVulnerabilities(ctx);
    const criticals = vulns.filter((v) => v.severity === "CRITICAL");
    const highs = vulns.filter((v) => v.severity === "HIGH");

    const report = [
      `SECURITY AUDIT REPORT`,
      `${"═".repeat(50)}`,
      `Scanned: ${ctx.projectName}  |  Language: ${ctx.language}`,
      `Findings: ${vulns.length}  |  CRITICAL: ${criticals.length}  |  HIGH: ${highs.length}`,
      ``,
      `VULNERABILITY SCAN`,
      `${"─".repeat(40)}`,
      vulns.map(
        (v) =>
          `  [${v.severity}]${v.cve ? " " + v.cve : ""}\n` +
          `  Pattern:    ${v.pattern}\n` +
          `  Location:   ${v.location}\n` +
          `  Mitigation: ${v.mitigation}\n`
      ).join("\n"),
      criticals.length === 0 && highs.length === 0
        ? `ENFORCEMENT: ✔ DEPLOYMENT APPROVED — No critical/high vulnerabilities`
        : `ENFORCEMENT: ✖ DEPLOYMENT BLOCKED — Resolve CRITICAL/HIGH findings first`,
    ].join("\n");

    const blocked = criticals.length > 0 || highs.length > 0;

    ctx.bus.publish(
      this.name,
      blocked ? "ORCHESTRATOR" : "OptimizationAgent",
      "SECURITY_CHECK",
      { criticals: criticals.length, highs: highs.length, blocked },
      blocked ? "FAILED" : "COMPLETE"
    );

    return {
      success: !blocked,
      output: report,
      artifacts: { "security-report.md": report },
      decision: blocked ? "BLOCKED" : "CLEARED",
    };
  }

  private scanForVulnerabilities(ctx: AgentContext): Vulnerability[] {
    const vulns: Vulnerability[] = [
      {
        severity: "MEDIUM",
        pattern: "Missing Content-Security-Policy header",
        location: "HTTP layer / middleware",
        mitigation: "Add CSP header: `helmet()` middleware or manual header",
      },
      {
        severity: "LOW",
        pattern: "Stack traces exposed in error responses",
        location: "Error handler middleware",
        mitigation: "Return sanitised error messages in production; log full trace server-side",
      },
      {
        severity: "LOW",
        pattern: "No rate limiting on public endpoints",
        location: "API gateway / routes",
        mitigation: "Apply rate-limiter middleware (e.g. express-rate-limit)",
      },
      {
        severity: "MEDIUM",
        pattern: "Secrets read via process.env without validation",
        location: "src/config",
        mitigation: "Validate required secrets at startup; throw if undefined",
      },
    ];

    if (/sql|database|db/i.test(ctx.request)) {
      vulns.push({
        severity: "MEDIUM",
        pattern: "Potential SQL injection via string interpolation",
        location: "src/db/repository",
        mitigation: "Use parameterised queries exclusively — never template strings",
      });
    }

    if (/file|upload|read|write/i.test(ctx.request)) {
      vulns.push({
        severity: "HIGH",
        pattern: "Path traversal risk in file operations",
        location: "File handling module",
        mitigation: "Resolve and validate paths against a whitelist base directory",
      });
    }

    return vulns;
  }
}
