export interface DagNode {
  id: string;
  label: string;
  agent: string;
  status: "pending" | "running" | "done" | "failed";
  output?: string;
}

export interface DagEdge {
  from: string;
  to: string;
}

export class TaskGraph {
  nodes: DagNode[] = [];
  edges: DagEdge[] = [];

  addNode(id: string, label: string, agent: string): void {
    this.nodes.push({ id, label, agent, status: "pending" });
  }

  addEdge(from: string, to: string): void {
    if (!this.nodes.find((n) => n.id === from)) {
      throw new Error(`DAG: source node '${from}' not found`);
    }
    if (!this.nodes.find((n) => n.id === to)) {
      throw new Error(`DAG: target node '${to}' not found`);
    }
    this.edges.push({ from, to });
  }

  setStatus(id: string, status: DagNode["status"], output?: string): void {
    const node = this.nodes.find((n) => n.id === id);
    if (node) {
      node.status = status;
      if (output) node.output = output;
    }
  }

  getDependencies(id: string): DagNode[] {
    const deps = this.edges
      .filter((e) => e.to === id)
      .map((e) => this.nodes.find((n) => n.id === e.from))
      .filter(Boolean) as DagNode[];
    return deps;
  }

  isReady(id: string): boolean {
    return this.getDependencies(id).every((n) => n.status === "done");
  }

  getExecutionOrder(): DagNode[] {
    const sorted: DagNode[] = [];
    const visited = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      this.edges
        .filter((e) => e.from === id)
        .forEach((e) => visit(e.to));
      const node = this.nodes.find((n) => n.id === id);
      if (node) sorted.unshift(node);
    };

    this.nodes
      .filter((n) => this.getDependencies(n.id).length === 0)
      .forEach((n) => visit(n.id));

    return sorted;
  }

  toJSON(): object {
    return {
      nodes: this.nodes.map((n) => n.id),
      edges: this.edges.map((e) => [e.from, e.to]),
    };
  }
}

export function buildProjectDAG(projectName: string): TaskGraph {
  const dag = new TaskGraph();
  dag.addNode("design_api", `Design API contracts for ${projectName}`, "SystemDesignAgent");
  dag.addNode("build_backend", `Build backend services for ${projectName}`, "CodeGenerationAgent");
  dag.addNode("build_frontend", `Build frontend/CLI for ${projectName}`, "CodeGenerationAgent");
  dag.addNode("write_tests", `Write test suite for ${projectName}`, "TestingAgent");
  dag.addNode("security_scan", `Security audit for ${projectName}`, "SecurityAgent");
  dag.addNode("optimize", `Optimize performance for ${projectName}`, "OptimizationAgent");
  dag.addNode("integrate", `Integrate all modules for ${projectName}`, "IntegrationAgent");
  dag.addNode("deploy", `Deploy ${projectName} to production`, "DeploymentAgent");

  dag.addEdge("design_api", "build_backend");
  dag.addEdge("design_api", "build_frontend");
  dag.addEdge("build_backend", "write_tests");
  dag.addEdge("build_frontend", "write_tests");
  dag.addEdge("write_tests", "security_scan");
  dag.addEdge("security_scan", "optimize");
  dag.addEdge("optimize", "integrate");
  dag.addEdge("integrate", "deploy");

  return dag;
}
