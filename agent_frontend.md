## 1) Renderer composition and state

### 1.1 App root and providers

- `renderer/src/main.tsx` loads CSS in order: `tokens` -> `themes` -> `base` -> `layout` -> `components`.
- Default theme: `data-theme="system"`.
- `AppProviders` composes:
- `QueryClientProvider`
- `PortsProvider` (workspace/assessment/chat/rubric/llmManager/llmSession ports, backed by electron adapters by default)
- `AppStateProvider`
- `ToastContainer`
- Query defaults (`renderer/src/app/queryClient.ts`):
- retries disabled for queries and mutations
- `gcTime` set to `Infinity` during Vitest runs

### 1.2 Global state slices

Global reducer state shape (`renderer/src/types/state.ts`): `workspace`, `chat`, `rubric`, `ui`.

- `workspace`:
- `currentFolder`, `files`, `status`, `error`
- `selectedFile` (`fileId`, `status`)
- `chat`:
- `messages`, `status`, `error` (`messages` may carry optional `sessionId` for simple-chat session scoping)
- `activeSessionIdByFileId`, `sessionsByFileId`, `sessionsStatusByFileId`, `sessionsErrorByFileId`, `sessionSyncNonceByFileId`
- `sessionSendPhaseBySessionId` tracks in-flight UX phase per session (`warming` before stream start, `thinking` after stream start until first content chunk)
- Assessment-tab chat actions track per-session essay send state so `chat/sendMessage` includes `essay` only on first send for a session.
- `rubric`:
- `selectedGradingRubricIdByFileId`
- `lockedGradingRubricId`
- `gradingSelectionByFileId`
- `ui`:
- `activeTopTab`
- `activeCommentsTab`
- `isChatCollapsed`
- `assessmentSplitRatio`

Reducer notes:
- Split ratio is clamped between `0.35` and `0.8`.
- Selected file type is derived from `workspace.files` extension kind (`image`/`docx`/`pdf`/`other`).
- Assessment-tab interaction state (`pendingSelection`, `activeCommand`, `chatMode`, `activeCommentId`, `draftText`) is feature-local in `features/assessment-tab/state`.
- React Query is used for backend-backed data flows such as feedback lists/mutations, rubric data/scores, and LLM manager catalog/downloaded/active/settings.

## 2) Component hierarchy

Top-level tree from `renderer/src/App.tsx`:

```text
App
  FileControlContainer
    FileControl
      LoaderBar
      FileDisplayBar

  AssessmentWindow
    (tab: assessment) AssessmentTab
      [optional] ImageView
      OriginalTextView
        TextViewWindow
          TextViewToolbar
          TextViewCanvas
          PendingCommentBanner
      [two-pane only] assessment splitter
      CommentsView
        Comments tabs (Comments / Score)
        CommentView[]
          CommentHeader
          CommentBody
          CommentTools
        [score tab] ScoreTool

    (tab: rubric) RubricTab
      RubricSelection
      RubricForReactPanel

    (tab: llm) LlmManager
      LlmDownload
      LlmSelector
      LlmConfiguration

  ChatView OR ChatCollapsedRail
    ChatControl
    ChatListScreen OR ChatScreen
    ActionsView
  ChatInterface
    CommandDisplay
    CommandDropdown
    ChatInput
    ChatToggle
    HighlightedTextDisplay
    Send button
```

