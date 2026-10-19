import { z } from "zod";

export const agentQuestionSchema = z.object({
  question: z.string().min(1),
  answerType: z.enum(["single_choice", "free_form"]),
  options: z.array(z.string()).max(4),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
});

export const agentQuizSchema = z.object({
  skip: z.boolean(),
  skipReason: z.string(),
  title: z.string(),
  intro: z.string(),
  questions: z.array(agentQuestionSchema).length(4).superRefine((questions, ctx) => {
    const freeFormCount = questions.filter((question) => question.answerType === "free_form").length;
    if (freeFormCount !== 1 && freeFormCount !== 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Use exactly 1 or 2 free-form questions, with the rest single-choice." });
    }
  }),
});

export type AgentQuiz = z.infer<typeof agentQuizSchema>;
