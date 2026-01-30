import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, TrendingUp, Award, Bell, Play, Users, Calendar, Download, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
const StudentDashboard = ({
  user,
  onTabChange
}) => {
  const {
    toast
  } = useToast();
  const [stats, setStats] = useState({
    completedClasses: 0,
    nextClass: null,
    progress: 0,
    certificates: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      const now = new Date().toISOString();

      // Fetch completed classes
      const {
        count: completedClassesCount,
        error: completedError
      } = await supabase.from('scheduled_classes').select('*', {
        count: 'exact',
        head: true
      }).contains('attendees', [user.id]).lt('end_time', now);

      // Fetch next class
      const {
        data: nextClassData,
        error: nextClassError
      } = await supabase.from('scheduled_classes').select('start_time, title').contains('attendees', [user.id]).gt('start_time', now).order('start_time', {
        ascending: true
      }).limit(1).maybeSingle(); // Use maybeSingle() to prevent error when no rows are found

      if (completedError || nextClassError && nextClassError.code !== 'PGRST116') {
        console.error('Error fetching dashboard data:', completedError || nextClassError);
      }
      setStats(prev => ({
        ...prev,
        completedClasses: completedClassesCount || 0,
        nextClass: nextClassData
      }));
      setLoading(false);
    };
    fetchDashboardData();
  }, [user]);
  const handleFeatureClick = feature => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: `${feature} será implementada em breve! Solicite na próxima conversa! 🚀`
    });
  };
  const getNextClassDisplay = () => {
    if (loading) return 'Carregando...';
    if (!stats.nextClass) return 'Nenhuma';
    const date = new Date(stats.nextClass.start_time);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }) + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const statsCards = [{
    title: 'Aulas Concluídas',
    value: loading ? '...' : stats.completedClasses,
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    change: 'Total'
  }, {
    title: 'Próxima Aula',
    value: getNextClassDisplay(),
    icon: Clock,
    color: 'from-purple-500 to-purple-600',
    change: stats.nextClass?.title || 'Agende uma aula'
  }, {
    title: 'Progresso (Exemplo)',
    value: '68%',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    change: '+5% esta semana'
  }, {
    title: 'Certificados (Exemplo)',
    value: '2',
    icon: Award,
    color: 'from-yellow-500 to-yellow-600',
    change: 'A1 e A2'
  }];
  const upcomingClasses = [{
    id: 1,
    title: 'Conversação Básica',
    time: 'Hoje, 19:00',
    level: 'A1',
    teacher: 'Prof. Marie',
    participants: 8
  }, {
    id: 2,
    title: 'Gramática Intermediária',
    time: 'Amanhã, 20:00',
    level: 'A2',
    teacher: 'Prof. Jean',
    participants: 10
  }];
  const recentActivities = [{
    id: 1,
    text: 'Completou a lição "Les Salutations"',
    time: '2h atrás'
  }, {
    id: 2,
    text: 'Participou da aula de conversação',
    time: '1 dia atrás'
  }];
  return <div className="p-6 space-y-6">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Bonjour, {user.name}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400"></p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return <motion.div key={stat.title} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: index * 0.1
        }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 truncate">
                {stat.value}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.title}</p>
            </motion.div>;
      })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-500" />
              Próximas Aulas (Exemplo)
            </h2>
            <Button variant="outline" size="sm" onClick={() => onTabChange('schedule')}>
              Ver todas
            </Button>
          </div>
          
          <div className="space-y-4">
            {upcomingClasses.map((class_, index) => <motion.div key={class_.id} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800 dark:text-white">{class_.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{class_.time}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                      {class_.level}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {class_.teacher}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {class_.participants}
                    </span>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" onClick={() => handleFeatureClick('Entrar na aula')}>
                  <Play className="w-4 h-4 mr-1" />
                  Entrar
                </Button>
              </motion.div>)}
          </div>
        </motion.div>

        <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-500" />
              Atividades Recentes (Exemplo)
            </h2>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => <motion.div key={activity.id} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: index * 0.1
          }} className="flex items-start space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 dark:text-white">{activity.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                </div>
              </motion.div>)}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center" onClick={() => onTabChange('schedule')}>
            <Calendar className="w-4 h-4 mr-2" />
            Minha Agenda
          </Button>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center" onClick={() => onTabChange('materials')}>
            <Download className="w-4 h-4 mr-2" />
            Baixar Materiais
          </Button>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex items-center" onClick={() => onTabChange('grades')}>
            <BarChart className="w-4 h-4 mr-2" />
            Ver Notas
          </Button>
        </div>
      </motion.div>
    </div>;
};
export default StudentDashboard;