import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  Plus,
  PlayCircle,
  StopCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppAutomations } from '@/hooks/useWhatsAppAutomations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AutomationsTab = () => {
  const { automations, fetchAutomations, saveAutomation, deleteAutomation, toggleAutomationStatus, loading } = useWhatsAppAutomations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'subscription_due',
    trigger_config: {},
    message_text: '',
    is_active: true
  });

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const handleSave = async () => {
    const success = await saveAutomation(formData, editingId);
    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (automation) => {
    setEditingId(automation.id);
    setFormData({
      name: automation.name || '',
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config || {},
      message_text: automation.message_text,
      is_active: automation.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
      await deleteAutomation(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      trigger_type: 'subscription_due',
      trigger_config: {},
      message_text: '',
      is_active: true
    });
  };

  const getTriggerLabel = (type) => {
    const labels = {
      'subscription_due': 'Mensalidade Vencendo',
      'days_in_school': 'Dias de Curso',
      'overdue': 'Mensalidade Atrasada',
      'new_student': 'Novo Aluno'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Automações</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
              <DialogDescription>Configure gatilhos automáticos para envio de mensagens.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label>Nome da Automação</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Cobrança de Mensalidade"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gatilho (Trigger)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.trigger_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value }))}
                  >
                    <option value="subscription_due">Mensalidade Vencendo Hoje</option>
                    <option value="overdue">Pagamento Atrasado</option>
                    <option value="new_student">Novo Aluno (Boas-vindas)</option>
                    <option value="days_in_school">Tempo de Casa (Dias)</option>
                  </select>
                </div>
                
                {formData.trigger_type === 'days_in_school' && (
                  <div>
                    <Label>Dias após matrícula</Label>
                    <Input 
                      type="number"
                      value={formData.trigger_config.days || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        trigger_config: { ...prev.trigger_config, days: parseInt(e.target.value) } 
                      }))}
                      placeholder="Ex: 7"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Mensagem</Label>
                <Textarea 
                  value={formData.message_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, message_text: e.target.value }))}
                  rows={4}
                  placeholder="Olá {nome}, sua mensalidade vence hoje..."
                />
                <p className="text-xs text-slate-500 mt-1">Variáveis disponíveis: {'{nome}'}, {'{email}'}</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="active-mode"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active-mode">Automação Ativa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{editingId ? 'Salvar Alterações' : 'Criar Automação'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {automations.map((automation) => (
          <div key={automation.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${automation.is_active ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white">{automation.name || 'Sem nome'}</h4>
                  <p className="text-xs text-slate-500">{getTriggerLabel(automation.trigger_type)}</p>
                </div>
              </div>
              <Switch 
                checked={automation.is_active}
                onCheckedChange={() => toggleAutomationStatus(automation.id, automation.is_active)}
              />
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 bg-slate-50 dark:bg-slate-900 p-2 rounded">
              "{automation.message_text}"
            </p>

            <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 
                {new Date(automation.created_at).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                 <button className="text-blue-500 hover:text-blue-600 font-medium" onClick={() => handleEdit(automation)}>Editar</button>
                 <button className="text-red-500 hover:text-red-600 font-medium" onClick={() => handleDelete(automation.id)}>Excluir</button>
              </div>
            </div>
          </div>
        ))}

        {automations.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma automação configurada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationsTab;