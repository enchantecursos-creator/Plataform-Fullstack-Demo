import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, MoreHorizontal, User as UserIcon, Flame, AlertCircle } from 'lucide-react';
import { formatCurrency, formatWhatsAppNumber } from '@/lib/crmUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const KanbanCard = ({ deal, index, onClick }) => {
  // Use profile data if available, fallback to legacy crm_contacts data
  const profile = deal.contact_profile || {};
  const contact = deal.crm_contacts || {};
  
  const displayName = profile.name || contact.name || 'Sem nome';
  const displayPhoto = profile.photo_url || contact.photo_url;
  const displayWhatsapp = contact.whatsapp;
  
  const leadTemp = profile.lead_temperature || contact.lead_temperature;
  const leadStatus = profile.lead_status || contact.lead_status;
  
  // Safe helper for getting initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  // Truncate message
  const truncateMessage = (msg, length = 60) => {
    if (!msg) return '';
    if (msg.length <= length) return msg;
    return msg.substring(0, length) + '...';
  };

  const lastMessage = deal.last_message_preview || "Nenhuma mensagem recente";
  const lastMessageTime = deal.last_message_at ? new Date(deal.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  const isLost = deal.status === 'PERDIDO' || deal.loss_reason;
  const isConverted = leadStatus === 'convertido' || deal.status === 'GANHO';

  const getTempColor = (temp) => {
    switch(temp) {
      case 'quente': return 'bg-red-500 text-white';
      case 'morno': return 'bg-yellow-500 text-white';
      case 'frio': return 'bg-blue-400 text-white';
      default: return 'bg-slate-600 text-slate-300';
    }
  };

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          onClick={() => onClick(deal)}
        >
          <Card className={`
            border-0 
            ${isConverted ? 'bg-gradient-to-br from-[#1e293b] to-[#10b981]/20 border border-[#10b981]/30' : 'bg-[#1e293b]'}
            text-white 
            rounded-xl 
            shadow-lg 
            hover:shadow-2xl 
            hover:scale-[1.02] 
            transition-all 
            duration-200
            cursor-pointer
            ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-green-500 rotate-2 z-50' : ''}
          `}>
            <CardContent className="p-4 space-y-3">
              {/* Header: Avatar + Name + Time */}
              <div className="flex items-start justify-between gap-3">
                <Avatar className={`h-10 w-10 border ${isConverted ? 'border-[#10b981]' : 'border-slate-600'}`}>
                  <AvatarImage src={displayPhoto} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-semibold text-sm truncate ${isConverted ? 'text-[#10b981]' : 'text-slate-100'}`}>
                      {displayName}
                    </h4>
                    {lastMessageTime && (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {lastMessageTime}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span className="truncate">
                      {formatWhatsAppNumber(displayWhatsapp) || 'Sem número'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5">
                {leadTemp && (
                  <Badge className={`text-[10px] px-1.5 h-5 rounded-md border-0 ${getTempColor(leadTemp)} hover:${getTempColor(leadTemp)}`}>
                    <Flame className="w-3 h-3 mr-1 fill-current" /> {leadTemp}
                  </Badge>
                )}
                {leadStatus && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 h-5 border-slate-600 ${leadStatus === 'convertido' ? 'text-green-400 border-green-800 bg-green-900/20' : 'text-slate-300'}`}>
                    {leadStatus}
                  </Badge>
                )}
              </div>

              {/* Last Message Preview */}
              <div className="bg-slate-800/50 rounded-lg p-2 text-xs text-slate-300 border border-slate-700/50">
                <p className="line-clamp-2 italic">
                  "{truncateMessage(lastMessage)}"
                </p>
              </div>

              {/* Lost Reason (if applicable) */}
              {isLost && deal.loss_reason && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-[10px] text-red-400 bg-red-900/10 px-2 py-1 rounded border border-red-900/30">
                        <AlertCircle className="w-3 h-3" />
                        <span className="truncate max-w-full">Motivo: {deal.loss_reason}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Motivo da perda: {deal.loss_reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Footer: Tags/Value + Responsible */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px] px-1.5 h-5">
                    {formatCurrency(deal.value)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                   <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <UserIcon className="w-3 h-3" />
                      <span className="max-w-[60px] truncate">
                        {deal.responsible?.name || 'Admin'}
                      </span>
                   </div>
                   <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-700">
                     <MoreHorizontal className="w-4 h-4" />
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;