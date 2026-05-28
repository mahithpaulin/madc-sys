export type SystemState =
  | "INIT" | "PLANNING" | "CLARIFICATION_BLOCK" | "DESIGN"
  | "IMPLEMENTATION" | "REVIEW" | "SECURITY_CHECK" | "OPTIMIZATION"
  | "INTEGRATION" | "TESTING" | "DEPLOYMENT" | "COMPLETE"
  | "FAILED" | "ROLLBACK";

const TRANSITIONS: [SystemState, SystemState][] = [
  ["INIT", "PLANNING"],
  ["PLANNING", "CLARIFICATION_BLOCK"],
  ["CLARIFICATION_BLOCK", "DESIGN"],
  ["DESIGN", "IMPLEMENTATION"],
  ["IMPLEMENTATION", "REVIEW"],
  ["REVIEW", "SECURITY_CHECK"],
  ["SECURITY_CHECK", "OPTIMIZATION"],
  ["OPTIMIZATION", "INTEGRATION"],
  ["INTEGRATION", "TESTING"],
  ["TESTING", "DEPLOYMENT"],
  ["DEPLOYMENT", "COMPLETE"],
  ["PLANNING", "FAILED"],
  ["CLARIFICATION_BLOCK", "FAILED"],
  ["REVIEW", "ROLLBACK"],
  ["SECURITY_CHECK", "ROLLBACK"],
  ["ROLLBACK", "CLARIFICATION_BLOCK"],
];

export class StateMachine {
  private current: SystemState = "INIT";
  private history: { state: SystemState; at: string }[] = [{ state: "INIT", at: new Date().toISOString() }];

  get state(): SystemState { return this.current; }

  transition(to: SystemState): void {
    const valid = TRANSITIONS.some(([f, t]) => f === this.current && t === to);
    if (!valid) throw new Error(`INVALID TRANSITION: ${this.current} -> ${to}`);
    this.current = to;
    this.history.push({ state: to, at: new Date().toISOString() });
  }

  getHistory(): { state: SystemState; at: string }[] { return [...this.history]; }
  isTerminal(): boolean { return this.current === "COMPLETE" || this.current === "FAILED"; }
}
