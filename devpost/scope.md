---
doc: scope
status: draft
---

# Explainit

A VS Code extension that turns an AI-assisted code change into a short, funny comprehension challenge instead of something the developer blindly accepts.

## The Unique Kernel

When an AI agent changes code, a playful avatar interrupts the “looks good” reflex and quizzes the developer about what just happened. The product’s distinctive move is making understanding the reward and the gate: the developer has to explain the change back before they can feel finished with it.

## Who It's For

Anyone building with AI in VS Code, especially developers who sometimes accept generated code without fully understanding it—from a first-time developer to an experienced pro. They are trying to move quickly, but today they usually read the diff passively, accept it, or ask the AI for an explanation instead of testing their own understanding.

## The Core Loop

The developer makes or accepts a meaningful code change and saves the file. Explainit notices the change and opens a small VS Code quiz experience with a funny avatar. An AI agent examines the change and asks three targeted questions, such as what happens if a list is empty. The developer answers, receives a playful understanding grade plus areas to investigate, and returns to coding. A manual `Explain This Change` command provides a dependable way to start the same loop during the demo.

## Inspiration & Identity

The identity is a friendly but interruptive coding coach: playful, slightly mischievous, and gamified rather than judgmental. The main spectacle is the avatar appearing inside VS Code immediately after a saved change. The exact avatar and humor style can be chosen during PRD.

## Why This Matters to the Learner

The learner wants to make AI-assisted development more intentional and create a teaching moment for people who rely on AI to do everything for them. It directly connects to the hackathon’s theme of learning the basics of building with AI, while also giving the learner a concrete way to explore autonomous agent behavior: the agent inspects a code change and decides what the developer should be asked.

## What "Working" Looks Like

In a one-minute demo, a developer opens a small VS Code project, makes or applies a code change, and saves it. The Explainit avatar appears, presents three generated questions about the changed code, accepts answers, and shows a result that distinguishes what the developer understands from what they should investigate. The “oh, that’s cool” moment is the quiz catching a real edge case in the new code rather than merely summarizing it.

## The POC Boundary

The proof of concept includes:

- a VS Code extension with a small webview or panel for the avatar and quiz;
- detection of a meaningful saved code change;
- a manual `Explain This Change` command as a reliable fallback;
- AI analysis of the current change and nearby file context;
- three targeted comprehension questions, answer grading, and a playful result;
- one-file or one-focused-change sessions suitable for a short live demo.

## Later

- Detecting the exact moment an AI assistant applies a diff.
- Integrating directly with a particular AI coding extension or agent.
- Multi-file workspace reasoning and richer project context.
- Persistent scores, streaks, badges, progress history, and friend sharing.
- Marketplace packaging, broader IDE support, and configurable personalities.

## Explicitly Cut

- Generic “any prompt” interception for the POC: VS Code does not provide a universal event that identifies every AI prompt across extensions.
- A standalone paste-a-snippet web app: it would be simpler technically, but it loses the in-editor interruption that makes the idea memorable.
- Full project-wide understanding: it adds complexity before the core quiz loop is proven.
- A complete social or competitive game: the first version only needs a compelling personal challenge and result.
