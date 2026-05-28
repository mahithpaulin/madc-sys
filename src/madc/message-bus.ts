import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

export type MessageStatus = "PENDING" | "IN_PROGRESS" | "FAILED" | "COMPLETE";

export interface BusMessage {
  task_id: string;
  from_agent: string;
  to_agent: string;
  stage: string;
  payload: Record<string, unknown>;
  status: MessageStatus;
  timestamp: string;
}

export class MessageBus extends EventEmitter {
  private log: BusMessage[] = [];

  publish(
    from_agent: string,
    to_agent: string,
    stage: string,
    payload: Record<string, unknown>,
    status: MessageStatus = "PENDING"
  ): BusMessage {
    const msg: BusMessage = {
      task_id: uuidv4(),
      from_agent,
      to_agent,
      stage,
      payload,
      status,
      timestamp: new Date().toISOString(),
    };
    this.log.push(msg);
    this.emit("message", msg);
    this.emit(`agent:${to_agent}`, msg);
    return msg;
  }

  updateStatus(task_id: string, status: MessageStatus): void {
    const msg = this.log.find((m) => m.task_id === task_id);
    if (msg) {
      msg.status = status;
      this.emit("status_update", { task_id, status });
    }
  }

  getLog(): BusMessage[] {
    return [...this.log];
  }

  getByStage(stage: string): BusMessage[] {
    return this.log.filter((m) => m.stage === stage);
  }

  summary(): string {
    const counts: Record<string, number> = {};
    for (const m of this.log) {
      counts[m.status] = (counts[m.status] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
  }
}
