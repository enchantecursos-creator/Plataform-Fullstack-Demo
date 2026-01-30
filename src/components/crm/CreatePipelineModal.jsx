import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export const PipelineForm = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState([
    { id: 1, name: 'Novo Lead', color: '#3b82f6' },
    { id: 2, name: 'Em Andamento', color: '#f59e0b' },
    { id: 3, name: 'Finalizado', color: '#10b981' }
  ]);

  const addStage = () => {
    setStages([
      ...stages,
      { 
        id: Date.now(), 
        name: '', 
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)] 
      }
    ]);
  };

  const removeStage = (id) => {
    if (stages.length <= 1) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O pipeline deve ter pelo menos uma etapa.' });
      return;
    }
    setStages(stages.filter(s => s.id !== id));
  };

  const updateStage = (id, field, value) => {
    setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nome obrigatório', description: 'Por favor, dê um nome ao pipeline.' });
      return;
    }
    
    if (stages.some(s => !s.name.trim())) {
      toast({ variant: 'destructive', title: 'Etapas inválidas', description: 'Todas as etapas devem ter um nome.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Check uniqueness
      const { data: existing } = await supabase
        .from('crm_pipelines')
        .select('id')
        .eq('name', name)
        .single();
        
      if (existing) {
        throw new Error('Já existe um pipeline com este nome.');
      }

      // 2. Create Pipeline
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('crm_pipelines')
        .insert({
          name,
          description,
          is_active: true
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // 3. Create Stages
      const stagesToInsert = stages.map((stage, index) => ({
        pipeline_id: pipelineData.id,
        name: stage.name,
        color: stage.color,
        order: index + 1
      }));

      const { error: stagesError } = await supabase
        .from('crm_stages')
        .insert(stagesToInsert);

      if (stagesError) throw stagesError;

      toast({ title: 'Sucesso', description: 'Pipeline criado com sucesso!' });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      
      // Reset form
      setName('');
      setDescription('');
      setStages([
        { id: 1, name: 'Novo Lead', color: '#3b82f6' },
        { id: 2, name: 'Em Andamento', color: '#f59e0b' },
        { id: 3, name: 'Finalizado', color: '#10b981' }
      ]);

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao criar pipeline', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Nome do Pipeline</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Ex: Vendas Internas"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Ex: Pipeline para time comercial..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Etapas do Pipeline</Label>
              <Button size="sm" variant="outline" onClick={addStage}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Etapa
              </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400 cursor-grab px-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 cursor-pointer relative group">
                    <input 
                      type="color" 
                      value={stage.color}
                      onChange={(e) => updateStage(stage.id, 'color', e.target.value)}
                      className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] p-0 border-0 cursor-pointer opacity-0"
                    />
                    <div 
                      className="w-full h-full" 
                      style={{ backgroundColor: stage.color }} 
                    />
                  </div>
                  <Input 
                    value={stage.name}
                    onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                    placeholder={`Etapa ${index + 1}`}
                    className="flex-1 h-8"
                  />
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                    onClick={() => removeStage(stage.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? 'Salvando...' : 'Salvar Pipeline'}
          </Button>
        </DialogFooter>
    </div>
  );
};

const CreatePipelineModal = ({ isOpen, onClose, onPipelineCreated }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Criar Novo Pipeline</DialogTitle>
        </DialogHeader>
        <PipelineForm onClose={onClose} onSuccess={onPipelineCreated} />
      </DialogContent>
    </Dialog>
  );
};

export default CreatePipelineModal;