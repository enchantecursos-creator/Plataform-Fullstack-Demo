import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KanbanSquare, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PipelinesTab from '@/components/crm/PipelinesTab';
import GruposTab from '@/components/crm/GruposTab';
import ConfiguracaoTab from '@/components/crm/ConfiguracaoTab';

const CRM = ({ user }) => {
  const [activeTab, setActiveTab] = useState('pipelines');
  const isAdmin = user?.role === 'ADMIN';

  const tabs = [
    { id: 'pipelines', label: 'Funis & Negociações', icon: KanbanSquare },
    { id: 'groups', label: 'Grupos', icon: Users },
    ...(isAdmin ? [{ id: 'config', label: 'Configurações', icon: Settings }] : [])
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pipelines': return <PipelinesTab user={user} />;
      case 'groups': return <GruposTab user={user} />;
      case 'config': return isAdmin ? <ConfiguracaoTab user={user} /> : null;
      default: return <PipelinesTab user={user} />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-2">
      <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-0"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default CRM;