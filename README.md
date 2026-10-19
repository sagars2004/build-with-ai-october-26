# build-with-ai-october-26
Build with AI: Basics hackathon project for October 2026.

## Normal VS Code window

For the one-window workflow, build and install the local extension once:

```bash
npm install
npm run package:extension
```

In VS Code, run **Extensions: Install from VSIX...** and choose `explainit-0.1.0.vsix`. Then open the Git-tracked project you want to work on in that same normal VS Code window. Start the visible service with `npm run dev:service` from this repository, or run the **Start Explainit Service** task from this workspace.

The installed extension handles saved edits and `@explainit` chat prompts without F5. F5 remains the separate Extension Development Host workflow for debugging Explainit itself.
