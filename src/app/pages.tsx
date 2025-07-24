// src/app/page.tsx
"use client"; // This line is crucial for client-side components in App Router

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatApiResponse, MathToolOutput, QuizToolOutput, QuizQuestionData } from '@/lib/types';
import MessageDisplay from '@/components/MessageDisplay';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "" || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input, type: "text" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", { // Calls your Next.js API Route
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const data: ChatApiResponse = await response.json();

      const aiMessage: ChatMessage = {
        role: "ai",
        content: data.message,
        type: data.type,
      };

      if (data.type === "math") {
        aiMessage.mathSteps = (data.tool_output as MathToolOutput)?.steps;
      } else if (data.type === "quiz") {
        aiMessage.quizData = (data.tool_output as QuizToolOutput)?.quiz;
        aiMessage.quizState = { answered: false, selectedChoice: null, isCorrect: null };
      }

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: Could not connect to the chatbot or process your request.", type: "text" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (messageIndex: number, selectedChoice: string, quizData: QuizQuestionData) => {
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      const quizMessage = newMessages[messageIndex];
      if (quizMessage && quizMessage.type === "quiz" && quizMessage.quizState) {
        quizMessage.quizState = {
          answered: true,
          selectedChoice: selectedChoice,
          isCorrect: selectedChoice === quizData.correctAnswer,
        };
      }
      return newMessages;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      <header className="bg-blue-600 text-white p-4 text-center text-2xl font-bold">
        Student Helper Chatbot
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageDisplay
            key={index}
            message={msg}
            onQuizAnswer={(selectedChoice) => {
              if (msg.type === "quiz" && msg.quizData) {
                handleQuizAnswer(index, selectedChoice, msg.quizData);
              }
            }}
          />
        ))}
        <div ref={messagesEndRef} /> {/* Scroll to this div */}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
           readOnly={loading}
          placeholder="Ask your academic question..."
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}