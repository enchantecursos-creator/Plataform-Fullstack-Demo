import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';

export const useWhatsAppAutomations = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getWhatsAppChannelKey } = useWhatsAppIntegration();

  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_automations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar automações",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveAutomation = useCallback(async (automationData, id = null) => {
    try {
      setLoading(true);

      // Verify Key Existence
      const key = await getWhatsAppChannelKey();
      if (!key) {
        throw new Error("Configure sua Chave do Canal WhatsApp nas configurações antes de criar automações.");
      }

      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        ...automationData,
        updated_at: new Date().toISOString()
      };

      let error;
      if (id) {
        const { error: updateError } = await supabase
          .from('whatsapp_automations')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('whatsapp_automations')
          .insert({
            ...payload,
            created_by: userData.user.id
          });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: id ? "Automação atualizada!" : "Automação criada!",
        description: "As configurações foram salvas com sucesso."
      });

      await fetchAutomations();
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar automação",
        description: error.message
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchAutomations, getWhatsAppChannelKey]);

  const deleteAutomation = useCallback(async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('whatsapp_automations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Automação excluída",
        description: "A automação foi removida com sucesso."
      });

      await fetchAutomations();
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchAutomations]);

  const toggleAutomationStatus = useCallback(async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('whatsapp_automations')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      await fetchAutomations();
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar status",
        description: error.message
      });
      return { success: false, error };
    }
  }, [toast, fetchAutomations]);

  return {
    automations,
    loading,
    fetchAutomations,
    saveAutomation,
    deleteAutomation,
    toggleAutomationStatus
  };
};