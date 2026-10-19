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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const quiz_panel_1 = require("./quiz-panel");
const http = __importStar(require("node:http"));
const fixtureQuiz = {
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
function requestContext(workspaceRoot, filePath, language) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ workspaceRoot, filePath, language });
        const request = http.request({ hostname: "127.0.0.1", port: 4242, path: "/context", method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (response) => {
            let responseBody = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => { responseBody += chunk; });
            response.on("end", () => {
                if (response.statusCode !== 200)
                    return reject(new Error(responseBody || "Explainit service unavailable"));
                const payload = JSON.parse(responseBody);
                resolve(payload.context);
            });
        });
        request.on("error", reject);
        request.setTimeout(2000, () => {
            request.destroy(new Error("Explainit service timed out; opening fixture mode."));
        });
        request.end(body);
    });
}
function requestAgentQuiz(workspaceRoot, filePath, language) {
    return (async () => {
        const controller = new AbortController();
        const deadline = setTimeout(() => controller.abort(), 60000);
        try {
            const response = await fetch("http://127.0.0.1:4242/quiz", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ workspaceRoot, filePath, language }),
                signal: controller.signal,
            });
            const responseBody = await response.text();
            if (!response.ok) {
                let detail = responseBody || "no error details";
                try {
                    const payload = JSON.parse(responseBody);
                    if (payload.message)
                        detail = payload.message;
                }
                catch {
                    // Keep the raw body when the service did not return JSON.
                }
                throw new Error(`Explainit service returned ${response.status}: ${detail}`);
            }
            try {
                const payload = JSON.parse(responseBody);
                return { ...payload.context, quiz: payload.quiz };
            }
            catch {
                throw new Error(`Explainit service returned invalid JSON (${responseBody.slice(0, 120)})`);
            }
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError")
                throw new Error("Explainit agent exceeded the 60-second response limit; opening fixture mode.");
            throw error;
        }
        finally {
            clearTimeout(deadline);
        }
    })();
}
function activate(context) {
    const panel = new quiz_panel_1.QuizPanel(context.extensionUri);
    const explainThisChange = async () => {
        // Open immediately so a slow or unavailable local service never makes the command feel inert.
        panel.show({ ...fixtureQuiz, source: "loading", intro: "The host is checking the MCP context before the buzzer sounds..." });
        const editor = vscode.window.activeTextEditor;
        const workspaceRoot = editor
            ? vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath
            : undefined;
        if (editor && workspaceRoot) {
            try {
                const result = await requestAgentQuiz(workspaceRoot, editor.document.uri.fsPath, editor.document.languageId);
                console.log(`[explainit] live agent quiz received from ${editor.document.uri.fsPath}`);
                const question = result.quiz.questions[0];
                panel.show({
                    ...fixtureQuiz,
                    title: result.quiz.title,
                    intro: result.quiz.intro,
                    changeLabel: result.filePath,
                    question: question.question,
                    answerType: question.answerType,
                    options: question.options.map((label, index) => ({ id: String(index), label: `${String.fromCharCode(65 + index)}. ${label}` })),
                    correctOptionId: question.answerType === "single_choice" ? String(question.options.indexOf(question.correctAnswer)) : "",
                    feedback: question.explanation,
                    contextSummary: `${result.diff.split("\n")[0]} …`,
                    toolsUsed: result.toolsUsed,
                    source: "agent",
                });
                return;
            }
            catch (error) {
                const reason = String(error);
                console.warn(`[explainit] using fixture quiz: ${reason}`);
                panel.show({ ...fixtureQuiz, source: "fixture", intro: `The live host stepped away for a moment. Fixture mode is ready. (${reason})` });
                void vscode.window.showWarningMessage(`Explainit used fixture mode: ${reason}`);
            }
        }
    };
    const command = vscode.commands.registerCommand("explainit.explainThisChange", explainThisChange);
    const liveCommand = vscode.commands.registerCommand("explainit.explainThisChangeLive", explainThisChange);
    context.subscriptions.push(command, liveCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map