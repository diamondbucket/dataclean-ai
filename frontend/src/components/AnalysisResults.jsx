import { useState } from 'react';
import { FiChevronRight, FiClipboard, FiZap, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const AnalysisResults = ({ analysis, onApply, sessionId }) => {
  const [copied, setCopied] = useState(false);
  const sections = analysis.split('\n\n').filter(Boolean);
  const [openSection, setOpenSection] = useState(0);
  const [applied, setApplied] = useState(false);

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpload = (uploadData) => {
    setSession(uploadData);
    setAnalysis(null);
    setFormData({
      businessProblem: '',
      processingGoal: 'Data Cleaning',
      customGoal: ''
    });
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      handleUpload(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Upload failed');
    }
  };

  const handleApply = async () => {
    try {
      // Check for destructive actions
      const destructiveCount = analysis.split('\n').filter(line => 
        line.toLowerCase().includes('drop') || 
        line.toLowerCase().includes('remove') ||
        line.toLowerCase().includes('filter')
      ).length;

      if (destructiveCount > 0) {
        const confirm = window.confirm(
          `This will apply ${destructiveCount} destructive operations. Are you sure?`
        );
        if (!confirm) return;
      }

      setApplied(false);
      const response = await axios.post(
        `http://localhost:5000/apply/${sessionId}`,
        { recommendations: analysis }
      );
      
      // Handle results
      if (response.data.results.errors.length > 0) {
        alert(`Some errors occurred:\n${response.data.results.errors.join('\n')}`);
      }
      
      onApply(response.data.updatedData);
      setApplied(true);
    } catch (error) {
      console.error('Apply error:', error);
      alert(error.response?.data?.error || 'Application failed');
    }
  };

  return (
    <div className="bg-black rounded-xl overflow-hidden border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]">
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiZap className="text-green-400" />
          <h3 className="text-lg font-bold">AI Recommendations</h3>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleApply}
            className="text-sm bg-green-400/10 text-green-300 px-4 py-2 rounded-lg hover:bg-green-400/20 flex items-center space-x-2"
          >
            <FiZap className="flex-shrink-0" />
            <span>Apply All Recommendations</span>
          </button>
          {applied && (
            <div className="text-green-400 flex items-center gap-2">
              <FiCheckCircle />
              <span className="text-sm">Applied!</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-gray-700">
        <AnimatePresence initial={false}>
          {sections.map((section, index) => {
            const [title, ...content] = section.split('\n');
            const isOpen = openSection === index;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-gray-700"
              >
                <button
                  onClick={() => setOpenSection(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <span className="font-medium">{title.replace(':', '')}</span>
                  <FiChevronRight className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-gray-700/20">
                        <ul className="space-y-3">
                          {content.map((point, i) => (
                            <li 
                              key={i}
                              className="flex items-start space-x-3"
                            >
                              <span className="text-green-400">▹</span>
                              <span className="flex-1">{point.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalysisResults;