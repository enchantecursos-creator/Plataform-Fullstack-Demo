import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import KanbanCard from './KanbanCard';
import DealDetailsModal from './DealDetailsModal';
import CreateModal from './CreateModal';
import { formatCurrency } from '@/lib/crmUtils';
import { supabase } from '@/lib/customSupabaseClient';

const PipelinesTab = () => {
  const { user } = useAuth();
  const { pipelines, stages, deals, fetchPipelines, fetchStages, fetchDeals, updateDealStage, loading } = useCRM();
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPipelines().then(data => {
      if (data && data.length > 0 && !selectedPipeline) {
         setSelectedPipeline(data[0].id);
      }
    });
  }, [fetchPipelines]); // removed selectedPipeline from dependency to avoid loop if logic changes

  useEffect(() => {
    if (selectedPipeline) {
      fetchStages(selectedPipeline);
      fetchDeals(selectedPipeline);
    }
  }, [selectedPipeline, fetchStages, fetchDeals]);

  // Realtime Subscription for updates
  useEffect(() => {
      if (!selectedPipeline) return;

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'crm_deals' },
          (payload) => {
             // Simplistic refresh on any deal change to keep stats sync
             // Optimization: check if payload affects current pipeline
             fetchDeals(selectedPipeline);
          }
        )
        .subscribe();

      return () => {
          supabase.removeChannel(channel);
      }
  }, [selectedPipeline, fetchDeals]);


  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStageId = destination.droppableId;
    
    // Check if moving to "Perdemos" - we can't do drag and drop without reason input usually
    // For now, we will allow drag, but if it requires input (like 'Perdemos'), we might need to pop a modal.
    // However, basic implementation without pop-up on DnD:
    const targetStage = stages.find(s => s.id === newStageId);
    if (targetStage?.name === 'Perdemos') {
        // Open modal instead of moving directly because we need a reason
        const deal = deals.find(d => d.id === draggableId);
        setSelectedDeal(deal); 
        // We can't easily cancel the drag visually without state revert, 
        // but since we haven't called updateDealStage yet, no backend change happens.
        // The UI might snap back on refresh or we let the user handle it in modal.
        return; 
    }

    await updateDealStage(draggableId, newStageId, user?.id);
  };

  // Filter based on profile name or whatsapp from connected contact
  const filteredDeals = deals.filter(deal => {
    const name = deal.contact_profile?.name || deal.crm_contacts?.name || '';
    const whatsapp = deal.crm_contacts?.whatsapp || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || whatsapp.includes(searchTerm);
  });

  // Metrics
  const pipelineTotalValue = filteredDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
  const pipelineTotalCount = filteredDeals.length;

  const handleCreateSuccess = () => {
      fetchPipelines();
      if (selectedPipeline) fetchDeals(selectedPipeline);
  };

  if (!pipelines.length && loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="animate-pulse">Carregando Funis...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 overflow-hidden rounded-xl shadow-2xl border border-slate-800">
      {/* Top Bar */}
      <div className="h-16 border-b border-slate-800 bg-[#1e293b]/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-[280px]">
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="bg-[#0f172a] border-slate-700 text-slate-200 focus:ring-green-500/50">
                <SelectValue placeholder="Selecione um Funil" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200">
                {pipelines.map(p => (
                  <SelectItem key={p.id} value={p.id} className="focus:bg-slate-700 focus:text-white cursor-pointer">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-lg shadow-green-900/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Criar
          </Button>

           <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
            <BookOpen className="w-4 h-4 mr-2" /> Ver tutorial
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-wider">Total Deals</span>
                  <span className="font-bold text-slate-200 text-sm">{pipelineTotalCount}</span>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="text-right">
                  <span className="block text-[10px] uppercase tracking-wider">Valor Pipeline</span>
                  <span className="font-bold text-green-400 text-sm">{formatCurrency(pipelineTotalValue)}</span>
              </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                placeholder="Buscar por nome ou whats..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#0f172a] border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-green-500/50 focus:border-green-500/50"
                />
            </div>
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Filter className="w-4 h-4 mr-2" /> Filtrar
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full gap-6 min-w-max pb-2">
            
            {/* Render Stages Columns */}
            {stages.map((stage) => {
              const stageDeals = filteredDeals.filter(d => d.stage_id === stage.id);
              const totalValue = stageDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0);

              return (
                <div key={stage.id} className="w-[320px] flex flex-col h-full rounded-xl bg-[#1e293b]/30 border border-slate-800/50 backdrop-blur-sm shadow-xl">
                  {/* Column Header */}
                  <div className={`p-4 border-b border-slate-700/50 rounded-t-xl bg-gradient-to-b from-[#1e293b] to-transparent`}>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-slate-100 text-sm tracking-wide">{stage.name}</h3>
                      <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                        {stageDeals.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {formatCurrency(totalValue)}
                    </p>
                    {/* Visual color bar */}
                    <div className="h-1 w-full mt-3 rounded-full" style={{ backgroundColor: stage.color || '#10b981' }}></div>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`
                          flex-1 
                          overflow-y-auto 
                          p-3 
                          scrollbar-thin 
                          scrollbar-thumb-slate-700 
                          scrollbar-track-transparent
                          transition-colors
                          ${snapshot.isDraggingOver ? 'bg-slate-800/30' : ''}
                        `}
                      >
                        {stageDeals.map((deal, index) => (
                          <KanbanCard 
                            key={deal.id} 
                            deal={deal} 
                            index={index} 
                            onClick={setSelectedDeal}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <DealDetailsModal 
        deal={selectedDeal} 
        isOpen={!!selectedDeal} 
        onClose={() => setSelectedDeal(null)} 
      />
      
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default PipelinesTab;