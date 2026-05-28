import chalk from "chalk";

export function printBanner(): void {
  const lines = [
    "",
    chalk.cyan("╔══════════════════════════════════════════════════════════════════════╗"),
    chalk.cyan("║") + chalk.bold.yellow("  ⚙️  MADC-SYS  ") + chalk.white("Multi-Agent Distributed Coding System") + "        " + chalk.cyan("║"),
    chalk.cyan("║") + chalk.gray("  Enterprise-grade deterministic AI engineering pipeline") + "          " + chalk.cyan("║"),
    chalk.cyan("╚══════════════════════════════════════════════════════════════════════╝"),
    "",
    chalk.gray("  10 specialized agents · Event-driven message bus · State-gated pipeline"),
    "",
  ];
  lines.forEach((l) => console.log(l));
}

export function printSectionHeader(title: string, icon: string = "▶"): void {
  console.log("");
  console.log(
    chalk.bold.cyan(`  ${icon} `) + chalk.bold.white(title)
  );
  console.log(chalk.cyan("  " + "─".repeat(60)));
}

export function printSuccess(msg: string): void {
  console.log(chalk.green("  ✔ ") + chalk.white(msg));
}

export function printError(msg: string): void {
  console.log(chalk.red("  ✖ ") + chalk.white(msg));
}

export function printInfo(msg: string): void {
  console.log(chalk.blue("  ℹ ") + chalk.gray(msg));
}

export function printWarning(msg: string): void {
  console.log(chalk.yellow("  ⚠ ") + chalk.white(msg));
}

export function printAgent(agentName: string, action: string): void {
  console.log(
    chalk.magenta("  [") +
      chalk.bold.magenta(agentName) +
      chalk.magenta("]") +
      chalk.white(" " + action)
  );
}

export function printStateTransition(from: string, to: string): void {
  console.log(
    chalk.dim("  STATE: ") +
      chalk.yellow(from) +
      chalk.dim(" → ") +
      chalk.green(to)
  );
}

export function printMessageBusEvent(from: string, to: string, stage: string): void {
  console.log(
    chalk.dim("  BUS  ") +
      chalk.blue(from) +
      chalk.dim(" ──► ") +
      chalk.cyan(to) +
      chalk.dim("  [" + stage + "]")
  );
}

export function printDivider(): void {
  console.log(chalk.dim("  " + "·".repeat(60)));
}

export function printCompletionBox(lines: string[]): void {
  const width = 68;
  console.log("");
  console.log(chalk.green("╔" + "═".repeat(width) + "╗"));
  for (const line of lines) {
    const padded = line.padEnd(width);
    console.log(chalk.green("║") + " " + chalk.white(padded.slice(0, width - 1)) + chalk.green("║"));
  }
  console.log(chalk.green("╚" + "═".repeat(width) + "╝"));
  console.log("");
}
