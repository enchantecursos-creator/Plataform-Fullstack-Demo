import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useWhatsAppFilters = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classrooms, setClassrooms] = useState([]);
  const [professors, setProfessors] = useState([]);
  
  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Filter state
  const [filters, setFilters] = useState({
    classroom: 'all',
    paymentStatus: 'all',
    entryDateStart: '',
    entryDateEnd: '',
    searchName: '',
    professorIds: [] // Array of selected professor IDs
  });

  // Fetch Classrooms
  const fetchClassrooms = async () => {
    try {
      const { data, error } = await supabase
        .from('Classroom')
        .select('id, level')
        .order('level');
      
      if (!error && data) {
        setClassrooms(data);
      } else {
        const { data: dataLow } = await supabase.from('classrooms').select('id, name');
        if (dataLow) setClassrooms(dataLow);
      }
    } catch (e) {
      console.warn('Error fetching classrooms', e);
    }
  };

  // Fetch Professors
  const fetchProfessors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'PROFESSOR')
        .order('name');
        
      if (!error && data) {
        setProfessors(data);
      }
    } catch (e) {
      console.warn('Error fetching professors', e);
    }
  };

  // Main fetch function
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          whatsapp,
          email,
          created_at,
          class_id,
          teacher_id,
          teacher:teacher_id ( name ),
          classrooms:class_id ( id, name, level ),
          Invoice (
            status,
            dueDate
          )
        `)
        .eq('role', 'ALUNO')
        .not('whatsapp', 'is', null)
        .neq('whatsapp', '');

      const { data, error } = await query;

      if (error) throw error;

      // Process the data
      const processedStudents = (data || []).map(student => {
        let paymentStatus = 'paid';
        const invoices = student.Invoice || [];
        
        const now = new Date();
        const hasOverdue = invoices.some(inv => {
          if (inv.status === 'overdue') return true;
          if (inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < now) return true;
          return false;
        });

        const hasPending = invoices.some(inv => inv.status === 'pending');

        if (hasOverdue) {
          paymentStatus = 'overdue';
        } else if (hasPending) {
          paymentStatus = 'pending';
        }

        return {
          ...student,
          paymentStatus,
          cleanPhone: student.whatsapp ? student.whatsapp.replace(/\D/g, '') : '',
          teacherName: student.teacher?.name || 'Sem professor'
        };
      });

      // Sort by name
      processedStudents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setStudents(processedStudents);
      setFilteredStudents(processedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchClassrooms();
    fetchProfessors();
    fetchStudents();
  }, [fetchStudents]);

  // Apply filters
  useEffect(() => {
    let result = [...students];

    // Filter by Name
    if (filters.searchName) {
      const q = filters.searchName.toLowerCase();
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.whatsapp && s.whatsapp.includes(q))
      );
    }

    // Filter by Classroom
    if (filters.classroom && filters.classroom !== 'all') {
      result = result.filter(s => s.class_id === filters.classroom);
    }

    // Filter by Payment Status
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      result = result.filter(s => s.paymentStatus === filters.paymentStatus);
    }

    // Filter by Entry Date
    if (filters.entryDateStart) {
      const startDate = new Date(filters.entryDateStart);
      result = result.filter(s => new Date(s.created_at) >= startDate);
    }
    if (filters.entryDateEnd) {
      const endDate = new Date(filters.entryDateEnd);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(s => new Date(s.created_at) <= endDate);
    }

    // Filter by Professors (Multi-select)
    if (filters.professorIds && filters.professorIds.length > 0) {
      result = result.filter(s => filters.professorIds.includes(s.teacher_id));
    }

    setFilteredStudents(result);
  }, [filters, students]);

  // Selection handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  }, [filteredStudents, selectedStudentIds]);

  const toggleStudentSelection = useCallback((studentId) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  }, []);

  const selectStudents = useCallback((ids) => {
    setSelectedStudentIds(ids);
  }, []);

  return {
    students,
    filteredStudents,
    loading,
    filters,
    setFilters,
    classrooms,
    professors,
    selectedStudentIds,
    setSelectedStudentIds,
    toggleSelectAll,
    toggleStudentSelection,
    selectStudents,
    refreshStudents: fetchStudents
  };
};