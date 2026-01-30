import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Calendar, TrendingUp, Bell } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AdminOverview = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    activeStudents: 0,
    monthlyRevenue: 0,
    classesThisMonth: 1234, // Mocked for now
    retentionRate: 94, // Mocked for now
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: studentCount, error: studentError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ALUNO');

      if (studentError) {
        toast({ variant: "destructive", title: "Erro ao buscar alunos", description: studentError.message });
      }

      const { data: revenueData, error: revenueError } = await supabase
        .rpc('calculate_monthly_financials');

      if (revenueError) {
        toast({ variant: "destructive", title: "Erro ao buscar receita", description: revenueError.message });
      }

      setStats(prev => ({
        ...prev,
        activeStudents: studentCount || 0,
        monthlyRevenue: revenueData?.total_income || 0,
      }));
    };

    fetchStats();
  }, [toast]);

  const statCards = [
    { title: 'Alunos Ativos', value: stats.activeStudents, change: '+12%', icon: Users, color: 'from-blue-500 to-blue-600' },
    { title: 'Receita Mensal', value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`, change: '+8%', icon: DollarSign, color: 'from-green-500 to-green-600' },
    { title: 'Aulas Este Mês', value: stats.classesThisMonth, change: '+15%', icon: Calendar, color: 'from-purple-500 to-purple-600' },
    { title: 'Taxa de Retenção', value: `${stats.retentionRate}%`, change: '+2%', icon: TrendingUp, color: 'from-yellow-500 to-yellow-600' }
  ];

  const recentActivities = [
    { id: 1, text: 'Nova matrícula: Ana Silva (A1)', time: '5 min atrás', type: 'enrollment' },
    { id: 2, text: 'Pagamento recebido: R$ 129,90', time: '12 min atrás', type: 'payment' },
    { id: 3, text: 'Aula cancelada: B2 - Conversação', time: '1h atrás', type: 'cancellation' },
    { id: 4, text: 'Novo professor cadastrado: Marie Dubois', time: '2h atrás', type: 'teacher' },
    { id: 5, text: 'Certificado emitido: João Santos (A2)', time: '3h atrás', type: 'certificate' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-500 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{stat.value}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.title}</p>
            </motion.div>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-purple-500" />
          Atividades Recentes
        </h2>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                activity.type === 'enrollment' ? 'bg-green-500' :
                activity.type === 'payment' ? 'bg-blue-500' :
                activity.type === 'cancellation' ? 'bg-red-500' :
                activity.type === 'teacher' ? 'bg-purple-500' :
                'bg-yellow-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-slate-800 dark:text-white">{activity.text}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOverview;