import { useState, useEffect } from 'react';
import { FiCheckCircle, FiDownload, FiUpload, FiXCircle, FiSliders, FiCheck, FiX, FiZap, FiRefreshCw } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';
import PropTypes from 'prop-types';

const algorithms = [
  'Linear Regression',
  'Logistic Regression',
  'Decision Tree',
  'Random Forest',
  'Support Vector Machine',
  'K-Nearest Neighbors',
  'Neural Network',
  'XGBoost'
];

const DeployModel = ({ sessionId, onClose }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [modelTrained, setModelTrained] = useState(false);
  const [modelCard, setModelCard] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showRefinement, setShowRefinement] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [parameters, setParameters] = useState({
    learningRate: 0.01,
    epochs: 100,
    batchSize: 32,
    dropout: 0.2
  });
  const [performance, setPerformance] = useState({
    accuracy: 85,
    precision: 83,
    recall: 87,
    f1Score: 85
  });
  const [accuracy, setAccuracy] = useState(75);
  const [parametersApplied, setParametersApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Calculate accuracy based on parameters
    const newAccuracy = Math.min(
      95,
      70 +
        (parameters.epochs / 20) * 10 +
        (parameters.learningRate * 1000) / 2 -
        parameters.dropout * 20
    );
    setAccuracy(Math.round(newAccuracy));
  }, [parameters]);

  const handleTrainModel = async () => {
    if (!selectedAlgorithm) {
      alert('Please select an algorithm first');
      return;
    }

    setIsTraining(true);
    try {
      const response = await axios.post(`http://localhost:5000/train/${sessionId}`, {
        algorithm: selectedAlgorithm
      });
      setModelTrained(true);
      // Store model info for later use
      setModelCard(response.data);
    } catch (error) {
      console.error('Training error:', error);
      alert(error.response?.data?.error || 'Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  const handleDownloadModel = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(
        `http://localhost:5000/download-model/${sessionId}`,
        {
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `model_${Date.now()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download model');
    } finally {
      setDownloading(false);
    }
  };

  const handleHostModel = async () => {
    setIsDeploying(true);
    try {
      const response = await axios.post(`http://localhost:5000/host-model/${sessionId}`);
      setModelCard({
        ...modelCard,
        apiKey: response.data.api_key,
        endpoint: response.data.endpoint
      });
    } catch (error) {
      console.error('Hosting error:', error);
      alert('Failed to host model');
    } finally {
      setIsDeploying(false);
    }
  };

  // Calculate performance metrics based on parameters
  const calculatePerformance = (params) => {
    // Base performance
    let accuracy = 85;
    let precision = 83;
    let recall = 87;
    let f1Score = 85;

    // Learning rate effects
    if (params.learningRate > 0.05) {
      // Too high learning rate decreases performance
      accuracy -= (params.learningRate - 0.05) * 200;
      precision -= (params.learningRate - 0.05) * 180;
      recall -= (params.learningRate - 0.05) * 190;
    } else if (params.learningRate < 0.01) {
      // Too low learning rate slightly decreases performance
      accuracy -= (0.01 - params.learningRate) * 100;
      precision -= (0.01 - params.learningRate) * 90;
      recall -= (0.01 - params.learningRate) * 95;
    }

    // Epochs effects
    accuracy += Math.log(params.epochs / 100) * 2;
    precision += Math.log(params.epochs / 100) * 1.8;
    recall += Math.log(params.epochs / 100) * 1.9;

    // Batch size effects
    if (params.batchSize < 16) {
      // Too small batch size can lead to noisy updates
      accuracy -= (16 - params.batchSize) * 0.2;
      precision -= (16 - params.batchSize) * 0.15;
      recall -= (16 - params.batchSize) * 0.18;
    } else if (params.batchSize > 64) {
      // Too large batch size can lead to poor generalization
      accuracy -= (params.batchSize - 64) * 0.1;
      precision -= (params.batchSize - 64) * 0.12;
      recall -= (params.batchSize - 64) * 0.11;
    }

    // Dropout effects
    if (params.dropout > 0.3) {
      // Too high dropout can hurt performance
      accuracy -= (params.dropout - 0.3) * 20;
      precision -= (params.dropout - 0.3) * 18;
      recall -= (params.dropout - 0.3) * 19;
    }

    // Ensure values stay within realistic bounds
    const clamp = (value) => Math.min(99, Math.max(50, value));
    accuracy = clamp(accuracy);
    precision = clamp(precision);
    recall = clamp(recall);
    
    // Calculate F1 score as harmonic mean of precision and recall
    f1Score = 2 * (precision * recall) / (precision + recall);

    return {
      accuracy: Math.round(accuracy),
      precision: Math.round(precision),
      recall: Math.round(recall),
      f1Score: Math.round(f1Score)
    };
  };

  const handleParameterChange = (name, value) => {
    setParameters(prev => {
      // Apply thresholds
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
    
    // Update performance preview immediately
    setPerformance(calculatePerformance(parameters));
    setHasChanges(true);
  };

  const handleRefine = async () => {
    try {
      setIsRefining(true);
      const response = await axios.post(`http://localhost:5000/refine-model/${sessionId}`, parameters);
      setPerformance(response.data.performance);
      setHasChanges(false);
      alert('Model refined successfully!');
    } catch (error) {
      console.error('Refinement error:', error);
      alert('Failed to refine model');
    } finally {
      setIsRefining(false);
    }
  };

  const applyHandler = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/refine-model/${sessionId}`, {
        parameters,
        accuracy
      });
      
      if (response.data.success) {
        setParametersApplied(true);
        setShowRefinement(false);
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
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FiZap className="text-green-400" />
          Model Deployment
        </h2>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setShowRefinement(true);
              setParametersApplied(false);
            }}
            className="bg-green-400/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-400/30"
          >
            <FiSliders /> Refine Performance
          </button>
        </div>

        {showRefinement && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Performance Tuner</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Model Accuracy: {accuracy}%</span>
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
                  <label className="block mb-2">Epochs ({parameters.epochs})</label>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={parameters.epochs}
                    onChange={(e) => handleParameterChange('epochs', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block mb-2">
                    Learning Rate ({parameters.learningRate.toFixed(4)})
                  </label>
                  <input
                    type="range"
                    min="0.0001"
                    max="0.01"
                    step="0.0001"
                    value={parameters.learningRate}
                    onChange={(e) => handleParameterChange('learningRate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block mb-2">
                    Batch Size ({parameters.batchSize})
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="128"
                    step="8"
                    value={parameters.batchSize}
                    onChange={(e) => handleParameterChange('batchSize', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block mb-2">
                    Dropout ({parameters.dropout.toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={parameters.dropout}
                    onChange={(e) => handleParameterChange('dropout', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={applyHandler}
              disabled={loading}
              className="mt-4 w-full bg-green-400 hover:bg-green-300 text-black py-2 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        )}

        {parametersApplied && (
          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={() => console.log('Download model logic')}
              className="bg-green-400 hover:bg-green-300 text-black px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <FiDownload /> Download Model
            </button>
            <button
              onClick={() => console.log('Deploy model logic')}
              className="bg-green-400 hover:bg-green-300 text-black px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <FiZap /> Deploy Model
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

DeployModel.propTypes = {
  sessionId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DeployModel; 