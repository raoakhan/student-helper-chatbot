# Student Helper Chatbot

An intelligent chatbot that helps students with math problems, quizzes, and general educational questions using Google's Gemini 2.5 AI models.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd student-helper-chatbot
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Set up environment variables (see below)

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variable:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

To get a Google API key:
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create an API key
3. Copy the key and add it to your `.env.local` file

## How to Test the Tools

The chatbot supports three types of interactions:

1. **Math Problem Solving** - Provides step-by-step solutions
2. **Quiz Generation** - Creates interactive quizzes on various topics
3. **General Q&A** - Answers educational questions with detailed explanations

## Test Case Scenarios

### 1. Math Problem Solving
**Input:** "How do I solve 2x + 3 = 11?"  
**Expected Result:** Should trigger the **Show Math Steps** tool, displaying a step-by-step solution to the equation.

### 2. Quiz Generation
**Input:** "Can you quiz me on the water cycle?"  
**Expected Result:** Should trigger the **Ask Quiz Question** tool, presenting an interactive multiple-choice question about the water cycle.

### 3. General Q&A
**Input:** "Tell me about photosynthesis."  
**Expected Result:** Should be handled directly by Gemini 2.5 Flash, providing a detailed explanation of photosynthesis with clear sections and formatting.

## Deployment

### Vercel (Recommended)
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Other Platforms
You can also deploy to other platforms that support Next.js applications. Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Built With

- [Next.js](https://nextjs.org/) - The React Framework
- [Google Gemini 2.5](https://ai.google.dev/) - AI models for chat and tools
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Styling
