import type { MessageBus } from "../message-bus.js";
import type { StateMachine } from "../state-machine.js";

export interface AgentContext {
  request: string;
  projectName: string;
  language: string;
  artifacts: Record<string, string>;
  bus: MessageBus;
  machine: StateMachine;
}

export interface AgentResult {
  success: boolean;
  output: string;
  artifacts: Record<string, string>;
  decision?: string;
  warnings?: string[];
}

export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly stage: string;
  abstract readonly icon: string;

  abstract execute(ctx: AgentContext): Promise<AgentResult>;

  protected sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  protected rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  protected ext(lang: string): string {
    const m: Record<string, string> = {
      TypeScript: "ts", Python: "py", Go: "go",
      Rust: "rs", "C++": "cpp", Shell: "sh", SQL: "sql",
    };
    return m[lang] ?? "ts";
  }
}
