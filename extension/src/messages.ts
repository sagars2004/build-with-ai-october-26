export type AnswerOption = {
  id: string;
  label: string;
};

export type FixtureQuiz = {
  title: string;
  intro: string;
  changeLabel: string;
  questionNumber: number;
  totalQuestions: number;
  question: string;
  answerType: "single_choice";
  options: AnswerOption[];
  correctOptionId: string;
  feedback: string;
  contextSummary?: string;
  toolsUsed?: string[];
};
