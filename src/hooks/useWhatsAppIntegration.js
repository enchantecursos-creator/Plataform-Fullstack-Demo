import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { validateMongoObjectId } from '@/lib/utils';

export const useWhatsAppIntegration = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // --- WhatsApp Channel Key Management ---

  const saveWhatsAppChannelKey = useCallback(async (key) => {
    try {
      setLoading(true);

      if (!validateMongoObjectId(key)) {
        throw new Error("Formato de chave inválido. Deve ser um ID hexadecimal de 24 caracteres.");
      }
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'whatsapp_channel_key',
          setting_value: key,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "✅ Chave do Canal salva!",
        description: "A chave do canal WhatsApp foi salva com sucesso.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving Channel Key:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar chave",
        description: error.message,
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getWhatsAppChannelKey = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'whatsapp_channel_key')
        .maybeSingle();

      if (error) throw error;
      return data?.setting_value || null;
    } catch (error) {
      console.error('Error getting Channel Key:', error);
      return null;
    }
  }, []);

  const saveApiKey = saveWhatsAppChannelKey; 
  const getApiKey = getWhatsAppChannelKey;


  // --- Sending Logic ---

  const sendMessageToStudent = useCallback(async (studentId, rawMessage, apiKeyOverride = null) => {
    try {
      // 1. Fetch Student Data with Strict Validation Logic
      // SCHEMA NOTE: querying profiles with junction table classrooms!classroom_students
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select(`
          id, 
          name, 
          whatsapp, 
          email,
          role,
          classrooms!classroom_students ( name, level )
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // VALIDATION: Ensure user is a student
      if (student.role !== 'ALUNO') {
        throw new Error(`O usuário ${student.name} não é um aluno (Role: ${student.role}).`);
      }

      // VALIDATION: Ensure whatsapp exists
      if (!student.whatsapp) {
        throw new Error(`O aluno ${student.name} não possui número de WhatsApp cadastrado.`);
      }

      // 2. Sanitize Phone
      const cleanPhone = student.whatsapp.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
         throw new Error(`Número de WhatsApp inválido para ${student.name}: ${student.whatsapp}`);
      }

      // 3. Process Placeholders
      // Handle array from M2M relationship
      const primaryClass = student.classrooms?.[0];
      const className = primaryClass?.name || primaryClass?.level || '';

      let processedMessage = rawMessage || '';
      processedMessage = processedMessage
        .replace(/{{\s*nome\s*}}/gi, student.name || '')
        .replace(/{{\s*email\s*}}/gi, student.email || '')
        .replace(/{{\s*turma\s*}}/gi, className)
        .replace(/{{\s*telefone\s*}}/gi, student.whatsapp || '');


      // 4. Send Message via Edge Function
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          chat: cleanPhone,
          message: processedMessage,
          apiKey: apiKeyOverride // Can be null, Edge Function handles it
        }
      });

      if (error) {
        let errorMessage = error.message;
        try {
           const body = JSON.parse(error.message);
           if (body.error) errorMessage = body.error;
           if (body.details) console.error('Error Details:', body.details);
        } catch(e) { /* ignore json parse error */ }
        throw new Error(errorMessage);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao enviar mensagem');
      }

      // 5. Log to History
      await supabase
        .from('whatsapp_message_history')
        .insert({
          recipient_id: studentId,
          recipient_phone: cleanPhone,
          message_text: processedMessage,
          status: 'sent',
          error_message: null
        });

      return { success: true, student: student.name };

    } catch (error) {
      console.error(`Error sending message to student ${studentId}:`, error);
      
      try {
        await supabase
          .from('whatsapp_message_history')
          .insert({
            recipient_id: studentId,
            recipient_phone: 'unknown',
            message_text: rawMessage,
            status: 'failed',
            error_message: error.message
          });
      } catch (e) {
        console.error('Error logging failed attempt:', e);
      }

      return { success: false, error: error.message };
    }
  }, []);

  const sendMessageToAllStudents = useCallback(async (message, onProgress) => {
    try {
      setLoading(true);

      const key = await getWhatsAppChannelKey();
      if (!key) {
        toast({
          variant: "destructive",
          title: "Configuração Necessária",
          description: "Configure sua Chave do Canal WhatsApp nas configurações antes de enviar."
        });
        return { success: false, total: 0, sent: 0, failed: 0 };
      }

      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'ALUNO')
        .not('whatsapp', 'is', null);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({ variant: "destructive", title: "Nenhum aluno encontrado" });
        return { success: false, total: 0 };
      }

      const results = {
        total: students.length,
        sent: 0,
        failed: 0,
        details: []
      };

      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        if (onProgress) onProgress({ current: i + 1, total: students.length, studentName: student.name });

        const result = await sendMessageToStudent(student.id, message, key);
        
        if (result.success) results.sent++;
        else results.failed++;

        results.details.push({
          studentId: student.id,
          studentName: student.name,
          success: result.success,
          error: result.error
        });

        // Delay to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "📊 Envio concluído",
        description: `Enviadas: ${results.sent} | Falhadas: ${results.failed}`,
      });

      return results;

    } catch (error) {
      console.error('Error sending messages to all:', error);
      toast({ variant: "destructive", title: "Erro no envio em massa", description: error.message });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [getWhatsAppChannelKey, sendMessageToStudent, toast]);


  // --- Helper Methods ---
  const getMessageHistory = useCallback(async (filters = {}) => {
    try {
      let query = supabase
        .from('whatsapp_message_history')
        .select('*, profiles!whatsapp_message_history_recipient_id_fkey(name)')
        .order('sent_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.startDate) query = query.gte('sent_at', filters.startDate);
      if (filters.endDate) query = query.lte('sent_at', filters.endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }, []);

  const getTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*, profiles!whatsapp_templates_created_by_fkey(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }, []);

  const saveTemplate = useCallback(async (name, messageText, templateId = null) => {
    try {
      setLoading(true);
      const templateData = { name, message_text: messageText, updated_at: new Date().toISOString() };
      
      if (templateId) {
        const { error } = await supabase.from('whatsapp_templates').update(templateData).eq('id', templateId);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase.from('whatsapp_templates').insert({ ...templateData, created_by: userData?.user?.id });
        if (error) throw error;
      }
      toast({ title: "✅ Template salvo!" });
      return { success: true };
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar template", description: error.message });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (templateId) => {
    try {
      setLoading(true);
      const { error } = await supabase.from('whatsapp_templates').delete().eq('id', templateId);
      if (error) throw error;
      toast({ title: "Template excluído" });
      return { success: true };
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir template", description: error.message });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    saveWhatsAppChannelKey,
    getWhatsAppChannelKey,
    sendMessageToStudent,
    sendMessageToAllStudents,
    getMessageHistory,
    getTemplates,
    saveTemplate,
    deleteTemplate,
    saveApiKey, 
    getApiKey
  };
};