# Goal
Refactor the ChatInterface component UI only.

## Scope
Focus solely on the ChatInterface UI. Do not focus on the vertical slice and data flow outside the component.

## Task
Lay the components out in the following way.
- three vertically stacked rows
- top row has space for CommandDisplay. Nothing shows unless a command has been selected. - middle row, left side, narrow width: CommandDropdown
- middle row, takes up most of the width, more than 90 percent, of the row: ChatInput
- middle row, right aligned, very narrow: send button
- bottom row, left, narrow width no more than 10 percent: ChatToggle
- bottom row, remaining width: HighlightedTextDisplay.

### ChatToggle
- This should be a toggle icon which can be slided left and right.
- Thr component should not be too tall and it should be inside a container.
- The toggle information (comment vs chat) should be displayed in very small letters above the toggle.

## Styles
- ChatToggle should be rounded. No borders. Background same as ChatInput.
- CommandDropdown is rounded. No text. only show text in dropdown itself.
- CommandDisplay is rounded. Text is displayed. Small cross icon after text can be clicked to remove the CommandDisplay (cancelling the command).
- HighlightedTextDisplay is always truncated.




