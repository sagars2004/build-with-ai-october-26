---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [ ] **1. Explainit opens a playable retro quiz surface from VS Code**
  Becomes usable: The extension launches in an Extension Development Host, the `Explain This Change` command opens the retro game-show webview, and a clearly labeled fixture quiz can be played through one question and feedback.
  Why now: Bootstraps the project while proving the visible kernel early—the avatar-led interruption and quiz experience exist before hidden integrations are added.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > VS Code Extension Activation and Commands`, `spec.md > Quiz Webview`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > File Structure`
  Build: Scaffold the TypeScript VS Code extension, shared contracts, webview, retro avatar placeholder, command registration, local development scripts, and a clearly labeled fixture path that renders the host, one question, answer control, feedback, and progress.
  Verify (mechanical): Run the TypeScript compile/typecheck command; launch the Extension Development Host; run `Explain This Change`; submit the fixture answer; confirm the panel renders without extension-host errors and shows feedback.
  Learner check: Open the Extension Development Host, run the command, play the fixture question, and report whether the retro host surface feels distinct from VS Code and whether the interaction is understandable.
  Commit: `Add playable Explainit extension shell`

- [ ] **2. Explainit can inspect one focused code change through MCP**
  Becomes usable: The local service and read-only MCP server start visibly, expose bounded workspace tools, and return the active file’s focused Git diff and nearby context for a manual quiz request.
  Why now: MCP is the main unfamiliar technical risk and the core differentiator; proving the tool boundary early prevents building a quiz experience that cannot access the intended context.
  PRD ref: `prd.md > Change-triggered quiz`, `prd.md > Agent-governed host`, `prd.md > Graceful skip`
  Spec ref: `spec.md > MCP Context Server`, `spec.md > Local Explainit Service`, `spec.md > Data Model`, `spec.md > Important Failure Modes`
  Build: Add the visible local Node service, MCP child process/client, read-only focused-change and nearby-context tools, Git diff extraction, path/size safety filters, service logs, and an extension request that displays the returned context summary. Keep model output fixture-backed for this slice.
  Verify (mechanical): Run the service command; call its focused-change endpoint against a tiny Git demo workspace; confirm logs show MCP discovery and a bounded tool call; run the extension command and confirm the returned file/diff summary appears without unrelated files.
  Learner check: Start the visible service, make one small change in a demo file, run `Explain This Change`, and report what the logs and panel show about the context Explainit inspected.
  Commit: `Add bounded MCP workspace context`

- [ ] **3. The agent generates a real short quiz from the focused change**
  Becomes usable: With a local API key configured, Explainit uses the agent skill and MCP context to generate up to three structured questions with mixed answer formats, while the fixture fallback remains available when the model is unavailable.
  Why now: This connects the proven UI and MCP boundary to the AI kernel and tests the most important external dependency before adding the full scoring flow.
  PRD ref: `prd.md > Agent-governed host`, `prd.md > States and Boundaries`, `prd.md > Graceful skip`
  Spec ref: `spec.md > Explainit Agent Skill`, `spec.md > Model Adapter`, `spec.md > External Services and Dependencies > OpenAI Responses API`, `spec.md > Important Failure Modes`
  Build: Add the versioned agent skill, structured quiz schemas, OpenAI Responses API adapter, MCP tool bridge, configurable model/key environment variables, four-call session budget, validation, one repair attempt, visible request/error logs, and clearly labeled fixture fallback.
  Verify (mechanical): Run typecheck and the service integration smoke test with a fixture response; with live configuration available, make one focused change and confirm a valid structured quiz is returned with no more than three questions; simulate missing-key or invalid-output handling and confirm the graceful fallback/skip.
  Learner check: Run one live quiz if API access is available, compare the questions with the code change, and report whether the agent tested something genuinely specific rather than producing a generic code explanation.
  Commit: `Generate agent-guided quizzes`

- [ ] **4. The quiz grades answers and produces the Trust Receipt**
  Becomes usable: The developer answers each question one at a time, receives brief correctness feedback, sees a final understanding score and review areas, and receives a concise Trust Receipt showing context inspected, question rationale, tested edge case, and next review step.
  Why now: Completes the learning loop and makes the MCP/agent behavior visible to a judge; this is the main end-to-end proof of the product kernel.
  PRD ref: `prd.md > Answer feedback and final score`, `prd.md > Trust Receipt`, `prd.md > States and Boundaries`, `prd.md > What We're Building`
  Spec ref: `spec.md > Quiz Webview`, `spec.md > Model Adapter`, `spec.md > Session Store`, `spec.md > Data Model`
  Build: Add answer submission contracts, per-question grading, score aggregation, receipt evidence from MCP tool use and quiz generation, completed-session state, and retro score/receipt UI. Keep the session in memory and enforce the call budget.
  Verify (mechanical): Run typecheck and service tests for correct, partial, incorrect, and skipped sessions; play a full fixture quiz and confirm feedback appears after each answer, the score is shown after the last question, and the Trust Receipt contains the expected evidence fields.
  Learner check: Play the complete quiz against a focused change, inspect the final score and Trust Receipt, and report whether the receipt makes the agent’s behavior understandable without opening source code.
  Commit: `Complete quiz scoring and trust receipt`

- [ ] **5. Saved-change triggering and demo polish work end to end**
  Becomes usable: A debounced save of a non-empty active-file Git diff can start the same quiz, repeated minor edits do not create an uncontrolled stream, and the local demo path is ready to record.
  Why now: Adds the automatic spectacle only after the manual path, MCP context, live agent, and result experience are reliable; it keeps trigger noise from obscuring earlier failures.
  PRD ref: `prd.md > Change-triggered quiz`, `prd.md > Repeated trigger`, `prd.md > Look and Feel`, `prd.md > What We're Building`
  Spec ref: `spec.md > Change Detector`, `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Important Failure Modes`
  Build: Add debounced saved-diff detection, duplicate-session protection, final retro styling and avatar asset, loading/skip/error states, README setup/demo instructions, and a short reproducible demo script.
  Verify (mechanical): Run the full typecheck/build checks; in a Git demo workspace save a meaningful change and confirm one quiz opens; save minor edits repeatedly and confirm no quiz storm; test no-diff and service-unavailable states; follow the README demo steps from a clean terminal.
  Learner check: Run the complete demo from the visible terminal through the Extension Development Host, try the automatic and manual triggers, and report what should be refined before final review.
  Commit: `Polish saved-change demo flow`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2, inspect the retro quiz shell plus the visible MCP context logs and give feedback before the live model integration.
- [ ] Final kick-the-tires exploration and feedback completed — after slice 5, run the complete manual and automatic flows, try no-diff/service-unavailable cases, and report refinements.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — connect the MCP/agent boundary to a real quiz session and verification evidence
- [ ] Optional edit and transfer reflection addressed — offer one safe edit or a brief transfer reflection after the tour
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to complete after the build; expected route is extension command → local service → MCP tool → model adapter → webview result]
Route and stops: [to complete from actual source symbols after implementation]
Edit outcome: [to complete]
Reflection: [to complete]
Activity mode: [to complete]

## Revisions

- Added root VS Code launch and task configuration after the first hands-on attempt showed that pressing `F5` did not launch the nested `extension/` package as an Extension Development Host. The extension manifest and compiled activation were correct; the missing launch target prevented the command from appearing. The launch target was then simplified to avoid reopening the normal workspace window.
