#!/usr/bin/env node
import readline from "readline";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { printBanner, printSectionHeader, printSuccess, printError, printInfo, printCompletionBox } from "./ui/banner.js";
import { runPipeline } from "./orchestrator.js";
import { pushToGitHub } from "./github.js";

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function saveArtifacts(
  outDir: string,
  artifacts: Record<string, string>
): Promise<void> {
  for (const [relPath, content] of Object.entries(artifacts)) {
    const full = path.join(outDir, relPath);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf-8");
  }
}

async function main(): Promise<void> {
  printBanner();

  // --- Accept request ---
  const args = process.argv.slice(2);
  let request: string;
  if (args.length > 0) {
    request = args.join(" ");
    printInfo(`Request (from args): ${request}`);
  } else {
    request = await prompt(
      "\x1b[36m  Enter your coding request:\x1b[0m\n  > "
    );
  }

  if (!request) {
    printError("No request provided. Exiting.");
    process.exit(1);
  }

  console.log("");

  // --- Run the 10-agent pipeline ---
  const result = await runPipeline(request);

  if (!result.success) {
    printError("Pipeline did not reach COMPLETE state.");
  }

  // --- Save artifacts locally ---
  printSectionHeader("💾  Saving Artifacts", "▶");
  const outDir = path.resolve(`madc-output/${result.projectName}`);
  await saveArtifacts(outDir, result.artifacts);

  // Save DAG and state history as metadata
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "madc-meta.json"),
    JSON.stringify(
      {
        projectName: result.projectName,
        language: result.language,
        stateHistory: result.stateHistory,
        dag: result.dagJson,
        messageBusEvents: result.busLog.length,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );

  printSuccess(`Artifacts saved to: ${outDir}`);
  printInfo(`Files: ${Object.keys(result.artifacts).length + 1} (including madc-meta.json)`);

  // --- GitHub push ---
  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    printInfo("GITHUB_PAT not set — skipping GitHub push.");
  } else {
    printSectionHeader("📡  Pushing to GitHub", "▶");

    const repoName = await prompt(
      `\x1b[36m  GitHub repo name\x1b[0m (leave blank to use "${result.projectName}"): `
    );
    const finalRepo = repoName || result.projectName;

    printInfo(`Pushing to github.com/<you>/${finalRepo} …`);

    const pushResult = await pushToGitHub(
      pat,
      finalRepo,
      result.artifacts,
      `MADC-SYS generated project: ${result.projectName}`
    );

    if (pushResult.success) {
      printSuccess(`Pushed!  ${pushResult.repoUrl}`);
    } else {
      printError(`GitHub push failed: ${pushResult.error}`);
    }
  }

  // --- Final summary ---
  printCompletionBox([
    `  MADC-SYS EXECUTION COMPLETE`,
    ``,
    `  Project:    ${result.projectName}`,
    `  Language:   ${result.language}`,
    `  Artifacts:  ${Object.keys(result.artifacts).length} files`,
    `  Bus events: ${result.busLog.length}`,
    `  States:     ${result.stateHistory.map((s) => s.state).join(" → ")}`,
    `  Output:     ${outDir}`,
  ]);
}

main().catch((err) => {
  console.error("\x1b[31m[FATAL]\x1b[0m", err);
  process.exit(1);
});
