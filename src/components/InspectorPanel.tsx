import type {
  ApprovalNodeConfig,
  ApproverOption,
  ConditionNodeConfig,
  EndNodeConfig,
  StartNodeConfig,
  TaskNodeConfig,
  WorkflowNode
} from '../types/workflow';

interface InspectorPanelProps {
  selectedNode: WorkflowNode | null;
  approvers: ApproverOption[];
  onUpdateNode: (nodeId: string, updater: (node: WorkflowNode) => WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

export function InspectorPanel({
  selectedNode,
  approvers,
  onUpdateNode,
  onDeleteNode
}: InspectorPanelProps) {
  if (!selectedNode) {
    return (
      <section className="panel inspector">
        <div className="panel__section">
          <div className="panel__eyebrow">Inspector</div>
          <h2>Select a node</h2>
          <p>Pick any node on the canvas to edit its form fields, version, and validation status.</p>
        </div>
      </section>
    );
  }

  const updateTitle = (title: string) => {
    onUpdateNode(selectedNode.id, (node) => ({
      ...node,
      data: {
        ...node.data,
        title,
        version: node.data.version + 1
      }
    }));
  };

  const updateSubtitle = (subtitle: string) => {
    onUpdateNode(selectedNode.id, (node) => ({
      ...node,
      data: {
        ...node.data,
        subtitle,
        version: node.data.version + 1
      }
    }));
  };

  const updateConfig = (config: WorkflowNode['data']['config']) => {
    onUpdateNode(selectedNode.id, (node) => ({
      ...node,
      data: {
        ...node.data,
        config,
        version: node.data.version + 1
      }
    }));
  };

  const renderConfigForm = () => {
    switch (selectedNode.data.kind) {
      case 'start': {
        const config = selectedNode.data.config as StartNodeConfig;
        return (
          <>
            <label className="field">
              <span>Trigger</span>
              <select
                value={config.trigger}
                onChange={(event) => updateConfig({ ...config, trigger: event.target.value as StartNodeConfig['trigger'] })}
              >
                <option value="manual">Manual</option>
                <option value="new-employee">New employee</option>
                <option value="document-request">Document request</option>
              </select>
            </label>
            <label className="field">
              <span>Owner team</span>
              <input value={config.ownerTeam} onChange={(event) => updateConfig({ ...config, ownerTeam: event.target.value })} />
            </label>
            <label className="field">
              <span>Kickoff note</span>
              <textarea
                rows={3}
                value={config.kickoffNote}
                onChange={(event) => updateConfig({ ...config, kickoffNote: event.target.value })}
              />
            </label>
          </>
        );
      }
      case 'task': {
        const config = selectedNode.data.config as TaskNodeConfig;
        return (
          <>
            <label className="field">
              <span>Task type</span>
              <select
                value={config.taskType}
                onChange={(event) => updateConfig({ ...config, taskType: event.target.value as TaskNodeConfig['taskType'] })}
              >
                <option value="collect-documents">Collect documents</option>
                <option value="orientation">Orientation</option>
                <option value="verify-information">Verify information</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="field">
              <span>Assignee type</span>
              <select
                value={config.assigneeType}
                onChange={(event) =>
                  updateConfig({ ...config, assigneeType: event.target.value as TaskNodeConfig['assigneeType'] })
                }
              >
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="specific">Specific user</option>
              </select>
            </label>
            {config.assigneeType === 'specific' ? (
              <label className="field">
                <span>Specific user</span>
                <select
                  value={config.assigneeId ?? ''}
                  onChange={(event) => updateConfig({ ...config, assigneeId: event.target.value })}
                >
                  <option value="">Select person</option>
                  {approvers.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span>SLA in hours</span>
              <input
                type="number"
                min={1}
                value={config.dueInHours}
                onChange={(event) => updateConfig({ ...config, dueInHours: Number(event.target.value) })}
              />
            </label>
            <label className="field">
              <span>Required documents</span>
              <textarea
                rows={4}
                value={config.requiredDocuments.join('\n')}
                onChange={(event) =>
                  updateConfig({
                    ...config,
                    requiredDocuments: event.target.value
                      .split('\n')
                      .map((item) => item.trim())
                      .filter(Boolean)
                  })
                }
              />
            </label>
            <label className="field">
              <span>Instructions</span>
              <textarea
                rows={4}
                value={config.instructions}
                onChange={(event) => updateConfig({ ...config, instructions: event.target.value })}
              />
            </label>
          </>
        );
      }
      case 'approval': {
        const config = selectedNode.data.config as ApprovalNodeConfig;
        return (
          <>
            <label className="field">
              <span>Approver type</span>
              <select
                value={config.approverType}
                onChange={(event) =>
                  updateConfig({ ...config, approverType: event.target.value as ApprovalNodeConfig['approverType'] })
                }
              >
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
                <option value="specific">Specific approver</option>
              </select>
            </label>
            {config.approverType === 'specific' ? (
              <label className="field">
                <span>Specific approver</span>
                <select
                  value={config.approverId ?? ''}
                  onChange={(event) => updateConfig({ ...config, approverId: event.target.value })}
                >
                  <option value="">Select approver</option>
                  {approvers.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span>Approval mode</span>
              <select
                value={config.approvalMode}
                onChange={(event) =>
                  updateConfig({ ...config, approvalMode: event.target.value as ApprovalNodeConfig['approvalMode'] })
                }
              >
                <option value="any">Any approver</option>
                <option value="all">All approvers</option>
              </select>
            </label>
            <label className="field">
              <span>SLA in hours</span>
              <input
                type="number"
                min={1}
                value={config.slaHours}
                onChange={(event) => updateConfig({ ...config, slaHours: Number(event.target.value) })}
              />
            </label>
            <label className="field field--toggle">
              <input
                type="checkbox"
                checked={config.escalationEnabled}
                onChange={(event) => updateConfig({ ...config, escalationEnabled: event.target.checked })}
              />
              <span>Enable escalation</span>
            </label>
            {config.escalationEnabled ? (
              <label className="field">
                <span>Escalate after hours</span>
                <input
                  type="number"
                  min={1}
                  value={config.escalationAfterHours ?? ''}
                  onChange={(event) =>
                    updateConfig({ ...config, escalationAfterHours: Number(event.target.value) || undefined })
                  }
                />
              </label>
            ) : null}
          </>
        );
      }
      case 'condition': {
        const config = selectedNode.data.config as ConditionNodeConfig;
        return (
          <>
            <label className="field">
              <span>Field</span>
              <select
                value={config.field}
                onChange={(event) =>
                  updateConfig({ ...config, field: event.target.value as ConditionNodeConfig['field'] })
                }
              >
                <option value="documents-complete">Documents complete</option>
                <option value="background-check">Background check</option>
                <option value="manager-approved">Manager approved</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="field">
              <span>Operator</span>
              <select
                value={config.operator}
                onChange={(event) =>
                  updateConfig({ ...config, operator: event.target.value as ConditionNodeConfig['operator'] })
                }
              >
                <option value="equals">Equals</option>
                <option value="not-equals">Not equals</option>
                <option value="contains">Contains</option>
              </select>
            </label>
            <label className="field">
              <span>Compare value</span>
              <input value={config.value} onChange={(event) => updateConfig({ ...config, value: event.target.value })} />
            </label>
            <label className="field">
              <span>True branch label</span>
              <input
                value={config.trueLabel}
                onChange={(event) => updateConfig({ ...config, trueLabel: event.target.value })}
              />
            </label>
            <label className="field">
              <span>False branch label</span>
              <input
                value={config.falseLabel}
                onChange={(event) => updateConfig({ ...config, falseLabel: event.target.value })}
              />
            </label>
          </>
        );
      }
      case 'end': {
        const config = selectedNode.data.config as EndNodeConfig;
        return (
          <>
            <label className="field">
              <span>Outcome</span>
              <select
                value={config.outcome}
                onChange={(event) => updateConfig({ ...config, outcome: event.target.value as EndNodeConfig['outcome'] })}
              >
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="needs-rework">Needs rework</option>
              </select>
            </label>
            <label className="field">
              <span>Summary</span>
              <textarea
                rows={4}
                value={config.summary}
                onChange={(event) => updateConfig({ ...config, summary: event.target.value })}
              />
            </label>
          </>
        );
      }
    }
  };

  return (
    <section className="panel inspector">
      <div className="panel__section">
        <div className="panel__eyebrow">Inspector</div>
        <h2>{selectedNode.data.title}</h2>
        <p>Node type: {selectedNode.data.kind}. Version {selectedNode.data.version}.</p>
      </div>

      <div className="panel__section">
        <label className="field">
          <span>Title</span>
          <input value={selectedNode.data.title} onChange={(event) => updateTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Subtitle</span>
          <input value={selectedNode.data.subtitle} onChange={(event) => updateSubtitle(event.target.value)} />
        </label>
        {renderConfigForm()}
      </div>

      <div className="panel__section">
        <div className="panel__eyebrow">Validation</div>
        {selectedNode.data.validationErrors.length ? (
          <div className="issue-list">
            {selectedNode.data.validationErrors.map((issue) => (
              <div key={issue} className="issue-item issue-item--error">
                {issue}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No node-level issues. This step is ready.</div>
        )}
      </div>

      <div className="panel__section">
        <button className="button button--danger" onClick={() => onDeleteNode(selectedNode.id)}>
          Delete Node
        </button>
      </div>
    </section>
  );
}
