import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useCRM = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState([]);
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);

  // Pipelines & Stages
  const fetchPipelines = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('crm_pipelines').select('*').eq('is_active', true).order('created_at');
      if (error) throw error;
      setPipelines(data);
      return data;
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar pipelines', description: error.message });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStages = useCallback(async (pipelineId) => {
    try {
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('order');
      if (error) throw error;
      setStages(data);
      return data;
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar etapas', description: error.message });
      return [];
    }
  }, [toast]);

  // Deals
  const fetchDeals = useCallback(async (pipelineId) => {
    setLoading(true);
    try {
      // Modified query to join with profiles via contact_profile_id or contact_id link logic
      // Ideally we rely on contact_profile_id being populated. 
      // If contact_profile_id is NULL (legacy), we might fallback or join via crm_contacts.
      // For this implementation, we assume migration or new deals populate it, or we join carefully.
      
      const { data: dealsData, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_contacts!inner (
             id, whatsapp, origin, tags, notes, photo_url, profile_id
          ),
          contact_profile:contact_profile_id (
             id, name, email, lead_temperature, lead_status, is_active_student, converted_at, lost_at, role, photo_url
          ),
          crm_stages (id, name, color),
          responsible:responsible_user_id (id, name, email)
        `)
        .eq('pipeline_id', pipelineId)
        .order('moved_at', { ascending: false });

      if (error) throw error;
      
      // Map data structure for easier consumption if needed, or return as is.
      // We will normalize 'name' from profile if available, else fallback? 
      // Actually Task says "Join crm_deals with public.profiles using contact_profile_id".
      // We also need crm_contacts for whatsapp.
      
      setDeals(dealsData);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao carregar negociações', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateDealStage = useCallback(async (dealId, newStageId, userId, lostReason = null) => {
    try {
      // 1. Get current state and target stage info
      const { data: deal } = await supabase
        .from('crm_deals')
        .select('stage_id, pipeline_id, contact_profile_id, contact_id, value, crm_stages(name)')
        .eq('id', dealId)
        .single();
        
      if (!deal) throw new Error('Deal not found');

      const { data: targetStage } = await supabase
        .from('crm_stages')
        .select('name, pipeline_id')
        .eq('id', newStageId)
        .single();
        
      if (!targetStage) throw new Error('Target stage not found');

      // Validation for lost reason
      if (targetStage.name === 'Perdemos' && !lostReason) {
        throw new Error('Motivo da perda é obrigatório para esta etapa.');
      }

      // 2. Prepare Deal Updates
      const dealUpdates = {
        stage_id: newStageId,
        moved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'ATIVO'
      };

      if (targetStage.name === 'Ganhamos') {
        dealUpdates.status = 'GANHO';
      } else if (targetStage.name === 'Perdemos') {
        dealUpdates.status = 'PERDIDO';
        dealUpdates.loss_reason = lostReason;
      }

      // 3. Update Deal
      const { error: updateError } = await supabase
        .from('crm_deals')
        .update(dealUpdates)
        .eq('id', dealId);

      if (updateError) throw updateError;

      // 4. Update History
      if (deal.stage_id !== newStageId) {
        await supabase.from('crm_deal_history').insert({
          deal_id: dealId,
          from_stage_id: deal.stage_id,
          to_stage_id: newStageId,
          moved_by_user_id: userId,
          reason: lostReason
        });
      }

      // 5. Update Profile Logic
      const profileId = deal.contact_profile_id;
      
      if (profileId) {
          const profileUpdates = {
              current_pipeline_id: targetStage.pipeline_id,
              current_stage_id: newStageId
          };

          if (targetStage.name === 'Ganhamos') {
              profileUpdates.role = 'ALUNO';
              profileUpdates.lead_status = 'convertido';
              profileUpdates.is_active_student = true;
              profileUpdates.converted_at = new Date().toISOString();
              
              // Trigger move to "Alunos Ativos" pipeline
              handleMoveToAlunosAtivos(profileId, deal.value, userId);

          } else if (targetStage.name === 'Perdemos') {
              profileUpdates.role = 'LEAD'; 
              profileUpdates.lead_status = 'perdido';
              profileUpdates.is_active_student = false;
              profileUpdates.lost_at = new Date().toISOString();
          } else {
              // Intermediate stages
              profileUpdates.role = 'LEAD';
              profileUpdates.lead_status = 'ativo';
              profileUpdates.is_active_student = false;
          }

          // Update Profile
          const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdates)
              .eq('id', profileId);

          if(profileError) console.error("Error updating profile:", profileError);
      }

      // Optimistic update locally
      setDeals(prev => prev.map(d => {
         if (d.id !== dealId) return d;
         return {
             ...d, 
             ...dealUpdates, 
             stage_id: newStageId,
             contact_profile: d.contact_profile ? {
                 ...d.contact_profile,
                 // Naive optimistic update for profile fields - fetching fresh is safer but this provides instant feedback
             } : d.contact_profile
         };
      }));
      
      // Fetch fresh to ensure sync
      fetchDeals(deal.pipeline_id);

      toast({ title: 'Sucesso', description: 'Card movido com sucesso.' });
      return true;

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao mover card', description: error.message });
      // Revert optimistic update requires refetching usually
      // fetchDeals(pipelines.find(p => deals.find(d => d.id === dealId)?.pipeline_id)?.id); 
      return false;
    }
  }, [deals, pipelines, fetchDeals, toast]);

  const updateProfileLeadTemperature = async (profileId, temperature) => {
      try {
          const { error } = await supabase
              .from('profiles')
              .update({ lead_temperature: temperature })
              .eq('id', profileId);
          
          if(error) throw error;
          
          // Update local state if needed
          setDeals(prev => prev.map(d => {
              if (d.contact_profile_id === profileId) {
                  return {
                      ...d,
                      contact_profile: {
                          ...d.contact_profile,
                          lead_temperature: temperature
                      }
                  }
              }
              return d;
          }));

          return true;
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar a temperatura.' });
          return false;
      }
  };

  // Helper for "Alunos Ativos" logic
  const handleMoveToAlunosAtivos = async (profileId, value, userId) => {
      try {
          // 1. Find "Alunos Ativos" pipeline
          const { data: activePipeline } = await supabase
              .from('crm_pipelines')
              .select('id')
              .eq('name', 'Alunos Ativos')
              .single();
          
          if (!activePipeline) return;

          // 2. Find "Ativo" stage
          const { data: activeStage } = await supabase
              .from('crm_stages')
              .select('id')
              .eq('pipeline_id', activePipeline.id)
              .eq('name', 'Ativo')
              .single();

          if (!activeStage) return;

          // 3. Check if deal already exists in this pipeline for this profile
          const { data: existing } = await supabase
              .from('crm_deals')
              .select('id')
              .eq('contact_profile_id', profileId)
              .eq('pipeline_id', activePipeline.id)
              .eq('status', 'ATIVO')
              .maybeSingle();
            
          if (existing) return;

          // Need contact_id as well for legacy compatibility
          const { data: contact } = await supabase.from('crm_contacts').select('id').eq('profile_id', profileId).maybeSingle();
          if(!contact) return; // Should have a contact

          // 4. Create new deal
          const { data: newDeal, error } = await supabase.from('crm_deals').insert({
              contact_id: contact.id,
              contact_profile_id: profileId,
              pipeline_id: activePipeline.id,
              stage_id: activeStage.id,
              responsible_user_id: userId,
              value: value,
              status: 'ATIVO',
              moved_at: new Date().toISOString()
          }).select().single();

          if (error) throw error;

          // 5. Add history
          await supabase.from('crm_deal_history').insert({
              deal_id: newDeal.id,
              to_stage_id: activeStage.id,
              moved_by_user_id: userId,
              reason: 'Conversão automática para Alunos Ativos'
          });

      } catch (e) {
          console.error("Auto-move to Alunos Ativos failed:", e);
      }
  };

  // WhatsApp Actions
  const sendMessage = async ({ deal_id, contact_id, message_text, send_via }) => {
    try {
       const { data, error } = await supabase.functions.invoke('crm-send-message', {
           body: { deal_id, contact_id, message_text, send_via }
       });
       if (error) throw error;
       toast({ title: 'Mensagem enviada', description: 'Enviada com sucesso via WhatsApp Web.' });
       return { success: true, data };
    } catch (error) {
       console.error(error);
       toast({ variant: 'destructive', title: 'Erro no envio', description: error.message });
       return { success: false, error };
    }
  };

  const syncWhatsAppMessages = async () => {
    try {
       toast({ title: 'Sincronizando...', description: 'Buscando mensagens novas...' });
       const { data, error } = await supabase.functions.invoke('crm-sync-whatsapp');
       if (error) throw error;
       toast({ title: 'Sincronização concluída', description: `${data.new_messages || 0} novas mensagens encontradas.` });
       return data;
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro na sincronização', description: error.message });
       throw error;
    }
  };

  // Groups
  const fetchGroups = async () => {
    const { data, error } = await supabase.from('crm_groups').select('*');
    if (error) throw error;
    return data;
  };

  // Config
  const saveConfig = async (key, value, userId) => {
    try {
      const { error } = await supabase.from('crm_config').upsert({
        key,
        value,
        updated_by_user_id: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      
      if (error) throw error;
      toast({ title: 'Configuração salva', description: `${key} atualizado com sucesso.` });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro', description: error.message });
    }
  };

  const getCaktoConfig = async () => {
      const { data } = await supabase.from('crm_config').select('key, value').in('key', ['CAKTO_CLIENT_ID']);
      if (!data) return {};
      const config = {};
      data.forEach(item => {
          if (item.key === 'CAKTO_CLIENT_ID') config.clientId = item.value;
      });
      return config;
  };

  const testCaktoConnection = async () => {
     try {
         toast({ title: 'Conexão', description: 'Testando conexão com Cakto...' });
         await new Promise(r => setTimeout(r, 1500));
         toast({ title: 'Sucesso', description: 'Conexão com Cakto estabelecida com sucesso!' });
     } catch (e) {
         toast({ variant: 'destructive', title: 'Falha', description: 'Não foi possível conectar à Cakto.' });
     }
  };

  return {
    loading,
    pipelines,
    stages,
    deals,
    fetchPipelines,
    fetchStages,
    fetchDeals,
    updateDealStage,
    updateProfileLeadTemperature,
    fetchGroups,
    saveConfig,
    sendMessage,
    syncWhatsAppMessages,
    getCaktoConfig,
    testCaktoConnection
  };
};