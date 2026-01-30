import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Briefcase, Calendar, Clock, User, Users, ChevronLeft, ChevronRight, Video, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import NewClassDialog from '@/components/NewClassDialog';


const ClassDialog = ({ isOpen, onClose, onSave, classroom, teachers, students }) => {
    const [formData, setFormData] = useState({ student_ids: [] });
    const [isSaving, setIsSaving] = useState(false);
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    useEffect(() => {
        if (isOpen) {
            setFormData(classroom || {
                name: '',
                level: 'A1',
                teacher_id: '',
                start_date: '',
                end_date: '',
                schedule_details: '',
                student_ids: [],
            });
        }
    }, [isOpen, classroom]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentToggle = (studentId) => {
        setFormData(prev => {
            const student_ids = prev.student_ids || [];
            return {
                ...prev,
                student_ids: student_ids.includes(studentId)
                    ? student_ids.filter(id => id !== studentId)
                    : [...student_ids, studentId]
            };
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900">
                <DialogHeader><DialogTitle className="text-slate-800 dark:text-white">{classroom?.id ? 'Editar' : 'Nova'} Turma</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    <input name="name" placeholder="Nome da Turma" value={formData.name || ''} onChange={handleInputChange} className="col-span-2 w-full p-2 border rounded bg-transparent" />
                    <select name="level" value={formData.level || 'A1'} onChange={handleInputChange} className="w-full p-2 border rounded bg-transparent"><option value="">Selecione um Nível</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select>
                    <select name="teacher_id" value={formData.teacher_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded bg-transparent"><option value="">Selecione um Professor</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                    <input name="start_date" type="date" value={formData.start_date || ''} onChange={handleInputChange} className="w-full p-2 border rounded bg-transparent" />
                    <input name="end_date" type="date" value={formData.end_date || ''} onChange={handleInputChange} className="w-full p-2 border rounded bg-transparent" />
                    <textarea name="schedule_details" placeholder="Detalhes (ex: Seg/Qua 19h-21h)" value={formData.schedule_details || ''} onChange={handleInputChange} className="col-span-2 w-full p-2 border rounded bg-transparent" />
                </div>
                <h3 className="font-medium text-slate-800 dark:text-white">Alunos</h3>
                <div className="max-h-48 overflow-y-auto border rounded p-2">
                    {students.map(s => (
                        <div key={s.id} className="flex items-center text-slate-800 dark:text-white"><input type="checkbox" checked={formData.student_ids?.includes(s.id)} onChange={() => handleStudentToggle(s.id)} className="mr-2" />{s.name}</div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AllClassesView = ({ user }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list or calendar
    const [currentDate, setCurrentDate] = useState(new Date());
    const { toast } = useToast();
    const [isNewClassDialogOpen, setIsNewClassDialogOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState(null);

    const fetchAllClasses = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('scheduled_classes').select('*, creator:creator_id(id, name)');
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar aulas', description: error.message });
        } else {
            setEvents(data);
        }
        setLoading(false);
    }, [toast]);
    
    useEffect(() => {
        fetchAllClasses();
    }, [fetchAllClasses]);

    const handleEditEvent = (event) => {
        setEventToEdit(event);
        setIsNewClassDialogOpen(true);
    };

    const handleDeleteEvent = async (eventId) => {
        const { error } = await supabase.from('scheduled_classes').delete().eq('id', eventId);
        if (error) {
            toast({ variant: "destructive", title: "Erro ao excluir aula", description: error.message });
        } else {
            toast({ title: "Aula excluída com sucesso!" });
            fetchAllClasses();
        }
    };
    
    const formatTime = (date) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR');
    const navigateDate = (direction) => {
        const newDate = new Date(currentDate);
        if (view === 'list') newDate.setDate(newDate.getDate() + direction);
        else newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
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

    return (
        <div className="p-6 space-y-6">
             <NewClassDialog 
                isOpen={isNewClassDialogOpen} 
                onClose={() => setIsNewClassDialogOpen(false)}
                user={user}
                onClassScheduled={fetchAllClasses}
                eventToEdit={eventToEdit}
            />
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border">
                <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                        <Button variant="outline" size="icon" onClick={() => navigateDate(1)}><ChevronRight className="w-4 h-4" /></Button>
                     </div>
                     <div className="flex gap-2">
                        <Button variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>Lista</Button>
                        <Button variant={view === 'calendar' ? 'default' : 'outline'} onClick={() => setView('calendar')}>Calendário</Button>
                        <Button onClick={() => { setEventToEdit(null); setIsNewClassDialogOpen(true); }}><PlusCircle className="w-4 h-4 mr-2" />Nova Aula</Button>
                     </div>
                </div>
                {loading ? <p>Carregando aulas...</p> : (
                    <>
                    {view === 'list' ? (
                        <div className="space-y-2">
                            {events.sort((a,b) => new Date(a.start_time) - new Date(b.start_time)).map(e => (
                                <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">{e.title}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400"><User className="inline w-4 h-4 mr-1"/>Professor: {e.creator?.name || 'N/A'}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400"><Calendar className="inline w-4 h-4 mr-1"/>{formatDate(e.start_time)} <Clock className="inline w-4 h-4 ml-2 mr-1"/>{formatTime(e.start_time)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="font-semibold capitalize text-slate-800 dark:text-white">{e.class_type?.replace('_', ' ')}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400"><Users className="inline w-4 h-4 mr-1"/>{e.attendees?.length || 0} participantes</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditEvent(e)}><Edit className="w-4 h-4 text-blue-500" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Excluir Aula?</AlertDialogTitle><AlertDialogDescription>A aula será removida permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDeleteEvent(e.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                         <Button size="sm" onClick={() => window.open(e.meeting_link, '_blank')} disabled={!e.meeting_link}><Video className="w-4 h-4 mr-1" />Entrar</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center font-bold text-sm p-2 text-slate-600 dark:text-slate-400">{day}</div>)}
                            {getMonthGrid().map((day, index) => {
                                if (!day) return <div key={index} className="border-t border-slate-200 dark:border-slate-700"></div>;
                                const dayEvents = getEventsForDay(day);
                                const isToday = day.toDateString() === new Date().toDateString();
                                return (
                                <div key={index} className={`border-t border-slate-200 dark:border-slate-700 p-2 min-h-[120px] ${isToday ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                                    <p className={`text-sm font-bold text-right ${isToday ? 'text-purple-600' : 'text-slate-800 dark:text-white'}`}>{day.getDate()}</p>
                                    <div className="space-y-1 mt-1">{dayEvents.map(event => <div key={event.id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs p-1 rounded truncate cursor-pointer" title={`${event.title} - ${event.creator.name}`}>{event.title}</div>)}</div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                    </>
                )}
            </motion.div>
        </div>
    );
};


const AdminClasses = ({ user, isAllClassesView = false }) => {
    const [classrooms, setClassrooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: classroomsData, error: classroomsError } = await supabase.from('classrooms').select('*, teacher:teacher_id(name), classroom_students(student_id)');
        if (classroomsError) toast({ variant: 'destructive', title: 'Erro ao buscar turmas', description: classroomsError.message });
        else setClassrooms(classroomsData.map(c => ({...c, student_ids: c.classroom_students.map(cs => cs.student_id)})));

        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, name, role').in('role', ['PROFESSOR', 'ALUNO']);
        if (profilesError) toast({ variant: 'destructive', title: 'Erro ao buscar usuários', description: profilesError.message });
        else {
            setTeachers(profilesData.filter(p => p.role === 'PROFESSOR'));
            setStudents(profilesData.filter(p => p.role === 'ALUNO'));
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => { if (!isAllClassesView) fetchData(); }, [fetchData, isAllClassesView]);

    if (isAllClassesView) {
        return <AllClassesView user={user} />;
    }

    const handleSaveClassroom = async (formData) => {
        const { student_ids, teacher, classroom_students, ...upsertData } = formData;
        const isEditing = !!upsertData.id;
    
        const { data: savedClass, error } = await supabase.from('classrooms').upsert(upsertData).select().single();
        
        if (error) {
            toast({ variant: "destructive", title: "Erro ao salvar turma", description: error.message });
            return;
        }

        const { error: deleteError } = await supabase.from('classroom_students').delete().eq('classroom_id', savedClass.id);
        if(deleteError) {
             toast({ variant: "destructive", title: "Erro ao atualizar alunos da turma", description: deleteError.message });
        }

        if (student_ids && student_ids.length > 0) {
            const studentLinks = student_ids.map(sid => ({ classroom_id: savedClass.id, student_id: sid }));
            const { error: studentError } = await supabase.from('classroom_students').insert(studentLinks);
            if (studentError) {
                toast({ variant: "destructive", title: "Erro ao associar alunos", description: studentError.message });
                return;
            }
        }
        toast({ title: `Turma ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
        fetchData();
        setIsDialogOpen(false);
    };

    const handleDeleteClassroom = async (classroomId) => {
        await supabase.from('classroom_students').delete().eq('classroom_id', classroomId);
        const { error } = await supabase.from('classrooms').delete().eq('id', classroomId);
        if (error) toast({ variant: "destructive", title: "Erro ao excluir turma", description: error.message });
        else { toast({ title: 'Turma excluída com sucesso!' }); fetchData(); }
    };
    
    const openDialog = (classroom = null) => {
        setSelectedClassroom(classroom);
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gerenciar Turmas</h2>
                    <Button onClick={() => openDialog(null)}><PlusCircle className="w-4 h-4 mr-2" />Nova Turma</Button>
                </div>
                {loading ? <p>Carregando turmas...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classrooms.map(c => (
                            <div key={c.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border">
                                <h3 className="font-bold text-lg flex items-center text-slate-800 dark:text-white"><Briefcase className="w-5 h-5 mr-2" />{c.name}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Nível: {c.level}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Professor: {c.teacher?.name || 'Não definido'}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Alunos: {c.student_ids?.length || 0}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Período: {c.start_date} a {c.end_date}</p>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="ghost" size="sm" onClick={() => openDialog(c)}><Edit className="w-4 h-4" /></Button>
                                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir Turma?</AlertDialogTitle><AlertDialogDescription>A turma será removida. Alunos e professores não serão afetados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDeleteClassroom(c.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <ClassDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveClassroom} classroom={selectedClassroom} teachers={teachers} students={students} />
            </motion.div>
        </div>
    );
};

export default AdminClasses;