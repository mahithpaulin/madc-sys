import { BaseAgent, AgentContext, AgentResult } from "./base-agent.js";

export class CodeGenerationAgent extends BaseAgent {
  readonly name = "CodeGenerationAgent";
  readonly stage = "IMPLEMENTATION";
  readonly icon = "💻";

  async execute(ctx: AgentContext): Promise<AgentResult> {
    await this.sleep(this.randomInt(900, 1400));

    const files = this.generateFiles(ctx);
    const listing = Object.entries(files)
      .map(([path, content]) => `FILE: ${path}\n${"─".repeat(Math.min(path.length + 6, 50))}\n${content}\n`)
      .join("\n");

    const summary = [
      `CODE GENERATION COMPLETE`,
      `Language: ${ctx.language}`,
      `Files generated: ${Object.keys(files).length}`,
      ``,
      Object.keys(files).map((f) => `  · ${f}`).join("\n"),
      ``,
      listing,
    ].join("\n");

    ctx.bus.publish(this.name, "ReviewAgent", "IMPLEMENTATION", {
      files: Object.keys(files),
      language: ctx.language,
    }, "COMPLETE");

    return {
      success: true,
      output: summary,
      artifacts: files,
    };
  }

  private generateFiles(ctx: AgentContext): Record<string, string> {
    const { projectName, language, request } = ctx;
    const slug = projectName.toLowerCase().replace(/\s+/g, "-");
    const files: Record<string, string> = {};

    files[`src/index.${this.ext(language)}`] = this.pickLanguageBoilerplate(language, projectName);
    files[`src/app.${this.ext(language)}`] = this.appFile(language, projectName);
    files[`src/config.${this.ext(language)}`] = this.configFile(language, slug);
    files[`src/logger.${this.ext(language)}`] = this.loggerFile(language);

    if (/api|rest|http|server/i.test(request)) {
      files[`src/routes/${slug}.${this.ext(language)}`] = this.routeFile(language, slug);
    }
    if (/db|database|sql|store|persist/i.test(request)) {
      files[`src/db/schema.${this.ext(language)}`] = this.schemaFile(language, slug);
      files[`src/db/repository.${this.ext(language)}`] = this.repoFile(language, slug);
    }
    if (/cli|terminal|command/i.test(request)) {
      files[`src/cli.${this.ext(language)}`] = this.cliFile(language, projectName);
    }

    files[`README.md`] = this.readme(projectName, language, Object.keys(files));
    return files;
  }

  private ext(lang: string): string {
    const map: Record<string, string> = {
      TypeScript: "ts", Python: "py", Go: "go",
      Rust: "rs", "C++": "cpp", Shell: "sh", SQL: "sql",
    };
    return map[lang] ?? "ts";
  }

  private appFile(lang: string, name: string): string {
    if (lang === "Python") return `class App:\n    def __init__(self):\n        self.name = "${name}"\n    def run(self):\n        print(f"[{self.name}] Running...")\n`;
    if (lang === "Go") return `package main\n\ntype App struct{ Name string }\n\nfunc Run() { a := App{Name: "${name}"}; _ = a }\n`;
    return `export class App {\n  constructor(private name = "${name}") {}\n  start() { console.log(\`[\${this.name}] Starting...\`); }\n}\n`;
  }

  private configFile(lang: string, slug: string): string {
    if (lang === "Python") return `import os\nCONFIG = {"app_name": "${slug}", "debug": os.getenv("DEBUG", "false") == "true"}\n`;
    if (lang === "Go") return `package config\nimport "os"\nvar AppName = "${slug}"\nvar Debug = os.Getenv("DEBUG") == "true"\n`;
    return `export const config = {\n  appName: "${slug}",\n  debug: process.env.DEBUG === "true",\n  port: parseInt(process.env.PORT ?? "3000"),\n};\n`;
  }

  private loggerFile(lang: string): string {
    if (lang === "Python") return `import logging\nlogging.basicConfig(level=logging.INFO)\nlogger = logging.getLogger(__name__)\n`;
    if (lang === "Go") return `package logger\nimport "log"\nfunc Info(msg string) { log.Println("[INFO]", msg) }\n`;
    return `const levels = { INFO: "INFO", WARN: "WARN", ERROR: "ERROR" } as const;\nexport const logger = {\n  info: (msg: string) => console.log(\`[INFO] \${msg}\`),\n  warn: (msg: string) => console.warn(\`[WARN] \${msg}\`),\n  error: (msg: string) => console.error(\`[ERROR] \${msg}\`),\n};\n`;
  }

  private routeFile(lang: string, slug: string): string {
    if (lang === "Python") return `from flask import Blueprint, jsonify\n${slug}_bp = Blueprint("${slug}", __name__)\n@${slug}_bp.get("/${slug}")\ndef list_items(): return jsonify([])\n`;
    return `import { Router } from "express";\nexport const router = Router();\nrouter.get("/${slug}", (_req, res) => res.json({ items: [] }));\nrouter.post("/${slug}", (req, res) => res.json({ created: req.body }));\n`;
  }

  private schemaFile(lang: string, slug: string): string {
    const table = slug.replace(/-/g, "_");
    return `-- ${slug} schema\nCREATE TABLE IF NOT EXISTS ${table} (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ\n);\n`;
  }

  private repoFile(lang: string, slug: string): string {
    if (lang === "Python") return `class ${slug.replace(/-/g, "_").charAt(0).toUpperCase()}Repo:\n    def find_all(self): return []\n    def find_by_id(self, id): return None\n    def save(self, item): return item\n`;
    return `export class ${slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s/g, "")}Repository {\n  async findAll() { return []; }\n  async findById(id: string) { return null; }\n  async save(item: unknown) { return item; }\n}\n`;
  }

  private cliFile(lang: string, name: string): string {
    if (lang === "Python") return `import argparse\ndef main():\n    parser = argparse.ArgumentParser(description="${name}")\n    parser.add_argument("command")\n    args = parser.parse_args()\n    print(f"Running {args.command}")\n`;
    return `import { parseArgs } from "node:util";\nconst { values } = parseArgs({ options: { command: { type: "string" } } });\nconsole.log(\`[${name}] Command: \${values.command}\`);\n`;
  }

  private readme(name: string, lang: string, files: string[]): string {
    const fileList = files.map((f) => "- " + f).join("\n");
    return [
      "# " + name,
      "",
      "Generated by MADC-SYS — Multi-Agent Distributed Coding System",
      "",
      "## Language",
      lang,
      "",
      "## Files",
      fileList,
      "",
      "## Getting Started",
      "",
      "See individual source files for entry-point instructions.",
      "",
    ].join("\n");
  }
}
