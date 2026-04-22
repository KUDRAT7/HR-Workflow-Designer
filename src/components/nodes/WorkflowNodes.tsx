import type { ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import clsx from 'clsx';
import type { WorkflowNodeData } from '../../types/workflow';

function NodeCard({
  data,
  accent,
  icon,
  showLeftHandle = true,
  showRightHandle = true,
  extraHandles
}: {
  data: WorkflowNodeData;
  accent: string;
  icon: string;
  showLeftHandle?: boolean;
  showRightHandle?: boolean;
  extraHandles?: ReactNode;
}) {
  return (
    <div className={clsx('workflow-node', `workflow-node--${accent}`, `is-${data.status}`)}>
      {showLeftHandle ? <Handle type="target" position={Position.Left} className="workflow-node__handle" /> : null}
      {showRightHandle ? (
        <Handle type="source" position={Position.Right} className="workflow-node__handle workflow-node__handle--out" />
      ) : null}
      {extraHandles}
      <div className="workflow-node__top">
        <span className="workflow-node__icon">{icon}</span>
        <div>
          <div className="workflow-node__title">{data.title}</div>
          <div className="workflow-node__subtitle">{data.subtitle}</div>
        </div>
      </div>
      <div className="workflow-node__metrics">
        {data.metrics.map((metric) => (
          <span
            key={`${metric.label}-${metric.value}`}
            className={clsx('workflow-node__metric', metric.tone && `is-${metric.tone}`)}
          >
            <strong>{metric.value}</strong>
            <em>{metric.label}</em>
          </span>
        ))}
      </div>
      {data.validationErrors.length ? (
        <div className="workflow-node__issues">
          {data.validationErrors.slice(0, 2).map((issue) => (
            <div key={issue}>{issue}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StartNode({ data }: NodeProps) {
  return <NodeCard data={data as WorkflowNodeData} accent="start" icon="S" showLeftHandle={false} />;
}

function TaskNode({ data }: NodeProps) {
  return <NodeCard data={data as WorkflowNodeData} accent="task" icon="T" />;
}

function ApprovalNode({ data }: NodeProps) {
  return (
    <NodeCard
      data={data as WorkflowNodeData}
      accent="approval"
      icon="A"
      extraHandles={
        <Handle
          id="secondary"
          type="source"
          position={Position.Bottom}
          className="workflow-node__handle workflow-node__handle--secondary"
        />
      }
    />
  );
}

function ConditionNode({ data }: NodeProps) {
  return (
    <NodeCard
      data={data as WorkflowNodeData}
      accent="condition"
      icon="?"
      extraHandles={
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Right}
            style={{ top: '38%' }}
            className="workflow-node__handle workflow-node__handle--out"
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            className="workflow-node__handle workflow-node__handle--secondary"
          />
        </>
      }
      showRightHandle={false}
    />
  );
}

function EndNode({ data }: NodeProps) {
  return <NodeCard data={data as WorkflowNodeData} accent="end" icon="E" showRightHandle={false} />;
}

export const workflowNodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  condition: ConditionNode,
  end: EndNode
};
