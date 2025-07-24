// src/components/MessageDisplay.tsx
import { ChatMessage } from '@/lib/types';
import MathSteps from '@/components/MathSteps'; 
import QuizCard from '@/components/QuizCard';   

interface MessageDisplayProps {
  message: ChatMessage;
  onQuizAnswer?: (selectedChoice: string) => void;
}

// Helper function to format text content with basic markdown-like styling
function formatTextContent(content: string): JSX.Element {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      elements.push(<br key={index} />);
      return;
    }
    
    // Handle markdown headings (### heading)
    if (/^#{1,6}/.test(trimmedLine)) {
      const level = (trimmedLine.match(/^#+/) || [''])[0].length;
      const content = trimmedLine.replace(/^#+\s*/, '');
      const HeadingTag = level <= 2 ? 'h2' : 'h3';
      const headingClass = level <= 2 
        ? 'font-bold text-gray-900 text-xl mt-6 mb-3'
        : 'font-semibold text-gray-800 text-lg mt-4 mb-2';
      
      elements.push(
        <HeadingTag key={index} className={headingClass}>
          {formatInlineText(content)}
        </HeadingTag>
      );
      return;
    }
    
    // Handle numbered sections (1., 2., 3.)
    if (/^\d+\./.test(trimmedLine)) {
      const content = trimmedLine.replace(/^\d+\.\s*/, '');
      elements.push(
        <div key={index} className="mt-4 mb-2">
          <h3 className="font-semibold text-gray-800 text-lg">
            {formatInlineText(content)}
          </h3>
        </div>
      );
      return;
    }
    
    // Handle bullet points (•, -, or *) - but only if they're clearly list items
    if (/^[•\-]\s+/.test(trimmedLine) || /^\*\s+(?!\*)[^*]+$/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^[•\-\*]\s+/, '');
      // Skip if the content looks like it's part of bold formatting or headings
      if (!content.includes('**') && content.length > 3) {
        elements.push(
          <div key={index} className="ml-6 mb-2 flex items-start">
            <span className="text-blue-500 mr-3 mt-1 text-lg">🔹</span>
            <span className="text-gray-700 leading-relaxed">{formatInlineText(content)}</span>
          </div>
        );
        return;
      }
    }
    
    // Handle debug/model info lines
    if (trimmedLine.startsWith('🔧')) {
      elements.push(
        <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-3 rounded">
          <span className="text-blue-800 text-sm font-medium">{trimmedLine}</span>
        </div>
      );
      return;
    }
    
    // Regular paragraphs
    elements.push(
      <p key={index} className="text-gray-800 leading-relaxed mb-3">
        {formatInlineText(trimmedLine)}
      </p>
    );
  });
  
  return <div>{elements}</div>;
}

// Helper function to format inline text (bold, etc.)
function formatInlineText(text: string): JSX.Element {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  const elements: (string | JSX.Element)[] = [];
  
  parts.forEach((part, index) => {
    if (index % 2 === 1) {
      // This is bold text
      elements.push(<strong key={index} className="font-semibold text-gray-900">{part}</strong>);
    } else {
      // Regular text
      elements.push(part);
    }
  });
  
  return <span>{elements}</span>;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onQuizAnswer }) => {
  const isUser = message.role === 'user';
  
  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start space-x-3 max-w-2xl">
          <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">👤</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start space-x-3 max-w-4xl w-full">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">🤖</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {message.type === 'text' && (
            <div className="bg-white rounded-2xl rounded-tl-md px-6 py-4 shadow-lg border border-gray-100">
              <div className="prose prose-sm max-w-none">
                {formatTextContent(message.content)}
              </div>
            </div>
          )}

          {message.type === 'math' && message.mathSteps && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-lg border border-gray-100">
                <p className="text-gray-800 font-medium">{message.content}</p>
              </div>
              <MathSteps steps={message.mathSteps} />
            </div>
          )}

          {message.type === 'quiz' && message.quizData && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-lg border border-gray-100">
                <p className="text-gray-800 font-medium">{message.content}</p>
              </div>
              <QuizCard
                quizData={message.quizData}
                quizState={message.quizState}
                onAnswer={onQuizAnswer}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageDisplay;