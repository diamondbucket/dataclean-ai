import { FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

const AnalysisPreview = ({ analysis }) => {
  const previewContent = (analysis.split('\n\n')[0] || 'No preview available')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black p-6 rounded-xl border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/5 blur-[100px]"></div>
      
      <div className="flex items-center gap-3 mb-4 relative">
        <FiZap className="text-green-400 flex-shrink-0" />
        <h3 className="font-bold text-green-300">Quick Preview</h3>
      </div>
      
      <div className="space-y-2 relative">
        {previewContent.split('\n').map((line, index) => (
          <p key={index} className="text-sm text-green-300/90">
            {line.trim()}
          </p>
        ))}
      </div>
    </motion.div>
  );
};

export default AnalysisPreview;