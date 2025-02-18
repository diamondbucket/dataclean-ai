import { useState } from 'react';
import { FiZap, FiChevronRight, FiTrash2, FiDownload, FiBox, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import PropTypes from 'prop-types';

const AnalysisResults = ({ analysis, onApply, sessionId, onDeploy }) => {
  // Move parseAnalysis function before it's used
  const parseAnalysis = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const structured = [];
    let currentSection = null;

    for (let line of lines) {
      if (line.match(/^\d+\./)) {
        currentSection = {
          id: structured.length + 1,
          title: line.trim(),
          descriptions: []
        };
        structured.push(currentSection);
      } else if (currentSection) {
        currentSection.descriptions.push(line.trim());
      }
    }

    return structured;
  };

  const [expandedItems, setExpandedItems] = useState({});
  const [recommendations, setRecommendations] = useState(parseAnalysis(analysis));
  const [showActions, setShowActions] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const handleDelete = (id) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setActionMessage('Downloading processed data...');
      setShowMessage(true);
      
      const response = await axios.get(
        `http://localhost:5000/download-final/${sessionId}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'processed_data.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setActionMessage('Download complete!');
      setTimeout(() => setShowMessage(false), 2000);
    } catch (error) {
      console.error('Download error:', error);
      setActionMessage('Failed to download file');
      setTimeout(() => setShowMessage(false), 2000);
    } finally {
      setDownloading(false);
    }
  };

  const handleApplyClick = () => {
    setActionMessage('Applying recommendations...');
    setShowMessage(true);
    onApply();
    setShowActions(true);
    setTimeout(() => {
      setActionMessage('Changes applied successfully!');
      setTimeout(() => setShowMessage(false), 2000);
    }, 1000);
  };

  const handleDeployClick = () => {
    setActionMessage('Preparing model training...');
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      onDeploy();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendations Section */}
      <div className="bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(128,128,128,0.5)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiZap className="text-green-400" />
            <h3 className="text-lg font-bold text-green-400">AI Recommendations</h3>
          </div>
          {!showActions && (
            <button
              onClick={handleApplyClick}
              className="bg-black border border-green-400/20 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:bg-green-400/10"
            >
              <FiZap />
              Apply All Recommendations
            </button>
          )}
        </div>

        <div className="space-y-2">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border border-green-400/20 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setExpandedItems(prev => ({ ...prev, [rec.id]: !prev[rec.id] }))}
                  className="flex-1 flex items-center justify-between text-left text-green-300 hover:bg-green-400/10 transition-colors"
                >
                  <span>{rec.title}</span>
                  <FiChevronRight
                    className={`transform transition-transform ${
                      expandedItems[rec.id] ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDelete(rec.id)}
                  className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                >
                  <FiTrash2 />
                </button>
              </div>
              
              {expandedItems[rec.id] && (
                <div className="px-4 py-3 bg-black/30 border-t border-green-400/20">
                  {rec.descriptions.map((desc, index) => (
                    <p key={index} className="text-green-300/90">
                      {desc}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Bar */}
      {showActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-green-400/20 backdrop-blur-sm">
          {showMessage && (
            <div className="w-full bg-green-400/10 text-green-400 py-2 text-center flex items-center justify-center gap-2">
              {actionMessage.includes('...') ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
              ) : (
                <FiCheck />
              )}
              {actionMessage}
            </div>
          )}
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <FiZap />
              <span className="font-medium">Recommendations Applied</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-2 rounded-lg transition-colors hover:bg-green-400/10 disabled:opacity-50"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
                ) : (
                  <FiDownload />
                )}
                Download Processed Data
              </button>
              <button
                onClick={handleDeployClick}
                className="flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-2 rounded-lg transition-colors hover:bg-green-400/10"
              >
                <FiBox />
                Train Models
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AnalysisResults.propTypes = {
  analysis: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired,
  sessionId: PropTypes.string.isRequired,
  onDeploy: PropTypes.func.isRequired
};

export default AnalysisResults;