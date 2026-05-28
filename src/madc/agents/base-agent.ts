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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  protected pickLanguageBoilerplate(language: string, projectName: string): string {
    const name = projectName.replace(/\s+/g, "_").toLowerCase();
    const map: Record<string, string> = {
      TypeScript: `// ${projectName} — TypeScript entry\nimport { App } from "./app";\nconst app = new App();\napp.start();`,
      Python: `# ${projectName} — Python entry\nfrom app import App\nif __name__ == "__main__":\n    App().run()`,
      Go: `// ${projectName} — Go entry\npackage main\nfunc main() { Run() }`,
      Rust: `// ${projectName} — Rust entry\nfn main() { run(); }`,
      "C++": `// ${projectName} — C++ entry\n#include "app.hpp"\nint main() { return App().run(); }`,
      Shell: `#!/usr/bin/env bash\n# ${name} deploy script\nset -euo pipefail`,
      SQL: `-- ${projectName} schema\nCREATE TABLE IF NOT EXISTS ${name} (id SERIAL PRIMARY KEY);`,
    };
    return map[language] ?? map["TypeScript"];
  }
}
