# Phase 0: AssessmentTab Orchestration Contract (Boundary + Interface Freeze)

## Purpose
Freeze renderer-side boundaries and event contracts between `AssessmentTab`, `OriginalTextView`, `CommentsView`, and `ChatInterface` before behavior implementation.

## Ownership Rules
- `AssessmentTab` owns all cross-pane orchestration state:
  - `pendingSelection: PendingSelection | null`
  - `activeCommand: ActiveCommand | null`
  - `chatMode: ChatMode`
  - `activeCommentId: string | null`
  - `isProcessCenterOpen: boolean`
- `OriginalTextView` owns only local rendering/interaction details and emits normalized events upward.
- `CommentsView` owns only rendering of comment rows/tools and emits actions upward.
- `ChatInterface` owns only controlled input rendering and emits mode/draft/submit events upward.
- No component writes directly into another component’s internal state.

## Frozen Event Names
### AssessmentTab -> OriginalTextView
- `selectedFileId`
- `text`
- `pendingSelection`
- `activeCommentId`
- `isProcessCenterOpen`
- `onSelectionCaptured(selection)`
- `onCommandSelected(command)`
- `onToggleProcessCenter(open)`

### AssessmentTab -> CommentsView
- `comments`
- `activeCommentId`
- `isLoading`
- `error`
- `onSelectComment(commentId)`
- `onEditComment(commentId, nextText)`
- `onDeleteComment(commentId)`
- `onSendToLlm(commentId, command?)`
- `onApplyComment(commentId, applied)`

### AssessmentTab -> CommentView Subcomponents
- `CommentHeaderProps`
- `CommentBodyProps`
- `CommentToolsProps`

### AssessmentTab -> ChatInterface
- `activeCommand`
- `pendingSelection`
- `chatMode`
- `isModeLockedToChat`
- `draftText`
- `onDraftChange(text)`
- `onSubmit()`
- `onModeChange(mode)`
- `onCommandSelected(command | null)`

## Policy Rules (Frozen for later phases)
- `chatMode` defaults to `comment`.
- `activeCommand != null` forces `chatMode = 'chat'` and locks mode switching.
- clearing command unlocks mode switching.
- comment creation mode and inline/block branching are handled in later phases, but must consume these frozen interfaces.
