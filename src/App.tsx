import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import { Header } from './components/Header';
import { InspectorPanel } from './components/InspectorPanel';
import { NodePalette } from './components/NodePalette';
import { SandboxPanel } from './components/SandboxPanel';
import { WorkflowCanvas, buildConnectedEdges } from './components/WorkflowCanvas';
import { createWorkflowNode } from './data/workflowData';
import { decorateNodes, parseWorkflowJson, serializeWorkflow, validateWorkflow } from './lib/workflow';
import { workflowApi } from './mock/api';
import type {
  ApproverOption,
  SandboxExecutionResult,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeKind,
  WorkflowTemplate
} from './types/workflow';

type BannerState = {
  tone: 'neutral' | 'success' | 'error';
  text: string;
};

function App() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [approvers, setApprovers] = useState<ApproverOption[]>([]);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sandboxResult, setSandboxResult] = useState<SandboxExecutionResult | null>(null);
  const [banner, setBanner] = useState<BannerState>({
    tone: 'neutral',
    text: 'Loading templates and mock HR metadata...'
  });
  const [saveLabel, setSaveLabel] = useState('Save Workflow');
  const [runningSandbox, setRunningSandbox] = useState(false);

  const validation = validateWorkflow(nodes, edges);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

  const commitWorkflow = (nextNodes: WorkflowNode[], nextEdges: WorkflowEdge[]) => {
    const decoratedNodes = decorateNodes(nextNodes, nextEdges);
    setNodes(decoratedNodes);
    setEdges(nextEdges);
    if (selectedNodeId && !decoratedNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  };

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const [templateList, approverList] = await Promise.all([
          workflowApi.fetchTemplates(),
          workflowApi.fetchApprovers()
        ]);

        if (!active) {
          return;
        }

        setTemplates(templateList);
        setApprovers(approverList);

        const firstTemplateId = templateList[0]?.id ?? '';
        if (firstTemplateId) {
          const template = await workflowApi.loadTemplate(firstTemplateId);
          if (!active) {
            return;
          }
          setActiveTemplateId(firstTemplateId);
          setBanner({
            tone: 'success',
            text: 'Loaded mock template data. Start editing the workflow or drag new nodes in.'
          });
          commitWorkflow(template.nodes, template.edges);
        }
      } catch {
        if (!active) {
          return;
        }
        setBanner({
          tone: 'error',
          text: 'Unable to load mock data. You can still build a workflow manually.'
        });
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const handleLoadTemplate = async (templateId: string) => {
    setActiveTemplateId(templateId);
    setSelectedNodeId(null);
    setSandboxResult(null);
    setBanner({
      tone: 'neutral',
      text: 'Loading selected workflow template from the mock API...'
    });

    const template = await workflowApi.loadTemplate(templateId);
    commitWorkflow(template.nodes, template.edges);
    setBanner({
      tone: 'success',
      text: 'Template loaded successfully.'
    });
  };

  const handleNodesChange = (changes: NodeChange<WorkflowNode>[]) => {
    commitWorkflow(applyNodeChanges(changes, nodes), edges);
  };

  const handleEdgesChange = (changes: EdgeChange<WorkflowEdge>[]) => {
    commitWorkflow(nodes, applyEdgeChanges(changes, edges));
  };

  const handleConnect = (connection: Connection) => {
    commitWorkflow(nodes, buildConnectedEdges(connection, edges));
  };

  const handleCreateNode = (kind: WorkflowNodeKind, position: { x: number; y: number }) => {
    const nextNode = createWorkflowNode(
      {
        kind,
        position
      },
      nodes.filter((node) => node.data.kind === kind).length + 1
    );
    commitWorkflow([...nodes, nextNode], edges);
    setSelectedNodeId(nextNode.id);
    setBanner({
      tone: 'success',
      text: `${kind[0].toUpperCase()}${kind.slice(1)} node added to the canvas.`
    });
  };

  const handleQuickAdd = (kind: WorkflowNodeKind) => {
    handleCreateNode(kind, {
      x: 200 + (nodes.length % 3) * 230,
      y: 120 + nodes.length * 22
    });
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, kind: WorkflowNodeKind) => {
    event.dataTransfer.setData('application/hr-workflow-node', kind);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleUpdateNode = (nodeId: string, updater: (node: WorkflowNode) => WorkflowNode) => {
    commitWorkflow(
      nodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }
        return updater(node);
      }),
      edges
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    commitWorkflow(
      nodes.filter((node) => node.id !== nodeId),
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setSelectedNodeId(null);
    setBanner({
      tone: 'neutral',
      text: 'Node deleted from the workflow.'
    });
  };

  const handleValidate = () => {
    const currentValidation = validateWorkflow(nodes, edges);
    setBanner({
      tone: currentValidation.isValid ? 'success' : 'error',
      text: currentValidation.isValid
        ? 'Validation passed. The workflow is ready for sandbox testing.'
        : `Validation found ${currentValidation.issues.length} issue(s). Review the side panels for details.`
    });
    commitWorkflow(nodes, edges);
  };

  const handleSave = async () => {
    setSaveLabel('Saving...');
    const result = await workflowApi.saveWorkflow(nodes, edges);
    setSaveLabel('Save Workflow');
    setBanner({
      tone: 'success',
      text: `Mock save completed. ${result.nodeCount} nodes and ${result.edgeCount} edges stored as ${result.workflowId}.`
    });
  };

  const handleRunSandbox = async () => {
    setRunningSandbox(true);
    setBanner({
      tone: 'neutral',
      text: 'Running a mock execution through the current workflow...'
    });
    const result = await workflowApi.runSandbox(nodes, edges);
    setSandboxResult(result);
    setRunningSandbox(false);
    setBanner({
      tone: result.success ? 'success' : 'error',
      text: result.summary
    });
  };

  const handleExport = () => {
    const blob = new Blob([serializeWorkflow(nodes, edges)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hr-workflow-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setBanner({
      tone: 'success',
      text: 'Workflow exported as JSON.'
    });
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseWorkflowJson(text);
      commitWorkflow(parsed.nodes, parsed.edges);
      setSelectedNodeId(null);
      setSandboxResult(null);
      setBanner({
        tone: 'success',
        text: `Imported workflow from ${file.name}.`
      });
    } catch {
      setBanner({
        tone: 'error',
        text: 'Import failed. Please provide a valid workflow JSON export.'
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="app">
      <Header
        templates={templates}
        activeTemplateId={activeTemplateId}
        onTemplateChange={handleLoadTemplate}
        onSave={handleSave}
        onValidate={handleValidate}
        onExport={handleExport}
        onImportClick={handleImportClick}
        saveLabel={saveLabel}
      />

      <input ref={importInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />

      <section className="summary-strip">
        <div className="summary-card">
          <span>Nodes</span>
          <strong>{nodes.length}</strong>
        </div>
        <div className="summary-card">
          <span>Connections</span>
          <strong>{edges.length}</strong>
        </div>
        <div className="summary-card">
          <span>Validation</span>
          <strong>{validation.isValid ? 'Ready' : 'Needs work'}</strong>
        </div>
        <div className={`banner banner--${banner.tone}`}>{banner.text}</div>
      </section>

      <main className="workspace">
        <NodePalette
          onDragStart={handleDragStart}
          onQuickAdd={handleQuickAdd}
          templates={templates}
          onLoadTemplate={handleLoadTemplate}
          validation={validation}
        />

        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onCreateNode={handleCreateNode}
          onSelectNode={setSelectedNodeId}
        />

        <div className="right-column">
          <InspectorPanel
            selectedNode={selectedNode}
            approvers={approvers}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
          />
          <SandboxPanel
            validation={validation}
            result={sandboxResult}
            running={runningSandbox}
            onRun={handleRunSandbox}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
