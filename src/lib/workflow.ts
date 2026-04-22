import type {
  ApprovalNodeConfig,
  ConditionNodeConfig,
  EndNodeConfig,
  SandboxExecutionResult,
  StartNodeConfig,
  TaskNodeConfig,
  ValidationIssue,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowValidationResult
} from '../types/workflow';

function incomingCount(nodeId: string, edges: WorkflowEdge[]) {
  return edges.filter((edge) => edge.target === nodeId).length;
}

function outgoingCount(nodeId: string, edges: WorkflowEdge[]) {
  return edges.filter((edge) => edge.source === nodeId).length;
}

export function getNodeMetrics(data: WorkflowNodeData) {
  switch (data.kind) {
    case 'start': {
      const config = data.config as StartNodeConfig;
      return [
        { label: 'Trigger', value: config.trigger },
        { label: 'Owner', value: config.ownerTeam }
      ];
    }
    case 'task': {
      const config = data.config as TaskNodeConfig;
      return [
        { label: 'Assignee', value: config.assigneeType },
        { label: 'SLA', value: `${config.dueInHours}h`, tone: 'warning' as const },
        { label: 'Docs', value: `${config.requiredDocuments.filter(Boolean).length}` }
      ];
    }
    case 'approval': {
      const config = data.config as ApprovalNodeConfig;
      return [
        { label: 'Approver', value: config.approverType },
        { label: 'Mode', value: config.approvalMode },
        { label: 'SLA', value: `${config.slaHours}h`, tone: 'warning' as const }
      ];
    }
    case 'condition': {
      const config = data.config as ConditionNodeConfig;
      return [
        { label: 'Field', value: config.field },
        { label: 'True', value: config.trueLabel, tone: 'positive' as const },
        { label: 'False', value: config.falseLabel }
      ];
    }
    case 'end': {
      const config = data.config as EndNodeConfig;
      return [{ label: 'Outcome', value: config.outcome, tone: 'positive' as const }];
    }
  }
}

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowValidationResult {
  const issues: ValidationIssue[] = [];
  const startNodes = nodes.filter((node) => node.data.kind === 'start');
  const endNodes = nodes.filter((node) => node.data.kind === 'end');

  if (startNodes.length !== 1) {
    issues.push({
      severity: 'error',
      message: `Workflow must have exactly one start node. Found ${startNodes.length}.`
    });
  }

  if (endNodes.length === 0) {
    issues.push({
      severity: 'error',
      message: 'Workflow must have at least one end node.'
    });
  }

  for (const node of nodes) {
    const { kind, title, config } = node.data;

    if (!title.trim()) {
      issues.push({
        nodeId: node.id,
        severity: 'error',
        message: 'Node title is required.'
      });
    }

    if (kind === 'start') {
      if (incomingCount(node.id, edges) > 0) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Start node cannot have incoming connections.'
        });
      }
      if (outgoingCount(node.id, edges) === 0) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Start node must connect to the next step.'
        });
      }
      const startConfig = config as StartNodeConfig;
      if (!startConfig.ownerTeam.trim()) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Owner team is empty.'
        });
      }
    }

    if (kind === 'task') {
      const taskConfig = config as TaskNodeConfig;
      if (incomingCount(node.id, edges) === 0) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Task has no incoming edge.'
        });
      }
      if (outgoingCount(node.id, edges) === 0) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Task has no outgoing edge.'
        });
      }
      if (taskConfig.assigneeType === 'specific' && !taskConfig.assigneeId) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Specific task assignee selected without a person.'
        });
      }
      if (taskConfig.dueInHours <= 0) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Task SLA must be greater than zero.'
        });
      }
    }

    if (kind === 'approval') {
      const approvalConfig = config as ApprovalNodeConfig;
      if (incomingCount(node.id, edges) === 0 || outgoingCount(node.id, edges) === 0) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Approval step should have both incoming and outgoing edges.'
        });
      }
      if (approvalConfig.approverType === 'specific' && !approvalConfig.approverId) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Specific approver selected without a person.'
        });
      }
      if (
        approvalConfig.escalationEnabled &&
        (!approvalConfig.escalationAfterHours || approvalConfig.escalationAfterHours <= approvalConfig.slaHours)
      ) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Escalation should happen after the approval SLA.'
        });
      }
    }

    if (kind === 'condition') {
      const conditionConfig = config as ConditionNodeConfig;
      const outgoing = edges.filter((edge) => edge.source === node.id);
      if (!conditionConfig.value.trim()) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'Condition comparison value is required.'
        });
      }
      if (outgoing.length < 2) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'Condition node should branch to at least two outcomes.'
        });
      }
    }

    if (kind === 'end') {
      if (outgoingCount(node.id, edges) > 0) {
        issues.push({
          nodeId: node.id,
          severity: 'error',
          message: 'End node cannot have outgoing connections.'
        });
      }
      if (incomingCount(node.id, edges) === 0) {
        issues.push({
          nodeId: node.id,
          severity: 'warning',
          message: 'End node is not reachable.'
        });
      }
    }
  }

  return {
    isValid: !issues.some((issue) => issue.severity === 'error'),
    issues
  };
}

