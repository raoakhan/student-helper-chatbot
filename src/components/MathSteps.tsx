// src/components/MathSteps.tsx
import React from 'react';
import { MathSubStep } from '@/lib/types';

interface MathStepsProps {
  steps: MathSubStep[];
}

const MathSteps: React.FC<MathStepsProps> = ({ steps }) => {
  return (
    <ol className="list-decimal list-inside space-y-2 mt-2">
      {steps.map((s, index) => (
        <li key={index} className="text-gray-800">
          <span className="font-medium">{s.step}</span>
          {s.substeps && s.substeps.length > 0 && (
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              {s.substeps.map((sub, subIndex) => (
                <li key={subIndex} className="text-gray-700">• {sub}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
};

export default MathSteps;