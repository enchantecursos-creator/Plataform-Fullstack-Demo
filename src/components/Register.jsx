import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Briefcase } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null); // 'ALUNO' or 'PROFESSOR'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    rg: '',
    whatsapp: '',
    plan: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { name, email, password, cpf, rg, whatsapp, plan } = formData;
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: error.message,
      });
      setIsLoading(false);
      return;
    }
    
    if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name,
            role: userType,
            plan,
            cpf,
            rg,
            whatsapp,
            email,
          })
          .eq('id', user.id);

        if (profileError) {
             toast({
                variant: "destructive",
                title: "Erro ao salvar perfil",
                description: profileError.message,
              });
        } else {
             toast({
                title: "Confirme seu email!",
                description: "Enviamos um link de confirmação para o seu email. Após confirmar, faça o login.",
              });
              navigate('/login');
        }
    }


    setIsLoading(false);
  };

  const studentPlans = [
    { id: 'student_basic', name: 'Plano Básico', price: 'R$ 99/mês' },
    { id: 'student_premium', name: 'Plano Premium', price: 'R$ 149/mês' },
  ];

  const teacherPlans = [
    { id: 'teacher_starter', name: 'Plano Professor Inicial', price: 'Taxa de 15%' },
    { id: 'teacher_pro', name: 'Plano Professor Pro', price: 'Taxa de 10%' },
  ];

  const plans = userType === 'ALUNO' ? studentPlans : teacherPlans;

  const renderStep1 = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Como você vai usar a plataforma?</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <Button variant="outline" className="h-32 text-lg flex-1 flex-col" onClick={() => handleUserTypeSelect('ALUNO')}>
          <User className="w-8 h-8 mb-2" />
          Sou Aluno
        </Button>
        <Button variant="outline" className="h-32 text-lg flex-1 flex-col" onClick={() => handleUserTypeSelect('PROFESSOR')}>
          <Briefcase className="w-8 h-8 mb-2" />
          Sou Professor
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
      <Button variant="ghost" onClick={() => setStep(1)} className="mb-4 text-slate-800 dark:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
        Crie sua conta de {userType === 'ALUNO' ? 'Aluno' : 'Professor'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome Completo" required className="w-full p-3 border rounded-lg bg-transparent dark:text-white" />
        <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required className="w-full p-3 border rounded-lg bg-transparent dark:text-white" />
        <input name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Senha (mínimo 6 caracteres)" required className="w-full p-3 border rounded-lg bg-transparent dark:text-white" />
        <input name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="CPF" required className="w-full p-3 border rounded-lg bg-transparent dark:text-white" />
        <input name="rg" value={formData.rg} onChange={handleInputChange} placeholder="RG" required className="w-full p-3 border rounded-lg bg-transparent dark:text-white" />
        <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="WhatsApp" required className="w-full p-3 border rounded-lg bg-transparent dark:text-white" />
        
        <div className="space-y-2">
            <p className="font-medium text-slate-800 dark:text-white">Escolha seu plano:</p>
            {plans.map(plan => (
                <label key={plan.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${formData.plan === plan.id ? 'border-purple-500 ring-2 ring-purple-500' : 'border-slate-300 dark:border-slate-600'}`}>
                    <div className="text-slate-800 dark:text-white">
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{plan.price}</p>
                    </div>
                    <input type="radio" name="plan" value={plan.id} checked={formData.plan === plan.id} onChange={handleInputChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500" />
                </label>
            ))}
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3" disabled={isLoading}>
          {isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'}
        </Button>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-900 dark:to-blue-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-2xl p-8 backdrop-blur-lg border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Cadastro Enchanté</h1>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div key={step}>
              {step === 1 ? renderStep1() : renderStep2()}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-purple-600 dark:text-purple-400 hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;