import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Award, BookOpen, CheckCircle, Edit, PlusCircle, Trash2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export const GradeDialog = ({ isOpen, onClose, onSave, students }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    evaluation_type: 'Lição',
    evaluation_name: '',
    grade: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        student_id: '',
        evaluation_type: 'Lição',
        evaluation_name: '',
        grade: 0,
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-white">Lançar Nota</DialogTitle>
          <DialogDescription>Selecione o aluno e insira os detalhes da avaliação.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label>Aluno</label>
            <select name="student_id" value={formData.student_id} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="">Selecione um aluno</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>Tipo de Avaliação</label>
            <select name="evaluation_type" value={formData.evaluation_type} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="Lição">Lição</option>
              <option value="Prova">Prova</option>
              <option value="Participação">Participação</option>
              <option value="Trabalho">Trabalho</option>
            </select>
          </div>
          <div>
            <label>Nome da Avaliação</label>
            <input name="evaluation_name" value={formData.evaluation_name} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: Prova Módulo 1" />
          </div>
          <div>
            <label>Nota (0 a 10)</label>
            <input type="number" name="grade" value={formData.grade} onChange={handleInputChange} min="0" max="10" step="0.1" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Lançar Nota'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Grades = ({ user }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grades')
      .select('*, teacher:profiles!teacher_id(name)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao buscar notas", description: error.message });
    } else {
      setGrades(data);
    }
    setLoading(false);
  }, [toast, user.id]);

  useEffect(() => {
    if (user.role === 'ALUNO') {
      fetchGrades();
    }
  }, [fetchGrades, user.role]);

  const getGradeColor = (grade) => {
    if (grade >= 7) return 'text-green-500';
    if (grade >= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (user.role !== 'ALUNO') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p>Esta página é visível apenas para alunos.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Minhas Notas</h1>
        <p className="text-slate-600 dark:text-slate-400">Acompanhe seu desempenho e evolução no curso.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="space-y-4">
          {loading ? (
            <p>Carregando notas...</p>
          ) : grades.length > 0 ? (
            grades.map((grade, index) => (
              <motion.div
                key={grade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{grade.evaluation_name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {grade.evaluation_type} • Prof. {grade.teacher.name} • {new Date(grade.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getGradeColor(grade.grade)}`}>
                    {grade.grade.toFixed(1)}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium">Nenhuma nota lançada ainda.</h3>
              <p className="text-sm text-slate-500">Continue estudando! Suas notas aparecerão aqui.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Grades;