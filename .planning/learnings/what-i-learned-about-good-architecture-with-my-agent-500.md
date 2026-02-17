# What I Learned About Good Architecture With My Agent

I used to think architecture was mostly about folder names and clean looking diagrams. This planning round changed that for me. The biggest shift came from working through `03_folder_system.md` with my agent. I finally saw that architecture is really about boundaries. It is about who is allowed to do what, where state lives, and how each layer talks to the next one.

For a while, I was struggling to understand this learning slowly by myself. I could read docs. I could follow examples. But I still mixed concerns in my head. I would imagine UI components fetching data, touching storage, and handling too much logic. It felt convenient, but it also felt messy. Now I get why that causes pain later.

In this plan, the separation is clear. The renderer owns UI and interaction flow. Electron main owns the database and process orchestration. Python handles LLM tasks only. The preload layer gives a typed bridge. That means one direction for responsibility. The UI asks for things through typed APIs. It does not open SQLite. It does not manage Python lifecycles. That simple rule already makes the system easier to reason about.

`03_folder_system.md` made this concrete for me because it mapped the architecture to real folders and files. I could point to `renderer/src/features` and say this is where presentational components, containers, and hooks live. I could point to `electron/main/db/repositories` and say this is where persistence lives. I could point to `electron/main/services` and see orchestration and side effects. This gave me confidence. Not abstract confidence. Practical confidence.

The most important detail was the strict separation of UI from data ownership. Presentational components render. They do not perform domain writes. Containers and hooks orchestrate behavior. Services call adapters and repositories. The main process persists and normalizes. This pattern appeared across the planning docs, and it repeated enough times that it clicked for me.

I also learned that good architecture can make collaboration better. When boundaries are explicit, you can change one part without fear of silently breaking another part. If a UI tab changes layout, it should not affect database schema. If a repository changes an index strategy, it should not force a redesign of presentational components. This is the kind of stability I want as the app grows.

Another helpful moment was seeing how state is split between Context and TanStack Query. Session and interaction state live in reducers. Async backend aligned state lives in query flows. That split supports the same architecture lesson. Keep responsibilities narrow. Keep contracts clear.

This is still planning, not implementation. Nothing has actually been built yet. That matters. But this planning phase already gave me a better mental model for building the app in a way that can survive real complexity.

For teachers and coding enthusiasts, this is the core idea I am taking forward. A good app is not only about features. It is also about where each feature belongs in the system. Once that is clear, coding gets calmer, and iteration gets faster.

![Assessment tab mockup](../mockups/AssessmentTab.png)
