import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const NewClassDialog = ({ isOpen, onClose, user, onClassScheduled, eventToEdit }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time_str: '',
    end_time_str: '',
    class_type: 'group_class',
    attendees: [],
    meeting_link: '',
  });
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    now.setHours(now.getHours() + 1);
    const endTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

    setFormData({
      title: '',
      description: '',
      date: today,
      start_time_str: startTime,
      end_time_str: endTime,
      class_type: 'group_class',
      attendees: [],
      meeting_link: '',
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        const startDate = new Date(eventToEdit.start_time);
        const endDate = new Date(eventToEdit.end_time);
        
        const localStartDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
        const localEndDate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);

        setFormData({
          title: eventToEdit.title,
          description: eventToEdit.description || '',
          date: localStartDate.toISOString().split('T')[0],
          start_time_str: localStartDate.toTimeString().slice(0, 5),
          end_time_str: localEndDate.toTimeString().slice(0, 5),
          class_type: eventToEdit.class_type,
          attendees: eventToEdit.attendees || [],
          meeting_link: eventToEdit.meeting_link || '',
        });
      } else {
        resetForm();
      }

      const fetchStudents = async () => {
        let query = supabase.from('profiles').select('id, name').eq('role', 'ALUNO');
        if (user.role === 'PROFESSOR') {
          query = query.eq('teacher_id', user.id);
        }
        const { data, error } = await query;
        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao buscar alunos' });
        } else {
          setStudents(data);
        }
      };

      fetchStudents();
    }
  }, [isOpen, eventToEdit, resetForm, user, toast]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleMultiSelectChange = (e) => {
    const { options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setFormData((prev) => ({ ...prev, attendees: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const [startHour, startMinute] = formData.start_time_str.split(':');
    const [endHour, endMinute] = formData.end_time_str.split(':');
    
    const start_time = new Date(Date.UTC(
        new Date(formData.date).getUTCFullYear(),
        new Date(formData.date).getUTCMonth(),
        new Date(formData.date).getUTCDate(),
        Number(startHour), Number(startMinute)
    ));

    const end_time = new Date(Date.UTC(
        new Date(formData.date).getUTCFullYear(),
        new Date(formData.date).getUTCMonth(),
        new Date(formData.date).getUTCDate(),
        Number(endHour), Number(endMinute)
    ));


    if (start_time >= end_time) {
      toast({ variant: 'destructive', title: 'Horário inválido', description: 'O horário de término deve ser após o início.' });
      setIsSaving(false);
      return;
    }

    const classData = {
      title: formData.title,
      description: formData.description,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      creator_id: user.id,
      attendees: formData.class_type === 'group_class' ? formData.attendees : (formData.attendees.length > 0 ? [formData.attendees[0]] : []),
      class_type: formData.class_type,
      meeting_link: formData.meeting_link,
    };
    
    let error;
    if (eventToEdit) {
      const { error: updateError } = await supabase.from('scheduled_classes').update(classData).eq('id', eventToEdit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('scheduled_classes').insert(classData);
      error = insertError;
    }
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar aula', description: error.message });
    } else {
      toast({ title: `Aula ${eventToEdit ? 'atualizada' : 'agendada'} com sucesso!` });
      onClassScheduled();
      onClose();
    }
    setIsSaving(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Editar' : 'Agendar Nova'} Aula</DialogTitle>
          <DialogDescription>Preencha os detalhes da aula abaixo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <InputField name="title" label="Título da Aula" value={formData.title} onChange={handleInputChange} />
          <div className="grid grid-cols-3 gap-4">
            <InputField name="date" label="Data" value={formData.date} onChange={handleInputChange} type="date" />
            <InputField name="start_time_str" label="Início" value={formData.start_time_str} onChange={handleInputChange} type="time" />
            <InputField name="end_time_str" label="Fim" value={formData.end_time_str} onChange={handleInputChange} type="time" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
            <select name="class_type" value={formData.class_type} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
              <option value="group_class">Em Grupo</option>
              <option value="private_class">Particular</option>
            </select>
          </div>
          <InputField name="meeting_link" label="Link da Reunião (opcional)" value={formData.meeting_link} onChange={handleInputChange} placeholder="https://meet.google.com/..." />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {formData.class_type === 'group_class' ? 'Participantes (Alunos)' : 'Participante (Aluno)'}
            </label>
            <select 
              multiple={formData.class_type === 'group_class'} 
              name="attendees" 
              value={formData.attendees} 
              onChange={handleMultiSelectChange} 
              className="w-full h-32 p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white"
            >
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {formData.class_type === 'group_class' && <p className="text-xs text-slate-500 mt-1">Segure Ctrl (ou Cmd em Mac) para selecionar vários.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InputField = ({ name, label, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <input id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" />
  </div>
);

export default NewClassDialog;