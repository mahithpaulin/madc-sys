import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

interface Finding {
  severity: "INFO" | "WARN" | "ERROR";
  file: string;
  issue: string;
  suggestion: string;
}

export class ReviewAgent extends BaseAgent {
  readonly name = "ReviewAgent";
  readonly stage = "REVIEW";
  readonly icon = "🧪";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(600, 1000));

    const findings = this.analyzeCode(ctx);
    const errors = findings.filter((f) => f.severity === "ERROR");
    const warns = findings.filter((f) => f.severity === "WARN");
    const infos = findings.filter((f) => f.severity === "INFO");

    const report = [
      `CODE REVIEW REPORT`,
      `${"═".repeat(50)}`,
      `Total findings: ${findings.length}  |  ERROR: ${errors.length}  |  WARN: ${warns.length}  |  INFO: ${infos.length}`,
      ``,
      ...findings.map(
        (f) =>
          `  [${f.severity.padEnd(5)}] ${f.file}\n` +
          `           Issue: ${f.issue}\n` +
          `           Fix:   ${f.suggestion}`
      ),
      ``,
      errors.length === 0
        ? `DECISION: ✔ APPROVED — No blocking errors`
        : `DECISION: ✖ REJECTED — ${errors.length} error(s) must be resolved`,
    ].join("\n");

    const decision = errors.length === 0 ? "APPROVED" : "NEEDS_FIX";

    ctx.bus.publish(
      this.name,
      errors.length === 0 ? "SecurityAgent" : "ORCHESTRATOR",
      "REVIEW",
      { findings: findings.length, errors: errors.length, decision },
      errors.length === 0 ? "COMPLETE" : "FAILED"
    );

    return {
      success: errors.length === 0,
      output: report,
      artifacts: { "review-report.md": report },
      decision,
      warnings: warns.map((w) => w.issue),
    };
  }

  private analyzeCode(ctx: AgentContext): Finding[] {
    const lang = ctx.language;
    return [
      {
        severity: "INFO",
        file: `src/index.${this.ext(lang)}`,
        issue: "Entry point lacks graceful shutdown handler",
        suggestion: "Add SIGTERM/SIGINT signal handlers for clean shutdown",
      },
      {
        severity: "WARN",
        file: `src/config.${this.ext(lang)}`,
        issue: "Hardcoded default port may conflict in containerised environments",
        suggestion: "Read port exclusively from environment — no default fallback",
      },
      {
        severity: "INFO",
        file: `src/logger.${this.ext(lang)}`,
        issue: "Log level not configurable at runtime",
        suggestion: "Derive log level from LOG_LEVEL environment variable",
      },
      {
        severity: "INFO",
        file: "README.md",
        issue: "Missing dependency installation instructions",
        suggestion: "Add install and run commands to README Getting Started section",
      },
    ];
  }

  private ext(lang: string): string {
    const map: Record<string, string> = {
      TypeScript: "ts", Python: "py", Go: "go", Rust: "rs", "C++": "cpp",
    };
    return map[lang] ?? "ts";
  }
}