export function decorateNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const validation = validateWorkflow(nodes, edges);
  return nodes.map((node) => {
    const nodeIssues = validation.issues.filter((issue) => issue.nodeId === node.id);
    const hasError = nodeIssues.some((issue) => issue.severity === 'error');
    const hasWarning = nodeIssues.some((issue) => issue.severity === 'warning');

    return {
      ...node,
      data: {
        ...node.data,
        metrics: getNodeMetrics(node.data),
        status: hasError ? 'error' : hasWarning ? 'warning' : 'ready',
        validationErrors: nodeIssues.map((issue) => issue.message)
      }
    };
  });
}

export function serializeWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      nodes,
      edges
    },
    null,
    2
  );
}

export function parseWorkflowJson(raw: string): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const parsed = JSON.parse(raw) as { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  return {
    nodes: parsed.nodes,
    edges: parsed.edges
  };
}

export function buildSandboxExecution(nodes: WorkflowNode[], edges: WorkflowEdge[]): SandboxExecutionResult {
  const validation = validateWorkflow(nodes, edges);

  if (!validation.isValid) {
    return {
      success: false,
      durationMs: 0,
      summary: 'Validation failed. Fix workflow errors before running the sandbox.',
      steps: validation.issues.map((issue, index) => ({
        nodeId: issue.nodeId ?? `issue-${index}`,
        title: issue.nodeId ? `Node ${issue.nodeId}` : 'Workflow',
        outcome: 'blocked',
        detail: issue.message
      }))
    };
  }

  const startNode = nodes.find((node) => node.data.kind === 'start');
  if (!startNode) {
    return {
      success: false,
      durationMs: 0,
      summary: 'No start node available for execution.',
      steps: []
    };
  }

  const orderedSteps: SandboxExecutionResult['steps'] = [];
  const visited = new Set<string>();
  let currentId: string | undefined = startNode.id;
  let guard = 0;

  while (currentId && guard < 25) {
    guard += 1;
    const currentNode = nodes.find((node) => node.id === currentId);
    if (!currentNode || visited.has(currentId)) {
      break;
    }

    visited.add(currentId);
    if (currentNode.data.kind === 'condition') {
      const trueEdge =
        edges.find((edge) => edge.source === currentId && edge.sourceHandle === 'yes') ??
        edges.find((edge) => edge.source === currentId);
      orderedSteps.push({
        nodeId: currentId,
        title: currentNode.data.title,
        outcome: 'branch-true',
        detail: 'Condition evaluated true in sandbox simulation.'
      });
      currentId = trueEdge?.target;
      continue;
    }

    orderedSteps.push({
      nodeId: currentId,
      title: currentNode.data.title,
      outcome: 'passed',
      detail:
        currentNode.data.kind === 'approval'
          ? 'Approval granted in mock sandbox.'
          : currentNode.data.kind === 'end'
            ? 'Workflow completed.'
            : 'Step completed successfully.'
    });

    const nextEdge = edges.find((edge) => edge.source === currentId);
    currentId = nextEdge?.target;
  }

  return {
    success: true,
    durationMs: orderedSteps.length * 350,
    summary: `Sandbox completed ${orderedSteps.length} steps successfully.`,
    steps: orderedSteps
  };
}
