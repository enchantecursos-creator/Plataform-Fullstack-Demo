import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  PlusCircle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Filter,
  Briefcase,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import AddTransactionDialog from '@/components/admin/AddTransactionDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const ReportDialog = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', accountId: 'all', categoryId: 'all', status: 'all' });
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchFilters = async () => {
        const { data: accData } = await supabase.from('financial_accounts').select('id, name');
        setAccounts(accData || []);
        const { data: catData } = await supabase.from('financial_categories').select('id, name');
        setCategories(catData || []);
      };
      fetchFilters();
    }
  }, [isOpen]);

  const handleExport = (format) => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: `A exportação para ${format} com os filtros selecionados será implementada em breve!`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Relatório Financeiro</DialogTitle>
          <DialogDescription>Selecione os filtros para exportar.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full p-2 border rounded-md" />
          <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full p-2 border rounded-md" />
          <select value={filters.accountId} onChange={e => setFilters({...filters, accountId: e.target.value})} className="w-full p-2 border rounded-md"><option value="all">Todas as Contas</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select value={filters.categoryId} onChange={e => setFilters({...filters, categoryId: e.target.value})} className="w-full p-2 border rounded-md"><option value="all">Todas as Categorias</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full p-2 border rounded-md"><option value="all">Todos os Status</option><option value="paid">Pago</option><option value="pending">Pendente</option></select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => handleExport('CSV')}>Exportar CSV</Button>
          <Button onClick={() => handleExport('XLS')}>Exportar XLS</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AccountDialog = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', type: 'corrente', initial_balance: 0, institution: '', agency: '', account_number: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <input placeholder="Nome da Conta" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-md" />
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-md"><option value="corrente">Corrente</option><option value="gateway">Gateway</option><option value="caixa">Caixa</option></select>
          <input type="number" placeholder="Saldo Inicial" value={formData.initial_balance} onChange={e => setFormData({...formData, initial_balance: parseFloat(e.target.value)})} className="w-full p-2 border rounded-md" />
          <input placeholder="Instituição" value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="w-full p-2 border rounded-md" />
          <input placeholder="Agência" value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} className="w-full p-2 border rounded-md" />
          <input placeholder="Número da Conta" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} className="w-full p-2 border rounded-md" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Conta'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FinancialDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({ income: 0, expenses: 0, balance: 0, projection: 0 });
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: transactionsData, error } = await supabase.from('financial_transactions').select(`*, financial_categories ( name )`).order('transaction_date', { ascending: false }).limit(5);
    if (error) toast({ variant: "destructive", title: "Erro ao buscar transações", description: error.message });
    else setTransactions(transactionsData);

    const { data: accountsData, error: accError } = await supabase.from('financial_accounts').select('*');
    if (accError) toast({ variant: "destructive", title: "Erro ao buscar contas", description: accError.message });
    else setAccounts(accountsData);

    const { data: monthlyData, error: monthlyError } = await supabase.rpc('calculate_monthly_financials');
    if (monthlyError) {
        console.error(monthlyError);
        toast({ variant: "destructive", title: "Erro ao calcular totais", description: monthlyError.message });
    } else {
      const income = monthlyData?.length > 0 ? monthlyData[0].total_income : 0;
      const expenses = monthlyData?.length > 0 ? monthlyData[0].total_expenses : 0;
      const balance = income - expenses;
      setStats({ income, expenses, balance, projection: balance * 1.1 });
      setChartData([ { name: 'Jul', Entradas: 4000, Saídas: 2400 }, { name: 'Ago', Entradas: 3000, Saídas: 1398 }, { name: 'Set', Entradas: income, Saídas: expenses } ]);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTransaction = async (transaction) => {
    const { error } = await supabase.from('financial_transactions').insert([transaction]);
    if (error) toast({ variant: "destructive", title: "Erro ao adicionar transação", description: error.message });
    else {
      toast({ title: "Transação Adicionada!" });
      fetchData();
      setIsAddOpen(false);
    }
  };

  const handleAddAccount = async (accountData) => {
    const { error } = await supabase.from('financial_accounts').insert([{ ...accountData, current_balance: accountData.initial_balance }]);
    if (error) toast({ variant: "destructive", title: "Erro ao adicionar conta", description: error.message });
    else {
      toast({ title: "Conta Adicionada!" });
      fetchData();
    }
  };

  const getStatusIcon = (status) => ({ paid: <CheckCircle className="w-5 h-5 text-green-500" />, pending: <Clock className="w-5 h-5 text-yellow-500" /> }[status] || <XCircle className="w-5 h-5 text-red-500" />);

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Painel Financeiro</h1>
          <p className="text-slate-600 dark:text-slate-400">Visão geral das finanças da Enchanté Cursos.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setIsReportOpen(true)}><Download className="w-4 h-4 mr-2" />Gerar Relatório</Button>
          <Button onClick={() => setIsAddOpen(true)} className="bg-gradient-to-r from-purple-500 to-blue-500"><PlusCircle className="w-4 h-4 mr-2" />Nova Transação</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{ title: 'Entradas do Mês', value: stats.income, icon: ArrowUpCircle, color: 'from-green-500 to-green-600' }, { title: 'Saídas do Mês', value: stats.expenses, icon: ArrowDownCircle, color: 'from-red-500 to-red-600' }, { title: 'Resultado do Mês', value: stats.balance, icon: DollarSign, color: 'from-blue-500 to-blue-600' }, { title: 'Projeção 30 dias', value: stats.projection, icon: TrendingUp, color: 'from-yellow-500 to-yellow-600' }].map((stat, index) => { const Icon = stat.icon; return (<motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border"><div className="flex items-center justify-between mb-4"><div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}><Icon className="w-6 h-6 text-white" /></div></div><h3 className="text-2xl font-bold">R$ {stat.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3><p className="text-sm">{stat.title}</p></motion.div>); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border">
          <h2 className="text-xl font-semibold mb-6">Evolução Mensal</h2>
          <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} /><Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold">Contas</h2><Button variant="outline" size="sm" onClick={() => setIsAccountOpen(true)}><PlusCircle className="w-4 h-4 mr-2" />Adicionar</Button></div>
          <div className="space-y-3">{accounts.map(acc => (<div key={acc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg"><div className="flex items-center space-x-3"><Banknote className="w-5 h-5 text-purple-500" /><div><p className="font-medium">{acc.name}</p><p className="text-sm text-slate-500">{acc.account_type}</p></div></div><p className="font-semibold">R$ {acc.current_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>))}</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border">
        <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-semibold">Últimas Transações</h2><Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filtros</Button></div>
        <div className="space-y-3">{transactions.map((tx, index) => (<motion.div key={tx.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg"><div className="flex items-center space-x-3">{getStatusIcon(tx.status)}<div><p className="font-medium">{tx.description}</p><p className="text-sm text-slate-500">{new Date(tx.transaction_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p></div></div><p className={`font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{tx.type === 'income' ? '+' : ''}R$ {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></motion.div>))}</div>
      </motion.div>
      
      <AddTransactionDialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAddTransaction={handleAddTransaction} />
      <ReportDialog isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <AccountDialog isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} onSave={handleAddAccount} />
    </div>
  );
};

export default FinancialDashboard;