import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Image as ImageIcon, Upload, Key, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';
import { validateMongoObjectId } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

const AdminSettings = ({ onSettingsUpdate }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // WhatsApp Channel Key State
  const [channelKey, setChannelKey] = useState('');
  const [initialKey, setInitialKey] = useState(''); // To track if it was loaded from DB
  const [isSavingKey, setIsSavingKey] = useState(false);
  const { getWhatsAppChannelKey } = useWhatsAppIntegration();
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const { data: appConfigData, error: appConfigError } = await supabase
          .from('AppConfig')
          .select('*')
          .limit(1)
          .single();

        if (appConfigError && appConfigError.code !== 'PGRST116') { // Ignore 'exact one row' error if table is empty
          throw appConfigError;
        }
        setConfig(appConfigData);

        const { data: logoData, error: logoError } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'logo_url')
          .single();
        
        if (logoError && logoError.code !== 'PGRST116') {
          throw logoError;
        }
        if (logoData) {
          setLogoUrl(logoData.setting_value);
        }

        // Fetch WhatsApp Key using hook (reuses existing logic for fetching)
        const key = await getWhatsAppChannelKey();
        if (key) {
            setChannelKey(key);
            setInitialKey(key);
        }

      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao buscar configurações", description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [toast, getWhatsAppChannelKey]);

  const handleSave = async () => {
    if (!config || !config.id) {
        toast({ variant: "destructive", title: "Configurações não carregadas", description: "Não é possível salvar." });
        return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('AppConfig')
      .update({
        cancelFreeWindowDays: config.cancelFreeWindowDays,
        cancelFeeCentsGroup: config.cancelFeeCentsGroup,
      })
      .eq('id', config.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
    }
    setIsSaving(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `public/logo_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      toast({ variant: "destructive", title: "Erro no upload da logo", description: uploadError.message });
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('app_settings')
      .update({ setting_value: publicUrl })
      .eq('setting_key', 'logo_url');

    setIsUploading(false);
    if (dbError) {
      toast({ variant: "destructive", title: "Erro ao salvar logo", description: dbError.message });
    } else {
      setLogoUrl(publicUrl);
      onSettingsUpdate(); // Notify App.jsx to refetch
      toast({ title: "Logo atualizada com sucesso!" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: name.includes('Cents') ? value * 100 : Number(value) }));
  };

  const handleSaveKey = async () => {
      setIsSavingKey(true);
      
      // Client-side validation
      if (!validateMongoObjectId(channelKey)) {
        toast({ 
            variant: "destructive", 
            title: "Formato Inválido", 
            description: "A chave deve ser um ID MongoDB válido (24 caracteres hexadecimais)." 
        });
        setIsSavingKey(false);
        return;
      }

      try {
        // Call the Edge Function to save the key
        const { data, error } = await supabase.functions.invoke('save-whatsapp-key', {
          body: { apiKey: channelKey }
        });

        if (error) throw error;
        
        if (!data.success) {
            throw new Error(data.error || 'Falha ao salvar a chave');
        }

        setInitialKey(channelKey); // Update local state to reflect saved status
        toast({ 
            title: "✅ Chave salva com sucesso!", 
            description: "A integração com o WhatsApp foi configurada." 
        });

      } catch (error) {
          console.error('Error saving key:', error);
          toast({ 
              variant: "destructive", 
              title: "❌ Erro ao salvar", 
              description: error.message || "Ocorreu um erro ao conectar com o servidor." 
          });
      } finally {
          setIsSavingKey(false);
      }
  };

  if (loading) {
    return <div className="p-6 text-center">Carregando configurações...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2 text-purple-500" />
          Identidade Visual
        </h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-700">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full" />
            ) : (
              <ImageIcon className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-white">Logo da Empresa</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Use um arquivo .png com fundo transparente.</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg" />
            <Button variant="outline" onClick={() => fileInputRef.current.click()} disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Alterar Logo'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-purple-500" />
          Configurações do Sistema
        </h2>
        {config ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Janela de Cancelamento Gratuito (dias)
                </label>
                <input
                  type="number"
                  name="cancelFreeWindowDays"
                  value={config.cancelFreeWindowDays}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Taxa de Cancelamento - Grupo (R$)
                </label>
                <input
                  type="number"
                  name="cancelFeeCentsGroup"
                  value={config.cancelFeeCentsGroup / 100}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6">
              <Button
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Nenhuma configuração de sistema encontrada. Por favor, configure o banco de dados.</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-green-600" />
                Configuração WhatsApp
            </h2>
            <Badge variant={initialKey ? "outline" : "destructive"} className={`${initialKey ? "border-green-600 text-green-600 bg-green-50" : ""}`}>
                {initialKey ? (
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Configurado</span>
                ) : (
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Não configurado</span>
                )}
            </Badge>
        </div>
        
        <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 font-medium">Informação de Segurança</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                A Chave do Canal (Channel Key) é a credencial que permite enviar mensagens em nome da sua escola. Mantenha esta chave segura.
                Ela deve ser um ID válido do MongoDB (24 caracteres hexadecimais).
            </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 max-w-xl">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Chave do Canal WhatsApp (Channel Key)
                </label>
                <div className="flex gap-2">
                    <Input
                        type="password"
                        value={channelKey}
                        onChange={(e) => setChannelKey(e.target.value)}
                        placeholder="Ex: 507f1f77bcf86cd799439011"
                        className="font-mono text-sm"
                    />
                    <Button 
                        onClick={handleSaveKey} 
                        disabled={isSavingKey || !channelKey}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                    >
                        {isSavingKey ? 'Salvando...' : 'Salvar Key'}
                    </Button>
                </div>
                {channelKey && !validateMongoObjectId(channelKey) && (
                    <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> 
                        Formato inválido. A chave deve ter 24 caracteres hexadecimais.
                    </p>
                )}
                {initialKey && channelKey === initialKey && (
                   <p className="text-xs text-slate-400 mt-2">A chave exibida é a que está salva atualmente.</p>
                )}
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;