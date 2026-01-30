import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  PlusCircle,
  Send,
  Repeat,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const CreateInvoiceDialog = ({ isOpen, onClose, onSave, user, editingInvoice }) => {
  const [formData, setFormData] = useState({
    userId: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    description: '',
    method: 'PIX',
    chargeType: 'single', // 'single' or 'subscription'
    nextChargeDate: new Date().toISOString().split('T')[0],
  });
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      let query = supabase.from('profiles').select('id, name, email').eq('role', 'ALUNO');
      if (user.role === 'PROFESSOR') {
        query = query.eq('teacher_id', user.id);
      }
      const { data, error } = await query;
      if (!error) setStudents(data);
    };

    if (isOpen) {
      fetchStudents();
      if (editingInvoice) {
        setFormData({
          userId: editingInvoice.userId,
          amount: editingInvoice.amount / 100,
          dueDate: new Date(editingInvoice.dueDate).toISOString().split('T')[0],
          description: editingInvoice.description,
          method: editingInvoice.method,
          chargeType: 'single'
        });
      } else {
        // Reset form on open for new invoice
        setFormData({
          userId: '', amount: 0, dueDate: new Date().toISOString().split('T')[0], description: '', method: 'PIX', chargeType: 'single', nextChargeDate: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [isOpen, user, editingInvoice]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ ...formData, id: editingInvoice?.id });
    setIsSaving(false);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
     if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingInvoice ? 'Editar Cobrança' : 'Nova Cobrança'}</DialogTitle>
          <DialogDescription>Preencha os detalhes da cobrança.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!editingInvoice && (
            <div>
              <label>Tipo de Cobrança</label>
              <select name="chargeType" value={formData.chargeType} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="single">Cobrança Única</option>
                <option value="subscription">Assinatura</option>
              </select>
            </div>
          )}
          <div>
            <label>Aluno</label>
            <select name="userId" value={formData.userId} onChange={handleInputChange} disabled={!!editingInvoice} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="">Selecione um aluno</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Valor (R$)</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          {formData.chargeType === 'single' ? (
            <div>
              <label>Data de Vencimento</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          ) : (
             !editingInvoice && (
                <div>
                  <label>Data da Próxima Cobrança</label>
                  <input type="date" name="nextChargeDate" value={formData.nextChargeDate} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
              )
           )}
          <div>
            <label>Descrição</label>
            <input name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          {formData.chargeType === 'single' && (
            <div>
              <label>Método</label>
              <select name="method" value={formData.method} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="PIX">PIX</option>
                <option value="Cartão">Cartão</option>
                <option value="Boleto">Boleto</option>
              </select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ManageSubscriptionDialog = ({ subscription, isOpen, onClose, onUpdate }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nextChargeDate, setNextChargeDate] = useState('');

  useEffect(() => {
    if (subscription) {
      setNextChargeDate(new Date(subscription.next_charge_date).toISOString().split('T')[0]);
    }
  }, [subscription]);

  if (!subscription) return null;

  const handleUpdateSubscription = async () => {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ next_charge_date: nextChargeDate })
      .eq('id', subscription.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar assinatura", description: error.message });
    } else {
      toast({ title: "Assinatura atualizada com sucesso!" });
      onUpdate();
      setIsEditing(false);
    }
  };

  const handleDeleteSubscription = async () => {
    const { error } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', subscription.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir assinatura", description: error.message });
    } else {
      toast({ title: "Assinatura excluída com sucesso!" });
      onUpdate();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Assinatura</DialogTitle>
          <DialogDescription>Detalhes da assinatura de {subscription.profiles?.name}.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <p><strong>Plano:</strong> {subscription.subscription_plans?.name}</p>
          <p><strong>Status:</strong> {subscription.status}</p>
          {isEditing ? (
            <div>
              <label>Próxima Cobrança:</label>
              <input type="date" value={nextChargeDate} onChange={(e) => setNextChargeDate(e.target.value)} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700" />
            </div>
          ) : (
            <p><strong>Próxima Cobrança:</strong> {new Date(subscription.next_charge_date).toLocaleDateString('pt-BR')}</p>
          )}
        </div>
        <DialogFooter className="justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a assinatura.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSubscription}>Continuar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button onClick={handleUpdateSubscription}>Salvar</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>Fechar</Button>
                <Button onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Billing = ({ user }) => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('invoices');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isManageSubOpen, setIsManageSubOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    let invoiceQuery = supabase.from('Invoice').select('*, profiles(name, email)');
    let subscriptionQuery = supabase.from('user_subscriptions').select('*, profiles(name, email), subscription_plans(name)');

    if (user.role === 'PROFESSOR') {
        const { data: studentIds, error: studentError } = await supabase
            .from('profiles')
            .select('id')
            .eq('teacher_id', user.id);
        
        if (studentError) {
            toast({ variant: "destructive", title: "Erro ao buscar alunos", description: studentError.message });
            setLoading(false);
            return;
        }
        
        const ids = studentIds.map(s => s.id);
        invoiceQuery = invoiceQuery.in('userId', ids);
        subscriptionQuery = subscriptionQuery.in('user_id', ids);
    }
    
    const [invoiceRes, subscriptionRes] = await Promise.all([
      invoiceQuery.order('dueDate', { ascending: false }),
      subscriptionQuery.order('created_at', { ascending: false })
    ]);

    if (invoiceRes.error) toast({ variant: "destructive", title: "Erro ao buscar faturas", description: invoiceRes.error.message });
    else setInvoices(invoiceRes.data);

    if (subscriptionRes.error) toast({ variant: "destructive", title: "Erro ao buscar assinaturas", description: subscriptionRes.error.message });
    else setSubscriptions(subscriptionRes.data);

    setLoading(false);
  }, [toast, user.id, user.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveInvoice = async (invoiceData) => {
    const { id, chargeType, userId, amount, description, dueDate, nextChargeDate, method } = invoiceData;
    const amountInCents = Math.round(amount * 100);

    if (!userId || !amount || !description) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Usuário, valor e descrição são obrigatórios." });
      return;
    }
    
    if (id) { // Editing existing invoice
      const { error } = await supabase.from('Invoice').update({
        amount: amountInCents, description, dueDate, method
      }).eq('id', id);
      if (error) toast({ variant: "destructive", title: "Erro ao atualizar cobrança", description: error.message });
      else {
        toast({ title: "Cobrança atualizada com sucesso!" });
        fetchData();
      }
    } else { // Creating new invoice or subscription
        if (chargeType === 'subscription') {
            if (!nextChargeDate) {
              toast({ variant: "destructive", title: "Data da próxima cobrança é obrigatória para assinaturas." });
              return;
            }
            const { data: planData, error: planError } = await supabase.from('subscription_plans').insert({ name: description, description: `Plano para ${userId}`, price_cents: amountInCents, periodicity: 'monthly', is_active: true }).select().single();
            if (planError) { toast({ variant: "destructive", title: "Erro ao criar plano", description: planError.message }); return; }
            const { error: subError } = await supabase.from('user_subscriptions').insert({ user_id: userId, plan_id: planData.id, status: 'active', next_charge_date: nextChargeDate });
            if (subError) toast({ variant: "destructive", title: "Erro ao criar assinatura", description: subError.message });
            else { toast({ title: "Assinatura criada!" }); fetchData(); }
        } else {
            const { error } = await supabase.from('Invoice').insert({ userId, amount: amountInCents, description, dueDate, method, status: 'PENDING', type: 'MANUAL', attempts: 0 });
            if (error) toast({ variant: "destructive", title: "Erro ao criar cobrança", description: error.message });
            else { toast({ title: "Cobrança criada!" }); fetchData(); }
        }
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setIsCreateInvoiceOpen(true);
  };
  
  const handleDeleteInvoice = async (invoiceId) => {
    const { error } = await supabase.from('Invoice').delete().eq('id', invoiceId);
    if (error) toast({ variant: "destructive", title: "Erro ao excluir cobrança", description: error.message });
    else {
      toast({ title: "Cobrança excluída com sucesso!" });
      fetchData();
    }
  };

  const handleSendInvoice = (invoice) => {
    toast({
      title: "Enviando cobrança...",
      description: `A cobrança para ${invoice.profiles.email} está sendo enviada.`,
    });
  };

  const handleDownloadInvoice = (invoice) => {
    toast({
      title: "Gerando boleto...",
      description: `O boleto para "${invoice.description}" está sendo gerado.`,
    });
    // Dummy PDF generation for demonstration
    const pdfContent = `
      <h1>Boleto de Cobrança</h1>
      <p><strong>Beneficiário:</strong> Sua Escola</p>
      <p><strong>Pagador:</strong> ${invoice.profiles.name}</p>
      <p><strong>Descrição:</strong> ${invoice.description}</p>
      <p><strong>Valor:</strong> R$ ${(invoice.amount / 100).toFixed(2)}</p>
      <p><strong>Vencimento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
      <p><strong>Código de Barras:</strong> |||| |||||||| || |||||||| || ||||||||| || ||||||||</p>
    `;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `boleto_${invoice.id}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };


  const handleManageSubscription = (sub) => {
    setSelectedSubscription(sub);
    setIsManageSubOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': case 'active': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue': case 'paused': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'canceled': return <XCircle className="w-5 h-5 text-slate-500" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PAID': 'Pago', 'PENDING': 'Aguardando', 'OVERDUE': 'Atrasado', 'CANCELED': 'Cancelado',
      'active': 'Ativa', 'paused': 'Pausada', 'canceled': 'Cancelada'
    };
    return statusMap[status] || status;
  };

  const canCreateInvoice = user.role === 'ADMIN' || (user.role === 'PROFESSOR' && user.can_emit_charges);

  const renderInvoices = () => (
    <div className="space-y-4">
      {loading ? <p>Carregando faturas...</p> : invoices.map((invoice, index) => (
        <motion.div key={invoice.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
          <div className="flex items-center space-x-4">
            {getStatusIcon(invoice.status)}
            <div>
              <p className="font-medium text-slate-800 dark:text-white">{invoice.description}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{`Aluno: ${invoice.profiles?.name || 'N/A'} | `}Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-semibold text-slate-800 dark:text-white">R$ {(invoice.amount / 100).toFixed(2)}</p>
              <p className={`text-sm font-semibold ${invoice.status === 'PAID' ? 'text-green-500' : 'text-yellow-500'}`}>{getStatusText(invoice.status)}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => handleEditInvoice(invoice)}><Edit className="w-4 h-4 text-blue-500" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir esta cobrança? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInvoice(invoice.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {(invoice.status === 'PENDING' || invoice.status === 'OVERDUE') && <Button variant="outline" size="sm" onClick={() => handleSendInvoice(invoice)}><Send className="w-4 h-4" /></Button>}
              <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(invoice)}><Download className="w-4 h-4" /></Button>
            </div>
          </div>
        </motion.div>
      ))}
      {!loading && invoices.length === 0 && <div className="text-center py-8"><Receipt className="w-12 h-12 mx-auto text-slate-400 mb-4" /><h3 className="text-lg font-medium">Nenhuma fatura encontrada.</h3></div>}
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-4">
      {loading ? <p>Carregando assinaturas...</p> : subscriptions.map((sub, index) => (
        <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            {getStatusIcon(sub.status)}
            <div>
              <p className="font-medium">{sub.subscription_plans?.name}</p>
              <p className="text-sm text-slate-500">{`Aluno: ${sub.profiles?.name || 'N/A'} | `}Próx. Cobrança: {new Date(sub.next_charge_date).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <p className={`text-sm font-semibold ${sub.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{getStatusText(sub.status)}</p>
            <Button variant="outline" size="sm" onClick={() => handleManageSubscription(sub)}>Gerenciar</Button>
          </div>
        </motion.div>
      ))}
      {!loading && subscriptions.length === 0 && <div className="text-center py-8"><Repeat className="w-12 h-12 mx-auto text-slate-400 mb-4" /><h3 className="text-lg font-medium">Nenhuma assinatura encontrada.</h3></div>}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cobranças e Assinaturas</h1>
          <p className="text-slate-600">Gerencie as faturas e planos recorrentes dos seus alunos.</p>
        </div>
        {canCreateInvoice && (
          <Button onClick={() => { setEditingInvoice(null); setIsCreateInvoiceOpen(true); }} className="bg-gradient-to-r from-purple-500 to-blue-500">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nova Cobrança
          </Button>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border">
        <div className="flex border-b mb-4">
          <button onClick={() => setActiveTab('invoices')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'invoices' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Faturas</button>
          <button onClick={() => setActiveTab('subscriptions')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'subscriptions' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>Assinaturas</button>
        </div>
        {activeTab === 'invoices' ? renderInvoices() : renderSubscriptions()}
      </motion.div>
      <CreateInvoiceDialog isOpen={isCreateInvoiceOpen} onClose={() => setIsCreateInvoiceOpen(false)} onSave={handleSaveInvoice} user={user} editingInvoice={editingInvoice} />
      <ManageSubscriptionDialog 
        subscription={selectedSubscription} 
        isOpen={isManageSubOpen} 
        onClose={() => setIsManageSubOpen(false)}
        onUpdate={fetchData}
      />
    </div>
  );
};

export default Billing;