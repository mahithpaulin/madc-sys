import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const CONFIG_DIR = path.join(os.homedir(), ".madc");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface MadcConfig {
  github_pat?: string;
  github_user?: string;
}

async function readConfig(): Promise<MadcConfig> {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as MadcConfig;
  } catch {
    return {};
  }
}

async function writeConfig(cfg: MadcConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

function rlPrompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
  });
}

export async function getGithubPat(): Promise<string | null> {
  // 1. Check env var first
  if (process.env.GITHUB_PAT) return process.env.GITHUB_PAT;

  // 2. Check saved config
  const cfg = await readConfig();
  if (cfg.github_pat) return cfg.github_pat;

  // 3. Prompt and save
  console.log("\n[..] No GitHub PAT found.");
  console.log("[..] Create one at: github.com/settings/tokens");
  console.log("[..] Required scope: repo\n");
  const pat = await rlPrompt("  Paste your GitHub PAT (or press Enter to skip): ");
  if (!pat) return null;

  const save = await rlPrompt("  Save PAT to ~/.madc/config.json for future runs? [Y/n]: ");
  if (!save || save.toLowerCase() === "y") {
    await writeConfig({ ...cfg, github_pat: pat });
    console.log("[OK] PAT saved to ~/.madc/config.json\n");
  }

  return pat;
}

export async function getSavedOutputDir(): Promise<string> {
  return path.join(os.homedir(), "madc-output");
}
