import type { WorkflowTemplate } from '../types/workflow';

interface HeaderProps {
  templates: WorkflowTemplate[];
  activeTemplateId: string;
  onTemplateChange: (templateId: string) => void;
  onSave: () => void;
  onValidate: () => void;
  onExport: () => void;
  onImportClick: () => void;
  saveLabel: string;
}

export function Header({
  templates,
  activeTemplateId,
  onTemplateChange,
  onSave,
  onValidate,
  onExport,
  onImportClick,
  saveLabel
}: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <div className="eyebrow">Tredence Analytics Case Study</div>
        <h1>HR Workflow Designer</h1>
        <p>Prototype for onboarding, leave approval, and configurable HR automation flows.</p>
      </div>
      <div className="app-header__actions">
        <label className="field field--inline">
          <span>Template</span>
          <select value={activeTemplateId} onChange={(event) => onTemplateChange(event.target.value)}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <button className="button button--ghost" onClick={onValidate}>
          Validate
        </button>
        <button className="button button--ghost" onClick={onExport}>
          Export JSON
        </button>
        <button className="button button--ghost" onClick={onImportClick}>
          Import JSON
        </button>
        <button className="button button--primary" onClick={onSave}>
          {saveLabel}
        </button>
      </div>
    </header>
  );
}
