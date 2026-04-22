import type { SandboxExecutionResult, WorkflowValidationResult } from '../types/workflow';

interface SandboxPanelProps {
  validation: WorkflowValidationResult;
  result: SandboxExecutionResult | null;
  running: boolean;
  onRun: () => void;
}

export function SandboxPanel({ validation, result, running, onRun }: SandboxPanelProps) {
  return (
    <section className="panel sandbox">
      <div className="panel__section">
        <div className="panel__eyebrow">Sandbox</div>
        <h2>Test Workflow</h2>
        <p>Run a mock execution path to validate your prototype without backend persistence.</p>
        <button className="button button--primary button--full" onClick={onRun} disabled={running}>
          {running ? 'Running sandbox...' : 'Run Sandbox'}
        </button>
      </div>

      <div className="panel__section panel__section--soft">
        <div className="panel__eyebrow">Validation Summary</div>
        {validation.issues.length ? (
          <div className="issue-list">
            {validation.issues.slice(0, 6).map((issue, index) => (
              <div
                key={`${issue.message}-${index}`}
                className={`issue-item ${issue.severity === 'error' ? 'issue-item--error' : 'issue-item--warning'}`}
              >
                {issue.message}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No workflow-level issues. Ready to simulate.</div>
        )}
      </div>

      <div className="panel__section">
        <div className="panel__eyebrow">Latest Run</div>
        {result ? (
          <>
            <div className={`run-summary ${result.success ? 'is-success' : 'is-failed'}`}>
              <strong>{result.summary}</strong>
              <span>{result.durationMs} ms simulated duration</span>
            </div>
            <div className="run-steps">
              {result.steps.map((step) => (
                <div key={`${step.nodeId}-${step.title}`} className={`run-step run-step--${step.outcome}`}>
                  <strong>{step.title}</strong>
                  <span>{step.detail}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">No sandbox run yet. Use this panel to smoke-test the workflow.</div>
        )}
      </div>
    </section>
  );
}
