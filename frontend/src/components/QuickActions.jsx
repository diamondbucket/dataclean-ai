import { FiZap } from 'react-icons/fi';
import { motion } from 'framer-motion';
import axios from 'axios';

const QuickActions = ({ onApply, quickActions, sessionId }) => {
  const handleQuickAction = async (action) => {
    try {
      const confirm = window.confirm(`Apply "${action}" to dataset?`);
      if (!confirm) return;

      const response = await axios.post(
        `http://localhost:5000/apply-quick/${sessionId}`,
        { action }
      );
      
      onApply(response.data.updatedData);
      alert('Action applied successfully!');
    } catch (error) {
      console.error('Quick action error:', error);
      alert(error.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="bg-black rounded-xl p-6 border-2 border-green-400/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
      <div className="flex items-center gap-3 mb-4">
        <FiZap className="text-green-400" />
        <h3 className="text-lg font-bold text-green-300">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((group, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            className="bg-black/30 p-4 rounded-lg border border-green-400/20"
          >
            <h4 className="font-medium mb-2 text-green-300">{group.title}</h4>
            <p className="text-sm text-green-300/80 mb-3">{group.description}</p>
            <div className="space-y-2">
              {group.actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  className="w-full text-left p-2 text-sm text-green-300/90 hover:bg-green-400/10 rounded-md transition-colors"
                >
                  ▹ {action}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions; 