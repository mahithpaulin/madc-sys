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
  header, ok, err, info, agentLine, state, bus as busLog, divider, Spinner,
} from "./ui/terminal.js";

export type Language = "TypeScript" | "Python" | "Go" | "Rust" | "C++" | "Shell" | "SQL";

export interface PipelineResult {
  success: boolean;
  artifacts: Record<string, string>;
  projectName: string;
  language: Language;
  stateHistory: { state: string; at: string }[];
  busLog: ReturnType<MessageBus["getLog"]>;
  dagJson: object;
}

function detectLanguage(req: string): Language {
  if (/\bpython\b/i.test(req)) return "Python";
  if (/\bgo\b|\bgolang\b/i.test(req)) return "Go";
  if (/\brust\b/i.test(req)) return "Rust";
  if (/\bc\+\+\b|\bcpp\b|\bgame\b|\bml\b/i.test(req)) return "C++";
  if (/\bshell\b|\bbash\b/i.test(req)) return "Shell";
  if (/\bsql\b|\bschema\b/i.test(req)) return "SQL";
  return "TypeScript";
}

function inferName(req: string): string {
  const stop = new Set(["a","an","the","build","create","make","write","generate","for","with","and","that","which","in","using","simple"]);
  const words = req.trim().split(/\s+/).filter((w) => !stop.has(w.toLowerCase())).slice(0, 4);
  if (words.length === 0) return "madc-project";
  return words.map((w) => w.replace(/[^a-zA-Z0-9]/g, "")).filter(Boolean).join("-").toLowerCase();
}

const PIPELINE = [
  { agent: new PlannerAgent(),         from: "INIT",                to: "PLANNING"            },
  { agent: new ClarificationAgent(),   from: "PLANNING",            to: "CLARIFICATION_BLOCK" },
  { agent: new SystemDesignAgent(),    from: "CLARIFICATION_BLOCK", to: "DESIGN"              },
  { agent: new CodeGenerationAgent(),  from: "DESIGN",              to: "IMPLEMENTATION"      },
  { agent: new ReviewAgent(),          from: "IMPLEMENTATION",      to: "REVIEW"              },
  { agent: new SecurityAgent(),        from: "REVIEW",              to: "SECURITY_CHECK"      },
  { agent: new OptimizationAgent(),    from: "SECURITY_CHECK",      to: "OPTIMIZATION"        },
  { agent: new IntegrationAgent(),     from: "OPTIMIZATION",        to: "INTEGRATION"         },
  { agent: new TestingAgent(),         from: "INTEGRATION",         to: "TESTING"             },
  { agent: new DeploymentAgent(),      from: "TESTING",             to: "DEPLOYMENT"          },
] as const;

export async function runPipeline(request: string): Promise<PipelineResult> {
  const bus       = new MessageBus();
  const machine   = new StateMachine();
  const lang      = detectLanguage(request);
  const projName  = inferName(request);
  const dag       = buildProjectDAG(projName);
  const artifacts : Record<string, string> = {};

  const ctx: AgentContext = { request, projectName: projName, language: lang, artifacts, bus, machine };

  info(`Project : ${projName}`);
  info(`Language: ${lang}`);
  info(`Agents  : ${PIPELINE.length}`);
  divider();

  for (const step of PIPELINE) {
    const { agent, from, to } = step;

    header(agent.icon, agent.name);
    state(from, to);

    // Transition state machine
    try {
      machine.transition(to as Parameters<StateMachine["transition"]>[0]);
    } catch (e: unknown) {
      err(`State transition failed: ${String(e)}`);
      return { success: false, artifacts, projectName: projName, language: lang, stateHistory: machine.getHistory(), busLog: bus.getLog(), dagJson: dag.toJSON() };
    }

    // Run agent with spinner
    const spinner = new Spinner(`${agent.name} executing…`);
    spinner.start();

    let result;
    try {
      result = await agent.execute(ctx);
    } catch (e: unknown) {
      spinner.fail();
      err(`${agent.name} threw: ${String(e)}`);
      return { success: false, artifacts, projectName: projName, language: lang, stateHistory: machine.getHistory(), busLog: bus.getLog(), dagJson: dag.toJSON() };
    }

    spinner.stop(result.success);

    // Print truncated output (max 16 lines on phone screen)
    const lines = result.output.split("\n");
    lines.slice(0, 16).forEach((l) => agentLine(l));
    if (lines.length > 16) info(`  ... ${lines.length - 16} more lines`);

    // Show bus event
    const log = bus.getLog();
    if (log.length > 0) {
      const last = log[log.length - 1];
      busLog(last.from_agent, last.to_agent, last.stage);
    }

    // Merge artifacts
    Object.assign(artifacts, result.artifacts);
    Object.assign(ctx.artifacts, result.artifacts);

    // Hard stop on clarification block
    if (!result.success && agent.name === "ClarificationAgent") {
      err("HARD STOP: Clarification gate blocked execution.");
      break;
    }

    divider();
  }

  // Final transition
  try { machine.transition("COMPLETE"); } catch { /* may already be failed */ }

  ok(`Pipeline done — State: ${machine.state}`);
  info(`Bus events: ${bus.getLog().length}  |  ${bus.summary()}`);
  info(`Artifacts : ${Object.keys(artifacts).length} files`);

  return {
    success: machine.state === "COMPLETE",
    artifacts,
    projectName: projName,
    language: lang,
    stateHistory: machine.getHistory(),
    busLog: bus.getLog(),
    dagJson: dag.toJSON(),
  };
}
