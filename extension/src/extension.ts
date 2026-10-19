import * as vscode from "vscode";
import { FixtureQuiz } from "./messages";
import { QuizPanel } from "./quiz-panel";

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

export function activate(context: vscode.ExtensionContext): void {
  const panel = new QuizPanel(context.extensionUri);
  const command = vscode.commands.registerCommand(
    "explainit.explainThisChange",
    () => panel.show(fixtureQuiz),
  );

  context.subscriptions.push(command);
}

export function deactivate(): void {}
