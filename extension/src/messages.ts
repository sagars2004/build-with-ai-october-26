export type AnswerOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  question: string;
  answerType: "single_choice" | "free_form";
  options: AnswerOption[];
  correctOptionId: string;
  correctAnswer: string;
  feedback: string;
};

export type FixtureQuiz = {
  title: string;
  intro: string;
  changeLabel: string;
  questionNumber: number;
  totalQuestions: number;
  question: string;
  answerType: "single_choice" | "free_form";
  options: AnswerOption[];
  correctOptionId: string;
  feedback: string;
  contextSummary?: string;
  toolsUsed?: string[];
  source?: "fixture" | "agent" | "loading";
  questions?: QuizQuestion[];
};
