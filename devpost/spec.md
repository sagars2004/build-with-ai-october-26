---
doc: spec
status: approved
---

# Explainit — Technical Spec

## How This Works, In Plain Language

Explainit has three local pieces, plus two VS Code entry points:

1. A VS Code extension notices a focused file change and displays the retro game-show quiz surface inside VS Code.
2. A local Explainit service coordinates one quiz session. It keeps the current quiz in memory, talks to the model, and sends results back to the extension.
3. A small read-only MCP server gives the agent a controlled way to inspect the focused change and nearby code. The agent can request only the workspace context it needs instead of receiving the whole project.

The extension also exposes an `@explainit` Chat Participant for prompts the developer explicitly sends to Explainit. A saved-change watcher remains the automatic path after meaningful edits. Explainit cannot passively read another extension's private chat transcript through the public VS Code API, so the demo uses explicit routing for prompt commentary and automatic observation for saved code changes.

The local service starts the MCP server as a child process and acts as the MCP client. It exposes the MCP tools to the model as callable tool definitions, forwards any model-selected tool call to the MCP server, and gives the returned context back to the model. Once the model has enough context, it returns a structured quiz object rather than loose prose. The extension renders that object and sends each answer back for grading.

This shape keeps workspace access separate from quiz behavior, makes the MCP boundary visible for learning, and avoids adding accounts, a database, deployment, or full-project indexing to the POC.

## The Core Journey Through the System

PRD ref: `prd.md > The Core Journey`.

1. The developer opens a small Git-backed project in VS Code and starts the local service with the visible development command.
2. The extension watches the active file. The user can invoke `Explain This Change` manually, or a debounced save event can start the flow when the active file has a non-empty Git diff.
3. The extension sends a quiz-start request to the local service containing the workspace root, active file path, language, and optional changed-region metadata. It does not send credentials, unrelated files, or a full repository scan.
4. The service starts or reuses the local MCP server for the session. The model receives the agent skill, the allowed MCP tool descriptions, and the initial change metadata.
5. If more context is needed, the model selects a read-only MCP tool. The service calls the MCP server, receives the bounded code context, and continues the model turn.
6. The model returns a strict quiz contract containing the host introduction, exactly four questions, a validated 2/2 or 3/1 mix of answer formats, grading rubrics, edge-case explanations, and Trust Receipt evidence.
7. The service stores that quiz in memory and returns the first question to the extension. The extension renders the retro host interface.
8. The developer answers. The extension sends only the current question identifier, rubric reference, and answer to the service. The service makes a small grading request and returns concise feedback plus a score contribution.
9. After the final answer, the service calculates the session result and returns the final score, review areas, and Trust Receipt. The extension renders the reveal and keeps it visible until the user closes the surface.

## Stack

- **TypeScript** for the extension, local service, shared types, and MCP server. The learner already has substantial application and AI-agent experience; one language keeps the POC coherent.
- **VS Code Extension API** for commands, workspace/document events, Git diff access, and the quiz webview. Documentation: https://code.visualstudio.com/api
- **Node.js local service** using a small HTTP server. It keeps the API key and agent orchestration outside the webview while remaining easy to start and log locally. Exact Node version should be pinned during the first build based on the installed runtime.
- **VS Code Webview** for the retro host, quiz cards, answer controls, feedback, score, and Trust Receipt. Documentation: https://code.visualstudio.com/api/extension-guides/webview
- **OpenAI Responses API** for quiz generation and answer grading. The model name is configured with `EXPLAINIT_MODEL`; no model is hard-coded into the UI. Responses structured output uses JSON Schema so the extension receives predictable data. Documentation: https://platform.openai.com/docs/api-reference/responses and https://platform.openai.com/docs/guides/structured-outputs
- **MCP TypeScript SDK** for the local read-only context server and its client connection. Documentation: https://modelcontextprotocol.io/docs and https://github.com/modelcontextprotocol/typescript-sdk
- **Git CLI or VS Code Git integration** for the active file’s diff. The POC only needs the focused file and a non-empty change; it does not need a full repository model.

## Where It Runs and How Someone Tries It

Explainit runs locally on the learner’s Mac. Deployment is not required; the required artifact is a short demo video plus a public GitHub repository.

