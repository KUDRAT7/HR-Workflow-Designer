import { approverOptions, cloneTemplate, workflowTemplates } from '../data/workflowData';
import { buildSandboxExecution } from '../lib/workflow';
import type {
  ApproverOption,
  SandboxExecutionResult,
  WorkflowEdge,
  WorkflowNode,
  WorkflowTemplate
} from '../types/workflow';

const delay = <T,>(value: T, duration = 550) =>
  new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(value), duration);
  });

export const workflowApi = {
  async fetchTemplates(): Promise<WorkflowTemplate[]> {
    return delay(workflowTemplates, 400);
  },

  async fetchApprovers(): Promise<ApproverOption[]> {
    return delay(approverOptions, 350);
  },

  async loadTemplate(templateId: string): Promise<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] }> {
    return delay(cloneTemplate(templateId), 650);
  },

  async saveWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
    return delay(
      {
        workflowId: `wf-${Date.now()}`,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        savedAt: new Date().toISOString()
      },
      700
    );
  },

  async runSandbox(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<SandboxExecutionResult> {
    return delay(buildSandboxExecution(nodes, edges), 850);
  }
};
