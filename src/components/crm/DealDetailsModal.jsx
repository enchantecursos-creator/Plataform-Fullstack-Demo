import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Send, Phone, Tag, Clock, MessageSquare, AlertTriangle, ArrowRight, Flame } from 'lucide-react';
import { formatCurrency, formatWhatsAppNumber } from '@/lib/crmUtils';
import { useCRM } from '@/hooks/useCRM';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DealDetailsModal = ({ deal, isOpen, onClose }) => {
  const { user } = useAuth();
  const { sendMessage, updateDealStage, updateProfileLeadTemperature, fetchStages, pipelines } = useCRM();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [moving, setMoving] = useState(false);
  
  // Move State
  const [targetStageId, setTargetStageId] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [availableStages, setAvailableStages] = useState([]);
  
  // Local profile state to reflect changes
  const [currentLeadTemp, setCurrentLeadTemp] = useState('');

  const scrollRef = useRef(null);

  // Profile/Contact Data
  const profile = deal?.contact_profile || {};
  const contact = deal?.crm_contacts || {};
  const displayName = profile.name || contact.name || 'Sem nome';
  const displayPhoto = profile.photo_url || contact.photo_url;
  const displayWhatsapp = contact.whatsapp;
  
  const leadStatus = profile.lead_status || contact.lead_status;
  const convertedAt = profile.converted_at;
  const lostAt = profile.lost_at;

  useEffect(() => {
    if (deal && isOpen) {
      fetchMessages();
      loadStages();
      setTargetStageId(deal.stage_id); // Reset target to current
      setLossReason(deal.loss_reason || '');
      setCurrentLeadTemp(profile.lead_temperature || contact.lead_temperature || 'frio');
    }
  }, [deal, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
        const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  const loadStages = async () => {
    if(!deal?.pipeline_id) return;
    const { data } = await supabase.from('crm_stages').select('*').eq('pipeline_id', deal.pipeline_id).order('order');
    if(data) setAvailableStages(data);
  };

  const fetchMessages = async () => {
    if (!deal) return;
    const { data } = await supabase.from('crm_messages').select('*').eq('deal_id', deal.id).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !deal) return;
    setSending(true);
    
    const tempMsg = {
        id: 'temp-' + Date.now(),
        message_text: newMessage,
        sender_type: 'WHATSAPP_OUTGOING',
        created_at: new Date().toISOString(),
        status: 'sending'
    };
    setMessages(prev => [...prev, tempMsg]);

    const result = await sendMessage({
        deal_id: deal.id,
        contact_id: deal.contact_id,
        message_text: newMessage,
        send_via: 'whatsapp_web'
    });

    if (result.success) {
        setNewMessage('');
        fetchMessages(); 
    }
    setSending(false);
  };

  const handleMoveStage = async () => {
    if (!targetStageId || targetStageId === deal.stage_id) return;
    
    setMoving(true);
    const success = await updateDealStage(deal.id, targetStageId, user?.id, lossReason);
    if (success) {
      onClose();
    }
    setMoving(false);
  };
  
  const handleTempChange = async (val) => {
      setCurrentLeadTemp(val);
      if (deal.contact_profile_id) {
          await updateProfileLeadTemperature(deal.contact_profile_id, val);
      }
  };

  if (!deal) return null;

  const targetStageObj = availableStages.find(s => s.id === targetStageId);
  const isTargetLost = targetStageObj?.name === 'Perdemos';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[950px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-[#0f172a] border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#1e293b]">
           <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
                 <AvatarImage src={displayPhoto} />
                 <AvatarFallback>{displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                 <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {displayName}
                 </DialogTitle>
                 <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Phone className="w-3 h-3" />
                    {formatWhatsAppNumber(displayWhatsapp)}
                    <span className="mx-1">•</span>
                    <Badge variant="outline" className="text-xs font-normal border-slate-300 dark:border-slate-600">
                       {deal.crm_stages?.name}
                    </Badge>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
               {/* Move Stage Controls */}
               <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                   <Select value={targetStageId} onValueChange={setTargetStageId}>
                       <SelectTrigger className="w-[180px] h-8 bg-white dark:bg-slate-900 text-xs">
                           <SelectValue placeholder="Mover para..." />
                       </SelectTrigger>
                       <SelectContent>
                           {availableStages.map(s => (
                               <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                           ))}
                       </SelectContent>
                   </Select>
                   <Button 
                        size="sm" 
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={handleMoveStage}
                        disabled={moving || (targetStageId === deal.stage_id) || (isTargetLost && !lossReason)}
                   >
                       {moving ? 'Movendo...' : <><ArrowRight className="w-3 h-3 mr-1" /> Mover</>}
                   </Button>
               </div>
               <Button variant="outline" onClick={onClose} size="sm">Fechar</Button>
           </div>
        </div>

        {/* Validation Error / Lost Reason Input */}
        {isTargetLost && (
             <div className="bg-red-50 dark:bg-red-900/20 p-3 px-6 flex items-center gap-4 border-b border-red-100 dark:border-red-900/30 animate-in slide-in-from-top-2">
                 <AlertTriangle className="text-red-500 w-5 h-5 shrink-0" />
                 <div className="flex-1">
                     <Label className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 block">Motivo da Perda (Obrigatório)</Label>
                     <Input 
                        value={lossReason} 
                        onChange={(e) => setLossReason(e.target.value)}
                        placeholder="Ex: Preço muito alto, Fechou com concorrente..."
                        className="h-8 bg-white dark:bg-slate-900 border-red-200 dark:border-red-800 focus-visible:ring-red-500"
                     />
                 </div>
             </div>
        )}

        {/* Content - Two Columns */}
        <div className="flex-1 flex overflow-hidden">
           
           {/* Left: Chat Area */}
           <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-[#f0f2f5] dark:bg-[#0b1120]">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                 <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            Nenhuma mensagem trocada ainda.
                        </div>
                    )}
                    {messages.map((msg) => {
                       const isMe = msg.sender_type === 'WHATSAPP_OUTGOING';
                       return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                             <div className={`
                                max-w-[70%] rounded-lg p-3 text-sm shadow-sm relative
                                ${isMe 
                                   ? 'bg-green-100 dark:bg-green-900/40 text-slate-800 dark:text-green-50 rounded-tr-none' 
                                   : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}
                             `}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.message_text}</p>
                                <span className="text-[10px] opacity-60 flex justify-end mt-1 gap-1 items-center">
                                   {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   {isMe && <span>✓</span>}
                                </span>
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-3 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                 <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem (WhatsApp)..."
                    className="flex-1 border-0 focus-visible:ring-0 bg-slate-100 dark:bg-slate-900"
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                 />
                 <Button 
                    size="icon" 
                    className="bg-green-600 hover:bg-green-700 text-white rounded-full h-10 w-10 shrink-0"
                    onClick={handleSendMessage}
                    disabled={sending}
                 >
                    <Send className="w-4 h-4" />
                 </Button>
              </div>
           </div>

           {/* Right: Info Sidebar */}
           <div className="w-[320px] bg-white dark:bg-[#1e293b] overflow-y-auto p-4 space-y-6 border-l border-slate-200 dark:border-slate-800">
              
              {/* Status Info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Status do Lead</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                          <span className="text-xs text-slate-500 block mb-1">Status</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                             {leadStatus || 'Ativo'}
                          </span>
                      </div>
                      <div>
                          <span className="text-xs text-slate-500 block mb-1">Temperatura</span>
                          <Select value={currentLeadTemp} onValueChange={handleTempChange}>
                              <SelectTrigger className="h-7 text-xs bg-white dark:bg-slate-800">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="frio">❄️ Frio</SelectItem>
                                  <SelectItem value="morno">☕ Morno</SelectItem>
                                  <SelectItem value="quente">🔥 Quente</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
              </div>

              {/* Responsible */}
              <div className="space-y-2">
                 <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Responsável</h4>
                 <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback>R</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{deal.responsible?.name || 'Não atribuído'}</span>
                 </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2">
                 <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Histórico</h4>
                 <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                        <span>Criado em:</span>
                        <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                    </div>
                     {convertedAt && (
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                            <span>Convertido em:</span>
                            <span>{new Date(convertedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                    {lostAt && (
                        <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                            <span>Perdido em:</span>
                            <span>{new Date(lostAt).toLocaleDateString()}</span>
                        </div>
                    )}
                 </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                 <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Notas Internas</h4>
                 <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800/30 min-h-[100px]">
                    {deal.notes || contact.notes || "Nenhuma nota adicionada."}
                 </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                 <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                    Tags <Button variant="ghost" size="sm" className="h-4 w-4 p-0"><Tag className="w-3 h-3" /></Button>
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {(contact.tags || []).map((tag, i) => (
                       <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border-0">
                          {tag}
                       </Badge>
                    ))}
                 </div>
              </div>

           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealDetailsModal;