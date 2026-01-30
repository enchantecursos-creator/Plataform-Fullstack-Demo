import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Trash2, 
  Plus,
  Power,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useWhatsAppAutoResponses } from '@/hooks/useWhatsAppAutoResponses';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AutoResponsesTab = () => {
  const { autoResponses, fetchAutoResponses, saveAutoResponse, deleteAutoResponse, loading } = useWhatsAppAutoResponses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    keyword: '',
    response_text: '',
    is_active: true
  });

  useEffect(() => {
    fetchAutoResponses();
  }, [fetchAutoResponses]);

  const handleSave = async () => {
    const success = await saveAutoResponse(formData, editingId);
    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleEdit = (response) => {
    setEditingId(response.id);
    setFormData({
      keyword: response.keyword,
      response_text: response.response_text,
      is_active: response.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta resposta automática?')) {
      await deleteAutoResponse(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      keyword: '',
      response_text: '',
      is_active: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Respostas Automáticas</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Resposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Resposta' : 'Nova Resposta Automática'}</DialogTitle>
              <DialogDescription>O sistema responderá automaticamente quando receber esta palavra-chave.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label>Palavra-chave (Keyword)</Label>
                <Input 
                  value={formData.keyword}
                  onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
                  placeholder="Ex: #preço, #ajuda"
                />
                <p className="text-xs text-slate-500 mt-1">O sistema buscará essa palavra exata na mensagem recebida.</p>
              </div>

              <div>
                <Label>Resposta</Label>
                <Textarea 
                  value={formData.response_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, response_text: e.target.value }))}
                  rows={4}
                  placeholder="Digite a resposta automática..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="response-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="response-active">Resposta Ativa</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={loading}>{editingId ? 'Salvar Alterações' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Palavra-chave</th>
                <th className="px-6 py-3">Resposta</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {autoResponses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Nenhuma resposta automática configurada
                  </td>
                </tr>
              ) : (
                autoResponses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {item.keyword}
                    </td>
                    <td className="px-6 py-4 max-w-[400px]">
                      <p className="truncate text-slate-600 dark:text-slate-400">{item.response_text}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutoResponsesTab;