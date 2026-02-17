# What I Learned About Designing an App Workflow

I learned a workflow design method in this planning round that feels both simple and powerful. It came from combining three sources of truth. The first was `01_database_plan.md`, which defines the data model. The second was the workflow narrative in `AGENTS_temp.md`, which describes what teachers do step by step. The third was `02_broad_component_hierarchy.md`, which defines where those interactions and read models live in the UI.

When I connected those three documents, workflow design stopped feeling fuzzy. It became a map.

Before this, I often designed workflow in a screen first way. I would sketch panels and tabs, then try to retrofit data behavior after the layout felt right. That can work for small prototypes, but it creates confusion quickly when features interact. In this round, I flipped that pattern. I started with durable entities and relationships. Then I traced user actions. Then I mapped each state transition to a UI consumer.

`01_database_plan.md` gave me a grounded data backbone. Entities identify files and rubrics. Filepath and filename tables track folder and file indexing details. Feedback holds comments. Chats stores conversational records. Rubric tables model scoring structures and rubric instances. Audit tracks actions. This schema gives each workflow step a place to persist information.

`AGENTS_temp.md` then provided the narrative path. The teacher selects a folder. The app scans files and updates file records. The teacher opens a file and views text or image related context. The teacher adds comments and requests LLM feedback. The teacher switches to rubric mode, edits rubric structures, applies scores, and eventually generates a feedback file. Each step has intent, side effects, and visible UI outcomes.

`02_broad_component_hierarchy.md` completed the picture. It says where this workflow appears on screen and what component types are allowed to do. Presentational components render data and emit interaction signals. Control components and services own domain writes and orchestration. This separation means the workflow can evolve without turning every view component into a data access layer.

The practical breakthrough was mapping these layers directly. I basically planned the data structures I would need, where the user would consume that data in the UI, and mapped one onto the other to help me see the broader architecture of the app. That sentence sounds simple, but it changed how I think.

Here is why the mapping matters. When a teacher selects a folder, that is not just a UI click. It is a chain. A picker returns a path. Path state is persisted. Files are scanned recursively to depth limits. File records are upserted. The FileDisplayBar then reads those records. A chat message can also be generated to reflect system status. One user action produces multiple coordinated updates across database and UI. If you design this intentionally, the result feels coherent.

The same is true for comments and rubric flow. A feedback command in chat is not only text in a chat box. It updates feedback records and comments view models. A rubric selection is not only a tab state change. It maps rubric entities into rubric detail and score views. Applying a score is not only a click in a matrix. It creates or updates rubric instance records and score records. Workflow clarity comes from tracing these end to end transitions.

This method also exposed ownership boundaries. The renderer should not directly own persistence side effects. It should orchestrate via typed APIs and state layers. Main process handlers and repositories should own durable writes. The component hierarchy supports that by distinguishing presentational nodes from data and control modules. I now treat this as a workflow discipline, not only an architecture preference.

I also noticed how this approach helps with onboarding and collaboration. If someone joins the project, they can read the workflow narrative and immediately map each step to data tables and UI modules. If a bug appears, the mapping helps narrow scope quickly. If a feature changes, you can identify exactly which workflow nodes and data contracts are affected.

I found this especially helpful for deciding boundaries on day one implementation tasks. Instead of asking, where should this go, I can ask, which workflow transition owns this behavior. That question usually points to the right container, service, or repository immediately. It removes guesswork.

That clarity is going to matter when the project moves from planning to build. The first coding steps will already have a shared sequence and fewer ambiguous decisions.

For teachers, this planning style has direct value. The app workflow can be validated against real grading behavior before implementation starts. You can ask practical questions early. Does folder selection give clear status feedback. Do rubric edits surface in an understandable way. Does comment generation appear where teachers expect it. These questions are easier to answer when flow and data are mapped together.

For coders and vibe coding enthusiasts, this gives speed with structure. You can still iterate quickly, but each iteration lands on a known map. You avoid random coupling between UI and storage. You avoid hidden state transitions. You get fewer surprises during integration.

Another benefit is testing strategy. When workflow is defined as explicit transitions, tests become clearer. You can test each step as intent plus expected persistence plus expected UI update. You can test failure paths, like picker cancel or scan failure, with known outcomes. This reduces ambiguity and raises confidence.

I should be explicit about status. Nothing has actually been built yet. This round is planning only. But the planning has real implementation value because it defines a workflow spine that code can follow.

What I now believe is this. App workflow design works best when you connect three views at once. The data model. The user narrative. The component ownership map. If one view is missing, architecture clarity drops. If all three align, the broader app architecture becomes visible and buildable.

That is my main learning from this round. I did not just list features. I designed transitions. I anchored them in data. I mapped them to UI. And now I can move into implementation with fewer unknowns and better confidence.

![Rubric tab mockup](../mockups/RubricTab.png)
