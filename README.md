# ExplainIt

**Don't just vibe-code: understand it.**  

ExplainIt is an MCP-powered VS Code extension that turns saved AI edits into rapid in-editor comprehension quizzes—catching runtime bugs, state transitions, and edge cases before you blindly hit accept.

Made for the **Build with AI: Basics** Hackathon (October 2026).

---

## Overview

When developers write code with AI assistants (Copilot, Cursor, autonomous agents), it is easy to fall into the **"looks good to me" reflex**—glancing at a 40-line diff for three seconds and hitting save, only to spend hours later debugging an unhandled edge case or broken state transition.

**ExplainIt flips the dynamic.** Instead of the AI passively answering your questions, an autonomous, retro game-show host intercepts your momentum the moment you save a file. It analyzes the *discrete latest edit* using local Model Context Protocol (MCP) tools and challenges you with a rapid, 4-question comprehension quiz right inside your IDE. 

Understanding is the reward and the gate: you explain the change back before you feel finished with it.

---

## Key Features

* **Automatic Saved-Change Interception:** Watches active workspace documents and debounces save events (1200ms) to trigger quizzes without manual copy-pasting.
* **Discrete Edit Isolation:** Detects the *newest insertion, deletion, or replacement* rather than getting confused by large, pre-existing Git diffs.
* **Retro Game-Show UI:** Polished, arcade-style Webview featuring a custom pixel avatar, vibrant retro palette (`#ffca58`, `#ff6fbe`, `#74e0a1`), question timers, and reactive answer locking.
* **Dynamic 4-Question Challenges:** Strictly balances recognition and explanation using either a **2 single-choice + 2 free-form** or **3 single-choice + 1 free-form** structure.
* **Instant In-Editor Grading:** Evaluates single-choice options and uses heuristic keyword/stem matching to evaluate free-form explanations, acknowledging honest "I don't know" admissions without crashing.
* **The Trust Receipt:** Generates a post-quiz evidence card detailing the exact bounded context read, MCP tools invoked, concepts tested, and recommended review areas.
* **In-Editor Chat Participant (`@explainit`):** Mention `@explainit` in VS Code Chat to get playful, code-aware commentary on your prompts during vibe-coding sessions.
* **Graceful Fixture Fallback:** If the local AI service or model provider is unreachable, ExplainIt instantly provides a labeled fixture challenge so your development flow is never blocked.

---

## Architecture & Request Flow

ExplainIt consists of three local layers that communicate cleanly over localhost HTTP and standard IO:

```
┌────────────────────────────────────────────────────────┐
│               VS Code (Host Environment)               │
│  - extension.ts   : Save watcher & discrete edit delta │
│  - quiz-panel.ts  : Retro Webview UI & instant grading │
│  - @explainit     : Native VS Code Chat participant    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST (http://127.0.0.1:4242)
                            ▼
┌────────────────────────────────────────────────────────┐
│                ExplainIt Local Service                 │
│  - server.ts      : API routes (/quiz, /observe)       │
│  - agent.ts       : System prompts & Zod repair loop   │
│  - config.ts      : Multi-provider LLM configuration   │
└───────────────────────────┬────────────────────────────┘
                            │ stdio (MCP Client Transport)
                            ▼
┌────────────────────────────────────────────────────────┐
│               MCP Context Server (Child)               │
│  - mcp/server.ts  : Model Context Protocol tools       │
│  - workspace/git  : Bounded git diff & nearby context  │
│  - safety.ts      : Sanitizes secrets & blocklists .env│
└────────────────────────────────────────────────────────┘
```

### Read-Only MCP Tools:
1. `get_focused_change`: Extracts the active file's Git diff and fingerprint.
2. `get_nearby_context`: Reads surrounding committed code via `git show HEAD:<file>` (bounded to 8,000 characters).
3. `get_workspace_metadata`: Returns safe workspace name and language identifiers.
4. **Safety Filter:** Hard-blocks `.env`, `.env.*`, `credentials.json`, `secrets.json`, and directory traversal attempts.

---

## Prerequisites & Configuration

