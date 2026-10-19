---
doc: prd
status: approved
---

# Explainit — Product Requirements

Explainit is a VS Code experience for AI-assisted developers that turns a recent code change into a short, game-show-style comprehension quiz.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`.

## The Core Journey

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`.

1. The developer works in a small VS Code project and makes or accepts a meaningful code change.
2. After the file is saved, Explainit notices the change and opens its quiz experience. The developer can also start the same experience with the `Explain This Change` command.
3. A polished, minimalist host interface appears with an avatar and a game-show-style introduction, such as: “Welcome to Explainit! Today’s mystery: what did the agent really do?”
4. The host briefly identifies what changed and starts a short quiz, showing progress such as “Question 1 of 3.”
5. The agent-governed host chooses a small set of questions about the change. Questions can ask for a free-form explanation or offer selectable answers, depending on what best tests understanding.
6. After each answer, the host immediately gives a brief explanation of why the answer was correct, incomplete, or incorrect, including a relevant edge case when useful.
7. After the final question, the host reveals a score that communicates how well the developer understands the changed code and points out what deserves another look.
8. Explainit shows a Trust Receipt summarizing what changed, which workspace context it inspected, why the questions were selected, the edge case being tested, and what the developer should review next.
9. The developer can return to coding. The proof-of-concept session does not require a persistent history.

## Screens and Layout

Source: `scope.md > The POC Boundary`, `scope.md > Inspiration & Identity`.

Explainit is one focused VS Code quiz surface rather than a multi-screen product.

- **Host header:** avatar icon, Explainit identity, and the game-show-style opening or current reaction.
- **Change context:** a compact indication of the changed file or code area so the developer knows what the quiz is about.
- **Conversation area:** the host’s question, the user’s answer, and brief feedback after each answer in a simple chat-like sequence.
- **Answer area:** either a free-form response field or selectable options, chosen by the host for the current question.
- **Progress and result:** short progress indicator during the quiz and a final score/reveal after the last question.
- **Trust Receipt:** a compact post-quiz evidence panel that makes the agent’s context use and reasoning path visible without exposing implementation details.

The user moves through the experience in one surface. The host should feel similar to an IDE agent interface while remaining visually distinct through its avatar, game-show copy, and answer feedback.

## Look and Feel

Source: learner direction during the PRD interview; `scope.md > Inspiration & Identity`.

The layout uses a polished retro video-game style so it clearly stands out against the surrounding IDE window. It remains a simple, readable chat-oriented surface, but the avatar, quiz cards, progress indicator, answer feedback, and final reveal should feel like a compact game-show game rather than a generic IDE agent panel. Use a restrained retro palette and intentional game-inspired typography or visual accents without making the interface noisy or hard to read. The game-show energy should come from the host’s language, reactions, score reveal, and recognizable retro-game treatment.

## Features and Behavior

### Change-triggered quiz

Source: `scope.md > The Core Loop`, `scope.md > The POC Boundary`.

- After a meaningful saved code change, Explainit opens the quiz surface for that change.
- The developer can manually start the same flow with `Explain This Change` for a dependable demo path.
- The quiz focuses on one file or one clearly bounded change for the proof of concept.
- The opening identifies the change briefly and does not ask the developer to restate project context that is already available.

### Agent-governed host

Source: `scope.md > The Unique Kernel`, `scope.md > Why This Matters to the Learner`.

- The host uses the available code-change and nearby workspace context to decide what is worth testing.
- The host chooses a small number of questions, capped at four for the proof of concept.
- The host can choose between free-form explanation and selectable answers based on which format better tests the concept.
- The host adapts its wording, follow-up, and feedback to the specific change rather than displaying a fixed generic quiz.
- The host maintains the game-show personality while remaining playful rather than judgmental.

### Answer feedback and final score

Source: learner decisions during the PRD interview; `scope.md > What "Working" Looks Like`.

- The user submits one answer at a time.
- After each answer, the host gives a brief explanation of the correctness of the response.
- Feedback can identify an edge case or a part of the changed code the user should investigate.
- After the final question, the host displays a score describing how well the user knows the changed code.
- The final result distinguishes demonstrated understanding from areas that need review.

### Trust Receipt

Source: learner decision during the spec interview; `scope.md > The POC Boundary`.

- After the final score, Explainit displays a Trust Receipt for the completed session.
- The receipt identifies the changed file or focused change and the bounded workspace context inspected.
- It explains, in concise host language, why the questions were chosen and which edge case or concept they tested.
- It lists what the developer demonstrated and what deserves another look.
- The receipt is evidence for the demo, not a full reasoning transcript or a persistent report.

### Graceful skip

