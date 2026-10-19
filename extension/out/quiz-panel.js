"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizPanel = void 0;
const vscode = __importStar(require("vscode"));
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
class QuizPanel {
    extensionUri;
    panel;
    activeQuiz;
    questionIndex = 0;
    score = 0;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    show(quiz) {
        this.activeQuiz = quiz;
        this.questionIndex = 0;
        this.score = 0;
        if (this.panel && quiz.source === "agent") {
            const previousPanel = this.panel;
            this.panel = undefined;
            previousPanel.dispose();
        }
        if (this.panel) {
            this.panel.webview.html = this.render(quiz);
            this.panel.reveal(vscode.ViewColumn.Beside);
            return;
        }
        this.panel = vscode.window.createWebviewPanel("explainitQuiz", "Explainit", vscode.ViewColumn.Beside, { enableScripts: true });
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        this.panel.webview.onDidReceiveMessage((message) => {
            if (message.type === "nextQuestion") {
                this.questionIndex += 1;
                if (this.activeQuiz)
                    this.panel.webview.html = this.render(this.activeQuiz);
                return;
            }
            if (message.type !== "submitAnswer")
                return;
            const current = this.currentQuestion();
            if (!current)
                return;
            const answer = message.answer ?? message.optionId ?? "";
            const isCorrect = current.answerType === "single_choice"
                ? answer === current.correctOptionId
                : this.freeFormLooksCorrect(answer, current.correctAnswer);
            if (isCorrect)
                this.score += 1;
            const total = this.activeQuiz?.questions?.length ?? 1;
            const isFinal = this.questionIndex >= total - 1;
            void this.panel?.webview.postMessage({
                type: "answerFeedback",
                isCorrect,
                feedback: isCorrect
                    ? current.feedback
                    : `Not quite. ${current.feedback}`,
                isFinal,
                score: this.score,
                total,
            });
        });
        this.panel.webview.html = this.render(quiz);
    }
    currentQuestion() {
        const quiz = this.activeQuiz;
        if (!quiz)
            return undefined;
        return quiz.questions?.[this.questionIndex] ?? {
            question: quiz.question,
            answerType: quiz.answerType,
            options: quiz.options,
            correctOptionId: quiz.correctOptionId,
            correctAnswer: quiz.correctOptionId,
            feedback: quiz.feedback,
        };
    }
    freeFormLooksCorrect(answer, expected) {
        const expectedTerms = expected.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
        const answerText = answer.toLowerCase();
        const usefulTerms = [...new Set(expectedTerms)].slice(0, 8);
        return usefulTerms.length > 0 && usefulTerms.filter((term) => answerText.includes(term)).length >= Math.max(1, Math.ceil(usefulTerms.length * 0.35));
    }
    render(quiz) {
        const avatarUri = this.panel
            ? this.panel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "media", "avatar.svg"))
            : "";
        const current = this.currentQuestion();
        const questionNumber = this.questionIndex + 1;
        const totalQuestions = quiz.questions?.length ?? quiz.totalQuestions;
        const options = current.options
            .map((option) => `<button class="option" data-option-id="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`)
            .join("");
        const answerControl = current.answerType === "free_form"
            ? `<textarea id="freeFormAnswer" placeholder="Explain it in your own words..."></textarea><button class="lock" id="submitFreeForm">LOCK IT IN</button>`
            : options;
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
      textarea { width: 100%; min-height: 110px; resize: vertical; padding: 14px; color: var(--ink); background: var(--panel-2); border: 1px solid var(--border); border-radius: 9px; font: inherit; }
      textarea:focus { border-color: var(--accent); outline: none; }
      .lock { margin-top: 12px; padding: 11px 14px; background: var(--accent); color: #24182d; border: 0; border-radius: 8px; font-weight: 700; }
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
        <div><div class="eyebrow">Explainit // ${quiz.source === "agent" ? "agent mode" : quiz.source === "loading" ? "agent connecting..." : "fixture mode"}</div><h1>${escapeHtml(quiz.title)}</h1></div>
      </header>
      <section class="intro">${escapeHtml(quiz.intro)}</section>
      <div class="change">FOCUSED CHANGE // ${escapeHtml(quiz.changeLabel)}<br />${escapeHtml(quiz.contextSummary ?? "")}</div>
      <div class="progress"><span>QUESTION ${questionNumber} OF ${totalQuestions}</span><span>HOST READY</span></div>
      <section class="message"><strong>${escapeHtml(current.question)}</strong><div class="options">${answerControl}</div></section>
      <section id="feedback" class="message feedback"></section>
      <section id="receipt" class="receipt"><strong>TRUST RECEIPT // ${quiz.source === "agent" ? "LIVE EVIDENCE" : "FIXTURE PREVIEW"}</strong><br />${escapeHtml(quiz.contextSummary ?? "The live agent will later show which workspace context it inspected and why it chose each question.")}<br />${quiz.toolsUsed ? escapeHtml(`MCP TOOLS // ${quiz.toolsUsed.join(", ")}`) : ""}</section>
    </main>
    <script>
      const vscode = acquireVsCodeApi();
      document.querySelectorAll('.option').forEach((button) => {
        button.addEventListener('click', () => {
          document.querySelectorAll('.option').forEach((item) => item.disabled = true);
          vscode.postMessage({ type: 'submitAnswer', optionId: button.dataset.optionId });
        });
      });
      document.getElementById('submitFreeForm')?.addEventListener('click', () => {
        const input = document.getElementById('freeFormAnswer');
        if (!input || !input.value.trim()) return;
        input.disabled = true;
        document.getElementById('submitFreeForm').disabled = true;
        vscode.postMessage({ type: 'submitAnswer', answer: input.value });
      });
      window.addEventListener('message', (event) => {
        if (event.data.type !== 'answerFeedback') return;
        const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] || character));
        const feedback = document.getElementById('feedback');
        feedback.classList.toggle('wrong', !event.data.isCorrect);
        feedback.innerHTML = '<strong>' + (event.data.isCorrect ? 'CORRECT // NICE READ' : 'NOT QUITE // KEEP YOUR EYES OPEN') + '</strong><br />' + escapeHtml(event.data.feedback);
        feedback.style.display = 'block';
        if (event.data.isFinal) {
          document.getElementById('receipt').innerHTML += '<br /><strong>FINAL SCORE // ' + event.data.score + ' / ' + event.data.total + '</strong>';
          document.getElementById('receipt').style.display = 'block';
        } else {
          const next = document.createElement('button');
          next.className = 'lock';
          next.textContent = 'NEXT QUESTION';
          next.addEventListener('click', () => vscode.postMessage({ type: 'nextQuestion' }));
          feedback.appendChild(next);
        }
      });
    </script>
  </body>
</html>`;
    }
}
exports.QuizPanel = QuizPanel;
//# sourceMappingURL=quiz-panel.js.map