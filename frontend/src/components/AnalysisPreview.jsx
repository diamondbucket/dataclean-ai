import { FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';

const AnalysisPreview = ({ analysis }) => {
  const previewContent = analysis.split('\n\n')[0] || 'No preview available';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-400/10 to-amber-400/5 p-6 rounded-xl border border-amber-400/20 shadow-[0_0_30px_-10px_rgba(251,191,36,0.2)]"
    >
      <div className="flex items-center gap-3 mb-4">
        <FiZap className="text-amber-400 flex-shrink-0" />
        <h3 className="font-bold">Quick Preview</h3>
      </div>
      
      <div className="space-y-2">
        {previewContent.split('\n').map((line, index) => (
          <p key={index} className="text-sm text-amber-300/80">
            {line.trim()}
          </p>
        ))}
      </div>
    </motion.div>
  );
};

export default AnalysisPreview;