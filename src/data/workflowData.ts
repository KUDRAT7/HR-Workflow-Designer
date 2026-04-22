import type {
  ApprovalNodeConfig,
  ApproverOption,
  ConditionNodeConfig,
  EndNodeConfig,
  NewNodeRequest,
  StartNodeConfig,
  TaskNodeConfig,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowNodeKind,
  WorkflowTemplate
} from '../types/workflow';

const defaultStartConfig: StartNodeConfig = {
  trigger: 'new-employee',
  ownerTeam: 'HR Operations',
  kickoffNote: 'Trigger onboarding once the offer is accepted.'
};

const defaultTaskConfig: TaskNodeConfig = {
  taskType: 'collect-documents',
  assigneeType: 'hr',
  dueInHours: 24,
  instructions: 'Collect employee identity and payroll documents.',
  requiredDocuments: ['Government ID', 'Address proof']
};

const defaultApprovalConfig: ApprovalNodeConfig = {
  approverType: 'manager',
  approvalMode: 'any',
  slaHours: 12,
  escalationEnabled: true,
  escalationAfterHours: 24
};

const defaultConditionConfig: ConditionNodeConfig = {
  field: 'documents-complete',
  operator: 'equals',
  value: 'true',
  trueLabel: 'Ready',
  falseLabel: 'Needs Review'
};

const defaultEndConfig: EndNodeConfig = {
  outcome: 'completed',
  summary: 'Workflow finished successfully.'
};

function cloneConfig(kind: WorkflowNodeKind) {
  if (kind === 'start') {
    return { ...defaultStartConfig };
  }

  if (kind === 'task') {
    return {
      ...defaultTaskConfig,
      requiredDocuments: [...defaultTaskConfig.requiredDocuments]
    };
  }

  if (kind === 'approval') {
    return { ...defaultApprovalConfig };
  }

  if (kind === 'condition') {
    return { ...defaultConditionConfig };
  }

  return { ...defaultEndConfig };
}

export const approverOptions: ApproverOption[] = [
  { id: 'ap-1', name: 'Mira Nair', role: 'HR Manager' },
  { id: 'ap-2', name: 'Rahul Sharma', role: 'Department Manager' },
  { id: 'ap-3', name: 'Sara Kim', role: 'People Ops Lead' }
];

const metricMap: Record<WorkflowNodeKind, (data: WorkflowNodeData) => WorkflowNodeData['metrics']> = {
  start: () => [
    { label: 'Trigger', value: 'Auto', tone: 'positive' },
    { label: 'Owner', value: 'HR' }
  ],
  task: (data) => {
    const config = data.config as TaskNodeConfig;
    return [
      { label: 'Assignee', value: config.assigneeType },
      { label: 'SLA', value: `${config.dueInHours}h`, tone: 'warning' },
      { label: 'Docs', value: `${config.requiredDocuments.length}` }
    ];
  },
  approval: (data) => {
    const config = data.config as ApprovalNodeConfig;
    return [
      { label: 'Mode', value: config.approvalMode },
      { label: 'SLA', value: `${config.slaHours}h`, tone: 'warning' },
      { label: 'Esc', value: config.escalationEnabled ? 'On' : 'Off' }
    ];
  },
  condition: (data) => {
    const config = data.config as ConditionNodeConfig;
    return [
      { label: 'Field', value: config.field },
      { label: 'True', value: config.trueLabel, tone: 'positive' },
      { label: 'False', value: config.falseLabel }
    ];
  },
  end: (data) => {
    const config = data.config as EndNodeConfig;
    return [{ label: 'Outcome', value: config.outcome, tone: 'positive' }];
  }
};

export function createNodeData(kind: WorkflowNodeKind, index: number): WorkflowNodeData {
  const base: WorkflowNodeData = {
    kind,
    title:
      kind === 'start'
        ? 'Start'
        : kind === 'task'
          ? `Task ${index}`
          : kind === 'approval'
            ? `Approval ${index}`
            : kind === 'condition'
              ? `Condition ${index}`
              : `End ${index}`,
    subtitle:
      kind === 'start'
        ? 'Workflow entry point'
        : kind === 'task'
          ? 'Human task for HR ops'
          : kind === 'approval'
            ? 'Decision gate'
            : kind === 'condition'
              ? 'Branching logic'
              : 'Workflow outcome',
    config:
      cloneConfig(kind),
    status: 'draft',
    version: 1,
    metrics: [],
    validationErrors: []
  };

  return {
    ...base,
    metrics: metricMap[kind](base)
  };
}

export function createWorkflowNode(request: NewNodeRequest, index: number): WorkflowNode {
  return {
    id: `node-${request.kind}-${index}`,
    type: request.kind,
    position: request.position,
    data: createNodeData(request.kind, index)
  };
}

