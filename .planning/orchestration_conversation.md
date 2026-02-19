# Conversation: Orchestrating Codex / LLM Agents

## User

Orchestration looks complex... What am I missing in my own rather simple
approach?

## Assistant
```ts
async function buildVerticalSlice(featureDescription) {

  const plan = await plannerAgent(featureDescription);

  const dbArtifacts = await dbAgent(plan.db_changes);

  const mainArtifacts = await mainAgent({
    plan,
    dbArtifacts
  });

  const ipcArtifacts = await ipcAgent({
    serviceContracts: mainArtifacts.contracts
  });

  const queryArtifacts = await queryAgent({
    ipcContract: ipcArtifacts.contract
  });

  const contextArtifacts = await contextAgent({
    queryAPI: queryArtifacts.api
  });

  const componentArtifacts = await componentAgent({
    hookAPI: queryArtifacts.api,
    contextAPI: contextArtifacts.api
  });

  const layoutArtifacts = await layoutAgent({
    componentName: componentArtifacts.name
  });

  const merged = mergeArtifacts([
    dbArtifacts,
    mainArtifacts,
    ipcArtifacts,
    queryArtifacts,
    contextArtifacts,
    componentArtifacts,
    layoutArtifacts
  ]);

  applyToRepo(merged);

  return merged;
}
```

------------------------------------------------------------------------

## User

What do you mean by isolated workspaces?

## Assistant

```ts
const result = await agent(input);

result = {
  files: [
    { path: "src/db/login.ts", content: "..." },
    { path: "src/ipc/login.ts", content: "..." }
  ],
  edits: [
    { path: "src/routes.ts", patch: "..." }
  ]
}

```

```ts
async function plannerAgent(featureDescription) {
  const prompt = `
You are a software architect.

Stack:
- Electron
- React
- TanStack Query
- SQLite
- IPC bridge pattern

Feature:
${featureDescription}

Output a JSON plan with:

{
  "entities": [],
  "database": {
    "newTables": [],
    "queries": []
  },
  "services": [],
  "ipcChannels": [],
  "rendererHooks": [],
  "components": [],
  "contextChanges": []
}

Only output valid JSON.
`;

  const response = await callLLM(prompt);

  return JSON.parse(response);
}

```
Example output:
```json
{
  "entities": ["Tag"],
  "database": {
    "newTables": [
      {
        "name": "tags",
        "fields": {
          "id": "INTEGER PRIMARY KEY",
          "name": "TEXT UNIQUE"
        }
      }
    ],
    "queries": [
      "createTag",
      "getTagsForNote"
    ]
  },
  "services": ["tagService"],
  "ipcChannels": [
    "tags:create",
    "tags:getForNote"
  ],
  "rendererHooks": [
    "useCreateTag",
    "useTagsForNote"
  ],
  "components": [
    "TagInput",
    "TagList"
  ],
  "contextChanges": []
}
```

------------------------------------------------------------------------

## User

How could agents be organized for a vertical slice in Electron (db, ipc,
renderer, TanStack, context, components)?

## Assistant

🔥 1. Who Writes the Files?

Not the agent.

Your orchestrator does.

Agents return proposals:
```JSON
{
  "files": [
    {
      "path": "src/main/db/tagRepository.ts",
      "content": "..."
    }
  ]
}
```


Then your orchestrator runs something like:

function applyArtifacts(artifacts) {
  for (const file of artifacts.files) {
    fs.writeFileSync(file.path, file.content);
  }
}


That’s it.

The agent never touches disk.

🧠 2. How Does the Orchestrator Decide If It’s “Right”?

There are 4 real strategies used in production systems.

Not magic. Not AI vibes.

Real engineering mechanisms.

✅ Strategy 1 — Structural Validation (Deterministic)

You validate:

Is the JSON valid?

Does it match schema?

Are required fields present?

Are file paths allowed?

Are there forbidden edits?

Example:
```ts
function validateSchema(output) {
  if (!output.files) throw Error("Missing files");
  for (const f of output.files) {
    if (!f.path.startsWith("src/main/")) {
      throw Error("Unauthorized path");
    }
  }
}
```


That’s mechanical validation.

✅ Strategy 2 — TypeScript Compilation

This is the big one.

After writing artifacts to a temporary workspace:

tsc --noEmit


If it fails → reject.

Now you have objective correctness.

Not vibes.

✅ Strategy 3 — Linting / Tests

Run:

eslint .
npm test


If failing → reject.

✅ Strategy 4 — Secondary LLM Review (Optional)

You can have a review agent:

const review = await reviewAgent({
  featureSpec,
  artifacts
});


It might return:

{
  "approved": false,
  "issues": ["IPC channel name inconsistent"]
}


But this is optional polish.

Real correctness usually comes from compilation and tests.

🎯 3. What Actually Happens in Serious Systems

Pipeline looks like this:

Agent generates artifacts
      ↓
Schema validation
      ↓
Write to temporary workspace
      ↓
Compile
      ↓
Run tests
      ↓
If pass → merge to real repo
If fail → send errors back to agent


That’s orchestration.

Not magic.

🔁 4. What Happens If Compilation Fails?

You feed the error back to the same agent.

Example:
```ts
const errors = runTypeCheck();

if (errors) {
  const fixed = await agent({
    previousOutput: artifacts,
    compilerErrors: errors
  });
}
```

Now you’ve built a self-correcting loop.

This is how Claude Code / Cursor style systems work internally.

🧩 5. How Does the Orchestrator “Evaluate”?

It doesn’t “understand.”

It uses:

JSON schema validation

File boundary rules

Static analysis

Compilation

Tests

Explicit contracts

The orchestrator is dumb.

It just enforces rules.

⚙️ 6. Minimal Real Implementation Example

Here’s what a real orchestrator loop might look like:
```ts
async function runAgentStep(agentFn, input) {
  const output = await agentFn(input);

  validateSchema(output);

  writeToTempWorkspace(output);

  const typeErrors = runTypeCheck();

  if (typeErrors.length > 0) {
    return runAgentStep(agentFn, {
      ...input,
      previousOutput: output,
      errors: typeErrors
    });
  }

  return output;
}
```

That’s it.

## User

What do you mean by DO NOT let them modify the real repo? What does
plannerAgent look like? What is dbArtifacts?

## Assistant

Explained: - Agents return structured JSON artifacts - Orchestrator
validates and writes files - Example JSON: { "files": \[...\],
"contracts": {...} } - Planner returns structured plan - dbAgent returns
files + query function contracts

------------------------------------------------------------------------

## User

OMG! Why does no one ever explain actual implementation? How does the
orchestrator decide? Who writes files?

## Assistant

Explained real-world evaluation pipeline: 1. JSON schema validation 2.
Write to temporary workspace 3. TypeScript compilation 4. Linting/tests
5. Retry loop if errors 6. Merge if successful

Orchestrator enforces rules. Compiler/tests judge correctness.

------------------------------------------------------------------------