// src/components/MessageDisplay.tsx
//import { FC } from 'react';
import { ChatMessage } from '@/lib/types';
import MathSteps from '@/components/MathSteps'; 
import QuizCard from '@/components/QuizCard';   

interface MessageDisplayProps {
  message: ChatMessage;
  onQuizAnswer?: (selectedChoice: string) => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onQuizAnswer }) => {
  const isUser = message.role === 'user';
  const messageClass = isUser ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-300 text-gray-800';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg p-3 max-w-lg shadow-md ${messageClass}`}>
        {message.type === 'text' && (
          <p>{message.content}</p>
        )}

        {message.type === 'math' && message.mathSteps && (
          <>
            <p className="mb-2 font-medium">{message.content}</p>
            <MathSteps steps={message.mathSteps} />
          </>
        )}

        {message.type === 'quiz' && message.quizData && (
          <>
            <p className="mb-2 font-medium">{message.content}</p>
            <QuizCard
              quizData={message.quizData}
              quizState={message.quizState}
              onAnswer={onQuizAnswer}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageDisplay;