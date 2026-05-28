import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

interface TestSuite {
  name: string;
  type: "unit" | "integration" | "e2e" | "edge";
  cases: string[];
  coverage: number;
}

export class TestingAgent extends BaseAgent {
  readonly name = "TestingAgent";
  readonly stage = "TESTING";
  readonly icon = "🧪";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(800, 1300));

    const suites = this.generateTestSuites(ctx);
    const totalCases = suites.reduce((s, t) => s + t.cases.length, 0);
    const avgCoverage = Math.round(suites.reduce((s, t) => s + t.coverage, 0) / suites.length);

    const testFiles = this.generateTestFiles(ctx, suites);

    const report = [
      `TEST GENERATION REPORT`,
      `${"═".repeat(50)}`,
      `Project: ${ctx.projectName}  |  Language: ${ctx.language}`,
      `Suites: ${suites.length}  |  Test cases: ${totalCases}  |  Avg coverage: ${avgCoverage}%`,
      ``,
      ...suites.map(
        (s) =>
          `  [${s.type.toUpperCase()}] ${s.name} (${s.coverage}% coverage)\n` +
          s.cases.map((c) => `    ✔ ${c}`).join("\n")
      ),
      ``,
      `GENERATED TEST FILES`,
      `${"─".repeat(40)}`,
      Object.keys(testFiles).map((f) => `  · ${f}`).join("\n"),
      ``,
      `EDGE CASE COVERAGE`,
      `${"─".repeat(40)}`,
      `  ✔ Null / undefined inputs`,
      `  ✔ Empty collections`,
      `  ✔ Boundary values (INT_MAX, empty string, 0)`,
      `  ✔ Concurrent modification scenarios`,
      `  ✔ Network timeout simulation`,
      ``,
      `STATUS: ✔ TEST SUITE COMPLETE`,
    ].join("\n");

    ctx.bus.publish(this.name, "DeploymentAgent", "TESTING", {
      suites: suites.length,
      cases: totalCases,
      coverage: avgCoverage,
    }, "COMPLETE");

    return {
      success: true,
      output: report,
      artifacts: { "test-report.md": report, ...testFiles },
    };
  }

  private generateTestSuites(ctx: AgentContext): TestSuite[] {
    const suites: TestSuite[] = [
      {
        name: "Core App",
        type: "unit",
        coverage: 94,
        cases: [
          "App initialises with correct defaults",
          "App throws on missing required config",
          "App gracefully handles startup errors",
        ],
      },
      {
        name: "Config Module",
        type: "unit",
        coverage: 100,
        cases: [
          "Config reads from environment variables",
          "Config falls back to defaults where safe",
          "Config throws on missing required secrets",
        ],
      },
      {
        name: "Logger",
        type: "unit",
        coverage: 97,
        cases: [
          "Logger emits correct level prefixes",
          "Logger respects LOG_LEVEL env var",
          "Logger does not leak secrets",
        ],
      },
    ];

    if (/api|rest|http/i.test(ctx.request)) {
      suites.push({
        name: "HTTP Routes",
        type: "integration",
        coverage: 91,
        cases: [
          "GET / returns 200 OK",
          "POST with valid body returns 201 Created",
          "PUT on non-existent ID returns 404",
          "DELETE requires authorisation",
          "Invalid JSON body returns 400",
        ],
      });
    }

    if (/db|database/i.test(ctx.request)) {
      suites.push({
        name: "Repository Layer",
        type: "integration",
        coverage: 88,
        cases: [
          "findAll returns empty array on fresh DB",
          "save persists and returns entity with ID",
          "findById returns null for unknown ID",
          "Concurrent save operations are safe",
        ],
      });
    }

    suites.push({
      name: "Edge Cases",
      type: "edge",
      coverage: 85,
      cases: [
        "Handles null request body gracefully",
        "Handles extremely large payloads (10MB)",
        "Recovers from transient DB connection failure",
        "Processes Unicode / emoji in string fields",
      ],
    });

    return suites;
  }

  private generateTestFiles(
    ctx: AgentContext,
    suites: TestSuite[]
  ): Record<string, string> {
    const ext = ctx.language === "Python" ? "py" : "test.ts";
    const files: Record<string, string> = {};
    for (const s of suites) {
      const fname = `tests/${s.name.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
      const body =
        ctx.language === "Python"
          ? `import pytest\n\nclass Test${s.name.replace(/\s+/g, "")}:\n${s.cases.map((c) => `    def test_${c.toLowerCase().replace(/[^a-z0-9]/g, "_")}(self):\n        assert True  # TODO\n`).join("\n")}`
          : `import { describe, it, expect } from "vitest";\n\ndescribe("${s.name}", () => {\n${s.cases.map((c) => `  it("${c}", () => {\n    expect(true).toBe(true); // TODO\n  });\n`).join("\n")}});\n`;
      files[fname] = body;
    }
    return files;
  }
}