export const nodePalette = [
  {
    kind: 'start' as const,
    name: 'Start',
    description: 'Begin a workflow when onboarding or another HR event starts.'
  },
  {
    kind: 'task' as const,
    name: 'Task',
    description: 'Assign a human step like document collection or orientation.'
  },
  {
    kind: 'approval' as const,
    name: 'Approval',
    description: 'Route a manager or HR approval step with escalation controls.'
  },
  {
    kind: 'condition' as const,
    name: 'Condition',
    description: 'Branch the flow based on a business rule or validation check.'
  },
  {
    kind: 'end' as const,
    name: 'End',
    description: 'Mark the workflow as completed, rejected, or sent for rework.'
  }
];

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'A starter workflow covering document collection, review, and completion.',
    category: 'Onboarding',
    nodes: [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 80, y: 240 },
        data: {
          ...createNodeData('start', 1),
          title: 'New Hire Trigger'
        }
      },
      {
        id: 'task-1',
        type: 'task',
        position: { x: 320, y: 220 },
        data: {
          ...createNodeData('task', 1),
          title: 'Collect Documents'
        }
      },
      {
        id: 'condition-1',
        type: 'condition',
        position: { x: 600, y: 220 },
        data: {
          ...createNodeData('condition', 1),
          title: 'Documents Complete'
        }
      },
      {
        id: 'approval-1',
        type: 'approval',
        position: { x: 900, y: 110 },
        data: {
          ...createNodeData('approval', 1),
          title: 'Manager Approval'
        }
      },
      {
        id: 'task-2',
        type: 'task',
        position: { x: 900, y: 330 },
        data: {
          ...createNodeData('task', 2),
          title: 'Fix Missing Items'
        }
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 1180, y: 110 },
        data: {
          ...createNodeData('end', 1),
          title: 'Onboarding Complete'
        }
      }
    ],
    edges: [
      { id: 'e-start-task', source: 'start-1', target: 'task-1' },
      { id: 'e-task-condition', source: 'task-1', target: 'condition-1' },
      {
        id: 'e-condition-yes',
        source: 'condition-1',
        sourceHandle: 'yes',
        target: 'approval-1',
        label: 'Ready',
        data: { branch: 'true' }
      },
      {
        id: 'e-condition-no',
        source: 'condition-1',
        sourceHandle: 'no',
        target: 'task-2',
        label: 'Needs Review',
        data: { branch: 'false' }
      },
      { id: 'e-approval-end', source: 'approval-1', target: 'end-1' },
      { id: 'e-rework-back', source: 'task-2', target: 'task-1' }
    ]
  },
  {
    id: 'leave-approval',
    name: 'Leave Approval',
    description: 'Compact leave request workflow with approval and rejection paths.',
    category: 'Leave',
    nodes: [
      {
        id: 'leave-start',
        type: 'start',
        position: { x: 60, y: 180 },
        data: {
          ...createNodeData('start', 1),
          title: 'Leave Request Raised'
        }
      },
      {
        id: 'leave-approval',
        type: 'approval',
        position: { x: 360, y: 180 },
        data: {
          ...createNodeData('approval', 1),
          title: 'Manager Decision'
        }
      },
      {
        id: 'leave-end-1',
        type: 'end',
        position: { x: 700, y: 90 },
        data: {
          ...createNodeData('end', 1),
          title: 'Approved'
        }
      },
      {
        id: 'leave-end-2',
        type: 'end',
        position: { x: 700, y: 270 },
        data: {
          ...createNodeData('end', 2),
          title: 'Rejected',
          config: {
            outcome: 'rejected',
            summary: 'Leave request rejected.'
          },
          metrics: [{ label: 'Outcome', value: 'rejected' }]
        }
      }
    ],
    edges: [
      { id: 'leave-edge-1', source: 'leave-start', target: 'leave-approval' },
      { id: 'leave-edge-2', source: 'leave-approval', target: 'leave-end-1' },
      {
        id: 'leave-edge-3',
        source: 'leave-approval',
        sourceHandle: 'secondary',
        target: 'leave-end-2',
        label: 'Reject'
      }
    ]
  }
];

export function cloneTemplate(templateId: string): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const template = workflowTemplates.find((item) => item.id === templateId) ?? workflowTemplates[0];
  return {
    nodes: template.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        config:
          node.data.kind === 'task'
            ? {
                ...(node.data.config as TaskNodeConfig),
                requiredDocuments: [...(node.data.config as TaskNodeConfig).requiredDocuments]
              }
            : { ...node.data.config },
        metrics: [...node.data.metrics],
        validationErrors: [...node.data.validationErrors]
      }
    })),
    edges: template.edges.map((edge) => ({ ...edge, data: edge.data ? { ...edge.data } : undefined }))
  };
}
