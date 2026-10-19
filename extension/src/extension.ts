import * as vscode from "vscode";
import { FixtureQuiz } from "./messages";
import { QuizPanel } from "./quiz-panel";
import * as http from "node:http";

const fixtureQuiz: FixtureQuiz = {
  title: "THE CODE MYSTERY",
  intro: "Welcome to Explainit! Today’s mystery: what did the agent really do? Prove you were paying attention.",
  changeLabel: "src/cart.ts · calculateTotal()",
  questionNumber: 1,
  totalQuestions: 3,
  question: "What happens if the cart is empty?",
  answerType: "single_choice",
  options: [
    { id: "zero", label: "A. It returns 0 and the checkout can continue." },
    { id: "undefined", label: "B. It returns undefined and the UI crashes." },
    { id: "throws", label: "C. It throws an error before the total is shown." },
  ],
  correctOptionId: "zero",
  feedback: "The reducer starts at 0, so an empty cart produces a safe zero total. That is the edge case this question was testing.",
};

function requestContext(workspaceRoot: string, filePath: string, language: string): Promise<{ filePath: string; diff: string; toolsUsed: string[] }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ workspaceRoot, filePath, language });
    const request = http.request(
      { hostname: "127.0.0.1", port: 4242, path: "/context", method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { responseBody += chunk; });
        response.on("end", () => {
          if (response.statusCode !== 200) return reject(new Error(responseBody || "Explainit service unavailable"));
          const payload = JSON.parse(responseBody) as { context: { filePath: string; diff: string; toolsUsed: string[] } };
          resolve(payload.context);
        });
      },
    );
    request.on("error", reject);
    request.setTimeout(2000, () => {
      request.destroy(new Error("Explainit service timed out; opening fixture mode."));
    });
    request.end(body);
  });
}

export function activate(context: vscode.ExtensionContext): void {
  const panel = new QuizPanel(context.extensionUri);
  const command = vscode.commands.registerCommand(
    "explainit.explainThisChange",
    async () => {
      // Open immediately so a slow or unavailable local service never makes the command feel inert.
      panel.show(fixtureQuiz);
      const editor = vscode.window.activeTextEditor;
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (editor && workspaceRoot) {
        try {
          const context = await requestContext(workspaceRoot, editor.document.uri.fsPath, editor.document.languageId);
          panel.show({ ...fixtureQuiz, changeLabel: context.filePath, contextSummary: `${context.diff.split("\n")[0]} …`, toolsUsed: context.toolsUsed });
          return;
        } catch (error) {
          console.warn(`[explainit] using fixture quiz: ${String(error)}`);
        }
      }
    },
  );

  context.subscriptions.push(command);
}

export function deactivate(): void {}
