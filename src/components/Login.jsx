import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import FloatingInfoBadge from '@/components/FloatingInfoBadge';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState(null);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  
  useEffect(() => {
    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'logo_url')
        .maybeSingle(); 
        

      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching logo:", error);
      }
      
      if (data && data.setting_value) {
        setLogoUrl(data.setting_value);
      }
    };
    fetchLogo();
  }, []);




  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, { data: { name } });
      if (!error) {
        toast({
          title: "Confirme seu email!",
          description: "Enviamos um link de confirmação para o seu email.",
        });
        setIsSignUp(false);
      }
    } else {
      await signIn(email, password);
    }

    setIsLoading(false);
  };


  const handleDemoLogin = async (demoEmail, demoPassword) => {
    await signIn(demoEmail, demoPassword);
  };
  

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  return (
  
    <div className={`login-bg min-h-screen flex items-center justify-center p-4 relative`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 md:ml-0"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-95">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo da Empresa" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">E</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Enchanté</h1>
            <p className="text-slate-600 dark:text-slate-400">Cursos de Francês</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 rounded-lg font-medium transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Aguarde...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
              <span className="block">Usuario: demo@enchante.app</span>
              <span className="block">Senha:    Demo@12345! </span>
            </p>
            
          </div>
        </div>
      </motion.div>
      <FloatingInfoBadge />
    </div>
  );
};

export default Login;