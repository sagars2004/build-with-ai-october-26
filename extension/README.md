# Explainit

Explainit is a retro game-show host for understanding AI-assisted code changes in VS Code.

## Normal-window setup

1. Start the local service from the Explainit workspace with `npm run dev:service`.
2. Package the extension with `npm run package:extension`.
3. Install `explainit-0.1.0.vsix` in VS Code with **Extensions: Install from VSIX...**.
4. Open the Git-tracked project you want to inspect in the same normal VS Code window.
5. Use **Explain This Change** or save a meaningful change. You can also use `@explainit` in VS Code Chat.

The Extension Development Host launched by F5 remains available for extension debugging; the VSIX workflow is the normal-window demo path.
