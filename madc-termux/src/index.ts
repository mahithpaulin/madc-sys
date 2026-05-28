#!/usr/bin/env node
import readline from "readline";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { banner, ok, err, info, header, summary } from "./ui/terminal.js";
import { runPipeline } from "./orchestrator.js";
import { getGithubPat, getSavedOutputDir } from "./config.js";
import { pushToGitHub } from "./github.js";

function prompt(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
}

async function saveOutput(outDir: string, artifacts: Record<string, string>): Promise<void> {
  for (const [rel, content] of Object.entries(artifacts)) {
    const full = path.join(outDir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content, "utf-8");
  }
}

async function main(): Promise<void> {
  banner();

  // Get request
  const args = process.argv.slice(2);
  let request: string;
  if (args.length > 0) {
    request = args.join(" ");
    info(`Request: ${request}`);
  } else {
    request = await prompt("\x1b[36m  Enter your coding request:\x1b[0m\n  > ");
  }

  if (!request) { err("No request provided. Exiting."); process.exit(1); }
  console.log("");

  // Run pipeline
  const result = await runPipeline(request);

  if (!result.success) {
    err("Pipeline did not complete successfully.");
  }

  // Save locally
  header(">>", "Saving artifacts");
  const baseDir = await getSavedOutputDir();
  const outDir  = path.join(baseDir, result.projectName);
  await saveOutput(outDir, result.artifacts);

  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "madc-meta.json"),
    JSON.stringify({
      projectName:    result.projectName,
      language:       result.language,
      stateHistory:   result.stateHistory,
      dag:            result.dagJson,
      busEvents:      result.busLog.length,
      generatedAt:    new Date().toISOString(),
      generatedBy:    "madc-termux",
    }, null, 2),
    "utf-8"
  );

  ok(`Saved to: ${outDir}`);
  info(`Files   : ${Object.keys(result.artifacts).length + 1}`);

  // GitHub push
  const pat = await getGithubPat();
  if (!pat) {
    info("Skipping GitHub push (no PAT).");
  } else {
    header(">>", "Pushing to GitHub");

    const repoInput = await prompt(
      `\x1b[36m  Repo name\x1b[0m (blank = "${result.projectName}"): `
    );
    const repoName = repoInput || result.projectName;
    info(`Pushing to github.com/<you>/${repoName} ...`);

    const pushed = await pushToGitHub(
      pat, repoName, result.artifacts,
      `MADC-SYS generated: ${result.projectName}`
    );

    if (pushed.success) {
      ok(`Pushed!  ${pushed.repoUrl}`);
    } else {
      err(`Push failed: ${pushed.error}`);
    }
  }

  // Final summary box
  summary([
    "  MADC-SYS COMPLETE",
    "",
    `  Project  : ${result.projectName}`,
    `  Language : ${result.language}`,
    `  Artifacts: ${Object.keys(result.artifacts).length} files`,
    `  Bus evts : ${result.busLog.length}`,
    `  States   : ${result.stateHistory.map((s) => s.state).join(" -> ")}`,
    `  Output   : ${outDir}`,
  ]);
}

main().catch((e) => { console.error("\x1b[31m[FATAL]\x1b[0m", e); process.exit(1); });
