export type SystemState =
  | "INIT"
  | "PLANNING"
  | "CLARIFICATION_BLOCK"
  | "DESIGN"
  | "IMPLEMENTATION"
  | "REVIEW"
  | "SECURITY_CHECK"
  | "OPTIMIZATION"
  | "INTEGRATION"
  | "TESTING"
  | "DEPLOYMENT"
  | "COMPLETE"
  | "FAILED"
  | "ROLLBACK";

interface Transition {
  from: SystemState;
  to: SystemState;
  guard?: () => boolean;
}

const TRANSITIONS: Transition[] = [
  { from: "INIT", to: "PLANNING" },
  { from: "PLANNING", to: "CLARIFICATION_BLOCK" },
  { from: "CLARIFICATION_BLOCK", to: "DESIGN" },
  { from: "DESIGN", to: "IMPLEMENTATION" },
  { from: "IMPLEMENTATION", to: "REVIEW" },
  { from: "REVIEW", to: "SECURITY_CHECK" },
  { from: "SECURITY_CHECK", to: "OPTIMIZATION" },
  { from: "OPTIMIZATION", to: "INTEGRATION" },
  { from: "INTEGRATION", to: "TESTING" },
  { from: "TESTING", to: "DEPLOYMENT" },
  { from: "DEPLOYMENT", to: "COMPLETE" },
  { from: "PLANNING", to: "FAILED" },
  { from: "CLARIFICATION_BLOCK", to: "FAILED" },
  { from: "DESIGN", to: "FAILED" },
  { from: "IMPLEMENTATION", to: "FAILED" },
  { from: "REVIEW", to: "ROLLBACK" },
  { from: "SECURITY_CHECK", to: "ROLLBACK" },
  { from: "ROLLBACK", to: "CLARIFICATION_BLOCK" },
];

export class StateMachine {
  private current: SystemState = "INIT";
  private history: { state: SystemState; at: string }[] = [];

  constructor() {
    this.record("INIT");
  }

  private record(state: SystemState) {
    this.history.push({ state, at: new Date().toISOString() });
  }

  get state(): SystemState {
    return this.current;
  }

  transition(to: SystemState): void {
    const valid = TRANSITIONS.find(
      (t) => t.from === this.current && t.to === to
    );
    if (!valid) {
      throw new Error(
        `INVALID TRANSITION: ${this.current} → ${to}. Execution halted.`
      );
    }
    if (valid.guard && !valid.guard()) {
      throw new Error(
        `GUARD FAILED: Transition ${this.current} → ${to} blocked.`
      );
    }
    this.current = to;
    this.record(to);
  }

  getHistory(): { state: SystemState; at: string }[] {
    return [...this.history];
  }

  isTerminal(): boolean {
    return this.current === "COMPLETE" || this.current === "FAILED";
  }
}
