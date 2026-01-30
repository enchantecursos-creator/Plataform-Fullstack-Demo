import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';

const AddTransactionDialog = ({ isOpen, onClose, onAddTransaction }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data: accountsData } = await supabase.from('financial_accounts').select('*');
      setAccounts(accountsData || []);
      if (accountsData?.length > 0) setAccountId(accountsData[0].id);

      const { data: categoriesData } = await supabase.from('financial_categories').select('*');
      setCategories(categoriesData || []);
      if (categoriesData?.length > 0) setCategoryId(categoriesData[0].id);
    };
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTransaction({
      description,
      amount: type === 'expense' ? -Math.abs(parseFloat(amount)) : parseFloat(amount),
      type,
      transaction_date: transactionDate,
      account_id: accountId,
      category_id: categoryId,
      status: 'paid', // Defaulting to paid for manual entry
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-white">Adicionar Nova Transação</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do lançamento financeiro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-right text-slate-700 dark:text-slate-300">Descrição</label>
            <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="amount" className="text-right text-slate-700 dark:text-slate-300">Valor (R$)</label>
            <input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right text-slate-700 dark:text-slate-300">Tipo</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="col-span-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
              <option value="expense">Saída</option>
              <option value="income">Entrada</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="date" className="text-right text-slate-700 dark:text-slate-300">Data</label>
            <input id="date" type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="col-span-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="account" className="text-right text-slate-700 dark:text-slate-300">Conta</label>
            <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className="col-span-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="category" className="text-right text-slate-700 dark:text-slate-300">Categoria</label>
            <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="col-span-3 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">Salvar Transação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;