Important orchestration contract:
- `AssessmentTab` owns `activeCommand`, `pendingSelection`, `chatMode`, `activeCommentId`, and `draftText` in local feature state.
- It exports these handlers/state to bottom `ChatInterface` through `onChatBindingsChange`.
- `ChatInterface` is globally rendered, but functionally driven by `AssessmentTab` bindings.
- `chat-view/ChatView.tsx` is composition-only. Session workflows (`load/list/create`) live in `chat-view/application`, policy/error mapping lives in `chat-view/domain`, and React lifecycle/state orchestration lives in `chat-view/hooks/useChatViewController.ts`.
- While a chat send is in-flight (`chat.status === sending` or session send phase is set), `useChatViewController` must not refresh session turns/list from `llmSession`; this preserves optimistic teacher/assistant messages and stream updates in `ChatScreen` until persistence catches up.
- `chat-view/components/ChatScreen.tsx` owns stream-follow scroll behavior: it auto-scrolls to the latest message while the user is near bottom, pauses auto-follow if the user scrolls up, and resumes when the user returns near bottom.
- `chat-view/components/ChatBubble.tsx` renders chat message markdown (`react-markdown` + `remark-gfm` + `rehype-sanitize`) and must preserve safe link handling, code-block formatting, and the animated rotating thinking indicator behavior for the latest assistant response during both `warming` and `thinking` send phases.
- `chat-view/components/ChatListScreen.tsx` renders temporary session labels (`Chat 1`, `Chat 2`, ...) by list index and exposes per-row delete actions; it should not display raw `sessionId` values in UI labels.

## 3) Layout and style contracts

### 3.1 CSS architecture

- Tokens: `renderer/src/styles/tokens.css`
- Theme variables: `renderer/src/styles/themes.css` (`light`, `dark`, `system`)
- Base resets/background/type: `renderer/src/styles/base.css`
- Grid layout: `renderer/src/styles/layout.css`
- Component visuals: `renderer/src/styles/components.css`

### 3.2 App layout grid

Desktop (`.app-shell`):
- Rows: main content + bottom chat input bar (`72px`).
- Columns: loader rail (`46px`), file bar (`170px`), assessment area (`flex`), chat panel (`320px`).
- Chat collapse sets last column to `8px` and swaps `ChatView` with `ChatCollapsedRail`.

Mobile (`max-width: 900px`):
- Single-column stack: assessment -> chat view -> chat input.
- Loader/file rails hidden.
- Assessment/rubric panes collapse to one column.

### 3.3 Assessment pane layout

- Two-pane mode (docx/pdf/other): left text pane + draggable vertical splitter + comments pane.
- Three-pane mode (image): image pane + text pane + comments pane.
- Split ratio variable: `--assessment-left-ratio` from state.

### 3.4 Styling conventions to preserve

- Core classes: `pane`, `subpane`, `content-block`, `tab`, `chat-send`, `chat-toggle`, `comment-view`.
- Color semantics derive from CSS vars, not hard-coded values.
- Accessibility patterns in use:
- ARIA roles for tabs/panels.
- `aria-selected`/`aria-controls` for tab buttons.
- Keyboard support for splitter arrows and comment card Enter/Space activation.

## 4) Frontend PR checklist (state ownership)

- React Query owns server state (lists, entities, loading/error from backend requests).
- Reducers/context own UI-only state (tabs, panel state, transient interaction flow).
- Do not mirror Query data into reducer caches.
- Do not add duplicate loading/error flags when Query already provides them.
- Remove unused global state/actions/selectors when they become dead.
- Before merge, run `npx tsc -p renderer/tsconfig.json --noEmit` and targeted renderer tests for touched features.
- Reference `renderer/STATE_OWNERSHIP.md` when introducing new state.

## 5) File structure
```text
renderer/
  src/
    main.tsx
    App.tsx
    app/
      AppProviders.tsx
      queryClient.ts
    adapters/
      assessment/
      chat/
      llm-manager/
      rubric/
      workspace/
    ports/
      index.ts
      PortsProvider.tsx
      *.port.ts
    state/
      AppStateProvider.tsx
      initialState.ts
      reducers.ts
      selectors.ts
      actions.ts
      types.ts
      __tests__/
    types/
      index.ts
      fileKind.ts
      primitives.ts
      state.ts
    features/
      workspace/
      assessment-window/
      assessment-tab/
      image-view/
      chat-view/
      chat-interface/
      feedback/
      llm-manager/
      rubric-data/
      rubric-tab/
      layout/
    test/
    styles/
      tokens.css
      themes.css
      base.css
      layout.css
      components.css
```
