import { useState, useEffect } from 'react';
import { FiUpload, FiDatabase, FiSettings, FiZap, FiChevronDown, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import AnalysisResults from './components/AnalysisResults';
import axios from 'axios';

const App = () => {
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessProblem: '',
    processingGoal: 'Data Cleaning',
    customGoal: ''
  });

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


  // Add state for tutorial steps
  const [showTutorial, setShowTutorial] = useState(true);
  
  // Sample dataset functionality
  const loadSampleDataset = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/upload', {
        sample: true
      });
      handleUpload(response.data);
    } catch (error) {
      console.error('Error loading sample:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest remains similar but with updated UI elements
  // ... [previous state handlers]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* New Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-xl">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiZap className="h-8 w-8 text-amber-400" />
            <h1 className="text-2xl font-bold">FORGE</h1>
          </div>
          <nav className="flex space-x-6">
            <button className="hover:text-amber-400 flex items-center">
              <FiDatabase className="mr-2" /> Docs
            </button>
            <button className="hover:text-amber-400 flex items-center">
              <FiSettings className="mr-2" /> Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AnimatePresence>
          {showTutorial && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 mb-8 relative"
            >
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-amber-400"
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <FiAlertTriangle className="mr-2 text-amber-400" />
                Getting Started
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="font-medium">1. Upload Data</p>
                  <p className="text-gray-400 text-sm">
                    CSV/Excel files under 10MB
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">2. Define Objectives</p>
                  <p className="text-gray-400 text-sm">
                    Clear business problem + processing goals
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">3. Generate Insights</p>
                  <p className="text-gray-400 text-sm">
                    AI-powered recommendations
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!session ? (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8">
        <h2 className="text-xl font-bold mb-6">Ignite Your Data</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="col-span-1">
            <FileUpload onUpload={handleFileUpload} />  {/* Updated prop name */}
          </div>
                <div className="col-span-1 flex flex-col justify-center">
                  <button
                    onClick={loadSampleDataset}
                    className="bg-gray-700 hover:bg-gray-600 p-6 rounded-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-600 rounded-lg group-hover:bg-amber-400 transition-colors">
                        <FiDatabase className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-left font-medium">Try Sample Dataset</p>
                        <p className="text-sm text-gray-400">
                          Explore with example data
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Enhanced Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-bold mb-4 text-amber-400">Dataset Stats</h3>
                <div className="space-y-4">
                  <StatCard 
                    label="Rows" 
                    value={session.shape[0]} 
                    icon={<FiDatabase />}
                  />
                  <StatCard
                    label="Columns"
                    value={session.shape[1]}
                    icon={<FiSettings />}
                  />
                  {/* Add more stats as needed */}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-bold mb-4 text-amber-400">Quick Actions</h3>
                <button className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg flex items-center space-x-2">
                  <FiZap className="flex-shrink-0" />
                  <span>Auto Clean</span>
                </button>
              </div>
            </div>

            {/* Main Analysis Area */}
            <div className="lg:col-span-3 space-y-6">
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-800 rounded-xl shadow-xl p-6 space-y-6"
              >
                {/* Form inputs with enhanced styling */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business Challenge
                  </label>
                  <textarea
                    required
                    value={formData.businessProblem}
                    onChange={(e) => setFormData({ ...formData, businessProblem: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    rows="3"
                    placeholder="Describe your core business challenge..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Processing Objective
                    </label>
                    <div className="relative">
                      <select
                        value={formData.processingGoal}
                        onChange={(e) => setFormData({ ...formData, processingGoal: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 appearance-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option>Data Cleaning</option>
                        <option>Feature Engineering</option>
                        <option>Outlier Detection</option>
                        <option>Other</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-4 text-gray-400" />
                    </div>
                  </div>

                  {formData.processingGoal === 'Other' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Custom Objective
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.customGoal}
                        onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-900 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        {/* Spinner SVG */}
                      </svg>
                      Forging Insights...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FiZap className="mr-2" />
                      Generate Recommendations
                    </span>
                  )}
                </button>
              </motion.form>

              {analysis && (
                <AnalysisResults 
                  analysis={analysis} 
                  onApply={() => {/* Implement action */}}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// New StatCard Component
const StatCard = ({ label, value, icon }) => (
  <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-medium">{value}</p>
    </div>
    <div className="text-amber-400 p-2 bg-gray-600 rounded-lg">
      {icon}
    </div>
  </div>
);

export default App;