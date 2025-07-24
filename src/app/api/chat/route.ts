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
  model: 'gemini-2.5-flash',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.0,
});

const proLLM = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-pro',
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.5,
});

// --- Define Tools ---

const showMathStepsTool = tool(
  async (input: unknown): Promise<MathToolOutput> => {
    const { mathQuestion } = input as { mathQuestion: string };
    const prompt = `
    You are an expert math tutor. Solve this math problem step by step.
    
    IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format:
    {
      "toolName": "showMathSteps",
      "steps": [
        {
          "step": "Step 1: Subtract 3 from both sides",
          "substeps": ["2x + 3 - 3 = 11 - 3", "2x = 8"]
        },
        {
          "step": "Step 2: Divide both sides by 2",
          "substeps": ["2x / 2 = 8 / 2", "x = 4"]
        }
      ]
    }
    
    Math Question: ${mathQuestion}
    
    Respond with ONLY the JSON object, no other text:`;

    try {
      const response = await proLLM.invoke(prompt);
      const content = String(response.content);
      
      console.log('🔧 DEBUG: Using model:', proLLM.model);
      console.log('🔧 DEBUG: Math question:', mathQuestion);
      console.log('🔧 DEBUG: Raw LLM response:', content);

      // Attempt to parse JSON. LLMs can sometimes wrap JSON in markdown.
      const jsonString = content.includes('```json')
        ? content.split('```json')[1].split('```')[0].trim()
        : content;

      const parsedOutput: MathToolOutput = JSON.parse(jsonString);

      // Basic validation (optional, but good for robustness)
      if (parsedOutput.toolName !== "showMathSteps" || !Array.isArray(parsedOutput.steps)) {
        throw new Error("Invalid format for MathToolOutput");
      }

      // Add debug info as first step for now
      parsedOutput.steps.unshift({
        step: `🔧 DEBUG: Model: ${proLLM.model} | Question: ${mathQuestion}`,
        substeps: [`Raw response length: ${content.length} chars`, `JSON parsed successfully`]
      });

      return parsedOutput;
    } catch (error) {
      console.error("🔧 DEBUG: JSON parsing failed:", error);
      console.log('🔧 DEBUG: Content that failed to parse:', 'Content not available in catch scope');
      
      // For now, return debug info in the response
      return {
        toolName: "showMathSteps",
        steps: [
          { 
            step: `DEBUG: Model used: ${proLLM.model}`, 
            substeps: [] 
          },
          { 
            step: `DEBUG: Raw response: Check console logs for full response`, 
            substeps: [] 
          },
          { 
            step: "JSON parsing failed - see console for details", 
            substeps: [] 
          }
        ],
      };
    }
  },
  {
    name: "showMathSteps",
    description: "REQUIRED for ALL math problems. Takes any mathematical question, equation, or expression as input and returns structured step-by-step solutions. Use this for: solving equations, factoring, derivatives, integrals, word problems, algebraic manipulations, etc. Examples: '2x + 3 = 11', 'factor x²-4', 'derivative of sin(x)', 'solve quadratic equations'.",
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
  async (input: unknown): Promise<QuizToolOutput> => {
    const { subject } = input as { subject: string };
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
      const content = String(response.content);

      const jsonString = content.includes('```json')
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
  ["system", `You are a helpful student assistant with access to specialized tools.

IMPORTANT TOOL USAGE RULES:
1. For ANY math problem, equation, or mathematical question (like "solve 2x + 3 = 11", "how to factor x²-4", "derivative of x²"), you MUST use the "showMathSteps" tool. DO NOT answer math questions directly.
2. For ANY request for a quiz or test question (like "quiz me on biology", "give me a question about history"), you MUST use the "askQuizQuestion" tool.
3. Only answer directly for general questions that don't involve math solving or quiz generation.

EXAMPLES:
- "How do I solve 2x + 3 = 11?" → Use showMathSteps tool
- "What is the derivative of x²?" → Use showMathSteps tool  
- "Quiz me on photosynthesis" → Use askQuizQuestion tool
- "What is machine learning?" → Answer directly

You have access to these tools: showMathSteps, askQuizQuestion. Use them when appropriate.`],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"], // Important for agent's internal thought process
]);

const agent = createToolCallingAgent({
  llm: flashLLM,
  tools,
  prompt: agentPrompt,
});

// AgentExecutor removed - using direct pattern matching instead

// Helper function to detect if a message is a math question
function isMathQuestion(message: string): boolean {
  const mathKeywords = [
    'solve', 'equation', 'factor', 'derivative', 'integral', 'calculate',
    'simplify', 'expand', 'find x', 'find y', 'algebra', 'calculus',
    'x =', 'y =', '=', '+', '-', '*', '/', '^', 'sqrt', 'log', 'sin', 'cos', 'tan'
  ];
  
  const lowerMessage = message.toLowerCase();
  return mathKeywords.some(keyword => lowerMessage.includes(keyword)) ||
         /\d+[x-z]|[x-z]\d+|\d+\s*[+\-*/^]|[+\-*/^]\s*\d+/.test(message);
}

// Helper function to detect if a message is asking for a quiz
function isQuizQuestion(message: string): boolean {
  const quizKeywords = [
    'quiz', 'test', 'question', 'ask me', 'challenge me', 'practice',
    'multiple choice', 'true or false', 'exam'
  ];
  
  const lowerMessage = message.toLowerCase();
  return quizKeywords.some(keyword => lowerMessage.includes(keyword));
}

// --- API Route Handler ---
export async function POST(request: NextRequest) {
  try {
    const { message: userMessage } = await request.json();

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ message: 'Invalid input', type: 'text' }, { status: 400 });
    }

    console.log('🔧 DEBUG: User message:', userMessage);
    console.log('🔧 DEBUG: Is math question?', isMathQuestion(userMessage));
    console.log('🔧 DEBUG: Is quiz question?', isQuizQuestion(userMessage));

    // Direct pattern matching instead of agent
    if (isMathQuestion(userMessage)) {
      console.log('🔧 DEBUG: Calling math tool directly');
      
      const toolResult = await showMathStepsTool.invoke({ mathQuestion: userMessage });
      const toolOutput: MathToolOutput = typeof toolResult === 'object' && 'toolName' in toolResult 
        ? toolResult as MathToolOutput 
        : { toolName: "showMathSteps", steps: [{ step: "Error processing math steps", substeps: [] }] };
        
      return NextResponse.json({
        message: "Here are the steps to solve your math problem:",
        type: "math",
        tool_output: toolOutput,
      } as ChatApiResponse);
      
    } else if (isQuizQuestion(userMessage)) {
      console.log('🔧 DEBUG: Calling quiz tool directly');
      
      // Extract subject from the message (simple approach)
      const subject = userMessage.toLowerCase().replace(/quiz|test|question|ask me|about|on/g, '').trim() || 'general knowledge';
      
      const toolResult = await askQuizQuestionTool.invoke({ subject });
      const toolOutput: QuizToolOutput = typeof toolResult === 'object' && 'toolName' in toolResult 
        ? toolResult as QuizToolOutput 
        : { toolName: "askQuizQuestion", quiz: { question: "Error generating quiz", choices: [], correctAnswer: "" } };
        
      return NextResponse.json({
        message: "Here's a quiz question for you:",
        type: "quiz",
        tool_output: toolOutput,
      } as ChatApiResponse);
      
    } else {
      console.log('🔧 DEBUG: Using direct LLM response');
      console.log('🔧 DEBUG: Using model:', flashLLM.model);
      
      // For general questions, use the LLM directly with a proper prompt
      const prompt = `You are an expert educational assistant. Provide a comprehensive, well-structured explanation that helps students learn effectively.

IMPORTANT FORMATTING RULES:
- Start with a clear definition or overview
- Use **bold** for key terms and concepts
- Organize information with numbered sections (1., 2., 3.)
- Use bullet points (•) for lists and sub-points
- Include examples where helpful
- End with a brief summary or key takeaway
- Keep paragraphs concise and focused
- Use simple, clear language appropriate for students

Student Question: ${userMessage}

Provide a detailed educational response:`;
      
      const response = await flashLLM.invoke(prompt);
      const content = String(response.content);
      
      console.log('🔧 DEBUG: Response length:', content.length);
      console.log('🔧 DEBUG: Response preview:', content.substring(0, 100) + '...');
      
      // Add debug info to the response
      const finalMessage = `🔧 **Model**: ${flashLLM.model}\n\n${content}`;
      
      return NextResponse.json({
        message: finalMessage,
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