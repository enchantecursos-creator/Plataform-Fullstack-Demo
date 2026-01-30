import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Book, Calendar, FileText, User, Settings, Briefcase, LogOut, Moon, Sun, GraduationCap, Users as UsersIcon, BarChart2, FileArchive, MessageSquare, KanbanSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CreatePipelineModal from './crm/CreatePipelineModal'; // Import the modal

const Sidebar = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  darkMode,
  onToggleDarkMode,
  logoUrl
}) => {
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const navItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['ALUNO', 'PROFESSOR', 'ADMIN']
  }, {
    id: 'crm',
    label: 'CRM',
    icon: KanbanSquare,
    roles: ['ADMIN', 'ATENDIMENTO', 'SUPORTE']
  }, {
    id: 'courses',
    label: 'Cursos',
    icon: GraduationCap,
    roles: ['ALUNO', 'PROFESSOR', 'ADMIN']
  }, {
    id: 'schedule',
    label: 'Agenda',
    icon: Calendar,
    roles: ['ALUNO', 'PROFESSOR', 'ADMIN']
  }, {
    id: 'materials',
    label: 'Materiais',
    icon: Book,
    roles: ['ALUNO', 'PROFESSOR']
  }, {
    id: 'documents',
    label: 'Documentos',
    icon: FileArchive,
    roles: ['PROFESSOR', 'ADMIN']
  }, {
    id: 'grades',
    label: 'Notas',
    icon: BarChart2,
    roles: ['ALUNO']
  }, {
    id: 'students',
    label: 'Alunos',
    icon: UsersIcon,
    roles: ['PROFESSOR'],
    condition: user?.canAddStudents
  }, {
    id: 'billing',
    label: 'Cobranças',
    icon: Briefcase,
    roles: ['ALUNO', 'PROFESSOR', 'ADMIN'],
    condition: user?.role !== 'PROFESSOR' || user?.can_emit_charges
  }, {
    id: 'admin',
    label: 'Admin',
    icon: Settings,
    roles: ['ADMIN']
  }, {
    id: 'financial',
    label: 'Financeiro',
    icon: Briefcase,
    roles: ['ADMIN']
  }];

  // Mock recent contacts for Task 6 requirements
  const recentContacts = [{
    id: 1,
    name: 'João Silva',
    avatar: null,
    lastMsg: 'Tenho interesse no curso...'
  }, {
    id: 2,
    name: 'Maria Oliveira',
    avatar: null,
    lastMsg: 'Qual o valor da mensalidade?'
  }, {
    id: 3,
    name: 'Carlos Souza',
    avatar: null,
    lastMsg: 'Combinado, até amanhã!'
  }];
  const filteredNavItems = navItems.filter(item => (item.roles.includes(user?.role) || user?.role === 'ADMIN' && item.roles.includes('ATENDIMENTO')) && (item.condition === undefined || item.condition));
  const NavLink = ({
    item
  }) => {
    const isActive = activeTab === item.id;
    return <Button variant={isActive ? "default" : "ghost"} className={`w-full justify-start text-sm font-medium mb-1 ${isActive ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'text-slate-600 dark:text-slate-300'}`} onClick={() => onTabChange(item.id)}>
        <item.icon className="w-5 h-5 mr-3" />
        {item.label}
      </Button>;
  };
  return <>
      <motion.div initial={{
      x: -256
    }} animate={{
      x: 0
    }} transition={{
      duration: 0.5,
      type: 'spring',
      stiffness: 100
    }} className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-40 shadow-xl">
        <div className="p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
           <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
            {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="font-bold text-xl text-purple-600">E</span>}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Portal Escola</h1>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Painel {user?.role}</p>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 flex items-center space-x-3 border border-slate-200 dark:border-slate-700">
            <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-600">
                <AvatarImage src={user?.photo_url} />
                <AvatarFallback className="bg-purple-100 text-purple-600 font-bold">
                    {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">{user?.role}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          <div className="mb-6">
              <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu Principal</h3>
              {filteredNavItems.map(item => <NavLink key={item.id} item={item} />)}
          </div>
          
          {/* Admin Specific Action in Sidebar */}
          {user?.role === 'ADMIN' && <div className="mb-6 px-3">
                 <Button variant="outline" className="w-full justify-start text-xs border-dashed border-slate-300 dark:border-slate-700 hover:border-solid hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500" onClick={() => setIsCreatePipelineOpen(true)}>
                    <Plus className="w-3 h-3 mr-2" /> Criar Pipeline
                 </Button>
             </div>}

          {/* CRM Specific "Recentes" Section */}
          {(activeTab === 'crm' || user?.role === 'ADMIN') && <div className="mt-6">
                  <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                      Recentes 
                      <span className="bg-green-100 text-green-700 text-[10px] px-1.5 rounded-full">3</span>
                  </h3>
                  <div className="space-y-1">
                      {recentContacts.map(contact => <button key={contact.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors group">
                               <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">{contact.name.substring(0, 2)}</AvatarFallback>
                               </Avatar>
                               <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600">{contact.name}</p>
                                  <p className="text-xs text-slate-500 truncate">{contact.lastMsg}</p>
                               </div>
                          </button>)}
                  </div>
              </div>}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <Button variant="ghost" size="icon" onClick={onToggleDarkMode} className="hover:bg-slate-200 dark:hover:bg-slate-800">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20">
            <LogOut className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </Button>
        </div>
      </motion.div>
      
      {/* Include the Modal in the layout */}
      <CreatePipelineModal isOpen={isCreatePipelineOpen} onClose={() => setIsCreatePipelineOpen(false)} onPipelineCreated={() => {
      // If we had a way to trigger refresh from sidebar, we would.
      // But main refresh happens inside PipelinesTab usually.
      // This is just for global access convenience.
    }} />
    </>;
};
export default Sidebar;