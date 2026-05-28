import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

interface Ambiguity {
  field: string;
  question: string;
  resolution: string;
}

export class ClarificationAgent extends BaseAgent {
  readonly name = "ClarificationAgent";
  readonly stage = "CLARIFICATION_BLOCK";
  readonly icon = "❓";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(400, 700));

    const ambiguities = this.detectAmbiguities(ctx.request, ctx.language);
    const resolved: Ambiguity[] = [];
    const blocked: Ambiguity[] = [];

    for (const a of ambiguities) {
      if (a.resolution) {
        resolved.push(a);
      } else {
        blocked.push(a);
      }
    }

    if (blocked.length > 0) {
      const questions = blocked.map((b, i) => `  Q${i + 1}: ${b.question}`).join("\n");
      ctx.bus.publish(this.name, "ORCHESTRATOR", "CLARIFICATION_BLOCK", {
        blocked: blocked.length,
        questions,
      }, "FAILED");
      return {
        success: false,
        output: `HARD STOP — ${blocked.length} unresolved ambiguit${blocked.length === 1 ? "y" : "ies"} detected:\n${questions}`,
        artifacts: {},
        decision: "BLOCKED",
      };
    }

    const report = [
      `AMBIGUITY SCAN COMPLETE`,
      `Detected: ${ambiguities.length}  |  Resolved: ${resolved.length}  |  Blocked: 0`,
      ``,
      resolved.map((a) => `  ✔ [${a.field}] ${a.question}\n    → ${a.resolution}`).join("\n"),
      ``,
      `GATE: OPEN — Proceeding to System Design`,
    ].join("\n");

    ctx.bus.publish(this.name, "SystemDesignAgent", "CLARIFICATION_BLOCK", {
      resolved,
      gate: "OPEN",
    }, "COMPLETE");

    return {
      success: true,
      output: report,
      artifacts: { "clarification-report.md": report },
      decision: "APPROVED",
    };
  }

  private detectAmbiguities(request: string, language: string): Ambiguity[] {
    const items: Ambiguity[] = [
      {
        field: "target_language",
        question: "Which primary programming language should be used?",
        resolution: `Resolved to ${language} based on project domain`,
      },
      {
        field: "auth_required",
        question: "Is user authentication required?",
        resolution: /auth|login|user|session/i.test(request)
          ? "Yes — authentication detected in requirements"
          : "No — single-actor system, no auth needed",
      },
      {
        field: "persistence",
        question: "What persistence mechanism is required?",
        resolution: /db|database|sql|mongo|redis|store/i.test(request)
          ? "Database persistence required — schema will be generated"
          : "In-memory state sufficient for this system",
      },
      {
        field: "concurrency",
        question: "Are concurrent operations expected?",
        resolution: /concurrent|parallel|async|queue/i.test(request)
          ? "Yes — async concurrency model required"
          : "Sequential execution model sufficient",
      },
      {
        field: "deployment_target",
        question: "What is the target deployment environment?",
        resolution: /cloud|aws|gcp|azure/i.test(request)
          ? "Cloud deployment target detected"
          : "Container-based deployment (Docker) assumed",
      },
    ];
    return items;
  }
}
