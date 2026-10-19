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
  questions: z.array(agentQuestionSchema).min(1).max(3),
});

export type AgentQuiz = z.infer<typeof agentQuizSchema>;
