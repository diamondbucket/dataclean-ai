import { useState } from 'react';
import { FiCheckCircle, FiDownload, FiUpload, FiXCircle, FiSliders, FiCheck, FiX } from 'react-icons/fi';
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
  const [showRefineModal, setShowRefineModal] = useState(false);
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

  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    const newParameters = {
      ...parameters,
      [name]: parseFloat(value)
    };
    setParameters(newParameters);
    
    // Update performance preview immediately
    setPerformance(calculatePerformance(newParameters));
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="my-8 bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(128,128,128,0.5)] max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-green-400 hover:text-green-300"
        >
          <FiX size={24} />
        </button>

        <h2 className="text-2xl font-bold text-green-400 mb-6">Deploy Model</h2>

        {!modelTrained ? (
          <>
            <div className="mb-6">
              <label className="block text-green-300 mb-2">Select Algorithm</label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="w-full bg-black border border-green-400/20 rounded-lg px-4 py-3 text-green-300 focus:ring-2 focus:ring-green-400"
              >
                <option value="">Choose an algorithm...</option>
                {algorithms.map((algo) => (
                  <option key={algo} value={algo}>
                    {algo}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className="w-full bg-green-400 hover:bg-green-300 text-black px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              {isTraining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Training Model...
                </>
              ) : (
                <>Train Model</>
              )}
            </button>
          </>
        ) : (
          <>
            {!modelCard?.apiKey ? (
              <div className="space-y-4">
                <button
                  onClick={handleDownloadModel}
                  disabled={downloading}
                  className="w-full bg-green-400 hover:bg-green-300 text-black px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <FiDownload />
                  Download Model
                </button>
                
                <button
                  onClick={handleHostModel}
                  disabled={isDeploying}
                  className="w-full bg-blue-500 hover:bg-blue-400 text-black px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      Deploying Model...
                    </>
                  ) : (
                    <>
                      <FiUpload />
                      Host Model
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/30 border border-green-400/20 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Model Card</h3>
                  <div className="space-y-2 text-green-300">
                    <p><strong>Algorithm:</strong> {selectedAlgorithm}</p>
                    <p><strong>API Key:</strong> {modelCard.apiKey}</p>
                    <p><strong>Endpoint:</strong> {modelCard.endpoint}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center text-green-400">
                  <FiCheckCircle className="mr-2" />
                  Model Successfully Deployed
                </div>

                {/* Model Performance Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Model Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 p-4 rounded-lg border border-green-400/20">
                      <p className="text-green-300">Accuracy</p>
                      <p className="text-2xl font-bold text-green-400">{performance.accuracy}%</p>
                      <div className="h-1 bg-green-400/20 rounded-full mt-2">
                        <div 
                          className="h-full bg-green-400 rounded-full transition-all duration-300"
                          style={{ width: `${performance.accuracy}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-400/20">
                      <p className="text-green-300">Precision</p>
                      <p className="text-2xl font-bold text-green-400">{performance.precision}%</p>
                      <div className="h-1 bg-green-400/20 rounded-full mt-2">
                        <div 
                          className="h-full bg-green-400 rounded-full transition-all duration-300"
                          style={{ width: `${performance.precision}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-400/20">
                      <p className="text-green-300">Recall</p>
                      <p className="text-2xl font-bold text-green-400">{performance.recall}%</p>
                      <div className="h-1 bg-green-400/20 rounded-full mt-2">
                        <div 
                          className="h-full bg-green-400 rounded-full transition-all duration-300"
                          style={{ width: `${performance.recall}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg border border-green-400/20">
                      <p className="text-green-300">F1 Score</p>
                      <p className="text-2xl font-bold text-green-400">{performance.f1Score}%</p>
                      <div className="h-1 bg-green-400/20 rounded-full mt-2">
                        <div 
                          className="h-full bg-green-400 rounded-full transition-all duration-300"
                          style={{ width: `${performance.f1Score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refine Performance Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Refine Performance</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-green-300 block mb-2">Learning Rate</label>
                      <input
                        type="range"
                        name="learningRate"
                        min="0.001"
                        max="0.1"
                        step="0.001"
                        value={parameters.learningRate}
                        onChange={handleParameterChange}
                        className="w-full accent-green-400 bg-black/30"
                      />
                      <div className="text-green-400 text-sm mt-1">{parameters.learningRate}</div>
                    </div>
                    <div>
                      <label className="text-green-300 block mb-2">Epochs</label>
                      <input
                        type="range"
                        name="epochs"
                        min="10"
                        max="500"
                        step="10"
                        value={parameters.epochs}
                        onChange={handleParameterChange}
                        className="w-full accent-green-400 bg-black/30"
                      />
                      <div className="text-green-400 text-sm mt-1">{parameters.epochs}</div>
                    </div>
                    <div>
                      <label className="text-green-300 block mb-2">Batch Size</label>
                      <input
                        type="range"
                        name="batchSize"
                        min="8"
                        max="128"
                        step="8"
                        value={parameters.batchSize}
                        onChange={handleParameterChange}
                        className="w-full accent-green-400 bg-black/30"
                      />
                      <div className="text-green-400 text-sm mt-1">{parameters.batchSize}</div>
                    </div>
                    <div>
                      <label className="text-green-300 block mb-2">Dropout Rate</label>
                      <input
                        type="range"
                        name="dropout"
                        min="0"
                        max="0.5"
                        step="0.1"
                        value={parameters.dropout}
                        onChange={handleParameterChange}
                        className="w-full accent-green-400 bg-black/30"
                      />
                      <div className="text-green-400 text-sm mt-1">{parameters.dropout}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleRefine}
                    disabled={!hasChanges || isRefining}
                    className={`flex-1 flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-3 rounded-lg transition-colors ${
                      hasChanges && !isRefining ? 'hover:bg-green-400/10' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isRefining ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
                    ) : (
                      <FiCheck />
                    )}
                    Apply Changes
                  </button>
                  <button
                    onClick={handleDownloadModel}
                    disabled={downloading || hasChanges}
                    className={`flex-1 flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-3 rounded-lg transition-colors ${
                      !downloading && !hasChanges ? 'hover:bg-green-400/10' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {downloading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
                    ) : (
                      <FiDownload />
                    )}
                    Download Model
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-3 rounded-lg transition-colors hover:bg-green-400/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
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