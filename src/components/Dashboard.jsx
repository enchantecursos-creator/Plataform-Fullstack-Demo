import React from 'react';
import StudentDashboard from '@/components/StudentDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';

const Dashboard = ({ user }) => {
  if (user.role === 'PROFESSOR') {
    return <TeacherDashboard user={user} />;
  }
  
  if (user.role === 'ALUNO') {
    return <StudentDashboard user={user} />;
  }

  // Fallback for other roles or if role is not defined
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
        Bem-vindo, {user.name}!
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Seu painel está sendo preparado.
      </p>
    </div>
  );
};

export default Dashboard;