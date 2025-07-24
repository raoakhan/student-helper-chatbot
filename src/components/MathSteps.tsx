// src/components/MathSteps.tsx
import React from 'react';
import { MathSubStep } from '@/lib/types';

interface MathStepsProps {
  steps: MathSubStep[];
}

const MathSteps: React.FC<MathStepsProps> = ({ steps }) => {
  return (
    <div className="bg-blue-50 rounded-lg p-4 mt-3 border-l-4 border-blue-400">
      <div className="flex items-center mb-3">
        <span className="text-blue-600 text-lg mr-2">📐</span>
        <h3 className="font-semibold text-blue-800">Solution Steps</h3>
      </div>
      <div className="space-y-4">
        {steps.map((stepObj, index) => (
          <div key={index} className="bg-white rounded-md p-3 shadow-sm">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-3 mt-0.5">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-2">{stepObj.step}</p>
                {stepObj.substeps && stepObj.substeps.length > 0 && (
                  <div className="ml-2 space-y-1">
                    {stepObj.substeps.map((substep, subIndex) => (
                      <div key={subIndex} className="flex items-center">
                        <span className="text-blue-400 mr-2">→</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-700">
                          {substep}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MathSteps;