### Prerequisites
* **Node.js** (v18+ or v20+ recommended) & **npm**
* **VS Code** (v1.90.0+)
* **Git** installed on your system

### Configuration
1. Clone the repository and install dependencies from the root:
   ```bash
   git clone <repo-url>
   cd build-with-ai-october-26
   npm install
   ```

2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and configure your preferred AI provider. ExplainIt supports multiple providers out of the box:
   ```env
   # Choose your provider: "gemini", "groq", "openai", or "nvidia"
   EXPLAINIT_PROVIDER=gemini
   
   # Provide the corresponding API key for your chosen provider:
   GEMINI_API_KEY=your_gemini_api_key_here
   EXPLAINIT_MODEL=gemini-3.8-flash

   # Or Groq:
   # GROQ_API_KEY=your_groq_api_key_here
   # EXPLAINIT_MODEL=openai/gpt-oss-20b

   # Or OpenAI:
   # OPENAI_API_KEY=your_openai_api_key_here
   # EXPLAINIT_MODEL=gpt-4o-mini
   ```
   *(Note: Never commit your `.env` file. Keys are read only by your local service and never sent to the browser or extension webview.)*

---

## How to Run & Test: Two Workflows

You can run and test ExplainIt in one of two ways depending on whether you want a single-window production experience or an active extension development environment:

### Method 1: Single Normal VS Code Window (Recommended via `.vsix`)

This workflow lets you use ExplainIt inside your normal, everyday VS Code window alongside any existing Git project.

1. **Build the extension package:**
   ```bash
   npm run package:extension
   ```
   *(This compiles TypeScript and generates `explainit-0.1.0.vsix` in the repository root.)*

2. **Install into VS Code:**
   * Open VS Code.
   * Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows/Linux).
   * Type and select: **Extensions: Install from VSIX...**
   * Choose `explainit-0.1.0.vsix`.

3. **Start the local service:**
   In a terminal tab inside this repository, run:
   ```bash
   npm run dev:service
   ```
   *(The service will start on `http://127.0.0.1:4242` and launch the MCP child process.)*

4. **Code and Test:**
   * Open any Git-backed project in VS Code.
   * Make a code edit and save the file (`Cmd+S`). ExplainIt will pop up on the side with a quiz!
   * Or open the Command Palette and run **Explain This Change**.

---

### Method 2: Two-Window Workflow (Extension Development Host via `F5`)

If you want to debug the extension code, inspect console logs, or make frontend changes:

1. Open this repository in VS Code.
2. Start the local background service:
   ```bash
   npm run dev:service
   ```
3. Press **`F5`** (or select **Run and Debug** -> **Launch Extension**).
4. A second VS Code window will open labeled **[Extension Development Host]**.
5. In that second window, open any small Git-backed demo folder.
6. Make an edit to a file, save it, or run `Explain This Change` from the Command Palette.

---

## Step-by-Step Testing & Verification Guide

1. **Test the Automatic Trigger:**
   * Open a tracked file (e.g., `src/index.ts`).
   * Add a new helper function or modify an existing return statement.
   * Save the file. After a 1.2-second debounce, the ExplainIt panel will open beside your code with the avatar greeting.
2. **Play Through a Quiz:**
   * Answer Question 1 (Single-choice). Notice the instant correctness banner and edge-case explanation.
   * Click **Next Question** to move forward through the remaining questions (including free-form explanation rounds).
   * Review your **Final Score** and the **Trust Receipt** showing inspected files and MCP tools used.
3. **Test the `@explainit` Chat Participant:**
   * Open the VS Code Chat panel (`Cmd+Alt+I`).
   * Mention `@explainit` with a prompt:  
     `@explainit I'm adding an authorization check before the cart calculation.`
   * The host will respond with playful, focused commentary on what edge cases to watch out for.
4. **Test Graceful Fallback Mode:**
   * Stop the local service (`Ctrl+C` in the terminal).
   * Run **Explain This Change** in VS Code.
   * Notice that the extension does not crash or hang; it immediately opens in labeled **Fixture Mode** so you can still preview the UI.

---

## Devpost Learn Skill Pack Process

ExplainIt was built from scratch following the **Devpost Learn Skill Pack** (`1-start` through `6-ship`), utilizing a disciplined plan-first process:

1. **`1-start` (Learner Profile):** Established developer background, project goals, and interest in exploring Model Context Protocol (MCP) and autonomous agent task boundaries.
2. **`2-scope` (Project Scope):** Sharpened the initial concept from a generic code explainer into an in-editor game-show quiz that turns comprehension into the gate. Produced [`devpost/scope.md`](file:///Users/sagarsahu/Desktop/Projects/build-with-ai-october-26/devpost/scope.md).
3. **`3-prd` (Product Requirements):** Defined user journeys, screens, question format constraints, skip behaviors, and the Trust Receipt concept. Produced [`devpost/prd.md`](file:///Users/sagarsahu/Desktop/Projects/build-with-ai-october-26/devpost/prd.md).
4. **`4-spec` (Technical Specification):** Architected the system into a local Node service, MCP stdio server, VS Code Webview, and JSON Schema self-repair pipeline. Produced [`devpost/spec.md`](file:///Users/sagarsahu/Desktop/Projects/build-with-ai-october-26/devpost/spec.md).
5. **`5-build` (Ordered Vertical Slices):** Executed the build across 5 verified slices tracked in [`devpost/checklist.md`](file:///Users/sagarsahu/Desktop/Projects/build-with-ai-october-26/devpost/checklist.md):
   * *Slice 1:* Playable retro quiz extension shell and Webview.
   * *Slice 2:* Read-only MCP server with Git diff and context tools.
   * *Slice 3:* Agent skill integration, JSON Schema enforcement, and multi-provider LLM adapter.
   * *Slice 4:* Instant answer grading, final score reveals, and the Trust Receipt.
   * *Slice 5:* Debounced saved-change detector, discrete edit deltas, and `@explainit` chat participant.
6. **`6-ship` & App Map:** Validated end-to-end functionality, mapped the full architecture in [`devpost/app-map.html`](file:///Users/sagarsahu/Desktop/Projects/build-with-ai-october-26/devpost/app-map.html), and packaged the standalone `.vsix`.

---

## Repository Structure

```text
build-with-ai-october-26/
├── devpost/                       # Planning documentation from Skill Pack
│   ├── learner-profile.md         # Initial learner interview & goals
│   ├── scope.md                   # Problem, audience, and POC boundary
│   ├── prd.md                     # Product requirements & UX rules
│   ├── spec.md                    # Technical blueprint & MCP architecture
│   ├── checklist.md               # 5-slice build log & verification record
│   ├── project-story.md           # Submission write-up & narrative
│   └── app-map.html               # Visual SVG architecture & request map
├── extension/                     # VS Code Extension
│   ├── src/
│   │   ├── extension.ts           # Save listener, discrete edit tracking, commands
│   │   ├── quiz-panel.ts          # Webview renderer, heuristic grader, Trust Receipt
│   │   └── messages.ts            # Type contracts
│   ├── media/
│   │   └── avatar.svg             # Pixel-art host avatar
│   └── package.json               # Extension manifest & contributes
├── service/                       # Local Daemon & Agent Service
│   ├── src/
│   │   ├── server.ts              # Local HTTP API (/quiz, /observe, /context)
│   │   ├── agent.ts               # Agent prompt, Zod schemas, self-repair loop
│   │   ├── config.ts              # Multi-provider provider configuration
│   │   ├── quiz-schema.ts         # Zod schemas for structured quiz outputs
│   │   ├── mcp/
│   │   │   ├── server.ts          # Read-only MCP server over stdio
│   │   │   └── client.ts          # MCP client connection manager
│   │   └── workspace/
│   │       ├── git.ts             # Bounded git diff & show helpers
│   │       └── safety.ts          # Path traversal & secret file filter
│   └── package.json
├── explainit-0.1.0.vsix           # Pre-packaged VS Code extension
├── .env.example                   # Environment configuration template
├── package.json                   # Root monorepo workspace scripts
└── README.md                      # Documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE).
