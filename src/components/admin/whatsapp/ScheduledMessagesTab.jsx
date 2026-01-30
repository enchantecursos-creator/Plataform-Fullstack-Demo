import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Trash2, 
  Edit, 
  Plus, 
  X, 
  AlertCircle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; 
import { useWhatsAppScheduling } from '@/hooks/useWhatsAppScheduling';
import { useWhatsAppFilters } from '@/hooks/useWhatsAppFilters'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ScheduledMessagesTab = () => {
  const { scheduledMessages, fetchScheduledMessages, createScheduledMessage, cancelScheduledMessage, loading } = useWhatsAppScheduling();
  const { filteredStudents, selectedStudentIds, toggleStudentSelection, toggleSelectAll } = useWhatsAppFilters();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    message_text: '',
    scheduled_time: '',
    recipient_ids: []
  });

  useEffect(() => {
    fetchScheduledMessages();
  }, [fetchScheduledMessages]);

  const handleCreate = async () => {
    const success = await createScheduledMessage({
      ...newMessage,
      recipient_ids: selectedStudentIds 
    });
    
    if (success) {
      setIsDialogOpen(false);
      setNewMessage({ message_text: '', scheduled_time: '', recipient_ids: [] });
    }
  };

  const handleCancel = async (id) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await cancelScheduledMessage(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Agendado': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'Enviado': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'Cancelado': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Mensagens Agendadas</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Agendar Nova Mensagem</DialogTitle>
              <DialogDescription>Configure a mensagem e data de envio.</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data e Hora</Label>
                  <Input 
                    type="datetime-local" 
                    value={newMessage.scheduled_time}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div>
                <Label>Mensagem</Label>
                <Textarea 
                  value={newMessage.message_text}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message_text: e.target.value }))}
                  rows={4}
                  placeholder="Digite o conteúdo da mensagem..."
                />
              </div>

              <div>
                <Label className="mb-2 block">Destinatários ({selectedStudentIds.length} selecionados)</Label>
                <div className="border rounded-md p-2 h-48 overflow-y-auto">
                   {filteredStudents.map(student => (
                     <div key={student.id} className="flex items-center gap-2 py-1">
                       <input 
                         type="checkbox" 
                         checked={selectedStudentIds.includes(student.id)}
                         onChange={() => toggleStudentSelection(student.id)}
                       />
                       <span className="text-sm">{student.name}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={loading}>Agendar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Data Programada</th>
                <th className="px-4 py-3">Mensagem</th>
                <th className="px-4 py-3">Destinatários</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {scheduledMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum agendamento encontrado
                  </td>
                </tr>
              ) : (
                scheduledMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(msg.scheduled_time).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[300px]">
                      <p className="truncate" title={msg.message_text}>{msg.message_text}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-400" />
                        {msg.recipient_ids?.length || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(msg.status)}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {msg.status === 'Agendado' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCancel(msg.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
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

export default ScheduledMessagesTab;