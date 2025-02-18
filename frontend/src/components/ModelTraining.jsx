import { useState, useEffect } from 'react';
import { FiKey, FiBox, FiCheck, FiX, FiCamera, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import PropTypes from 'prop-types';

const ModelTraining = ({ sessionId, onClose, onDeploy }) => {
  const [isTraining, setIsTraining] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);
  const [deploymentInfo, setDeploymentInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const handleTrain = async () => {
    try {
      setIsTraining(true);
      const response = await axios.post(
        `http://localhost:5000/train-models/${sessionId}`,
        {}, // Empty object as payload
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      setModels(response.data.models);
    } catch (error) {
      console.error('Training error:', error);
      alert('Failed to train models');
    } finally {
      setIsTraining(false);
    }
  };

  useEffect(() => {
    handleTrain();
  }, []);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    // Generate a random API key
    const generatedApiKey = 'sk_' + Math.random().toString(36).substr(2, 18);
    setApiKey(generatedApiKey);
    const endpoint = `https://api.example.com/models/${model.name.toLowerCase().replace(' ', '-')}`;
    setDeploymentInfo({
      model: model,
      apiKey: generatedApiKey,
      endpoint: endpoint
    });
    setShowApiInput(true);
  };

  const handleDeploy = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/deploy-model/${sessionId}`,
        {
          model_name: selectedModel.name,
          api_key: apiKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      onDeploy({
        ...selectedModel,
        endpoint: response.data.endpoint,
        api_key: apiKey
      });
      onClose();
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Failed to deploy model');
    }
  };

  const handleDownloadModel = async (model) => {
    try {
      setDownloading(true);
      setActionMessage('Downloading model...');
      setShowMessage(true);
      
      const response = await axios.get(
        `http://localhost:5000/download-model/${sessionId}/${model.name}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${model.name.toLowerCase().replace(' ', '_')}.pkl`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setActionMessage('Model downloaded successfully!');
      setTimeout(() => setShowMessage(false), 2000);
    } catch (error) {
      console.error('Download error:', error);
      setActionMessage('Failed to download model');
      setTimeout(() => setShowMessage(false), 2000);
    } finally {
      setDownloading(false);
    }
  };

  if (isTraining) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(128,128,128,0.5)] max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-transparent mx-auto mb-4" />
          <h3 className="text-green-400 text-lg font-semibold">Training Models...</h3>
          <p className="text-green-300/80 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(128,128,128,0.5)] max-w-4xl w-full">
        {deploymentInfo ? (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">Model Deployed Successfully</h2>
              <button onClick={onClose} className="text-green-400 hover:text-green-300">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="bg-black/30 border border-green-400/20 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-400">
                  {deploymentInfo.model.name} - {deploymentInfo.model.algorithm}
                </h3>
                <span className="bg-green-400/10 text-green-400 px-3 py-1 rounded-full text-sm">
                  Accuracy: {deploymentInfo.model.accuracy}%
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-green-300 mb-1">API Endpoint</label>
                  <code className="block bg-black/40 text-green-300 p-3 rounded-lg break-all">
                    {deploymentInfo.endpoint}
                  </code>
                </div>
                
                <div>
                  <label className="block text-green-300 mb-1">API Key</label>
                  <code className="block bg-black/40 text-green-300 p-3 rounded-lg break-all">
                    {deploymentInfo.apiKey}
                  </code>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-amber-400 bg-amber-400/10 p-3 rounded-lg">
                <FiCamera />
                <p className="text-sm font-medium">
                  ⚠️ Screenshot this information - you won't see it again!
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-2 rounded-lg transition-colors hover:bg-green-400/10"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">Model Comparison</h2>
              <button onClick={onClose} className="text-green-400 hover:text-green-300">
                <FiX size={24} />
              </button>
            </div>

            {showMessage && (
              <div className="mb-4 bg-green-400/10 text-green-400 py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                {actionMessage.includes('...') ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
                ) : (
                  <FiCheck />
                )}
                {actionMessage}
              </div>
            )}

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-green-400/20">
                    <th className="text-left py-3 px-4 text-green-400">Model Name</th>
                    <th className="text-left py-3 px-4 text-green-400">Algorithm</th>
                    <th className="text-left py-3 px-4 text-green-400">Accuracy</th>
                    <th className="text-left py-3 px-4 text-green-400">Hyperparameters</th>
                    <th className="text-left py-3 px-4 text-green-400">Training Time</th>
                    <th className="text-left py-3 px-4 text-green-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, index) => (
                    <tr key={index} className="border-b border-green-400/20">
                      <td className="py-3 px-4 text-green-300">{model.name}</td>
                      <td className="py-3 px-4 text-green-300">{model.algorithm}</td>
                      <td className="py-3 px-4 text-green-300">{model.accuracy}%</td>
                      <td className="py-3 px-4">
                        <code className="bg-black/30 text-green-300 px-2 py-1 rounded">
                          {model.hyperparameters}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-green-300">{model.training_time}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleModelSelect(model)}
                            className="bg-black border border-green-400/20 text-green-400 px-3 py-1 rounded-lg transition-colors hover:bg-green-400/10"
                          >
                            Select
                          </button>
                          <button
                            onClick={() => handleDownloadModel(model)}
                            disabled={downloading}
                            className="bg-black border border-green-400/20 text-green-400 px-3 py-1 rounded-lg transition-colors hover:bg-green-400/10 disabled:opacity-50"
                          >
                            <FiDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* API Key Input Modal */}
            {showApiInput && (
              <div className="mt-6 p-4 bg-black/30 border border-green-400/20 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-4">
                  Deploy {selectedModel.name} - {selectedModel.algorithm}
                </h3>
                <div className="mb-4">
                  <label className="block text-green-300 mb-2">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full bg-black/30 border border-green-400/20 text-green-300 px-4 py-2 rounded-lg focus:outline-none focus:border-green-400"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowApiInput(false)}
                    className="px-4 py-2 text-green-400 hover:text-green-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={!apiKey}
                    className="flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-2 rounded-lg transition-colors hover:bg-green-400/10 disabled:opacity-50"
                  >
                    <FiBox />
                    Deploy Model
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

ModelTraining.propTypes = {
  sessionId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onDeploy: PropTypes.func.isRequired
};

export default ModelTraining; 