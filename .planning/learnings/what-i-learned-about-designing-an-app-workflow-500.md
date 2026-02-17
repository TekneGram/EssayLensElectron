# What I Learned About Designing an App Workflow

This planning round taught me a practical way to design workflow before writing implementation code. The key was combining three files: `01_database_plan.md`, the workflow description in `AGENTS_temp.md`, and `02_broad_component_hierarchy.md`. Together, they helped me map what data exists, when it changes, and where the user experiences each change.

I used to think workflow design started with screens. Now I think it starts with events and state transitions. In this app, every step in the teacher journey touches specific tables and specific UI regions. Once I mapped those two sides together, the app became much easier to understand.

The process became very clear. First, plan data structures. In `01_database_plan.md`, entities, filenames, feedback, chats, rubrics, rubric details, and rubric scores are all defined with relationships. Then define user flow. In `AGENTS_temp.md`, the teacher picks a folder, files are scanned, a file is selected, comments are added, rubric actions happen, and feedback is generated. Then connect the flow to UI structure. In `02_broad_component_hierarchy.md`, each stage has a place in the component tree and a clear owner for reads and writes.

That mapping was the breakthrough for me. I basically planned the data structures I would need, where the user would consume that data in the UI, and mapped one onto the other to help me see the broader architecture of the app. Once I did that, workflow design stopped feeling abstract.

For example, selecting a folder is not just a button action. It updates persisted folder state and discovered files. It also triggers chat updates in the viewer. Selecting a document loads content into the main reading area and can update chat context. Adding feedback updates feedback storage and comments presentation. Selecting a rubric maps rubric entities into visible rubric views. The workflow is one story told across data and interface.

I also learned that this approach helps prevent design drift. If a workflow step does not have a clear data source or clear UI destination, that step probably needs more design work. The mapping acts like a checklist. It catches gaps early.

This is still a planning phase. Nothing has actually been built yet. But now I have a strong blueprint for implementation. I know what each step should do. I know where each piece of state should live. I know where each user action should show up in the UI.

I think coders will like this because it turns architecture into a practical flow map. Vibe coding enthusiasts can still move quickly, but with better structure. Teachers can also see the value, because the workflow is being designed around real grading tasks from the start.

I now also look at workflow planning as risk reduction. When each stage is mapped, failure paths are easier to design too. If scanning fails, I know which state should remain stable and what the user should see. If a rubric update returns an error, I know which panel should keep prior data and where the message should appear. This makes the app feel trustworthy even before advanced features are added.

Another useful result is momentum. I do not have to guess what to build next. The workflow map already suggests implementation order. Start with folder selection and file listing. Then connect document display. Then add comments flow. Then add rubric interactions. Each step has clear data contracts and clear UI targets.

![Rubric tab mockup](../mockups/RubricTab.png)
