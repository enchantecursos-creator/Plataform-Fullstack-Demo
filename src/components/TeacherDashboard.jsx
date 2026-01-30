import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  ClipboardCheck, 
  TrendingUp, 
  Clock,
  Play,
  MessageSquare,
  DollarSign,
  PlusCircle,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { UserDialog } from '@/components/StudentsPanel';
import { GradeDialog } from '@/components/Grades';


const TeacherDashboard = ({ user, onTabChange }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    receivedThisMonth: user.earnings?.receivedThisMonth || 0,
    toReceive: user.earnings?.toReceive || 0,
  });
  const [myStudents, setMyStudents] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
      // Fixed ambiguous relationship by specifying !classroom_students
      const { data: studentsData, error: studentsError, count } = await supabase
        .from('profiles')
        .select('id, name, role, plan, photo_url, whatsapp, classrooms!classroom_students(name)', { count: 'exact' })
        .eq('teacher_id', user.id);

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
      } else {
        setMyStudents(studentsData);
        setStats(prev => ({ ...prev, totalStudents: count }));
      }
      
      const now = new Date().toISOString();
      const { data: classesData, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('*')
        .or(`creator_id.eq.${user.id},attendees.cs.{${user.id}}`)
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(2);

      if(classesError) {
          console.error("Error fetching upcoming classes:", classesError);
      } else {
          setUpcomingClasses(classesData);
      }

  }, [user.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const handleEnterClass = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "🚧 Link não disponível",
        description: "Ainda não há um link de reunião para esta aula.",
      });
    }
  };

  const handleSendMessage = (student) => {
    if (student.whatsapp) {
      const whatsappNumber = student.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "🚧 WhatsApp não encontrado",
        description: `O aluno ${student.name} não possui um número de WhatsApp cadastrado.`,
      });
    }
  };

  const handleSaveUser = async (formData) => {
    const { email, password, ...profileData } = formData;
    
    profileData.teacher_id = user.id;

    const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email, password, ...profileData },
    });

    if (error || (data && data.error)) {
        toast({ variant: "destructive", title: "Erro ao criar aluno", description: error?.message || data?.error });
    } else {
        toast({ title: "Aluno criado com sucesso!" });
        fetchDashboardData(); 
        setIsUserDialogOpen(false);
    }
  };

  const handleSaveGrade = async (gradeData) => {
    const { error } = await supabase.from('grades').insert({
      ...gradeData,
      teacher_id: user.id,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao lançar nota", description: error.message });
    } else {
      toast({ title: "Nota lançada com sucesso!" });
      setIsGradeDialogOpen(false);
    }
  };


  const statCards = [
    { 
      title: 'Total de Alunos', 
      value: stats.totalStudents, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
    },
    { 
      title: 'Próxima Aula', 
      value: upcomingClasses.length > 0 ? new Date(upcomingClasses[0].start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'N/A', 
      icon: Clock, 
      color: 'from-purple-500 to-purple-600',
    },
    { 
      title: 'Recebido no Mês', 
      value: `R$ ${stats.receivedThisMonth.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'from-green-500 to-green-600',
    },
    { 
      title: 'A Receber', 
      value: `R$ ${stats.toReceive.toFixed(2)}`, 
      icon: ClipboardCheck, 
      color: 'from-yellow-500 to-yellow-600',
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <UserDialog 
        user={null}
        isOpen={isUserDialogOpen} 
        onClose={() => setIsUserDialogOpen(false)} 
        onSave={handleSaveUser}
        userType="ALUNO"
      />
      <GradeDialog
        isOpen={isGradeDialogOpen}
        onClose={() => setIsGradeDialogOpen(false)}
        onSave={handleSaveGrade}
        students={myStudents}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Bonjour, {user.name}! 👋
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Seu painel de professor. Pronto para inspirar seus alunos?
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-500" />
              Próximas Aulas
            </h2>
            <Button variant="outline" size="sm" onClick={() => onTabChange('schedule')}>Ver todas</Button>
          </div>
          
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? upcomingClasses.map((class_, index) => (
              <motion.div
                key={class_.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-white">{class_.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(class_.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" onClick={() => handleEnterClass(class_.meeting_link)}>
                    <Play className="w-4 h-4 mr-1" />
                    Entrar
                  </Button>
                </div>
              </motion.div>
            )) : <p className="text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma aula agendada.</p>}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Meus Alunos
            </h2>
            {user.canAddStudents && (
              <Button size="sm" onClick={() => setIsUserDialogOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar Aluno
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {myStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                   {student.photo_url ? (
                      <img src={student.photo_url} alt="Foto de perfil" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {student.name ? student.name.charAt(0) : '?'}
                      </div>
                    )}
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{student.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Plano: {student.plan || 'N/A'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleSendMessage(student)}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-6 text-white"
      >
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas de Professor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30" onClick={() => onTabChange('schedule')}>Agendar Nova Aula</Button>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30" onClick={() => setIsGradeDialogOpen(true)}>
            <Award className="w-4 h-4 mr-2" />
            Lançar Notas
          </Button>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30" onClick={() => onTabChange('materials')}>Ver Materiais de Aula</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherDashboard;