import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Info,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import NewClassDialog from '@/components/NewClassDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const EventDetailsDialog = ({ event, isOpen, onClose, onEdit, onDelete, user }) => {
  if (!event) return null;

  const formatTime = (date) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const canManage = user.role === 'ADMIN' || user.id === event.creator_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>{event.description || 'Sem descrição.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><Calendar className="inline w-4 h-4 mr-2" />{formatDate(event.start_time)}</p>
          <p><Clock className="inline w-4 h-4 mr-2" />{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
          <p><MapPin className="inline w-4 h-4 mr-2" />Professor: {event.creator?.name}</p>
          <p><Users className="inline w-4 h-4 mr-2" />Participantes: {event.attendees?.length || 0}</p>
        </div>
        <DialogFooter className="justify-between">
            <div>
                 {canManage && (
                    <>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(event)}>
                            <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Aula?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita. A aula será removida permanentemente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => onDelete(event.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                 )}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Fechar</Button>
                <Button onClick={() => window.open(event.meeting_link, '_blank')} disabled={!event.meeting_link}>
                    <Video className="w-4 h-4 mr-2" />Entrar na Aula
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Schedule = ({ user }) => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week, month
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewClassDialogOpen, setIsNewClassDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let query;
    if (user.role === 'ADMIN') {
        query = supabase.from('scheduled_classes').select(`*, creator:creator_id(name)`);
    } else {
        query = supabase
          .from('scheduled_classes')
          .select(`*, creator:creator_id(name)`)
          .or(`creator_id.eq.${user.id},attendees.cs.{${user.id}}`);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: "destructive", title: "Erro ao buscar aulas", description: error.message });
      setEvents([]);
    } else {
      setEvents(data);
    }
    setLoading(false);
  }, [toast, user.id, user.role]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenDetails = (event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleEditEvent = (event) => {
    setIsDetailsOpen(false);
    setEventToEdit(event);
    setIsNewClassDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    setIsDetailsOpen(false);
    const { error } = await supabase.from('scheduled_classes').delete().eq('id', eventId);
    if (error) {
        toast({ variant: "destructive", title: "Erro ao excluir aula", description: error.message });
    } else {
        toast({ title: "Aula excluída com sucesso!" });
        fetchEvents();
    }
  };

  const handleOpenNewClass = () => {
    setEventToEdit(null);
    setIsNewClassDialogOpen(true);
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) { const day = new Date(start); day.setDate(start.getDate() + i); days.push(day); }
    return days;
  };

  const getMonthGrid = () => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const days = [];
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDayOfWeek = date.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) { days.push(null); }
    for (let i = 1; i <= daysInMonth; i++) { days.push(new Date(year, month, i)); }
    return days;
  };

  const getEventsForDay = (date) => events.filter(event => new Date(event.start_time).toDateString() === date.toDateString());
  const formatTime = (date) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const weekDays = getWeekDays();
  const monthGrid = getMonthGrid();
  const today = new Date();

  return (
    <>
      <NewClassDialog 
        isOpen={isNewClassDialogOpen} 
        onClose={() => setIsNewClassDialogOpen(false)}
        user={user}
        onClassScheduled={fetchEvents}
        eventToEdit={eventToEdit}
      />
      <EventDetailsDialog 
        event={selectedEvent} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        user={user}
      />
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Agenda de Aulas</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie seus horários e aulas agendadas</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
              <Button variant="outline" size="sm" onClick={() => navigateDate(1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant={viewMode === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('week')}>Semana</Button>
              <Button variant={viewMode === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('month')}>Mês</Button>
              {(user.role === 'ADMIN' || user.role === 'PROFESSOR') && (
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" onClick={handleOpenNewClass}><Plus className="w-4 h-4 mr-2" />Nova Aula</Button>
              )}
            </div>
          </div>

          {viewMode === 'week' ? (
            <div className="grid grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isToday = day.toDateString() === today.toDateString();
                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`p-4 rounded-lg border-2 min-h-[200px] ${isToday ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'}`}>
                    <div className="text-center mb-3"><p className="text-sm font-medium text-slate-600 dark:text-slate-400">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p><p className={`text-lg font-bold ${isToday ? 'text-purple-600 dark:text-purple-400' : 'text-slate-800 dark:text-white'}`}>{day.getDate()}</p></div>
                    <div className="space-y-2">{dayEvents.map((event) => (<motion.div key={event.id} whileHover={{ scale: 1.02 }} className="p-2 rounded text-xs cursor-pointer transition-all bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" onClick={() => handleOpenDetails(event)}><p className="font-medium truncate">{event.title}</p><p className="opacity-75">{formatTime(event.start_time)}</p></motion.div>))}</div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center font-bold text-sm p-2 text-slate-600 dark:text-slate-400">{day}</div>)}
              {monthGrid.map((day, index) => {
                if (!day) return <div key={index} className="border-t border-slate-200 dark:border-slate-700"></div>;
                const dayEvents = getEventsForDay(day);
                const isToday = day.toDateString() === today.toDateString();
                return (
                  <div key={index} className={`border-t border-slate-200 dark:border-slate-700 p-2 min-h-[120px] ${isToday ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                    <p className={`text-sm font-bold text-right ${isToday ? 'text-purple-600' : 'text-slate-800 dark:text-white'}`}>{day.getDate()}</p>
                    <div className="space-y-1 mt-1">{dayEvents.map(event => <div key={event.id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs p-1 rounded truncate cursor-pointer" onClick={() => handleOpenDetails(event)}>{event.title}</div>)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center"><Clock className="w-5 h-5 mr-2 text-purple-500" />Próximas Aulas</h2>
          <div className="space-y-4">
            {loading ? <p>Carregando...</p> : events.filter(e => new Date(e.start_time) > new Date()).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, 3).map((event, index) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                <div className="flex-1"><div className="flex items-center space-x-3 mb-2"><h3 className="font-medium text-slate-800 dark:text-white">{event.title}</h3><span className={`px-2 py-1 text-xs font-medium rounded ${event.class_type === 'private_class' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{event.class_type === 'private_class' ? 'Particular' : 'Grupo'}</span></div><div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400"><span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{new Date(event.start_time).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span><span className="flex items-center"><Clock className="w-4 h-4 mr-1" />{formatTime(event.start_time)}</span><span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{event.creator?.name}</span></div></div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(event)}><Info className="w-4 h-4" /></Button>
                   {(user.role === 'ADMIN' || user.id === event.creator_id) && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}><Edit className="w-4 h-4 text-blue-500" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Excluir Aula?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. A aula será removida permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDeleteEvent(event.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500" onClick={() => window.open(event.meeting_link, '_blank')} disabled={!event.meeting_link}><Video className="w-4 h-4 mr-1" />Entrar</Button>
                </div>
              </motion.div>
            ))}
            {!loading && events.filter(e => new Date(e.start_time) > new Date()).length === 0 && <p>Nenhuma aula futura agendada.</p>}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Schedule;