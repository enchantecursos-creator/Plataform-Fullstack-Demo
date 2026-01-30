import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  BookOpen,
  Zap,
  UserCheck,
  UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AdminMaterials from '@/components/admin/AdminMaterials';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminSettings from '@/components/admin/AdminSettings';

const AdminPanel = ({ setActiveAdminTab }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: `${feature} será implementada em breve! Solicite na próxima conversa! 🚀`,
    });
  };
  
  const handleTabClick = (tabId, label) => {
    if (tabId === 'billing') {
      setActiveAdminTab('financial');
    } else if (tabId === 'classes') {
      handleFeatureClick(`Módulo ${label}`);
    } else {
      setActiveTab(tabId);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'students':
        return <AdminUsers userType="ALUNO" />;
      case 'teachers':
        return <AdminUsers userType="PROFESSOR" />;
      case 'materials':
        return <AdminMaterials />;
      case 'settings':
        return <AdminSettings />;
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center"
          >
            <div className="py-12">
              <Zap className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                Módulo em Construção
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Esta seção será implementada em breve com funcionalidades completas.
              </p>
              <Button 
                onClick={() => handleFeatureClick(`Implementar módulo ${activeTab}`)}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Solicitar Implementação
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
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
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
            { id: 'students', label: 'Alunos', icon: Users },
            { id: 'teachers', label: 'Professores', icon: UserCheck },
            { id: 'materials', label: 'Materiais', icon: BookOpen },
            { id: 'billing', label: 'Financeiro', icon: DollarSign },
            { id: 'classes', label: 'Aulas', icon: Calendar },
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

      {renderContent()}
    </div>
  );
};

export default AdminPanel;