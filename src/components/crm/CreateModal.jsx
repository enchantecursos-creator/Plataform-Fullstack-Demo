import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, KanbanSquare } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PipelineForm } from './CreatePipelineModal';
import { DealForm } from './CreateDealModal';

const CreateModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [view, setView] = useState('menu'); // 'menu', 'deal', 'pipeline'

  const handleClose = () => {
    setView('menu');
    onClose();
  };

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 transition-all duration-300">
        <DialogHeader>
          <DialogTitle>
             {view === 'menu' && 'O que você deseja criar?'}
             {view === 'deal' && 'Criar Novo Deal'}
             {view === 'pipeline' && 'Criar Novo Pipeline'}
          </DialogTitle>
        </DialogHeader>

        {view === 'menu' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 items-center justify-center border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 dark:hover:border-green-500/50 transition-all group"
                onClick={() => setView('deal')}
              >
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                      <UserPlus className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                  </div>
                  <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Criar Deal</span>
                  <span className="text-xs text-slate-500 text-center px-4">Adicione um novo contato e inicie uma negociação.</span>
              </Button>

              {user?.role === 'ADMIN' && (
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col gap-3 items-center justify-center border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 dark:hover:border-blue-500/50 transition-all group"
                    onClick={() => setView('pipeline')}
                  >
                      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                          <KanbanSquare className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </div>
                      <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Criar Pipeline</span>
                      <span className="text-xs text-slate-500 text-center px-4">Configure um novo fluxo de trabalho para sua equipe.</span>
                  </Button>
              )}
           </div>
        )}

        {view === 'deal' && (
            <DealForm onClose={handleClose} onSuccess={handleSuccess} />
        )}

        {view === 'pipeline' && (
            <PipelineForm onClose={handleClose} onSuccess={handleSuccess} />
        )}

      </DialogContent>
    </Dialog>
  );
};

export default CreateModal;