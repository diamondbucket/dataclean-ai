import { useState } from 'react';
import { FiX, FiCamera, FiSliders } from 'react-icons/fi';
import RefinePerformance from './RefinePerformance';

const ModelDeployedModal = ({ model, onClose }) => {
  const [showRefinement, setShowRefinement] = useState(false);
  const [currentModel, setCurrentModel] = useState(model);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <FiX />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-green-400">
          Model Deployed Successfully
        </h2>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl text-green-400">
              Model V1 - Random Forest
            </h3>
            <span className="text-green-400">
              Accuracy: {currentModel.accuracy}%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-green-400 mb-2">API Endpoint</h4>
              <div className="bg-black/50 p-3 rounded-lg font-mono text-sm">
                {currentModel.endpoint}
              </div>
            </div>

            <div>
              <h4 className="text-green-400 mb-2">API Key</h4>
              <div className="bg-black/50 p-3 rounded-lg font-mono text-sm">
                {currentModel.apiKey}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowRefinement(!showRefinement)}
              className="bg-green-400/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-400/30"
            >
              <FiSliders /> {showRefinement ? 'Hide Refinement' : 'Refine Performance'}
            </button>
            <button
              onClick={() => {}} // Add screenshot functionality
              className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-500/30"
            >
              <FiCamera /> Screenshot
            </button>
          </div>

          {showRefinement && (
            <RefinePerformance 
              model={currentModel} 
              onUpdate={setCurrentModel}
            />
          )}

          <div className="bg-yellow-500/20 p-4 rounded-lg flex items-center gap-2">
            <span className="text-yellow-500">⚠️</span>
            Screenshot this information - you won't see it again!
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDeployedModal; 