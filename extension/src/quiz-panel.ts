import * as vscode from "vscode";
import { FixtureQuiz } from "./messages";

export class QuizPanel {
  private panel?: vscode.WebviewPanel;

  constructor(private readonly extensionUri: vscode.Uri) {}

  show(quiz: FixtureQuiz): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      this.panel.webview.html = this.render(quiz);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "explainitQuiz",
      "Explainit",
      vscode.ViewColumn.Beside,
      { enableScripts: true },
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage(
      (message: { type: string; optionId?: string }) => {
        if (message.type !== "submitAnswer" || !message.optionId) return;

        const isCorrect = message.optionId === quiz.correctOptionId;
        void this.panel?.webview.postMessage({
          type: "answerFeedback",
          isCorrect,
          feedback: isCorrect
            ? quiz.feedback
            : `Not quite. ${quiz.feedback}`,
        });
      },
    );

    this.panel.webview.html = this.render(quiz);
  }

  private render(quiz: FixtureQuiz): string {
    const avatarUri = this.panel
      ? this.panel.webview.asWebviewUri(
          vscode.Uri.joinPath(this.extensionUri, "media", "avatar.svg"),
        )
      : "";
    const options = quiz.options
      .map(
        (option) =>
          `<button class="option" data-option-id="${option.id}">${option.label}</button>`,
      )
      .join("");

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Explainit</title>
    <style>
      :root {
        color-scheme: dark;
        --ink: #f8f7ff;
        --muted: #a9aac0;
        --panel: #18152d;
        --panel-2: #221d40;
        --accent: #ffca58;
        --pink: #ff6fbe;
        --green: #74e0a1;
        --border: #514878;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background: radial-gradient(circle at top right, #34265f, #0e0c1b 58%);
        color: var(--ink);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .shell { max-width: 720px; margin: 0 auto; padding: 28px; }
      .topline { display: flex; align-items: center; gap: 14px; }
      .avatar { width: 58px; height: 58px; image-rendering: pixelated; }
      .eyebrow { color: var(--accent); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; }
      h1 { margin: 4px 0 0; font-size: 25px; letter-spacing: -.04em; }
      .intro, .message, .receipt { background: rgba(24, 21, 45, .92); border: 1px solid var(--border); border-radius: 12px; padding: 18px; box-shadow: 0 10px 35px rgba(0,0,0,.22); }
      .intro { margin: 24px 0 12px; border-left: 4px solid var(--pink); }
      .change { color: var(--muted); font-size: 12px; margin-bottom: 24px; }
      .progress { display: flex; justify-content: space-between; color: var(--accent); font-size: 12px; margin-bottom: 10px; }
      .message { font-size: 15px; line-height: 1.6; }
      .options { display: grid; gap: 10px; margin-top: 16px; }
      button { color: var(--ink); font: inherit; cursor: pointer; }
      .option { text-align: left; padding: 14px; background: var(--panel-2); border: 1px solid var(--border); border-radius: 9px; }
      .option:hover, .option:focus-visible { border-color: var(--accent); color: var(--accent); outline: none; }
      .feedback { display: none; margin-top: 18px; border-left: 4px solid var(--green); }
      .feedback.wrong { border-left-color: var(--pink); }
      .feedback strong { color: var(--accent); }
      .receipt { display: none; margin-top: 18px; color: var(--muted); font-size: 12px; line-height: 1.6; }
      .receipt strong { color: var(--ink); }
    </style>
  </head>
  <body>
    <main class="shell">
      <header class="topline">
        <img class="avatar" src="${avatarUri}" alt="Explainit host avatar" />
        <div><div class="eyebrow">Explainit // fixture mode</div><h1>${quiz.title}</h1></div>
      </header>
      <section class="intro">${quiz.intro}</section>
      <div class="change">FOCUSED CHANGE // ${quiz.changeLabel}<br />${quiz.contextSummary ?? ""}</div>
      <div class="progress"><span>QUESTION ${quiz.questionNumber} OF ${quiz.totalQuestions}</span><span>HOST READY</span></div>
      <section class="message"><strong>${quiz.question}</strong><div class="options">${options}</div></section>
      <section id="feedback" class="message feedback"></section>
      <section id="receipt" class="receipt"><strong>TRUST RECEIPT // FIXTURE PREVIEW</strong><br />${quiz.contextSummary ?? "The live agent will later show which workspace context it inspected and why it chose each question."}<br />${quiz.toolsUsed ? `MCP TOOLS // ${quiz.toolsUsed.join(", ")}` : ""}</section>
    </main>
    <script>
      const vscode = acquireVsCodeApi();
      document.querySelectorAll('.option').forEach((button) => {
        button.addEventListener('click', () => {
          document.querySelectorAll('.option').forEach((item) => item.disabled = true);
          vscode.postMessage({ type: 'submitAnswer', optionId: button.dataset.optionId });
        });
      });
      window.addEventListener('message', (event) => {
        if (event.data.type !== 'answerFeedback') return;
        const feedback = document.getElementById('feedback');
        feedback.classList.toggle('wrong', !event.data.isCorrect);
        feedback.innerHTML = '<strong>' + (event.data.isCorrect ? 'CORRECT // NICE READ' : 'NOT QUITE // KEEP YOUR EYES OPEN') + '</strong><br />' + event.data.feedback;
        feedback.style.display = 'block';
        document.getElementById('receipt').style.display = 'block';
      });
    </script>
  </body>
</html>`;
  }
}
