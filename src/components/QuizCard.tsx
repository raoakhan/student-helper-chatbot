// src/components/QuizCard.tsx
import React from 'react';
import { QuizQuestionData } from '@/lib/types';

interface QuizCardProps {
  quizData: QuizQuestionData;
  quizState?: {
    answered: boolean;
    selectedChoice: string | null;
    isCorrect: boolean | null;
  };
  onAnswer?: (selectedChoice: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quizData, quizState, onAnswer }) => {
  const { question, choices, correctAnswer } = quizData;
  const { answered, selectedChoice, isCorrect } = quizState || { answered: false, selectedChoice: null, isCorrect: null };

  const getButtonClasses = (choice: string) => {
    let classes = "px-4 py-2 rounded-lg text-left w-full transition-colors duration-200 ";
    if (answered) {
      if (choice === correctAnswer) {
        classes += "bg-green-200 text-green-800 border-green-400"; // Correct answer
      } else if (choice === selectedChoice) {
        classes += "bg-red-200 text-red-800 border-red-400"; // Incorrectly selected
      } else {
        classes += "bg-gray-200 text-gray-700 border-gray-300 opacity-70"; // Unselected
      }
      classes += " cursor-not-allowed";
    } else {
      classes += "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
    }
    return classes;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-2 border border-gray-200">
      <p className="font-semibold text-lg mb-4">{question}</p>
      <div className="space-y-3">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => onAnswer && !answered && onAnswer(choice)}
            className={getButtonClasses(choice)}
            disabled={answered}
          >
            {choice}
          </button>
        ))}
      </div>
      {answered && (
        <p className={`mt-4 font-bold text-center ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? 'Correct!' : `Incorrect. The correct answer was: ${correctAnswer}`}
        </p>
      )}
    </div>
  );
};

export default QuizCard;