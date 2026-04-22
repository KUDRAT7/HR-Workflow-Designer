# Tredence HR Workflow Designer

A React + TypeScript + React Flow prototype for designing internal HR workflows such as onboarding and leave approval.

## What this includes

- React Flow canvas with drag-and-drop workflow editing
- Multiple custom nodes: `Start`, `Task`, `Approval`, `Condition`, and `End`
- Node-specific edit forms in an inspector panel
- Mock API layer for loading templates, approvers, saving workflows, and sandbox execution
- Workflow validation with node-level and workflow-level feedback
- Sandbox/test panel for a lightweight execution run
- JSON export/import for workflow portability
- README with architecture, assumptions, and tradeoffs

## Tech Stack

- React
- TypeScript
- Vite
- `@xyflow/react` (React Flow)
- `clsx`

## Project Structure

```text
src/
  components/
    nodes/WorkflowNodes.tsx
    Header.tsx
    InspectorPanel.tsx
    NodePalette.tsx
    SandboxPanel.tsx
    WorkflowCanvas.tsx
  data/workflowData.ts
  lib/workflow.ts
  mock/api.ts
  types/workflow.ts
  App.tsx
  main.tsx
  styles.css
```

## How to run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Feature Walkthrough

### 1. Workflow Canvas

- Drag nodes from the left palette to the canvas
- Connect nodes visually using React Flow handles
- Use condition nodes for branching (`Yes` / `No`)
- Use approval nodes with primary and secondary paths
- Mini-map, controls, snap-to-grid, and animated edges are enabled

### 2. Custom Node Forms

Each node type exposes different editable fields:

- `Start`: trigger, owner team, kickoff note
- `Task`: task type, assignee strategy, SLA, required documents, instructions
- `Approval`: approver strategy, mode, SLA, escalation rules
- `Condition`: field, operator, compare value, branch labels
- `End`: outcome and summary

### 3. Mock API Integration

Mock async functions simulate:

- template fetch
- approver fetch
- workflow loading
- workflow save
- sandbox run

These live in [src/mock/api.ts](/c:/Users/Asus/Desktop/Assignment/src/mock/api.ts).

### 4. Sandbox / Test Panel

The sandbox panel:

- validates the workflow
- runs a mock execution path
- shows step-by-step execution output
- surfaces issues before execution if validation fails

## Assignment Requirement Mapping

### Deliverables

- React application: yes, Vite-based setup
- React Flow canvas with multiple custom nodes: yes
- Node configuration/editing forms: yes
- Mock API integration: yes
- Workflow test/sandbox panel: yes
- README with architecture/design choices/assumptions: yes

### Functional Coverage

- Visual canvas editing: implemented
- Custom node types: implemented
- Modular architecture: implemented with separated `types`, `data`, `lib`, `mock`, and `components`
- Validation and testability: implemented
- Optional bonus items:
  - export/import as JSON: implemented
  - mini-map / zoom controls: implemented
  - workflow validation errors on nodes: implemented

## Design Choices

### Why this structure

I separated the app into:

- `types`: stable workflow contracts
- `data`: node defaults, palette definitions, starter templates
- `lib`: validation, serialization, sandbox execution, node decoration
- `mock`: async API simulation
- `components`: focused UI building blocks

This keeps the solution easy to extend if more HR node types or real API integration are added later.

### Why React Flow

React Flow is a strong fit here because the case study emphasizes:

- custom nodes
- edge management
- small sandbox testing
- modular front-end architecture

The prototype leans into those strengths while keeping the overall codebase interview-friendly.

### UI Direction

The UI uses a light analytics dashboard style inspired by the provided broad references:

- left palette for workflow blocks and templates
- center graph workspace
- right-side inspector and sandbox
- visible validation and execution status

## Assumptions

- No authentication is required
- No backend persistence is required
- Mock APIs are sufficient to demonstrate async integration patterns
- Workflow execution in the sandbox is intentionally lightweight and deterministic
- The prototype is optimized for clarity and extensibility over enterprise-scale rule execution


