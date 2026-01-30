import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useWhatsAppAutoResponses = () => {
  const { toast } = useToast();
  const [autoResponses, setAutoResponses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAutoResponses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_auto_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAutoResponses(data || []);
    } catch (error) {
      console.error('Error fetching auto responses:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar respostas automáticas",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveAutoResponse = useCallback(async (responseData, id = null) => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        ...responseData,
        updated_at: new Date().toISOString()
      };

      let error;
      if (id) {
        const { error: updateError } = await supabase
          .from('whatsapp_auto_responses')
          .update(payload)
          .eq('id', id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('whatsapp_auto_responses')
          .insert({
            ...payload,
            created_by: userData.user.id
          });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: id ? "Resposta atualizada!" : "Resposta criada!",
        description: "Configuração salva com sucesso."
      });

      await fetchAutoResponses();
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchAutoResponses]);

  const deleteAutoResponse = useCallback(async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('whatsapp_auto_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Resposta excluída",
        description: "A resposta automática foi removida."
      });

      await fetchAutoResponses();
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
  }, [toast, fetchAutoResponses]);

  return {
    autoResponses,
    loading,
    fetchAutoResponses,
    saveAutoResponse,
    deleteAutoResponse
  };
};