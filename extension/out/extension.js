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
function activate(context) {
    const panel = new quiz_panel_1.QuizPanel(context.extensionUri);
    const command = vscode.commands.registerCommand("explainit.explainThisChange", () => panel.show(fixtureQuiz));
    context.subscriptions.push(command);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map