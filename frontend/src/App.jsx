import { useState, useEffect } from 'react';
import { FiUpload, FiDatabase, FiSettings, FiZap, FiChevronDown, FiAlertTriangle, FiDownload, FiXCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import AnalysisResults from './components/AnalysisResults';
import AnalysisPreview from './components/AnalysisPreview';
import axios from 'axios';
import QuickActions from './components/QuickActions';

const QUICK_ACTIONS = [
  {
    title: 'Basic Cleaning',
    description: 'Standard data cleaning steps',
    actions: [
      'Drop missing values',
      'Remove duplicate rows',
      'Convert text columns to lowercase',
      'Standardize date formats'
    ]
  },
  {
    title: 'Feature Engineering',
    description: 'Common feature transformations',
    actions: [
      'Create new feature "age_group" as "pd.cut(df["Age"], bins=[0,18,35,50,100])"',
      'Convert column "price" to numeric',
      'Create ratio feature "price_per_sqft" as "Price / SquareFeet"'
    ]
  },
  {
    title: 'Data Validation',
    description: 'Quality checks and filters',
    actions: [
      'Filter rows where age < 0',
      'Validate email format in "email" column',
      'Check for outliers in "income" column'
    ]
  }
];

const App = () => {
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessProblem: '',
    processingGoal: 'Data Cleaning',
    customGoal: ''
  });

  // Add this state
  const [appliedData, setAppliedData] = useState(null);

  // Add state for quick actions
  const [quickAction, setQuickAction] = useState('');

  const handleUpload = (uploadData) => {
    setSession(uploadData);
    setAnalysis(null);
    setFormData({
      businessProblem: '',
      processingGoal: 'Data Cleaning',
      customGoal: ''
    });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Current session ID:', session?.session_id);
      
      const response = await axios.post(
        `http://localhost:5000/analyze/${session.session_id}`,
        {
          business_problem: formData.businessProblem,
          processing_goal: formData.processingGoal,
          custom_goal: formData.customGoal
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      alert(error.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Add refresh logic
  useEffect(() => {
    if (appliedData) {
      // Refresh data preview
      setSession(prev => ({
        ...prev,
        preview: appliedData.preview,
        shape: appliedData.shape
      }));
    }
  }, [appliedData]);

  // Add download handler
  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/download/${session.session_id}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `processed_${session.session_id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      alert(error.response?.data?.error || 'Download failed');
    }
  };

  // Add handler
  const handleQuickAction = (action) => {
    setFormData(prev => ({
      ...prev,
      customGoal: `${prev.customGoal}\n${action}`.trim()
    }));
  };

  // Add to download button logic
  const canDownload = appliedData?.downloadAvailable || session?.processed;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* New Header */}
      <header className="bg-black shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-green-400/10 blur-[100px]"></div>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <FiZap className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-bold">FORGE</h1>
          </div>
          <nav className="flex space-x-6">
            <button className="hover:text-green-400 flex items-center">
              <FiDatabase className="mr-2" /> Docs
            </button>
            <button className="hover:text-green-400 flex items-center">
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
              className="bg-black rounded-xl p-6 mb-8 relative border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)]"
            >
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 text-green-300 hover:text-green-400"
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <FiAlertTriangle className="mr-2 text-green-400" />
                Getting Started
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="font-medium">1. Upload Data</p>
                  <p className="text-green-300 text-sm">
                    CSV/Excel files under 10MB
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">2. Define Objectives</p>
                  <p className="text-green-300 text-sm">
                    Clear business problem + processing goals
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">3. Generate Insights</p>
                  <p className="text-green-300 text-sm">
                    AI-powered recommendations
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!session ? (
    <div className="space-y-8">
    <div className="bg-black/50 rounded-xl p-8 border border-green-400/20 shadow-[0_0_40px_-15px_rgba(251,191,36,0.15)]">
      <h2 className="text-xl font-bold mb-6 text-green-400">Ignite Your Data</h2>
      <div className="grid grid-cols-2 gap-8">
        <div className="col-span-1">
          <FileUpload onUpload={handleUpload} />
        </div>
                <div className="col-span-1 flex flex-col justify-center">
                  <button
                    onClick={loadSampleDataset}
                    className="bg-black/50 hover:bg-black/60 p-6 rounded-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-black/60 rounded-lg group-hover:bg-green-400 transition-colors">
                        <FiDatabase className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-left font-medium">Try Sample Dataset</p>
                        <p className="text-sm text-green-300">
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
            <div className="bg-black/50 rounded-xl p-6 border border-green-400/20 shadow-[0_0_30px_-10px_rgba(251,191,36,0.1)]">
                <h3 className="font-bold mb-4 text-green-400">Dataset Stats</h3>
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

              <div className="bg-black/50 rounded-xl p-6">
                <h3 className="font-bold mb-4 text-green-400">Quick Actions</h3>
                <button className="w-full bg-black/50 hover:bg-black/60 p-3 rounded-lg flex items-center space-x-2">
                  <FiZap className="flex-shrink-0" />
                  <span>Auto Clean</span>
                </button>
              </div>
            </div>

            {/* Main Analysis Area */}
            <div className="lg:col-span-3 space-y-6">
              <QuickActions 
                onApply={(newData) => {
                  setAppliedData(newData);
                  setSession(prev => ({
                    ...prev,
                    preview: newData.preview,
                    shape: newData.shape
                  }));
                }}
                quickActions={QUICK_ACTIONS}
                sessionId={session?.session_id}
              />
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_40px_-15px_rgba(34,197,94,0.3)]"
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
                    className="w-full bg-black/50 border border-black/60 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                        className="w-full bg-black/50 border border-black/60 rounded-lg px-4 py-3 appearance-none focus:ring-2 focus:ring-green-400"
                      >
                        <option>Data Cleaning</option>
                        <option>Feature Engineering</option>
                        <option>Outlier Detection</option>
                        <option>Other</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-4 text-green-300" />
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
                        className="w-full bg-black/50 border border-black/60 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-400 hover:bg-green-300 text-black py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
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
                <div className="space-y-6">
                  <AnalysisPreview analysis={analysis} />
                  <AnalysisResults 
                    analysis={analysis} 
                    onApply={(newData) => {
                      setAppliedData(newData);
                      setSession(prev => ({
                        ...prev,
                        preview: newData.preview,
                        shape: newData.shape
                      }));
                    }}
                    sessionId={session?.session_id}
                  />
                </div>
              )}

              {canDownload && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleDownload}
                    className="bg-green-400 hover:bg-green-300 text-black px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                  >
                    <FiDownload className="text-lg" />
                    Download Processed Data
                  </button>
                  
                  <button
                    onClick={() => setAppliedData(null)}
                    className="bg-red-400 hover:bg-red-300 text-black px-6 py-3 rounded-lg font-medium flex items-center gap-2"
                  >
                    <FiXCircle className="text-lg" />
                    Reset Changes
                  </button>
                </div>
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
  <div className="bg-black/50 rounded-lg p-4 flex items-center justify-between 
                border border-green-400/20 shadow-[0_0_20px_-5px_rgba(251,191,36,0.1)]">
    <div>
      <p className="text-sm text-green-300">{label}</p>
      <p className="text-2xl font-medium">{value}</p>
    </div>
    <div className="text-green-400 p-2 bg-black/30 rounded-lg">
      {icon}
    </div>
  </div>
);

export default App;