import ora from "ora";
import { MessageBus } from "./message-bus.js";
import { StateMachine } from "./state-machine.js";
import { buildProjectDAG } from "./dag.js";
import { AgentContext } from "./agents/base-agent.js";
import { PlannerAgent } from "./agents/planner.js";
import { ClarificationAgent } from "./agents/clarification.js";
import { SystemDesignAgent } from "./agents/system-design.js";
import { CodeGenerationAgent } from "./agents/code-generation.js";
import { ReviewAgent } from "./agents/review.js";
import { SecurityAgent } from "./agents/security.js";
import { OptimizationAgent } from "./agents/optimization.js";
import { IntegrationAgent } from "./agents/integration.js";
import { TestingAgent } from "./agents/testing.js";
import { DeploymentAgent } from "./agents/deployment.js";
import {
  printSectionHeader,
  printSuccess,
  printError,
  printInfo,
  printAgent,
  printStateTransition,
  printMessageBusEvent,
  printDivider,
} from "./ui/banner.js";

export type Language =
  | "TypeScript"
  | "Python"
  | "Go"
  | "Rust"
  | "C++"
  | "Shell"
  | "SQL";

export interface OrchestratorResult {
  success: boolean;
  artifacts: Record<string, string>;
  projectName: string;
  language: Language;
  stateHistory: { state: string; at: string }[];
  busLog: ReturnType<MessageBus["getLog"]>;
  dagJson: object;
}

function detectLanguage(request: string): Language {
  if (/\bpython\b/i.test(request)) return "Python";
  if (/\bgo\b|\bgolang\b/i.test(request)) return "Go";
  if (/\brust\b/i.test(request)) return "Rust";
  if (/\bc\+\+\b|\bcpp\b/i.test(request)) return "C++";
  if (/\bshell\b|\bbash\b|\bscript\b/i.test(request)) return "Shell";
  if (/\bsql\b|\bschema\b/i.test(request)) return "SQL";
  return "TypeScript";
}

function inferProjectName(request: string): string {
  const words = request.trim().split(/\s+/);
  const stop = new Set(["a", "an", "the", "build", "create", "make", "write", "generate", "for", "with", "and", "that", "which"]);
  const meaningful = words.filter((w) => !stop.has(w.toLowerCase())).slice(0, 4);
  if (meaningful.length === 0) return "madc-project";
  return meaningful
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .join("-")
    .toLowerCase();
}

const PIPELINE = [
  { agent: new PlannerAgent(),         from: "INIT",                to: "PLANNING" },
  { agent: new ClarificationAgent(),   from: "PLANNING",            to: "CLARIFICATION_BLOCK" },
  { agent: new SystemDesignAgent(),    from: "CLARIFICATION_BLOCK", to: "DESIGN" },
  { agent: new CodeGenerationAgent(),  from: "DESIGN",              to: "IMPLEMENTATION" },
  { agent: new ReviewAgent(),          from: "IMPLEMENTATION",      to: "REVIEW" },
  { agent: new SecurityAgent(),        from: "REVIEW",              to: "SECURITY_CHECK" },
  { agent: new OptimizationAgent(),    from: "SECURITY_CHECK",      to: "OPTIMIZATION" },
  { agent: new IntegrationAgent(),     from: "OPTIMIZATION",        to: "INTEGRATION" },
  { agent: new TestingAgent(),         from: "INTEGRATION",         to: "TESTING" },
  { agent: new DeploymentAgent(),      from: "TESTING",             to: "DEPLOYMENT" },
];

export async function runPipeline(request: string): Promise<OrchestratorResult> {
  const bus = new MessageBus();
  const machine = new StateMachine();
  const dag = buildProjectDAG(inferProjectName(request));
  const language = detectLanguage(request);
  const projectName = inferProjectName(request);
  const allArtifacts: Record<string, string> = {};

  const ctx: AgentContext = {
    request,
    projectName,
    language,
    artifacts: allArtifacts,
    bus,
    machine,
  };

  printInfo(`Project:  ${projectName}`);
  printInfo(`Language: ${language}`);
  printInfo(`Pipeline: ${PIPELINE.length} agents`);
  printDivider();

  for (const step of PIPELINE) {
    const { agent, from, to } = step;

    printSectionHeader(`${agent.icon}  ${agent.name}`, "▶");
    printStateTransition(from, to);

    const spinner = ora({
      text: `  ${agent.name} executing…`,
      color: "cyan",
      indent: 2,
    }).start();

    try {
      machine.transition(to as Parameters<StateMachine["transition"]>[0]);
    } catch (err: unknown) {
      spinner.fail(`  State transition failed: ${String(err)}`);
      return {
        success: false,
        artifacts: allArtifacts,
        projectName,
        language,
        stateHistory: machine.getHistory(),
        busLog: bus.getLog(),
        dagJson: dag.toJSON(),
      };
    }

    let result;
    try {
      result = await agent.execute(ctx);
    } catch (err: unknown) {
      spinner.fail(`  ${agent.name} threw: ${String(err)}`);
      return {
        success: false,
        artifacts: allArtifacts,
        projectName,
        language,
        stateHistory: machine.getHistory(),
        busLog: bus.getLog(),
        dagJson: dag.toJSON(),
      };
    }

    if (result.success) {
      spinner.succeed(`  ${agent.name} — COMPLETE`);
    } else {
      spinner.warn(`  ${agent.name} — ${result.decision ?? "NEEDS_ATTENTION"}`);
    }

    // Print truncated output
    const lines = result.output.split("\n");
    lines.slice(0, 18).forEach((l) => printAgent("", l));
    if (lines.length > 18) printInfo(`  … ${lines.length - 18} more lines`);

    // Show last bus message
    const busLog = bus.getLog();
    if (busLog.length > 0) {
      const last = busLog[busLog.length - 1];
      printMessageBusEvent(last.from_agent, last.to_agent, last.stage);
    }

    // Merge artifacts
    Object.assign(allArtifacts, result.artifacts);
    Object.assign(ctx.artifacts, result.artifacts);

    // Hard-stop on Clarification block
    if (!result.success && agent.name === "ClarificationAgent") {
      printError("HARD STOP: Clarification gate blocked execution.");
      break;
    }

    // Auto-proceed on non-blocking failures (review warnings, etc.)
    if (!result.success && result.decision === "NEEDS_FIX") {
      printInfo("Review flagged warnings — auto-proceeding (no blocking errors).");
    }

    printDivider();
  }

  // Transition to COMPLETE
  try {
    machine.transition("COMPLETE");
  } catch {
    // Already failed — ignore
  }

  printSuccess(`Pipeline finished. State: ${machine.state}`);
  printInfo(`Message bus events: ${bus.getLog().length}  |  ${bus.summary()}`);
  printInfo(`Artifacts generated: ${Object.keys(allArtifacts).length}`);

  return {
    success: machine.state === "COMPLETE",
    artifacts: allArtifacts,
    projectName,
    language,
    stateHistory: machine.getHistory(),
    busLog: bus.getLog(),
    dagJson: dag.toJSON(),
  };
}
