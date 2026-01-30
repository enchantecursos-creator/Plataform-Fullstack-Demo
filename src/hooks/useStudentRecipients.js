import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook to fetch student recipients for WhatsApp messaging.
 * 
 * SCHEMA DOCUMENTATION:
 * 1. Base Table: 'profiles'
 *    - We use profiles as the base because it contains the core user information (name, whatsapp, role).
 *    - We filter strictly by role='ALUNO'.
 * 
 * 2. Classroom Relationship: 'classrooms!classroom_students'
 *    - The system uses a Many-to-Many relationship between profiles and classrooms.
 *    - Junction table: 'classroom_students' (links student_id to classroom_id).
 *    - Target table: 'classrooms' (contains name, level).
 *    - Syntax 'classrooms!classroom_students' explicitly tells Supabase to join 'classrooms' 
 *      via the 'classroom_students' foreign keys.
 * 
 * 3. Teacher Relationship: 'teacher:teacher_id'
 *    - Profiles have a direct 'teacher_id' FK pointing to another profile (the teacher).
 *    - We alias this join as 'teacher' to fetch the teacher's name.
 */

export const useStudentRecipients = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter Data
  const [classrooms, setClassrooms] = useState([]);
  const [professors, setProfessors] = useState([]);

  // Filter State
  const [filters, setFilters] = useState({
    name: '',
    classId: 'all',
    teacherId: 'all',
    paymentStatus: 'all' // 'paid', 'pending', 'overdue'
  });

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  // Fetch Aux Data (Classrooms & Professors) for Dropdowns
  const fetchAuxData = useCallback(async () => {
    try {
      // Fetch Classrooms - Target table: 'classrooms'
      const { data: clsData, error: clsError } = await supabase
        .from('classrooms')
        .select('id, name, level')
        .order('name');
      
      if (!clsError && clsData) {
        setClassrooms(clsData);
      } 

      // Fetch Professors - From 'profiles' where role is PROFESSOR
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'PROFESSOR')
        .order('name');
      
      if (profData) setProfessors(profData);

    } catch (error) {
      console.error("Error fetching aux data", error);
    }
  }, []);

  // Compute Payment Status logic
  const getPaymentStatus = (invoices) => {
    if (!invoices || invoices.length === 0) return 'paid';

    const now = new Date();
    // Check for any overdue
    const hasOverdue = invoices.some(inv => {
      if (inv.status === 'overdue') return true;
      if (inv.status === 'pending' && inv.dueDate && new Date(inv.dueDate) < now) return true;
      return false;
    });
    if (hasOverdue) return 'overdue';

    // Check for pending
    const hasPending = invoices.some(inv => inv.status === 'pending');
    if (hasPending) return 'pending';

    return 'paid';
  };

  // Main Fetch Function
  const fetchStudents = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      // Fetch profiles with correct explicit joins
      // Note: We use !classroom_students to specify the exact path through the junction table
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          whatsapp,
          email,
          role,
          monthly_fee,
          teacher_id,
          classrooms!classroom_students ( id, name, level ),
          teacher:teacher_id ( name ),
          Invoice ( status, dueDate )
        `)
        .eq('role', 'ALUNO')
        .not('whatsapp', 'is', null)
        .neq('whatsapp', '');

      if (error) throw error;

      // Process Data
      const processed = data.map(s => {
        // Handle array response from M2M relationship (student might be in multiple classes, we take the first one for display)
        const primaryClass = s.classrooms?.[0];
        
        return {
          id: s.id,
          name: s.name,
          whatsapp: s.whatsapp,
          cleanPhone: s.whatsapp.replace(/\D/g, ''),
          email: s.email,
          role: s.role,
          
          // Classroom info
          class_id: primaryClass?.id || null,
          className: primaryClass?.name || primaryClass?.level || 'Sem Turma',
          
          // Teacher info
          teacher_id: s.teacher_id,
          teacherName: s.teacher?.name || 'Sem Professor',
          
          monthly_fee: s.monthly_fee,
          paymentStatus: getPaymentStatus(s.Invoice)
        };
      });

      // Sort by Name
      processed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setStudents(processed);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err.message || "Erro ao carregar alunos.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // Initial Fetch & Polling
  useEffect(() => {
    fetchAuxData();
    fetchStudents();

    // Poll every 30 seconds to keep list fresh
    const intervalId = setInterval(() => {
      fetchStudents(true); // silent fetch
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchStudents, fetchAuxData]);

  // Derived Filtered List
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Name Filter
      if (filters.name) {
        const q = filters.name.toLowerCase();
        const matchName = student.name?.toLowerCase().includes(q);
        const matchPhone = student.whatsapp?.includes(q);
        if (!matchName && !matchPhone) return false;
      }

      // Class Filter
      if (filters.classId !== 'all' && student.class_id !== filters.classId) {
        return false;
      }

      // Teacher Filter
      if (filters.teacherId !== 'all' && student.teacher_id !== filters.teacherId) {
        return false;
      }

      // Payment Filter
      if (filters.paymentStatus !== 'all' && student.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      return true;
    });
  }, [students, filters]);

  // Selection Handlers
  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => {
      const visibleIds = filteredStudents.map(s => s.id);
      // Combine existing selections with all visible ones
      const combined = new Set([...prev, ...visibleIds]);
      return Array.from(combined);
    });
  }, [filteredStudents]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Helper to check if all visible are selected
  const isAllVisibleSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every(s => selectedIds.includes(s.id));
  }, [filteredStudents, selectedIds]);

  // Return selected student objects for sending
  const getSelectedStudents = useCallback(() => {
    return students.filter(s => selectedIds.includes(s.id));
  }, [students, selectedIds]);

  return {
    students: filteredStudents,
    rawStudents: students,
    loading,
    error,
    refetch: () => fetchStudents(false),
    filters,
    setFilters,
    classrooms,
    professors,
    selectedIds,
    toggleSelection,
    selectAll,
    deselectAll,
    isAllVisibleSelected,
    getSelectedStudents,
    totalCount: students.length,
    filteredCount: filteredStudents.length
  };
};