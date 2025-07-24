export type ChatRole = "user" | "ai";
export type MessageType = "text" | "math" | "quiz";

export interface MathSubStep {
  step: string;
  substeps?: string[];
}

export interface MathToolOutput {
  toolName: "showMathSteps";
  steps: MathSubStep[];
}

export interface QuizQuestionData {
  question: string;
  choices: string[];
  correctAnswer: string;
}

export interface QuizToolOutput {
  toolName: "askQuizQuestion";
  quiz: QuizQuestionData;
}

export interface ChatApiResponse {
  message: string;
  type: MessageType;
  tool_output?: MathToolOutput | QuizToolOutput;
}

// For frontend state management
export interface ChatMessage {
  role: ChatRole;
  content: string;
  type: MessageType;
  // Specific data for tool-based messages
  mathSteps?: MathSubStep[];
  quizData?: QuizQuestionData;
  quizState?: {
    answered: boolean;
    selectedChoice: string | null;
    isCorrect: boolean | null;
  };
}