Source: learner decision during the PRD interview; `scope.md > Explicitly Cut`.

- If there is no meaningful change to quiz or the agent cannot produce a useful quiz, the host politely skips the challenge and explains briefly why.
- The user is not required to provide extra context or manually reconstruct information already available in the workspace.
- A skip does not present a misleading score.

## States and Boundaries

- **First use:** The user invokes the command or makes the first meaningful saved change; Explainit opens the host surface with the game-show introduction and the first question.
- **Normal quiz:** The host asks no more than four questions, accepts the selected response format, gives feedback after each answer, and advances through the short session.
- **No meaningful change:** The host politely explains that there is not enough of a focused change to quiz and lets the user return to coding.
- **Quiz unavailable:** If the change cannot produce a useful quiz, the host gives a brief, friendly skip message rather than requesting extra setup.
- **Incorrect or incomplete answer:** The host explains the relevant reasoning without shaming the user, records the result for the final score, and continues to the next question.
- **Completed quiz:** The final score and review areas remain visible until the user returns to coding or closes the surface. No history is required for the POC.
- **Trust Receipt:** The receipt appears after the score and remains available for the current session; it disappears when the session is closed because persistence is deferred.
- **Repeated trigger:** The experience should not create an uncontrolled stream of quizzes for every small edit; it is intended for a meaningful saved change or an explicit manual command.

## Product Decisions

- **VS Code first** — the in-editor experience is the main spectacle and preserves workspace context.
- **Saved-change trigger plus chat-aware entry point** — Explainit watches meaningful saved changes and also provides an `@explainit` chat participant for prompts the developer intentionally routes to it. VS Code does not expose another extension's private transcript for passive interception, so Explainit will not pretend to hear unrelated chats it cannot access.
- **Game-show host** — this was chosen as the most exciting personality direction.
- **One question at a time with immediate feedback** — it makes the quiz feel interactive and teaches the user while they play.
- **Mixed answer formats** — every four-question quiz uses either 2 selectable plus 2 free-form questions or 3 selectable plus 1 free-form question, so the session tests recognition and explanation.
- **Agent-governed behavior** — the host should decide useful questions, formats, and responses from the change context rather than behaving as a fixed script.
- **Polite skip without extra context requests** — the workspace already provides the intended context, and the user should not have to explain it again.
- **Retro video-game visual language** — the product should stand out clearly against the IDE window while remaining polished, readable, and restrained rather than visually chaotic.
- **Trust Receipt as visible evidence** — the agent’s use of workspace context and question-selection rationale should be understandable to a demo viewer without inspecting source code.

## What We're Building

The POC is complete when a developer can:

- trigger Explainit from a meaningful saved code change or the manual command;
- see the avatar-led game-show introduction and a concise change context;
- answer up to four agent-generated questions in a mix of response formats;
- receive brief correctness explanations after each answer;
- see a final score and clear indication of what they understand or should investigate; and
- see a Trust Receipt that explains the context inspected, the reason for the questions, and the next review areas; and
- experience a polite skip when no useful quiz can be generated.

## Deferred From the POC

- Direct detection of the exact AI prompt or diff-application moment, because that requires coupling to a particular AI assistant.
- Multi-file and full-project reasoning, because the POC needs one focused change to keep the quiz and demo clear.
- Persistent scores, streaks, badges, history, or friend sharing, because the first proof must establish the comprehension loop first.
- A full reasoning transcript or persistent Trust Receipt history, because the POC only needs a concise, current-session evidence summary.
- Multiple IDEs and marketplace-ready packaging, because VS Code is the chosen first environment.

## Possible Later Enhancements

Explainit could integrate with specific AI coding assistants to trigger at the moment an agent applies a diff. It could add project-wide quizzes, saved progress, streaks, social challenges, configurable hosts, and additional IDEs after the core loop proves useful.

## Non-Goals

- Explainit is not a general code explainer or documentation generator; the core interaction is testing the developer’s understanding.
- Explainit is not a complete code-review or security-analysis product; it may surface reasoning and edge cases but does not certify code quality.
- Explainit does not require the user to manually paste code or describe every action; it should use the available workspace context.
- Explainit does not quiz every keystroke or minor edit; uncontrolled interruptions would undermine the experience.

## Open Questions

- **Exact meaningful-change threshold** — resolve during `4-spec` or build exploration; it affects triggering but does not change the product journey.
- **Final score presentation and scale** — resolve during `4-spec`; the PRD requirement is a clear score about understanding, not a specific numeric system.
- **Exact avatar identity, retro references, and game-show copy** — can be refined during `4-spec` and build, as long as the host remains playful, readable, and clearly distinct from the IDE.
