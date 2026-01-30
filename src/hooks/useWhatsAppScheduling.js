import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';

export const useWhatsAppScheduling = () => {
  const { toast } = useToast();
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getWhatsAppChannelKey } = useWhatsAppIntegration();

  const fetchScheduledMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_scheduled_messages')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setScheduledMessages(data || []);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar agendamentos",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createScheduledMessage = useCallback(async (data) => {
    try {
      setLoading(true);
      
      // Basic validation
      if (!data.recipient_ids || data.recipient_ids.length === 0) {
        throw new Error("Selecione pelo menos um destinatário.");
      }
      if (!data.message_text) {
        throw new Error("O texto da mensagem é obrigatório.");
      }
      if (!data.scheduled_time) {
        throw new Error("A data/hora do agendamento é obrigatória.");
      }
      if (new Date(data.scheduled_time) < new Date()) {
        throw new Error("A data do agendamento deve ser futura.");
      }

      // Check for WhatsApp Channel Key
      const channelKey = await getWhatsAppChannelKey();
      if (!channelKey) {
        throw new Error("Configure sua Chave do Canal WhatsApp nas configurações antes de agendar.");
      }

      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('whatsapp_scheduled_messages')
        .insert({
          created_by: userData.user.id,
          recipient_ids: data.recipient_ids,
          message_text: data.message_text,
          scheduled_time: data.scheduled_time,
          status: 'Agendado'
        });

      if (error) throw error;

      toast({
        title: "Mensagem agendada!",
        description: "Sua mensagem foi agendada com sucesso."
      });
      
      await fetchScheduledMessages();
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: error.message
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchScheduledMessages, getWhatsAppChannelKey]);

  const cancelScheduledMessage = useCallback(async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('whatsapp_scheduled_messages')
        .update({ status: 'Cancelado' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "O envio da mensagem foi cancelado."
      });
      
      await fetchScheduledMessages();
      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar",
        description: error.message
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchScheduledMessages]);

  return {
    scheduledMessages,
    loading,
    fetchScheduledMessages,
    createScheduledMessage,
    cancelScheduledMessage
  };
};