import type { DragEvent } from 'react';
import {
  addEdge,
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition
} from '@xyflow/react';
import { workflowNodeTypes } from './nodes/WorkflowNodes';
import type { WorkflowEdge, WorkflowNode, WorkflowNodeKind } from '../types/workflow';

type ConnectPayload = Connection & Partial<WorkflowEdge>;

interface InnerCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: ConnectPayload) => void;
  onCreateNode: (kind: WorkflowNodeKind, position: XYPosition) => void;
  onSelectNode: (nodeId: string | null) => void;
}

function branchLabelForHandle(handle?: string | null) {
  if (handle === 'yes') return 'Yes';
  if (handle === 'no') return 'No';
  if (handle === 'secondary') return 'Reject';
  return undefined;
}

function InnerCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onCreateNode,
  onSelectNode
}: InnerCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData('application/hr-workflow-node') as WorkflowNodeKind;
    if (!kind) {
      return;
    }
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY
    });
    onCreateNode(kind, position);
  };

  return (
    <div className="panel canvas-panel" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="canvas-hint">
        Drag from the left palette or connect handles to design the workflow. Click empty space to clear selection.
      </div>
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={workflowNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) =>
          onConnect({
            ...connection,
            label: branchLabelForHandle(connection.sourceHandle),
            data: connection.sourceHandle ? { branch: connection.sourceHandle } : undefined
          })
        }
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true
        }}
        snapToGrid
        snapGrid={[20, 20]}
      >
        <Background gap={20} size={1} color="rgba(120, 145, 171, 0.25)" />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}

interface WorkflowCanvasProps extends InnerCanvasProps {}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerCanvas {...props} />
    </ReactFlowProvider>
  );
}

export function buildConnectedEdges(connection: ConnectPayload, existingEdges: WorkflowEdge[]) {
  return addEdge(
    {
      ...connection,
      id: `edge-${connection.source}-${connection.sourceHandle ?? 'default'}-${connection.target}-${existingEdges.length + 1}`
    },
    existingEdges
  );
}
