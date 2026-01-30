import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const DealForm = ({ onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data sources
  const [pipelines, setPipelines] = useState([]);
  const [allStages, setAllStages] = useState([]);
  const [users, setUsers] = useState([]);

  // Form State
  const [contactName, setContactName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [dealValue, setDealValue] = useState('');
  
  // Computed
  const availableStages = allStages.filter(s => s.pipeline_id === selectedPipeline);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        // Fetch Pipelines
        const { data: pipelinesData, error: pipelinesError } = await supabase
          .from('crm_pipelines')
          .select('id, name')
          .eq('is_active', true)
          .order('created_at');
        if (pipelinesError) throw pipelinesError;

        // Fetch Stages
        const { data: stagesData, error: stagesError } = await supabase
          .from('crm_stages')
          .select('id, name, pipeline_id, order')
          .order('order');
        if (stagesError) throw stagesError;

        // Fetch Users (for responsible dropdown)
        // Assuming we want admins/professors/staff
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, name')
          .order('name');
        if (usersError) throw usersError;

        setPipelines(pipelinesData || []);
        setAllStages(stagesData || []);
        setUsers(usersData || []);

        if (pipelinesData && pipelinesData.length > 0) {
          setSelectedPipeline(pipelinesData[0].id);
        }
        
        if (currentUser) {
            setResponsibleId(currentUser.id);
        }

      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, [toast, currentUser]);

  useEffect(() => {
    // Reset stage when pipeline changes
    if (selectedPipeline) {
       const firstStage = allStages.find(s => s.pipeline_id === selectedPipeline && s.order === 1);
       if (firstStage) setSelectedStage(firstStage.id);
       else setSelectedStage('');
    }
  }, [selectedPipeline, allStages]);

  const handleSubmit = async () => {
    // Validation
    if (!contactName.trim()) {
       return toast({ variant: 'destructive', title: 'Nome obrigatório', description: 'O nome do contato é obrigatório.' });
    }

    const whatsappRegex = /^55\d{10,11}$/;
    if (!whatsappRegex.test(whatsapp.replace(/\D/g, ''))) {
       return toast({ variant: 'destructive', title: 'WhatsApp inválido', description: 'Formato deve ser 55DDDNUMERO (ex: 5511999999999)' });
    }

    if (!selectedPipeline || !selectedStage) {
       return toast({ variant: 'destructive', title: 'Pipeline/Etapa obrigatórios', description: 'Selecione um funil e uma etapa.' });
    }

    setLoading(true);
    try {
        const cleanWhatsapp = whatsapp.replace(/\D/g, '');

        // 1. Create Profile first (since it's the base entity now)
        // Check if exists first by whatsapp? No simple uniqueness yet, but let's just insert for now
        // Ideally we check if profile exists, but here we create new LEAD
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
                name: contactName,
                email: email || null,
                role: 'LEAD',
                lead_status: 'ativo',
                lead_temperature: 'frio',
                current_pipeline_id: selectedPipeline,
                current_stage_id: selectedStage,
                is_active_student: false
                // is_admin defaulted to false by DB usually
            })
            .select()
            .single();

        if (profileError) throw profileError;

        // 2. Insert Contact linked to Profile
        const { data: contact, error: contactError } = await supabase
            .from('crm_contacts')
            .insert({
                name: contactName,
                whatsapp: cleanWhatsapp,
                email: email || null,
                responsible_user_id: responsibleId || currentUser?.id,
                status: 'active',
                origin: 'manual',
                profile_id: profile.id
            })
            .select()
            .single();

        if (contactError) throw contactError;

        // 3. Insert Deal
        const { data: deal, error: dealError } = await supabase
            .from('crm_deals')
            .insert({
                contact_id: contact.id, // Legacy field
                contact_profile_id: profile.id, // New field
                pipeline_id: selectedPipeline,
                stage_id: selectedStage,
                responsible_user_id: responsibleId || currentUser?.id,
                value: dealValue ? parseFloat(dealValue) : 0,
                status: 'ATIVO',
                moved_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dealError) throw dealError;

        // 4. History Log
        await supabase.from('crm_deal_history').insert({
            deal_id: deal.id,
            to_stage_id: selectedStage,
            moved_by_user_id: currentUser?.id,
            reason: 'Criação manual'
        });

        toast({ title: 'Sucesso', description: 'Deal e Perfil criados com sucesso!' });
        if (onSuccess) onSuccess();
        if (onClose) onClose();

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro ao criar deal', description: error.message });
    } finally {
        setLoading(false);
    }
  };

  if (initialLoading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin w-8 h-8 text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
        <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nome do Contato *</Label>
                    <Input 
                        value={contactName} 
                        onChange={(e) => setContactName(e.target.value)} 
                        placeholder="Ex: João Silva"
                    />
                </div>
                <div className="space-y-2">
                    <Label>WhatsApp (55DDD9...)</Label>
                    <Input 
                        value={whatsapp} 
                        onChange={(e) => setWhatsapp(e.target.value)} 
                        placeholder="Ex: 5511999999999"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Email (Opcional)</Label>
                <Input 
                    type="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="email@exemplo.com"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Pipeline</Label>
                    <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {pipelines.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Etapa Inicial</Label>
                    <Select value={selectedStage} onValueChange={setSelectedStage} disabled={!selectedPipeline}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStages.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select value={responsibleId} onValueChange={setResponsibleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Valor Estimado (R$)</Label>
                    <Input 
                        type="number"
                        value={dealValue} 
                        onChange={(e) => setDealValue(e.target.value)} 
                        placeholder="0.00"
                    />
                </div>
            </div>
        </div>

        <DialogFooter>
             <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
             <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Deal
             </Button>
        </DialogFooter>
    </div>
  );
};

const CreateDealModal = ({ isOpen, onClose, onSuccess }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>Criar Novo Deal</DialogTitle>
                </DialogHeader>
                <DealForm onClose={onClose} onSuccess={onSuccess} />
            </DialogContent>
        </Dialog>
    );
};

export default CreateDealModal;