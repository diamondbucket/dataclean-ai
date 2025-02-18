import { useState } from 'react';
import { FiZap, FiDownload, FiBox } from 'react-icons/fi';
import axios from 'axios';
import PropTypes from 'prop-types';

const QuickActions = ({ onApply, quickActions, sessionId, onDeploy }) => {
  const [loading, setLoading] = useState({});
  const [processingComplete, setProcessingComplete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleQuickAction = async (action, index) => {
    try {
      setLoading(prev => ({ ...prev, [index]: true }));
      
      const response = await axios.post(`http://localhost:5000/apply-quick/${sessionId}`, {
        action
      });

      onApply(response.data);
      setProcessingComplete(true);
    } catch (error) {
      console.error('Quick Action error:', error);
      alert(error.response?.data?.error || 'Failed to apply action.');
    } finally {
      setLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(`http://localhost:5000/download-final/${sessionId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'processed_data.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {quickActions.map((qa, index) => (
        <div
          key={index}
          className="bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(128,128,128,0.5)]"
        >
          <h4 className="text-lg font-bold text-green-400 mb-2">{qa.title}</h4>
          <p className="text-green-300 mb-3">{qa.description}</p>
          <div className="space-y-2">
            {qa.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action, `${index}-${idx}`)}
                disabled={loading[`${index}-${idx}`]}
                className="w-full flex items-center gap-2 bg-black border border-green-400/20 text-green-400 px-4 py-2 rounded-lg transition-colors hover:bg-green-400/10 disabled:opacity-50"
              >
                {loading[`${index}-${idx}`] ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
                ) : (
                  <FiZap />
                )}
                {action}
              </button>
            ))}
          </div>
        </div>
      ))}

      {processingComplete && (
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-3 rounded-lg transition-colors hover:bg-green-400/10"
          >
            {downloading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400 border-t-transparent" />
            ) : (
              <FiDownload />
            )}
            Download Processed Data
          </button>
          
          <button
            onClick={onDeploy}
            className="flex-1 flex items-center justify-center gap-2 bg-black border border-green-400/20 text-green-400 px-6 py-3 rounded-lg transition-colors hover:bg-green-400/10"
          >
            <FiBox />
            Deploy Model
          </button>
        </div>
      )}
    </div>
  );
};

QuickActions.propTypes = {
  onApply: PropTypes.func.isRequired,
  quickActions: PropTypes.array.isRequired,
  sessionId: PropTypes.string.isRequired,
  onDeploy: PropTypes.func.isRequired
};

export default QuickActions; 