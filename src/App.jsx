import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import StudentDashboard from '@/components/StudentDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';
import Courses from '@/components/Courses';
import Schedule from '@/components/Schedule';
import Materials from '@/components/Materials';
import Billing from '@/components/Billing';
import Profile from '@/components/Profile';
import AdminPanel from '@/components/admin/AdminPanel';
import Login from '@/components/Login';
import Register from '@/components/Register';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import AdminClasses from '@/components/admin/AdminClasses';
import StudentsPanel from '@/components/StudentsPanel';
import Grades from '@/components/Grades';
import AdminBilling from '@/components/admin/AdminBilling';
import ProfessorDocuments from '@/components/ProfessorDocuments';
import CRM from '@/components/CRM'; // Direct CRM Access

const AppContent = () => {
  const { user, signOut, loading } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const path = location.pathname.split('/')[1] || 'dashboard';
  const [activeTab, setActiveTab] = useState(path);
  const [darkMode, setDarkMode] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    setActiveTab(path);
  }, [path]);

  const fetchAppSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'logo_url')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching app settings:', error);
    }
    
    if (data && data.setting_value) {
      setLogoUrl(data.setting_value);
    } else {
      setLogoUrl(null); 
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, material_packages!fk_material_package(name)')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setCurrentUser(null);
      } else if (data) {
        setCurrentUser({
          ...user,
          ...data,
          name: data.name || user.email,
          email: data.email || user.email,
          plan: data.material_packages?.name || data.plan || 'Básico',
          earnings: {
            receivedThisMonth: data.receivedThisMonth || 0,
            toReceive: data.toReceive || 0,
          }
        });
      } else {
        setCurrentUser({
          ...user,
          name: user.email,
          email: user.email,
          role: null,
          plan: 'Básico',
        });
      }
    } else {
      setCurrentUser(null);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchAppSettings();
  }, [user, fetchProfile, fetchAppSettings]);

  const handleLogout = async () => {
    await signOut();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const renderDashboard = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'PROFESSOR') {
      return <TeacherDashboard user={currentUser} onTabChange={setActiveTab} />;
    }
    return <StudentDashboard user={currentUser} onTabChange={setActiveTab} />;
  };
  
  const renderContent = () => {
    if (!currentUser) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'courses':
        return <Courses user={currentUser} />;
      case 'schedule':
        return <Schedule user={currentUser} />;
      case 'materials':
        return <Materials user={currentUser} />;
      case 'documents':
        if (currentUser.role === 'PROFESSOR' || currentUser.role === 'ADMIN') {
          return <ProfessorDocuments user={currentUser} />;
        }
        return renderDashboard();
      case 'billing':
         if (currentUser.role === 'ADMIN') {
           return <AdminBilling user={currentUser} />;
         }
        if (currentUser.role === 'PROFESSOR' && !currentUser.can_emit_charges) {
          return renderDashboard();
        }
        return <Billing user={currentUser} />;
      case 'students':
        if (currentUser.role === 'PROFESSOR' && currentUser.canAddStudents) {
           return <StudentsPanel user={currentUser} />;
        }
        return renderDashboard();
      case 'grades':
        return <Grades user={currentUser} />;
      case 'profile':
        return <Profile user={currentUser} onUpdate={fetchProfile} />;
      case 'admin':
         return currentUser.role === 'ADMIN' ? <AdminPanel user={currentUser} setActiveAdminTab={setActiveTab} onSettingsUpdate={fetchAppSettings} /> : renderDashboard();
      case 'crm':
         // CRM is also accessible as a standalone route for convenience, or part of admin
         return (currentUser.role === 'ADMIN' || currentUser.role === 'ATENDIMENTO' || currentUser.role === 'SUPORTE') ? <CRM user={currentUser} /> : renderDashboard();
      case 'financial':
        return currentUser.role === 'ADMIN' ? <FinancialDashboard /> : renderDashboard();
      case 'classes':
        return currentUser.role === 'ADMIN' ? <AdminClasses user={currentUser} /> : renderDashboard();
      case 'aulas':
        return currentUser.role === 'ADMIN' ? <AdminClasses user={currentUser} isAllClassesView={true} /> : renderDashboard();
      default:
        return renderDashboard();
    }
  };
  
  if (loading) {
     return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser && !loading) {
    return <div className="flex h-screen items-center justify-center">Carregando perfil...</div>;
  }

  return (
    <div className={`flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        logoUrl={logoUrl}
      />
      <main className="flex-1 ml-64 transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Carregando Plataforma...</div>;
  }

  return (
    <>
      <Helmet>
        <title>Enchanté Cursos - Plataforma de Francês</title>
        <meta name="description" content="Plataforma completa para aprendizado de francês com turmas personalizadas e professores especializados" />
      </Helmet>
      
      <Router>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={session ? <Navigate to="/" /> : <Register />} />
          <Route path="/*" element={<ProtectedRoute><AppContent /></ProtectedRoute>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;