Prerequisites:

- Node.js and npm installed;
- VS Code installed;
- a small Git-backed demo workspace;
- an OpenAI API key supplied locally by the user, never requested in chat or committed to the repository.

Planned setup and demo flow:

1. Run `npm install` in the repository.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` and `EXPLAINIT_MODEL` locally.
3. Run `npm run dev:service` in a visible terminal. This starts the local Explainit service and its read-only MCP child process with logs enabled.
4. Open the repository in VS Code and press `F5` to launch an Extension Development Host.
5. In the development host, open a small demo project, make or apply one focused code change, save it, or run `Explain This Change` from the Command Palette.
6. Record the avatar introduction, one free-form or selectable answer, immediate feedback, the remaining short quiz, final score, Trust Receipt, and visible service/MCP logs.

The exact script names and local port are implementation details to verify in the first build. The intended experience is a visible terminal plus an Extension Development Host, not a deployed site.

## Look and Feel

Implements `prd.md > Look and Feel` and `prd.md > Screens and Layout`.

- A polished retro video-game game-show style that clearly contrasts with the VS Code window.
- A restrained retro palette with readable text and no clashing colors.
- A compact avatar icon as the host’s main personality cue.
- Chat-like conversation layout that still feels native to an IDE agent panel.
- Game energy through host copy, question cards, progress, reactions, score reveal, and Trust Receipt evidence—not through excessive animation.
- Retro typography or pixel-inspired accents may be used for headings and score moments, while body copy remains highly legible.

## Components

### VS Code Extension Activation and Commands

Implements `prd.md > Change-triggered quiz` and `prd.md > The Core Journey`.

Registers the `Explain This Change` command, starts the quiz flow, and connects the Extension Development Host to the local service. It owns the local user interaction boundary but never stores the API key.

### Change Detector

Implements `prd.md > Change-triggered quiz` and `prd.md > States and Boundaries`.

Listens for active-document saves with debounce protection. It captures a bounded description of the newest text edit, including inserted or deleted text and its line range, and sends that signal alongside the focused Git diff. The newest edit is the quiz subject; the Git diff and nearby context provide supporting history. The manual command can bypass the automatic detector’s threshold, but it still sends only focused-file metadata; the MCP server obtains the bounded diff and nearby context.

### Quiz Webview

Implements `prd.md > Screens and Layout`, `prd.md > Look and Feel`, and `prd.md > Answer feedback and final score`.

Renders the avatar host, change context, question progress, free-form or selectable answer controls, immediate feedback, final score, and Trust Receipt. It receives structured view-model messages from the extension and sends user actions back through a narrow message interface.

### Local Explainit Service

Implements `prd.md > Agent-governed host`, `prd.md > Answer feedback and final score`, and `prd.md > Graceful skip`.

Runs as a visible local Node process. It exposes a small localhost HTTP API for starting a quiz and submitting answers. It owns the in-memory session, model calls, call budget, graceful fallbacks, and logs.

### Explainit Agent Skill

Implements `prd.md > Agent-governed host`.

The skill is a versioned instruction and contract that defines the host’s role, allowed context, maximum question count, mixed answer formats, grading behavior, game-show tone, privacy boundary, and Trust Receipt fields. It is not a fixed quiz; it instructs the model how to decide what is worth testing for the current change.

### MCP Context Server

Implements `prd.md > Agent-governed host`, `prd.md > Graceful skip`, and `prd.md > Trust Receipt`.

Runs locally over a stdio connection and exposes read-only tools. The initial tools are:

- `get_focused_change`: returns the active file path, language, bounded diff, and a change fingerprint;
- `get_nearby_context`: returns bounded lines around the changed region;
- `get_workspace_metadata`: returns only safe metadata such as workspace name and language, not secrets or arbitrary file contents.

The service validates tool arguments, limits output size, blocks secret-like paths, and records which tools were used for the Trust Receipt.

### Model Adapter

Implements `prd.md > Agent-governed host` and `prd.md > Answer feedback and final score`.

Uses the OpenAI Responses API through the official TypeScript SDK or direct HTTPS from the local service. It translates the agent skill and MCP tool schemas into the model request, validates structured responses, and normalizes failures into the service’s skip/error states.

### Session Store

Implements `prd.md > States and Boundaries` and `prd.md > Trust Receipt`.

Keeps one active quiz session in memory. It stores the change fingerprint, generated questions, grading rubrics, answers, score contributions, tool-use evidence, and receipt data. It is discarded when the session closes or the service restarts; no database or persistent history is part of the POC.

## Data Model

All state is local to the running service and held in memory.

```ts
type QuizSession = {
  id: string;
  change: {
    filePath: string;
    language: string;
    fingerprint: string;
    diffSummary: string;
  };
  questions: Question[];
  answers: Answer[];
  toolEvidence: ToolEvidence[];
  score: number;
  status: "generating" | "active" | "complete" | "skipped";
  createdAt: string;
};

type Question = {
  id: string;
  prompt: string;
  answerType: "free_text" | "single_choice";
  options?: string[];
  rubric: string;
  feedback: string;
  edgeCase?: string;
};

type Answer = {
  questionId: string;
  value: string;
  correctness: "correct" | "partial" | "incorrect";
  explanation: string;
};

type ToolEvidence = {
  toolName: string;
  purpose: string;
  summary: string;
};
```

The source data originates in the active VS Code workspace and Git diff. The MCP server reads it only for the current request. The service transforms it into quiz questions and stores the resulting session in memory. When the user leaves or the service restarts, the session disappears.

## File Structure

```text
explainit/
├── extension/
│   ├── src/
│   │   ├── extension.ts              # Activate extension, register command, wire events
│   │   ├── change-detector.ts        # Debounced save handling and focused diff trigger
│   │   ├── service-client.ts         # Typed localhost requests to the local service
│   │   ├── quiz-panel.ts              # Create/manage the VS Code webview panel
│   │   └── messages.ts                # Extension ↔ webview message types
│   ├── media/
│   │   └── avatar.svg                # Retro host avatar asset
│   ├── package.json                   # VS Code contribution points and scripts
│   └── tsconfig.json
├── service/
│   ├── src/
│   │   ├── server.ts                  # Local HTTP server and request routes
│   │   ├── session-store.ts           # In-memory quiz sessions and call budget
│   │   ├── agent/
│   │   │   ├── orchestrator.ts        # Agent loop, MCP tool bridge, model calls
│   │   │   ├── skill.md                # Explainit host skill and safety rules
│   │   │   └── schemas.ts              # Structured quiz/grade/receipt schemas
│   │   ├── mcp/
│   │   │   ├── client.ts              # Connect to the local MCP child process
│   │   │   └── server.ts              # Read-only workspace context tools
│   │   ├── model/
│   │   │   └── openai-adapter.ts      # Responses API request/response handling
│   │   └── workspace/
│   │       ├── diff.ts                # Git diff and changed-region extraction
│   │       └── safety.ts              # Secret-like path and size filtering
│   ├── package.json
│   └── tsconfig.json
├── shared/
│   └── src/contracts.ts                # Shared API and view-model types
├── .env.example                        # Variable names only, no secrets
├── package.json                         # Workspace scripts and shared dev commands
├── README.md                            # Setup, demo, and troubleshooting
└── devpost/                             # Planning documents
```

## External Services and Dependencies

### OpenAI Responses API

Endpoint: `POST https://api.openai.com/v1/responses`.

Authentication: `Authorization: Bearer $OPENAI_API_KEY`; the key exists only in the local service environment.

Request shape, expressed through the official SDK or equivalent HTTPS JSON:

```json
{
  "model": "${EXPLAINIT_MODEL}",
  "input": [
    {"role": "system", "content": "<Explainit agent skill>"},
    {"role": "user", "content": "<focused change metadata>"}
  ],
  "tools": ["<bridged MCP tool definitions>"],
  "text": {
    "format": {
      "type": "json_schema",
      "name": "explainit_quiz",
      "strict": true,
      "schema": "<quiz schema>"
    }
  }
}
```

The generation response is normalized into the local `QuizSession` shape. Grading calls use the same endpoint with the current question’s rubric and the user’s answer, returning a strict object containing `correctness`, `explanation`, `scoreContribution`, and `reviewArea`.

The service should preserve stable instructions and use a session-local cache to avoid resending the full code context. `previous_response_id` or prompt caching may be investigated during the build, but neither is treated as permanent memory or a free-tier guarantee. Account-specific pricing, model availability, and rate limits must be checked before the first live call. Official references: https://platform.openai.com/docs/api-reference/responses, https://platform.openai.com/docs/guides/structured-outputs, https://help.openai.com/en/articles/5955604-how-can-i-solve-my-429-too-many-requests-errors

### Local MCP server

Transport: local stdio child process managed by the Explainit service.

Protocol: MCP tools with JSON Schema input and bounded structured/text output.

The service discovers the server’s tools, maps their schemas into the model’s callable tool definitions, invokes a selected tool, and returns the result to the model. The server never exposes arbitrary shell commands, writes, network access, credentials, or unrestricted repository search. Official references: https://modelcontextprotocol.io/docs/concepts/architecture and https://modelcontextprotocol.io/specification/2025-06-18/server/tools

### VS Code Extension API

The extension is installed locally in an Extension Development Host during the POC. It uses documented command, workspace/document event, webview, and Git integration capabilities. Official reference: https://code.visualstudio.com/api

## Important Failure Modes

- **OpenAI key missing, credits exhausted, or rate limited** → show a friendly host message, log the actionable error in the local service, and offer the clearly labeled demo fixture so the UI can still be demonstrated without pretending the live agent ran.
- **MCP server cannot start or a tool returns unusable context** → show a polite skip, record the failure in logs, and never send a guessed or unrestricted workspace snapshot to the model.
- **No focused Git diff** → the automatic trigger does nothing; the manual command shows a concise “nothing focused enough to quiz yet” message.
- **Model returns invalid structure or too many questions** → validate against the schema, retry once with a concise repair request if within the session budget, then skip rather than render malformed quiz state.

## What Was Simplified and Why

- **One active file and bounded nearby context** instead of full-project indexing — preserves the kernel while controlling privacy, token use, and implementation time.
- **Manual service startup** instead of extension-managed background startup — makes logs and testing visible for the POC and demo recording.
- **In-memory session store** instead of accounts or a database — the proof is the live quiz and Trust Receipt, not history.
- **One local MCP server with read-only tools** instead of a broad tool ecosystem — provides a genuine MCP learning artifact without adding unsafe or unnecessary capabilities.
- **Four-call session budget** instead of an unconstrained agent loop — limits rate-limit and cost risk while preserving generation plus per-answer feedback.
- **Demo fixture fallback** instead of claiming the model always works — keeps the visual demo resilient while clearly distinguishing simulated output from live agent output.

## Decisions and Open Issues

### Decisions

- TypeScript across the extension, service, shared contracts, and MCP server — accepted to keep one language across the POC.
- Manual local startup — chosen for visible logs and a clear demo video.
- OpenAI model calls through a configurable environment variable — accepted with the understanding that API free-tier availability is account-specific and not guaranteed.
- A local read-only MCP server — chosen to demonstrate discoverable workspace tools and agent-selected context.
- Active-file Git diff with a manual command fallback — chosen to keep the trigger understandable and reliable.
- Bounded context only — no credentials, unrelated files, or full repository scan.
- Trust Receipt — added as the standout feature that makes context use and agent behavior visible to judges.

### One useful uncertainty clarified

The learner initially wanted to use MCP to preserve context and reduce repeated model input. We clarified that MCP standardizes how an agent discovers and invokes context tools; it does not itself provide free usage or permanent memory. Explainit will therefore use MCP for controlled, on-demand workspace context and an in-memory session store for quiz continuity, while keeping the model-call budget explicit.

### Open issues

- **Exact installed Node and VS Code versions** — verify during setup; pin only what the local environment supports.
- **Exact MCP TypeScript SDK package/version and protocol revision** — verify before implementation because the protocol and SDK evolve.
- **Model name and account limits** — choose after checking the learner’s API project limits; keep it configurable.
- **Exact Git diff extraction method** — verify with a tiny demo repository during the first build step.
- **Retro avatar asset** — create or choose a simple secret-free local asset during build; it must remain readable at small size.
