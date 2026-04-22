import type { Edge, Node, XYPosition } from '@xyflow/react';

export type WorkflowNodeKind = 'start' | 'task' | 'approval' | 'condition' | 'end';
export type WorkflowNodeStatus = 'draft' | 'ready' | 'warning' | 'error';

export interface StartNodeConfig {
  trigger: 'manual' | 'new-employee' | 'document-request';
  ownerTeam: string;
  kickoffNote: string;
}

export interface TaskNodeConfig {
  taskType: 'collect-documents' | 'orientation' | 'verify-information' | 'custom';
  assigneeType: 'hr' | 'manager' | 'employee' | 'specific';
  assigneeId?: string;
  dueInHours: number;
  instructions: string;
  requiredDocuments: string[];
}

export interface ApprovalNodeConfig {
  approverType: 'manager' | 'hr' | 'specific';
  approverId?: string;
  approvalMode: 'any' | 'all';
  slaHours: number;
  escalationEnabled: boolean;
  escalationAfterHours?: number;
}

export interface ConditionNodeConfig {
  field: 'documents-complete' | 'background-check' | 'manager-approved' | 'custom';
  operator: 'equals' | 'not-equals' | 'contains';
  value: string;
  trueLabel: string;
  falseLabel: string;
}

export interface EndNodeConfig {
  outcome: 'completed' | 'rejected' | 'needs-rework';
  summary: string;
}

export type WorkflowNodeConfig =
  | StartNodeConfig
  | TaskNodeConfig
  | ApprovalNodeConfig
  | ConditionNodeConfig
  | EndNodeConfig;

export interface WorkflowNodeMetric {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

export interface WorkflowNodeData {
  kind: WorkflowNodeKind;
  title: string;
  subtitle: string;
  config: WorkflowNodeConfig;
  status: WorkflowNodeStatus;
  version: number;
  metrics: WorkflowNodeMetric[];
  validationErrors: string[];
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge<{ branch?: string }>;

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ApproverOption {
  id: string;
  name: string;
  role: string;
}

export interface ValidationIssue {
  nodeId?: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface SandboxExecutionStep {
  nodeId: string;
  title: string;
  outcome: 'passed' | 'blocked' | 'branch-true' | 'branch-false';
  detail: string;
}

export interface SandboxExecutionResult {
  success: boolean;
  durationMs: number;
  summary: string;
  steps: SandboxExecutionStep[];
}

export interface NewNodeRequest {
  kind: WorkflowNodeKind;
  position: XYPosition;
}
