import type { DragEvent } from 'react';
import { nodePalette } from '../data/workflowData';
import type { WorkflowTemplate, WorkflowValidationResult } from '../types/workflow';

interface NodePaletteProps {
  onDragStart: (event: DragEvent<HTMLDivElement>, kind: (typeof nodePalette)[number]['kind']) => void;
  onQuickAdd: (kind: (typeof nodePalette)[number]['kind']) => void;
  templates: WorkflowTemplate[];
  onLoadTemplate: (templateId: string) => void;
  validation: WorkflowValidationResult;
}

export function NodePalette({
  onDragStart,
  onQuickAdd,
  templates,
  onLoadTemplate,
  validation
}: NodePaletteProps) {
  const errorCount = validation.issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = validation.issues.filter((issue) => issue.severity === 'warning').length;

  return (
    <aside className="panel sidebar">
      <div className="panel__section">
        <div className="panel__eyebrow">Build Blocks</div>
        <h2>Node Palette</h2>
        <p>Drag nodes onto the canvas or insert them with one click.</p>
      </div>

      <div className="palette-grid">
        {nodePalette.map((item) => (
          <div
            key={item.kind}
            className="palette-card"
            draggable
            onDragStart={(event) => onDragStart(event, item.kind)}
            onDoubleClick={() => onQuickAdd(item.kind)}
          >
            <div>
              <strong>{item.name}</strong>
              <p>{item.description}</p>
            </div>
            <button className="button button--tiny" onClick={() => onQuickAdd(item.kind)}>
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="panel__section">
        <div className="panel__eyebrow">Templates</div>
        <h3>Starter Workflows</h3>
        <div className="template-list">
          {templates.map((template) => (
            <button key={template.id} className="template-card" onClick={() => onLoadTemplate(template.id)}>
              <strong>{template.name}</strong>
              <span>{template.category}</span>
              <p>{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="panel__section panel__section--soft">
        <div className="panel__eyebrow">Health Check</div>
        <h3>Workflow Status</h3>
        <div className="health-stats">
          <div>
            <strong>{errorCount}</strong>
            <span>Errors</span>
          </div>
          <div>
            <strong>{warningCount}</strong>
            <span>Warnings</span>
          </div>
          <div>
            <strong>{validation.isValid ? 'Ready' : 'Draft'}</strong>
            <span>State</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
