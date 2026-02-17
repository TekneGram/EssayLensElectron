# React Component Hierarchy

## Purpose
Define the high-level UI composition for EssayLens so feature specs can be implemented consistently.

## Scope
Describe the component hierarchy and ownership only.
Detailed behavior belongs in feature specs.

## Architectural constraints
- Renderer uses typed IPC only (`window.api.*`)
- Electron main owns DB access and Python service orchestration
- TanStack Query manages server state
- React Context manages UI/session state
- Presentational components do not fetch data directly.

## Responsibility map semantics
- `Reads` = data dependencies needed to render or decide behavior (props, context slices, query outputs).
- `Writes` = domain/application state changes triggered by the component (actions, mutations, persistence calls).
- Local ephemeral UI state (input draft, hover, open/closed) is not counted as a domain write.

## Top-level hierarchy - Parent-Child structure
`-- AppShell
    |-- FileControl
    |   |-- LoaderBar
    |   |-- FileDisplayBar
    |-- AssessmentWindow
    |   |-- AssessmentTab
    |   |   |--ImageView
    |   |   |--OriginalTextView
    |   |   |   |-- TextViewWindow
    |   |   |   |-- ProcessCommandCenter
    |   |   |--CommentsView
    |   |   |   |-- CommentView
    |   |   |   |-- ScoreTool
    |   |-- RubricTab
    |   |   |--RubricSelectionView
    |   |   |--RubricView
    |-- ChatViewer
    |-- ChatInterface

## Presentational components responsibilities

  | Component | Role | Reads | Writes |
  |---|---|---|---|
  | AppShell | top-level layout shell | layout props, slot content | none (domain) |
  | FileControl | file area wrapper UI | loading state, file list props, selected file id | none (domain) |
  | LoaderBar | folder-pick trigger UI | isLoading, button label | none (domain) |
  | FileDisplayBar | file list renderer | files, selected file id | none (domain) |
  | AssessmentWindow | workspace layout UI | active tab, slot content | none (domain) |
  | AssessmentTab | assessment layout UI | text/comments/score props | none (domain) |
  | OriginalTextView | text presentation | text, highlights, selection props | none (domain) |
  | TextViewWindow | text viewport UI | rendered text block props | none (domain) |
  | ProcessCommandCenter | action controls UI | control enabled/disabled states | none (domain) |
  | CommentsView | comments layout/list UI | comments, filters, selected comment id | none (domain) |
  | CommentView | single comment item UI | comment props | none (domain) |
  | ScoreTool | score control UI | score summary props | none (domain) |
  | RubricTab | rubric area layout | rubric slot content, active rubric tab state | none (domain) |
  | RubricSelectionView | rubric picker UI | rubric options, selected id | none (domain) |
  | RubricView | rubric table UI | rubric matrix, mode flags | none (domain) |
  | ChatViewer | transcript display | messages, status | none (domain) |
  | ChatInterface | chat input UI | draft text, send enabled | none (domain) |
  
  ## Data/control components responsibilities

  | Component/Module | Role | Reads | Writes |
  |---|---|---|---|
  | AppShellController | app-level orchestration | global app context/store | app-level actions/state transitions |
  | FileControlContainer | file workflow orchestration | workspace state, file query state | trigger picker/scan/persist actions |
  | useFileControl | file-control use-case hook | current folder, loading flags, file records | update file-control state, invoke services |
  | workspaceService | file-control use-case service | picker result, filesystem scan results | repository writes, returned view data |
  | workspaceRepository | persistence boundary | DB tables/records | insert/update/upsert cwd + files |
  | AssessmentWindowController | assessment page orchestration | selected file, active assessment tab | set active tab/file scope |
  | AssessmentController | assessment feature orchestration | text/comments/scores domain state | create/update comments, scoring actions |
  | RubricController | rubric mode + grading logic | rubric data, mode, selections | rubric selection/grading updates |
  | ChatController | chat orchestration | messages, model/session state | send/cancel/regenerate, persist messages |

  Use this rule:
  - Presentational = no domain writes
  - Control = own domain writes and service calls.
