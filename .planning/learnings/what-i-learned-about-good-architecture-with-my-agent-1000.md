# What I Learned About Good Architecture With My Agent

This project round taught me something I had been missing for a long time. I thought I understood app architecture, but I mostly understood architecture words. I could say layering, separation of concerns, and clean boundaries. I could describe them in theory. In practice, I still blurred the lines between UI, orchestration, and persistence. Working through the planning docs with my agent changed that.

The file that made the biggest difference was `03_folder_system.md`. It did not just list folders. It encoded responsibility. It defined ownership. It showed where each kind of logic should live. That helped me move from vague agreement to actual understanding.

For a while, I was struggling to understand this learning slowly by myself. I would read architecture articles and think, yes, this sounds right. Then I would sketch a feature and quietly put too much logic in the UI layer again. I did not have a strong enough mental guardrail. The plan gave me that guardrail. Now I get it.

The first clear lesson was this: the renderer is not the backend. The renderer should focus on interface and interaction. The main process should own DB access, filesystem operations, and Python orchestration. The preload bridge should expose a typed API so the renderer can request work safely. Python should handle LLM tasks and return structured outputs. When each layer has a clear mission, the app becomes easier to reason about.

Before this, I often treated the UI as a convenient place to glue everything together. It felt fast at first. It was also risky. UI code grew heavy. Testing became awkward. Refactors felt dangerous. The plan pushed me toward a stronger rule set. Presentational components render what they are given. Containers and hooks manage flow. Services call adapters. Persistence stays out of the UI.

The folder structure made that rule visible. `renderer/src/features/<feature>/components` is not the same as `renderer/src/features/<feature>/services`. `electron/main/db/repositories` is not the same as `electron/main/services`. Those boundaries are physical in the tree. That matters more than I expected. If the file location reflects ownership, it becomes harder to accidentally cross layers.

I also learned that good architecture is a language for collaboration. If someone asks where a change belongs, you should be able to answer quickly. If it is a view rendering issue, it belongs in presentational or container code. If it is persistence behavior, it belongs in repositories or handlers in main. If it is LLM behavior, it belongs in Python worker contracts and orchestration services. This shared language reduces confusion and speeds up decisions.

The planning docs reinforced this in several places. `00_app_architecture_spec.md` defined the layer model and the rule that renderer code does not touch the DB. `04_state_management.md` clarified state ownership, with Context and reducers for global UI and session state, and TanStack Query for async backend aligned state. `02_broad_component_hierarchy.md` separated presentational components from data and control components. `03_folder_system.md` then turned these ideas into a concrete project layout. Together they formed a consistent architecture story.

Another thing I appreciate now is how much architecture affects future change. If separation is weak, every feature becomes a cross layer risk. If separation is strong, change can stay local. You can revise a tab layout without rewriting repository code. You can optimize DB access without redesigning presentational components. You can swap some orchestration internals without changing how basic UI elements render. That isolation is not a luxury. It is what keeps momentum alive.

The folder plan also gave me a healthier way to think about naming. A name should reveal intent, not just type. A file like `workspaceHandlers.ts` tells me this is an IPC boundary for workspace operations. A file like `workspaceRepository.ts` tells me this is persistence logic. A file like `FileControlContainer.tsx` tells me this is UI orchestration, not pure presentation. These naming cues reduce cognitive load every time I open the project.

I also noticed that architecture is not only technical. It affects product clarity. This app is for teachers. Teachers need reliable workflows, clear feedback, and a stable interface for grading writing. When architecture is disciplined, those user facing goals are easier to maintain. The app can evolve without becoming fragile. That means better outcomes for people who actually use it.

It also helped me think about vibe coding in a more serious way. Fast iteration is great, but speed without structure can create long term drag. With architecture guardrails, you can still move quickly. You just avoid piling hidden complexity into the UI. You keep expressive coding, but with stronger defaults. That feels like a better version of rapid building.

One subtle but important shift was how I now think about ownership of side effects. Side effects are not bad. They just need a home. File scanning, DB writes, and Python process control are side effects. The plan gives each one a specific place. That is what reduces chaos.

I learned something else from this structure. Debugging paths become clearer. If there is a failure during folder scan, I know to inspect scanner services and main handlers first, then inspect what the renderer does with returned results. If chat responses look wrong, I can isolate contracts and worker orchestration before touching presentational components. Better boundaries do not remove bugs, but they reduce search space when bugs appear.

This also changed how I think about long term maintenance. Future contributors may never read every planning file in detail. They will still feel the architecture through file placement and module contracts. That is why structure is part of documentation. It teaches by default.

I should also be very clear about project status. Nothing has actually been built yet. This round is planning only. But this planning changed how I will build. It gave me a map I can trust.

If you are a developer, an educator, or someone exploring architecture while coding with agents, my main takeaway is simple. Put boundaries in writing. Put them in folders. Put them in state rules. Repeat them until they become instinct. I had to learn this slowly, and I did. Now I can see the app shape before implementation starts, and that gives me confidence for the next round.

![Assessment tab mockup](../mockups/AssessmentTab.png)
