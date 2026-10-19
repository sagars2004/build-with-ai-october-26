import { agentQuizSchema, AgentQuiz } from "./quiz-schema";
import { FocusedContext } from "./types";
import { providerConfig } from "./config";

const skill = `You are the Explainit game-show host. Test whether the developer understands the newest edit rather than asking them to repeat an older implementation. Use the recent edit signal as the primary subject of the quiz; use the Git diff and nearby context only to explain its surrounding behavior. Ask exactly four concise questions about behavior, data flow, an edge case, or a tradeoff visible in the newest edit. Prefer questions that require tracing state through branches, predicting failure modes, or reasoning through a counterfactual; avoid surface-level filename or endpoint recall. Use exactly either 2 single-choice plus 2 free-form questions, or 3 single-choice plus 1 free-form question. Make the first question single-choice for the current demo surface. Every answer must be grounded in the supplied code; do not invent project behavior. Keep the host playful and brief, but make the explanation technically precise. If the context is too thin to form a fair question, return skip=true and explain why. Never request secrets or inspect files outside the bounded context.`;

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    skip: { type: "boolean" },
    skipReason: { type: "string" },
    title: { type: "string" },
    intro: { type: "string" },
    questions: { type: "array", minItems: 4, maxItems: 4, items: {
      type: "object", additionalProperties: false,
      properties: {
        question: { type: "string" },
        answerType: { type: "string", enum: ["single_choice", "free_form"] },
        options: { type: "array", items: { type: "string" }, maxItems: 4 },
        correctAnswer: { type: "string" },
        explanation: { type: "string" },
      },
      required: ["question", "answerType", "options", "correctAnswer", "explanation"],
    } },
  },
  required: ["skip", "skipReason", "title", "intro", "questions"],
} as const;

export async function generateAgentQuiz(context: FocusedContext): Promise<AgentQuiz> {
  const config = providerConfig();
  if (!config.apiKey) throw new Error(`No API key configured for ${config.provider}; using fixture mode.`);
  const schemaReminder = `Return exactly this JSON shape: {"skip":false,"skipReason":"","title":"THE CODE MYSTERY","intro":"short host intro","questions":[{"question":"question text","answerType":"single_choice","options":["first answer","second answer"],"correctAnswer":"first answer","explanation":"brief code-grounded explanation"}]}. Include exactly 4 questions, with either 2 single_choice and 2 free_form questions, or 3 single_choice and 1 free_form question. The first question must use answerType single_choice. For free_form questions, set options to [] and provide a non-empty concise expected-answer rubric in correctAnswer; never leave correctAnswer blank.`;
  const contextPrompt = JSON.stringify({ recentEdit: context.recentEdit ?? "No discrete edit signal was provided; infer the focus from the current diff.", filePath: context.filePath, language: context.language, diff: context.diff, nearbyContext: context.nearbyContext });
  const messages = [
    { role: "system", content: `${skill} ${schemaReminder}` },
    { role: "user", content: contextPrompt },
  ];
  const firstContent = await requestChat(config, messages);
  try {
    return agentQuizSchema.parse(JSON.parse(firstContent));
  } catch (firstError) {
    const repairMessages = [
      { role: "system", content: `${skill} ${schemaReminder} Repair the candidate JSON and return only the corrected JSON.` },
      { role: "user", content: `Candidate JSON to repair:\n${firstContent}\n\nValidation issue:\n${String(firstError)}` },
    ];
    const repairedContent = await requestChat(config, repairMessages);
    return agentQuizSchema.parse(JSON.parse(repairedContent));
  }
}

export async function generatePromptCommentary(context: FocusedContext, prompt: string): Promise<string> {
  const config = providerConfig();
  if (!config.apiKey) throw new Error(`No API key configured for ${config.provider}; using host fallback.`);
  const messages = [
    {
      role: "system",
      content: `You are Explainit's playful game-show host observing a developer's prompt during a vibe-coding session. Use only the supplied focused change and nearby context. Respond in 2 or 3 concise sentences, with a little personality. Acknowledge what the developer is trying to do, point out one code-specific thing worth watching, and mention that a saved meaningful change can trigger the four-question quiz when relevant. Do not produce a full quiz, do not ask the developer to paste code, and do not invent behavior. Return plain text only.`,
    },
    {
      role: "user",
      content: JSON.stringify({ prompt, recentEdit: context.recentEdit ?? "No discrete edit signal was provided.", filePath: context.filePath, language: context.language, diff: context.diff, nearbyContext: context.nearbyContext }),
    },
  ];
  return requestChat(config, messages, false);
}

async function requestChat(config: { apiKey: string; baseUrl: string; model: string; provider: string }, messages: Array<{ role: string; content: string }>, jsonMode = true): Promise<string> {
  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages,
  };

  if (jsonMode) {
    // JSON mode plus Zod validation and the one repair attempt enforce the
    // application-level quiz contract across providers.
    requestBody.response_format = { type: "json_object" };
  }

  if (config.provider === "groq") {
    // GPT-OSS is a reasoning model. Groq requires an explicit reasoning
    // channel when JSON mode is enabled, and counts reasoning tokens toward
    // the completion budget.
    requestBody.reasoning_format = "hidden";
    requestBody.reasoning_effort = "low";
    requestBody.max_completion_tokens = 1800;
  } else {
    requestBody.max_tokens = 1800;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  if (!response.ok) {
    const detail = responseText.trim().slice(0, 2000);
    throw new Error(`${config.provider} request failed with ${response.status}${detail ? `: ${detail}` : "."}`);
  }

  let payload: { choices?: Array<{ message?: { content?: string } }> };
  try {
    payload = JSON.parse(responseText) as { choices?: Array<{ message?: { content?: string } }> };
  } catch {
    throw new Error(`${config.provider} returned a non-JSON response.`);
  }
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${config.provider} returned no quiz content.`);
  return content;
}
