import { NextRequest, NextResponse } from 'next/server';
//import { ChatGoogleGenerativeAI } from '@langchain/google-generativeai';
import { tool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';
//import { createToolCallingAgent } from '@langchain/core/agents';
//import { AgentExecutor } from 'langchain/agents';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createToolCallingAgent, AgentExecutor } from 'langchain/agents';

import {
  ChatApiResponse,
  MathToolOutput,
  QuizToolOutput,
} from '@/lib/types'; // Adjust path if needed

// Initialize LLMs
const flashLLM = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash', // Use 1.5-flash if 2.5 is not publicly available yet
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.7,
});

const proLLM = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-pro', // Use 1.5-pro if 2.5 is not publicly available yet
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.5,
});

// --- Define Tools ---

const showMathStepsTool = tool(
  async (mathQuestion: string): Promise<MathToolOutput> => {
    const prompt = `
    You are an expert math tutor. Explain how to solve the following math question step-by-step.
    Break down the solution into a numbered vertical list for main steps, and use bullet points for substeps.
    Include all necessary calculations. Format the output strictly as a JSON object with a 'toolName' field set to "showMathSteps" and a 'steps' key containing an array of step objects, each with 'step' and optional 'substeps' (array of strings).

    Math Question: ${mathQuestion}
    `;

    try {
      const response = await proLLM.invoke(prompt);
      const content = response.content;

      // Attempt to parse JSON. LLMs can sometimes wrap JSON in markdown.
      let jsonString = content.includes('```json')
        ? content.split('```json')[1].split('```')[0].trim()
        : content;

      const parsedOutput: MathToolOutput = JSON.parse(jsonString);

      // Basic validation (optional, but good for robustness)
      if (parsedOutput.toolName !== "showMathSteps" || !Array.isArray(parsedOutput.steps)) {
        throw new Error("Invalid format for MathToolOutput");
      }

      return parsedOutput;
    } catch (error) {
      console.error("Error in showMathStepsTool:", error);
      return {
        toolName: "showMathSteps",
        steps: [{ step: "I'm sorry, I couldn't generate the math steps correctly. Please try rephrasing the question.", substeps: [] }],
      };
    }
  },
  {
    name: "showMathSteps",
    description: "Takes a math question as input (e.g., '2x + 3 = 11') and returns a structured list of step-by-step explanations including calculations. Use this for any request involving solving or explaining mathematical problems.",
    schema: {
      type: "object",
      properties: {
        mathQuestion: {
          type: "string",
          description: "The mathematical question to solve or explain.",
        },
      },
      required: ["mathQuestion"],
    },
  }
);

const askQuizQuestionTool = tool(
  async (subject: string): Promise<QuizToolOutput> => {
    const prompt = `
    Generate a single multiple-choice quiz question about the topic: '${subject}'.
    Provide 4 distinct answer choices. Clearly indicate the correct answer.
    Format the output strictly as a JSON object with a 'toolName' field set to "askQuizQuestion" and a 'quiz' key containing 'question', 'choices' (an array of strings), and 'correctAnswer' (a string matching one of the choices).

    Example JSON format:
    {
      "toolName": "askQuizQuestion",
      "quiz": {
        "question": "What is the capital of France?",
        "choices": ["Berlin", "Madrid", "Paris", "Rome"],
        "correctAnswer": "Paris"
      }
    }
    `;

    try {
      const response = await proLLM.invoke(prompt);
      const content = response.content;

      let jsonString = content.includes('```json')
        ? content.split('```json')[1].split('```')[0].trim()
        : content;

      const parsedOutput: QuizToolOutput = JSON.parse(jsonString);

      // Basic validation
      if (parsedOutput.toolName !== "askQuizQuestion" || !parsedOutput.quiz || !Array.isArray(parsedOutput.quiz.choices)) {
        throw new Error("Invalid format for QuizToolOutput");
      }

      return parsedOutput;
    } catch (error) {
      console.error("Error in askQuizQuestionTool:", error);
      return {
        toolName: "askQuizQuestion",
        quiz: {
          question: "I'm sorry, I couldn't generate a quiz question on that topic. Please try another subject.",
          choices: [],
          correctAnswer: "",
        },
      };
    }
  },
  {
    name: "askQuizQuestion",
    description: "Takes a subject or topic as input (e.g., 'water cycle', 'photosynthesis') and returns a single multiple-choice question with 4 answer choices. Use this when the user explicitly asks for a quiz or test.",
    schema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "The subject or topic for the quiz question.",
        },
      },
      required: ["subject"],
    },
  }
);

// --- Agent Setup ---
const tools = [showMathStepsTool, askQuizQuestionTool];

const agentPrompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful student assistant. Your goal is to provide accurate academic answers and enhance learning. You can respond directly to general questions or use specific tools for math problems and quizzes."],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"], // Important for agent's internal thought process
]);

const agent = createToolCallingAgent({
  llm: flashLLM,
  tools,
  prompt: agentPrompt,
});

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: process.env.NODE_ENV === 'development', // Log agent thoughts in development
});

// --- API Route Handler ---
export async function POST(request: NextRequest) {
  try {
    const { message: userMessage } = await request.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ message: 'Invalid input', type: 'text' }, { status: 400 });
    }

    // Invoke the agent
    const response = await agentExecutor.invoke({ input: userMessage });

    // Determine response type based on agent's output
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0]; // Assuming one tool call at a time

      if (toolCall.name === "showMathSteps") {
        const toolOutput: MathToolOutput = await showMathStepsTool.invoke(toolCall.args.mathQuestion);
        return NextResponse.json({
          message: "Here are the steps to solve your math problem:",
          type: "math",
          tool_output: toolOutput,
        } as ChatApiResponse);
      } else if (toolCall.name === "askQuizQuestion") {
        const toolOutput: QuizToolOutput = await askQuizQuestionTool.invoke(toolCall.args.subject);
        return NextResponse.json({
          message: "Here's a quiz question for you:",
          type: "quiz",
          tool_output: toolOutput,
        } as ChatApiResponse);
      } else {
        // Fallback for unexpected tool calls
        return NextResponse.json({
          message: "I decided to use a tool, but something went wrong.",
          type: "text",
        } as ChatApiResponse);
      }
    } else {
      // Direct LLM response
      const aiResponseContent = response.output;
      return NextResponse.json({
        message: aiResponseContent,
        type: "text",
      } as ChatApiResponse);
    }
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({
      message: "Sorry, something went wrong on my end. Please try again!",
      type: "text",
    }, { status: 500 });
  }
}