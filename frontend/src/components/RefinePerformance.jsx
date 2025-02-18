import { useState, useEffect } from 'react';
import { FiSliders, FiDownload, FiZap } from 'react-icons/fi';
import axios from 'axios';

const RefinePerformance = ({ model, onUpdate }) => {
  const [accuracy, setAccuracy] = useState(model.accuracy || 92.4);
  const [parameters, setParameters] = useState({
    epochs: 10,
    learningRate: 0.001,
    batchSize: 32,
    dropout: 0.2,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate new accuracy based on parameters
    const newAccuracy = Math.min(
      95,
      model.accuracy +
        (parameters.epochs / 20) * 2 +
        (parameters.learningRate * 1000) / 2 -
        parameters.dropout * 20
    );
    setAccuracy(Math.round(newAccuracy * 10) / 10);
  }, [parameters, model.accuracy]);

  const handleParameterChange = (name, value) => {
    setParameters(prev => {
      if (name === 'epochs' && value > 25) {
        value = 25;
        alert('Maximum 25 epochs allowed!');
      }
      if (name === 'dropout' && value > 0.5) {
        value = 0.5;
        alert('Dropout cannot exceed 0.5!');
      }
      return { ...prev, [name]: parseFloat(value) };
    });
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/refine-model/${model.id}`, {
        parameters,
        accuracy
      });
      
      if (response.data.success) {
        onUpdate({ ...model, accuracy });
        alert('Model refined successfully!');
      }
    } catch (error) {
      console.error('Refinement failed:', error);
      alert('Failed to apply parameters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-green-400">Performance Tuner</h3>
      
      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-green-400">Model Accuracy: {accuracy}%</span>
          </div>
          <div className="h-2 bg-gray-600 rounded-full">
            <div 
              className="h-full bg-green-400 rounded-full transition-all duration-300"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-green-400">
              Epochs ({parameters.epochs})
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={parameters.epochs}
              onChange={(e) => handleParameterChange('epochs', e.target.value)}
              className="w-full accent-green-400"
            />
          </div>

          <div>
            <label className="block mb-2 text-green-400">
              Learning Rate ({parameters.learningRate.toFixed(4)})
            </label>
            <input
              type="range"
              min="0.0001"
              max="0.01"
              step="0.0001"
              value={parameters.learningRate}
              onChange={(e) => handleParameterChange('learningRate', e.target.value)}
              className="w-full accent-green-400"
            />
          </div>

          <div>
            <label className="block mb-2 text-green-400">
              Batch Size ({parameters.batchSize})
            </label>
            <input
              type="range"
              min="16"
              max="128"
              step="8"
              value={parameters.batchSize}
              onChange={(e) => handleParameterChange('batchSize', e.target.value)}
              className="w-full accent-green-400"
            />
          </div>

          <div>
            <label className="block mb-2 text-green-400">
              Dropout ({parameters.dropout.toFixed(2)})
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={parameters.dropout}
              onChange={(e) => handleParameterChange('dropout', e.target.value)}
              className="w-full accent-green-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleApply}
          disabled={loading}
          className="flex-1 bg-green-400 hover:bg-green-300 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Applying...' : 'Apply Changes'}
        </button>
        
        {accuracy > model.accuracy && (
          <div className="flex gap-2">
            <button className="bg-green-400 hover:bg-green-300 text-black px-4 py-2 rounded-lg flex items-center gap-2">
              <FiDownload /> Download
            </button>
            <button className="bg-green-400 hover:bg-green-300 text-black px-4 py-2 rounded-lg flex items-center gap-2">
              <FiZap /> Deploy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefinePerformance; 