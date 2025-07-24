// src/components/QuizCard.tsx
import React from 'react';
import { QuizQuestionData } from '@/lib/types';

interface QuizState {
  answered: boolean;
  selectedChoice: string | null;
  isCorrect: boolean | null;
}

interface QuizCardProps {
  quizData: QuizQuestionData;
  quizState?: QuizState;
  onAnswer?: (selectedChoice: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ quizData, quizState, onAnswer }) => {
  const handleChoiceClick = (choice: string) => {
    if (!quizState?.answered && onAnswer) {
      onAnswer(choice);
    }
  };

  const getChoiceStyle = (choice: string) => {
    if (!quizState?.answered) {
      return "bg-white hover:bg-purple-50 hover:border-purple-300 cursor-pointer transform hover:scale-[1.02] transition-all duration-200";
    }

    if (choice === quizData.correctAnswer) {
      return "bg-green-50 border-green-400 text-green-800 shadow-md";
    }

    if (choice === quizState.selectedChoice && choice !== quizData.correctAnswer) {
      return "bg-red-50 border-red-400 text-red-800 shadow-md";
    }

    return "bg-gray-50 text-gray-500 opacity-75";
  };

  const getChoiceIcon = (choice: string) => {
    if (!quizState?.answered) return null;
    
    if (choice === quizData.correctAnswer) {
      return <span className="text-green-600 font-bold ml-2">✓</span>;
    }
    
    if (choice === quizState.selectedChoice && choice !== quizData.correctAnswer) {
      return <span className="text-red-600 font-bold ml-2">✗</span>;
    }
    
    return null;
  };

  return (
    <div className="bg-purple-50 rounded-lg p-4 mt-3 border-l-4 border-purple-400">
      <div className="flex items-center mb-4">
        <span className="text-purple-600 text-lg mr-2">🧠</span>
        <h3 className="font-semibold text-purple-800">Quiz Question</h3>
      </div>
      
      <div className="bg-white rounded-md p-4 shadow-sm mb-4">
        <h4 className="font-medium text-gray-800 text-lg leading-relaxed">{quizData.question}</h4>
      </div>
      
      <div className="space-y-3">
        {quizData.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoiceClick(choice)}
            disabled={quizState?.answered}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
              getChoiceStyle(choice)
            } disabled:cursor-not-allowed flex items-center justify-between`}
          >
            <div className="flex items-center">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white text-sm font-bold rounded-full flex items-center justify-center mr-3">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="font-medium">{choice}</span>
            </div>
            {getChoiceIcon(choice)}
          </button>
        ))}
      </div>

      {quizState?.answered && (
        <div className={`mt-4 p-4 rounded-lg border-l-4 ${
          quizState.isCorrect 
            ? 'bg-green-50 border-green-400' 
            : 'bg-red-50 border-red-400'
        }`}>
          {quizState.isCorrect ? (
            <div className="flex items-center">
              <span className="text-2xl mr-2">🎉</span>
              <p className="text-green-700 font-semibold">Excellent! You got it right!</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💡</span>
                <p className="text-red-700 font-semibold">Not quite right, but keep learning!</p>
              </div>
              <p className="text-gray-700">
                The correct answer is: <span className="font-semibold text-green-700">{quizData.correctAnswer}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizCard;