import { useState } from 'react';
import { FiChevronRight, FiClipboard, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const AnalysisResults = ({ analysis, onApply }) => {
  const [copied, setCopied] = useState(false);
  const sections = analysis.split('\n\n').filter(Boolean);
  const [openSection, setOpenSection] = useState(0);

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

  return (
    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <FiZap className="text-amber-400" />
          <span>AI Recommendations</span>
        </h3>
        <button
          onClick={() => copyToClipboard(analysis)}
          className="text-amber-400 hover:text-amber-300 flex items-center space-x-2"
        >
          <FiClipboard />
          <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
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
                              <span className="text-amber-400">▹</span>
                              <span className="flex-1">{point.trim()}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => onApply(content)}
                          className="mt-4 text-sm bg-amber-400/10 text-amber-300 px-4 py-2 rounded-lg hover:bg-amber-400/20 flex items-center space-x-2"
                        >
                          <FiZap className="flex-shrink-0" />
                          <span>Apply Recommendations</span>
                        </button>
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