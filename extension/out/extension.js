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
function requestAgentQuiz(workspaceRoot, filePath, language, recentEdit) {
    return (async () => {
        const controller = new AbortController();
        const deadline = setTimeout(() => controller.abort(), 60000);
        try {
            const response = await fetch("http://127.0.0.1:4242/quiz", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ workspaceRoot, filePath, language, recentEdit }),
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
function requestHostCommentary(workspaceRoot, filePath, language, prompt, recentEdit) {
    return (async () => {
        const response = await fetch("http://127.0.0.1:4242/observe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ workspaceRoot, filePath, language, prompt, recentEdit }),
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
            throw new Error(`Explainit observation service returned ${response.status}: ${detail}`);
        }
        const payload = JSON.parse(responseBody);
        if (!payload.message)
            throw new Error("Explainit observation returned no host message.");
        return payload.message;
    })();
}
function offsetAt(text, line, character) {
    let offset = 0;
    for (let currentLine = 0; currentLine < line; currentLine += 1) {
        const newline = text.indexOf("\n", offset);
        if (newline < 0)
            return text.length;
        offset = newline + 1;
    }
    return Math.min(offset + character, text.length);
}
function describeRecentEdit(document, previousText, change) {
    const start = offsetAt(previousText, change.range.start.line, change.range.start.character);
    const removedText = previousText.slice(start, start + change.rangeLength).replace(/\s+/g, " ").trim();
    const insertedText = change.text.replace(/\s+/g, " ").trim();
    const location = `lines ${change.range.start.line + 1}-${change.range.end.line + 1}`;
    if (!insertedText && removedText)
        return `Latest edit: deleted ${change.rangeLength} character(s) on ${location}. Deleted snippet: ${removedText.slice(0, 500)}`;
    if (insertedText && removedText)
        return `Latest edit: replaced text on ${location}. Removed: ${removedText.slice(0, 250)}. Added: ${insertedText.slice(0, 250)}`;
    if (insertedText)
        return `Latest edit: added text on ${location}: ${insertedText.slice(0, 500)}`;
    return `Latest edit: changed ${change.rangeLength} character(s) on ${location}.`;
}
function displayRecentEdit(recentEdit) {
    return recentEdit?.replace(/\s*(?:Deleted snippet|Removed|Added):.*$/i, "").trim();
}
function activate(context) {
    const panel = new quiz_panel_1.QuizPanel(context.extensionUri);
    let autoInFlight = false;
    let autoCooldownUntil = 0;
    let saveTimer;
    const documentSnapshots = new Map();
    const recentEdits = new Map();
    const activeDocument = vscode.window.activeTextEditor?.document;
    if (activeDocument)
        documentSnapshots.set(activeDocument.uri.toString(), activeDocument.getText());
    const documentOpened = vscode.workspace.onDidOpenTextDocument((document) => {
        documentSnapshots.set(document.uri.toString(), document.getText());
    });
    const documentChanged = vscode.workspace.onDidChangeTextDocument((event) => {
        const key = event.document.uri.toString();
        const previousText = documentSnapshots.get(key);
        if (previousText !== undefined && event.contentChanges.length > 0) {
            recentEdits.set(key, describeRecentEdit(event.document, previousText, event.contentChanges[0]));
        }
        documentSnapshots.set(key, event.document.getText());
    });
    const explainThisChange = async (automatic = false, recentEdit, savedDocument) => {
        if (automatic) {
            if (autoInFlight || Date.now() < autoCooldownUntil)
                return;
            autoInFlight = true;
        }
        // Open immediately so a slow or unavailable local service never makes the command feel inert.
        panel.show({ ...fixtureQuiz, source: "loading", changeLabel: "Preparing focused change", intro: "The host is checking the MCP context before the buzzer sounds..." });
        const document = savedDocument ?? vscode.window.activeTextEditor?.document;
        const workspaceRoot = document
            ? vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath
            : undefined;
        if (document && workspaceRoot) {
            try {
                const result = await requestAgentQuiz(workspaceRoot, document.uri.fsPath, document.languageId, recentEdit);
                console.log(`[explainit] live agent quiz received from ${document.uri.fsPath}`);
                const question = result.quiz.questions[0];
                const questions = result.quiz.questions.map((item) => ({
                    question: item.question,
                    answerType: item.answerType,
                    options: item.options.map((label, index) => ({ id: String(index), label: `${String.fromCharCode(65 + index)}. ${label}` })),
                    correctOptionId: item.answerType === "single_choice" ? String(item.options.indexOf(item.correctAnswer)) : "",
                    correctAnswer: item.correctAnswer,
                    feedback: item.explanation,
                }));
                panel.show({
                    ...fixtureQuiz,
                    title: result.quiz.title,
                    intro: result.quiz.intro,
                    changeLabel: result.filePath.startsWith(`${workspaceRoot}/`) ? result.filePath.slice(workspaceRoot.length + 1) : result.filePath.split("/").pop() ?? result.filePath,
                    question: question.question,
                    answerType: question.answerType,
                    options: question.options.map((label, index) => ({ id: String(index), label: `${String.fromCharCode(65 + index)}. ${label}` })),
                    correctOptionId: question.answerType === "single_choice" ? String(question.options.indexOf(question.correctAnswer)) : "",
                    feedback: question.explanation,
                    contextSummary: displayRecentEdit(result.recentEdit),
                    toolsUsed: result.toolsUsed,
                    source: "agent",
                    questions,
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
        if (automatic) {
            autoInFlight = false;
            autoCooldownUntil = Date.now() + 10_000;
        }
    };
    const command = vscode.commands.registerCommand("explainit.explainThisChange", explainThisChange);
    const liveCommand = vscode.commands.registerCommand("explainit.explainThisChangeLive", explainThisChange);
    const saveWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
        if (!vscode.workspace.getWorkspaceFolder(document.uri))
            return;
        console.log(`[explainit] saved file; scheduling observation for ${document.uri.fsPath}`);
        if (saveTimer)
            clearTimeout(saveTimer);
        saveTimer = setTimeout(() => void explainThisChange(true, recentEdits.get(document.uri.toString()), document), 1200);
    });
    const participant = vscode.chat.createChatParticipant("explainit.host", async (request, _chatContext, response) => {
        const editor = vscode.window.activeTextEditor;
        const workspaceRoot = editor
            ? vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath
            : undefined;
        if (!editor || !workspaceRoot) {
            response.markdown("🎙️ The host is ready, but I need an open workspace file to observe. Open the changed file beside this chat and try again.");
            return;
        }
        response.progress("The host is checking the focused change...");
        try {
            const message = await requestHostCommentary(workspaceRoot, editor.document.uri.fsPath, editor.document.languageId, request.prompt, recentEdits.get(editor.document.uri.toString()));
            response.markdown(message);
        }
        catch (error) {
            response.markdown(`🎙️ **Host note:** I heard you, but I need a saved focused change before I can inspect the code. Save the file, then ask me again.\n\n_${String(error)}_`);
        }
    });
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, "media", "avatar.svg");
    context.subscriptions.push(command, liveCommand, saveWatcher, documentOpened, documentChanged, participant);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map