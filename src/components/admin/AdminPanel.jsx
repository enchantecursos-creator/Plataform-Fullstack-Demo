import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  DollarSign, 
  BookOpen,
  UserCheck,
  BrainCircuit,
  Briefcase,
  MonitorPlay,
  FileArchive,
  MessageSquare,
  KanbanSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AdminMaterials from '@/components/admin/AdminMaterials';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminClasses from '@/components/admin/AdminClasses';
import ProfessorDocuments from '@/components/ProfessorDocuments';
import AdminAI from '@/components/admin/AdminAI';
import WhatsAppIntegration from '@/components/admin/WhatsAppIntegration';
import CRM from '@/components/CRM';

const AdminPanel = ({ user, setActiveAdminTab, onSettingsUpdate }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle external tab requests (like from URL or Sidebar)
  useEffect(() => {
     // If parent passes a prop or we want to read from URL search params, we could do it here
  }, []);

  const handleTabClick = (tabId, label) => {
    if (tabId === 'billing') {
      setActiveAdminTab('financial');
    } else {
      setActiveTab(tabId);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview />;
      case 'crm': return <CRM user={user} />;
      case 'students': return <AdminUsers userType="ALUNO" />;
      case 'teachers': return <AdminUsers userType="PROFESSOR" />;
      case 'materials': return <AdminMaterials />;
      case 'documents': return <ProfessorDocuments user={user} />;
      case 'settings': return <AdminSettings onSettingsUpdate={onSettingsUpdate} />;
      case 'turmas': return <AdminClasses user={user} />;
      case 'aulas': return <AdminClasses user={user} isAllClassesView={true} />;
      case 'ai': return <AdminAI />;
      case 'whatsapp': return <WhatsAppIntegration />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Painel Administrativo
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gerencie toda a plataforma Enchanté Cursos
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Briefcase },
            { id: 'crm', label: 'CRM', icon: KanbanSquare },
            { id: 'students', label: 'Alunos', icon: Users },
            { id: 'teachers', label: 'Professores', icon: UserCheck },
            { id: 'turmas', label: 'Turmas', icon: Users },
            { id: 'aulas', label: 'Aulas', icon: MonitorPlay },
            { id: 'materials', label: 'Materiais', icon: BookOpen },
            { id: 'documents', label: 'Documentos', icon: FileArchive },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
            { id: 'ai', label: 'IA', icon: BrainCircuit },
            { id: 'billing', label: 'Financeiro', icon: DollarSign },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabClick(tab.id, tab.label)}
                className={activeTab === tab.id 
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white" 
                  : ""
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </motion.div>

      <div className="flex-1 min-h-0">
         {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;