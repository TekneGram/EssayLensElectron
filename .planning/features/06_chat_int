# Outline
**ignore AGENTS.md** files

## Goal
- Create subcomponents and layout and state management for ChatInterface component.
- Ensure styles match current website layout.
- ensure state is compatible with current global state context.

## ChatInterface components
- HighlightDisplay: this component takes any highlighted text from
the OriginalTextView, truncates it and displays it in this component
- ChatInput: a simple input field for chatting with LLM
- CommandDropdown: a dropdown menu containing a list of commands that when chosen
steer the chat input message towards different APIs.
- CommandDisplay: displays the command that was selected, replaces it with a new one if another is selected.
The user can only select one command at a time.

## Layout
- CommandDisplay and HighlightDisplay sit side by side, CommandDisplay on the left, and both are positioned above the ChatInput.
- the CommandDropdown, ChatInput and the send button are side by side horizontally positioned.

## Styles
- all components are grouped within the ChatInterface border which is very light.
- no borders around any of the components
- no background colors within the components.
- components should look invisible except for the light border around the ChatInterface.
Look at the styles guide in the .planning folder to recommend concrete styles for these components.

*Create a new folder in .planning folder called chat-interface and write an html and css mockup of the chat interface. Before doing so, look at the current mockups in .planning/mockups to see the outline of the ChatInterface and the styles used. In the mockup, make sure to populate the drop down with commands like "bulk" "topic sentence" and "comment". Put truncated text in the HightlightDisplay component*

# State
No component needs to receive state from the global context. However chat messages, commands and highlighted text will eventually be displayed in the ChatView after the user clicks send. If no command is chosen, chat messages are treated as comments on the essay and are displayed as a comment. This will need to update the database feedback table and audit table and also display in the CommentsView component. if the user selects a command, this sends the input to the LLM for feedback and so this should be displayed in the ChatView. Plan the interfaces and TanStack queries necessary to achieve this.
