"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentQuizSchema = exports.agentQuestionSchema = void 0;
const zod_1 = require("zod");
exports.agentQuestionSchema = zod_1.z.object({
    question: zod_1.z.string().min(1),
    answerType: zod_1.z.enum(["single_choice", "free_form"]),
    options: zod_1.z.array(zod_1.z.string()).max(4),
    correctAnswer: zod_1.z.string().min(1),
    explanation: zod_1.z.string().min(1),
});
exports.agentQuizSchema = zod_1.z.object({
    skip: zod_1.z.boolean(),
    skipReason: zod_1.z.string(),
    title: zod_1.z.string(),
    intro: zod_1.z.string(),
    questions: zod_1.z.array(exports.agentQuestionSchema).length(4),
});
//# sourceMappingURL=quiz-schema.js.map