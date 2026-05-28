export interface DagNode {
  id: string;
  label: string;
  agent: string;
  status: "pending" | "running" | "done" | "failed";
  output?: string;
}

export class TaskGraph {
  nodes: DagNode[] = [];
  edges: { from: string; to: string }[] = [];

  addNode(id: string, label: string, agent: string): void {
    this.nodes.push({ id, label, agent, status: "pending" });
  }

  addEdge(from: string, to: string): void {
    this.edges.push({ from, to });
  }

  setStatus(id: string, status: DagNode["status"], output?: string): void {
    const n = this.nodes.find((n) => n.id === id);
    if (n) { n.status = status; if (output) n.output = output; }
  }

  toJSON(): object {
    return {
      nodes: this.nodes.map((n) => n.id),
      edges: this.edges.map((e) => [e.from, e.to]),
    };
  }
}

export function buildProjectDAG(name: string): TaskGraph {
  const dag = new TaskGraph();
  dag.addNode("design_api", `Design API for ${name}`, "SystemDesignAgent");
  dag.addNode("build_backend", `Build backend for ${name}`, "CodeGenerationAgent");
  dag.addNode("write_tests", `Write tests for ${name}`, "TestingAgent");
  dag.addNode("security_scan", `Security audit for ${name}`, "SecurityAgent");
  dag.addNode("integrate", `Integrate modules for ${name}`, "IntegrationAgent");
  dag.addNode("deploy", `Deploy ${name}`, "DeploymentAgent");
  dag.addEdge("design_api", "build_backend");
  dag.addEdge("build_backend", "write_tests");
  dag.addEdge("write_tests", "security_scan");
  dag.addEdge("security_scan", "integrate");
  dag.addEdge("integrate", "deploy");
  return dag;
}
