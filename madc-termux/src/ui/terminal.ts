import chalk from "chalk";

const W = 64;

export function banner(): void {
  const pad = (s: string) => " " + s.padEnd(W - 2);
  console.log("");
  console.log(chalk.cyan("+" + "=".repeat(W - 2) + "+"));
  console.log(chalk.cyan("|") + chalk.bold.yellow(pad("  MADC-SYS  Multi-Agent Distributed Coding")) + chalk.cyan("|"));
  console.log(chalk.cyan("|") + chalk.white(pad("  Deterministic AI Engineering Pipeline    ")) + chalk.cyan("|"));
  console.log(chalk.cyan("|") + chalk.gray(pad("  10 agents | Message bus | State machine  ")) + chalk.cyan("|"));
  console.log(chalk.cyan("+" + "=".repeat(W - 2) + "+"));
  console.log("");
}

export function header(icon: string, title: string): void {
  console.log("");
  console.log(chalk.bold.cyan(icon + " " + title));
  console.log(chalk.cyan("-".repeat(W - 2)));
}

export function ok(msg: string): void {
  console.log(chalk.green("[OK] ") + chalk.white(msg));
}

export function err(msg: string): void {
  console.log(chalk.red("[!!] ") + chalk.white(msg));
}

export function info(msg: string): void {
  console.log(chalk.blue("[..] ") + chalk.gray(msg));
}

export function warn(msg: string): void {
  console.log(chalk.yellow("[>>] ") + chalk.white(msg));
}

export function agentLine(text: string): void {
  console.log(chalk.dim("     ") + chalk.white(text));
}

export function state(from: string, to: string): void {
  console.log(chalk.dim("     STATE ") + chalk.yellow(from) + chalk.dim(" -> ") + chalk.green(to));
}

export function bus(from: string, to: string, stage: string): void {
  console.log(chalk.dim("     BUS   ") + chalk.blue(from) + chalk.dim(" => ") + chalk.cyan(to) + chalk.dim(" [" + stage + "]"));
}

export function divider(): void {
  console.log(chalk.dim("  " + "·".repeat(W - 4)));
}

export function summary(lines: string[]): void {
  console.log("");
  console.log(chalk.green("+" + "=".repeat(W - 2) + "+"));
  for (const line of lines) {
    const content = " " + line;
    console.log(chalk.green("|") + chalk.white(content.padEnd(W - 2)) + chalk.green("|"));
  }
  console.log(chalk.green("+" + "=".repeat(W - 2) + "+"));
  console.log("");
}

export class Spinner {
  private frames = ["|", "/", "-", "\\"];
  private idx = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  start(): void {
    process.stdout.write(chalk.cyan("  [" + this.frames[0] + "] ") + chalk.white(this.label));
    this.timer = setInterval(() => {
      this.idx = (this.idx + 1) % this.frames.length;
      process.stdout.write("\r" + chalk.cyan("  [" + this.frames[this.idx] + "] ") + chalk.white(this.label));
    }, 120);
  }

  stop(success = true): void {
    if (this.timer) clearInterval(this.timer);
    const icon = success ? chalk.green("[*]") : chalk.yellow("[!]");
    process.stdout.write("\r" + icon + " " + chalk.white(this.label) + " " + (success ? chalk.green("done") : chalk.yellow("warn")) + "\n");
  }

  fail(): void {
    if (this.timer) clearInterval(this.timer);
    process.stdout.write("\r" + chalk.red("[X]") + " " + chalk.white(this.label) + " " + chalk.red("FAILED") + "\n");
  }
}
