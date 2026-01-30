import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Edit, Trash2, Plus, Download, FileText, Users, MessageSquare, Award, BookOpen, Folder, File, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { AddRecordedLessonDialog } from '@/components/AddRecordedLessonDialog';
import { EditRecordedLessonDialog } from '@/components/EditRecordedLessonDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Sub-components for the new panel ---

const ContentTab = ({ course, user }) => {
    const { toast } = useToast();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [lessonToEdit, setLessonToEdit] = useState(null);
    const [isAddLessonOpen, setAddLessonOpen] = useState(false);
    const [isEditLessonOpen, setEditLessonOpen] = useState(false);

    const fetchRecordedLessons = useCallback(async () => {
        setLoading(true);
        let query = supabase
          .from('course_modules')
          .select(`*, recorded_lessons!inner(*)`)
          .eq('course_id', course.id)
          .order('order_index', { ascending: true })
          .order('created_at', { foreignTable: 'recorded_lessons', ascending: true });

        const { data: modulesData, error: modulesError } = await query;

        if (modulesError && modulesError.code !== 'PGRST116') { // Ignore no rows error
          toast({ variant: 'destructive', title: 'Erro ao buscar aulas.', description: modulesError.message });
          setLoading(false); return;
        }

        const modulesWithLessons = modulesData ? modulesData.filter(module => module.recorded_lessons.length > 0 || user.role !== 'ALUNO') : [];
        setModules(modulesWithLessons);
        setLoading(false);
    }, [course.id, user.role, toast]);
  
    useEffect(() => { fetchRecordedLessons(); }, [fetchRecordedLessons]);

    const heroLesson = useMemo(() => {
        if (loading || modules.length === 0) return null;
        const allLessons = modules.flatMap(m => m.recorded_lessons);
        const highlighted = allLessons.find(l => l.highlight);
        return highlighted || allLessons[0] || null;
    }, [modules, loading]);

    const handleOpenModal = (lesson) => { setCurrentLesson(lesson); setModalOpen(true); };
    const handleEditClick = (e, lesson) => { e.stopPropagation(); setLessonToEdit(lesson); setEditLessonOpen(true); };
    const getPathFromUrl = (url) => { try { const urlObj = new URL(url); return urlObj.pathname.split('/').slice(2).join('/'); } catch(e) { return null; } };

    const handleDeleteLesson = async (e, lesson) => {
        e.stopPropagation();
        if(lesson.thumbnail_url) { const path = getPathFromUrl(lesson.thumbnail_url); if(path) await supabase.storage.from('lesson_thumbnails').remove([path]); }
        if(lesson.video_provider === 'supabase' && lesson.video_url) { const path = getPathFromUrl(lesson.video_url); if(path) await supabase.storage.from('recorded_videos').remove([path]); }
        
        const { error } = await supabase.from('recorded_lessons').delete().eq('id', lesson.id);
        if (error) toast({ variant: 'destructive', title: 'Erro ao excluir aula', description: error.message });
        else { toast({ title: 'Aula excluída com sucesso!' }); fetchRecordedLessons(); }
    };
    
    // --- Netflix Style Layout Components ---
    const LevelBadge = ({ level }) => ( <span className="inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-black/10">{level}</span> );
    const Card = ({ lesson, onOpen }) => (
        <div className="group relative aspect-video w-64 flex-shrink-0 text-left transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-violet-400">
            <button onClick={() => onOpen(lesson)} className="w-full h-full block rounded-xl overflow-hidden bg-zinc-800 shadow">
                <img src={lesson.thumbnail_url || 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop'} alt={lesson.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                    <h4 className="line-clamp-1 text-sm font-semibold text-white drop-shadow">{lesson.title}</h4>
                    <LevelBadge level={lesson.level} />
                </div>
            </button>
            {(user.role === 'ADMIN' || user.role === 'PROFESSOR') && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70" onClick={(e) => handleEditClick(e, lesson)}><Edit className="w-3 h-3 text-white" /></Button>
                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70" onClick={(e) => e.stopPropagation()}><Trash2 className="w-3 h-3 text-red-400" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir a aula "{lesson.title}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={(e) => handleDeleteLesson(e, lesson)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </div>
            )}
        </div>
    );
    const Row = ({ title, lessons, onOpen }) => (
      <section className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        <div className="flex snap-x gap-4 overflow-x-auto pb-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{lessons.map((l) => ( <div key={l.id} className="snap-start"><Card lesson={l} onOpen={onOpen} /></div> ))}</div>
      </section>
    );
    const Hero = ({ lesson, onOpen }) => (
      <div className="relative mb-10 overflow-hidden rounded-3xl">
        <div className="aspect-[16/6] w-full bg-zinc-900 sm:aspect-[16/7] md:aspect-[16/6] lg:aspect-[16/5]"><img src={lesson.thumbnail_url || 'https://images.unsplash.com/photo-1614452320437-e7de215a721b'} alt={lesson.title} className="h-full w-full object-cover" /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3">
          <div className="flex items-center gap-2"><LevelBadge level={lesson.level} /><span className="text-xs font-medium uppercase tracking-wide text-white/80">Aula em destaque</span></div>
          <h2 className="max-w-3xl text-3xl font-extrabold text-white drop-shadow md:text-4xl lg:text-5xl">{lesson.title}</h2>
          {lesson.description && <p className="max-w-2xl text-sm text-white/85 md:text-base">{lesson.description}</p>}
          <div className="mt-1"><Button onClick={() => onOpen(lesson)} className="bg-violet-500 hover:bg-violet-600">▶ Assistir agora</Button></div>
        </div>
      </div>
    );
    
    return (
        <div className="w-full bg-slate-50 dark:bg-zinc-900 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
            {(user.role === 'ADMIN' || user.role === 'PROFESSOR') && (
                <header className="mb-6 flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button onClick={() => setAddLessonOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova Aula</Button>
                    </div>
                </header>
            )}
            
            <AddRecordedLessonDialog isOpen={isAddLessonOpen} onClose={() => setAddLessonOpen(false)} courseId={course.id} onLessonAdded={fetchRecordedLessons} />
            {lessonToEdit && <EditRecordedLessonDialog isOpen={isEditLessonOpen} onClose={() => { setEditLessonOpen(false); setLessonToEdit(null); }} lesson={lessonToEdit} onLessonUpdated={fetchRecordedLessons} />}

            {loading ? <p className="text-center text-slate-500 dark:text-zinc-400">Carregando aulas...</p> : (
                <>
                    {heroLesson && <Hero lesson={heroLesson} onOpen={handleOpenModal} />}
                    {modules.map((mod) => ( <Row key={mod.name} title={mod.name} lessons={mod.recorded_lessons} onOpen={handleOpenModal} /> ))}
                    {(modules.length === 0) && ( <div className="text-center py-20"><h2 className="text-xl font-semibold text-slate-700 dark:text-zinc-300">Nenhuma aula gravada ainda</h2><p className="text-slate-500 dark:text-zinc-400 mt-2">Adicione a primeira aula para começar.</p></div> )}
                </>
            )}
            <VideoModal open={modalOpen} onClose={() => setModalOpen(false)} lesson={currentLesson} />
        </div>
    );
}

const TurmasTab = ({ course, user }) => {
    const { toast } = useToast();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClassrooms = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('classrooms').select('*, teacher:teacher_id(name), classroom_students(count)').eq('id', course.id);
        if(error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar turmas' });
        } else {
            setClassrooms(data);
        }
        setLoading(false);
    }, [toast, course.id]);

    useEffect(() => { fetchClassrooms(); }, [fetchClassrooms]);

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Gerenciamento de Turmas</h2>
        <div className="space-y-4">
        {loading ? <p>Carregando...</p> : classrooms.map(c => (
            <div key={c.id} className="p-4 border rounded-lg flex justify-between items-center bg-white dark:bg-slate-800">
                <div>
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-sm text-slate-500">Professor: {c.teacher?.name || 'N/A'} | Alunos: {c.classroom_students[0]?.count || 0}</p>
                </div>
                <Button>Gerenciar</Button>
            </div>
        ))}
        </div>
      </div>
    );
};

const UsuariosTab = ({ course, user }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState({});
    const { toast } = useToast();

    useEffect(() => {
        const fetchStudentsAndProgress = async () => {
            setLoading(true);
            const { data: studentsData, error: studentsError } = await supabase.from('classroom_students').select('profiles(*)').eq('classroom_id', course.id);
            if (studentsError) toast({ variant: 'destructive', title: 'Erro ao buscar alunos' });
            else {
                const studentList = studentsData.map(s => s.profiles).filter(Boolean);
                setStudents(studentList);
                const studentIds = studentList.map(s => s.id);
                if (studentIds.length > 0) {
                    const { data: progressData, error: progressError } = await supabase.from('progress').select('user_id, percent').in('user_id', studentIds).eq('course_id', course.id);
                    if (progressError) toast({ variant: 'destructive', title: 'Erro ao buscar progresso' });
                    else {
                        const progressMap = progressData.reduce((acc, p) => { acc[p.user_id] = p.percent; return acc; }, {});
                        setProgress(progressMap);
                    }
                }
            }
            setLoading(false);
        };
        fetchStudentsAndProgress();
    }, [course.id, toast]);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Alunos da Turma: {course.name}</h2>
            <div className="space-y-4">
            {loading ? <p>Carregando...</p> : students.map(s => (
                <div key={s.id} className="p-4 border rounded-lg flex justify-between items-center bg-white dark:bg-slate-800">
                    <div><h3 className="font-bold">{s.name}</h3><p className="text-sm text-slate-500">{s.email}</p></div>
                    <div><p className="font-semibold">Progresso: {progress[s.id] || 0}%</p></div>
                </div>
            ))}
            </div>
        </div>
    );
}

const ComentariosTab = ({ course, user }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchComments = async () => {
            setLoading(true);
            const { data: modules, error: modulesError } = await supabase.from('course_modules').select('id').eq('course_id', course.id);
            if (modulesError) { toast({ variant: 'destructive', title: 'Erro ao buscar módulos' }); setLoading(false); return; }
            const moduleIds = modules.map(m => m.id);
            if(moduleIds.length === 0) { setLoading(false); setComments([]); return; }
            const { data: moduleLessons, error: moduleLessonsError } = await supabase.from('recorded_lessons').select('id').in('module_id', moduleIds);
            if(moduleLessonsError) { toast({ variant: 'destructive', title: 'Erro ao buscar aulas' }); setLoading(false); return; }
            const lessonIds = moduleLessons.map(l => l.id);
            if(lessonIds.length > 0) {
                 const { data, error } = await supabase.from('comments').select('*, user:user_id(name), lesson:lesson_id(title)').in('lesson_id', lessonIds).order('created_at', { ascending: false });
                if (error) toast({ variant: 'destructive', title: 'Erro ao buscar comentários' }); else setComments(data);
            }
            setLoading(false);
        };
        fetchComments();
    }, [course.id, toast]);

    const handleUpdateComment = async (commentId, newStatus) => {
        const { error } = await supabase.from('comments').update({ status: newStatus }).eq('id', commentId);
        if(error) toast({ variant: 'destructive', title: 'Erro ao atualizar comentário' });
        else {
            toast({title: 'Comentário atualizado!'});
            setComments(prev => prev.map(c => c.id === commentId ? {...c, status: newStatus} : c));
        }
    };
    
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Comentários</h2>
            <div className="space-y-4">
                {loading ? <p>Carregando...</p> : comments.map(c => (
                    <div key={c.id} className="p-4 border rounded-lg bg-white dark:bg-slate-800">
                        <div className="flex justify-between items-start">
                             <div><p><strong>{c.user.name}</strong> em <strong>{c.lesson.title}</strong> <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString('pt-BR')}</span></p><p className="mt-2">{c.content}</p></div>
                             <div><span className={`px-2 py-1 text-xs rounded-full ${c.status === 'visible' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{c.status}</span></div>
                        </div>
                        {(user.role === 'ADMIN' || user.role === 'PROFESSOR') && (
                            <div className="flex gap-2 mt-2"><Button size="sm" variant="outline" onClick={() => handleUpdateComment(c.id, c.status === 'visible' ? 'hidden' : 'visible')}>{c.status === 'visible' ? 'Ocultar' : 'Aprovar'}</Button><Button size="sm" variant="destructive" onClick={() => handleUpdateComment(c.id, 'deleted')}>Excluir</Button></div>
                        )}
                    </div>
                ))}
                {!loading && comments.length === 0 && <p>Nenhum comentário encontrado.</p>}
            </div>
        </div>
    );
};

const CertificadosTab = ({ course, user }) => {
    const { toast } = useToast();
    const handleGenerateCertificate = () => toast({ title: "🚧 Funcionalidade em desenvolvimento", description: "A geração de certificados será implementada em breve!" });
    return (
        <div className="p-6 text-center"><Award className="mx-auto h-16 w-16 text-yellow-500 mb-4" /><h2 className="text-2xl font-bold mb-4">Certificados</h2><p className="mb-6 text-slate-600">Gere e gerencie os certificados de conclusão dos alunos.</p><Button onClick={handleGenerateCertificate}>Gerar Certificados para Alunos Elegíveis</Button></div>
    );
};

const CoursePanel = ({ course, onBack, user }) => {
  const [activeTab, setActiveTab] = useState('content');
  const tabs = [{ id: 'content', label: 'Conteúdo' },{ id: 'turmas', label: 'Turmas' },{ id: 'usuarios', label: 'Usuários' },{ id: 'comentarios', label: 'Comentários' },{ id: 'certificados', label: 'Certificados' }];
  const renderTabContent = () => {
    switch (activeTab) {
      case 'content': return <ContentTab course={course} user={user} />;
      case 'turmas': return <TurmasTab course={course} user={user} />;
      case 'usuarios': return <UsuariosTab course={course} user={user} />;
      case 'comentarios': return <ComentariosTab course={course} user={user} />;
      case 'certificados': return <CertificadosTab course={course} user={user} />;
      default: return <ContentTab course={course} user={user} />;
    }
  };
  
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 min-h-screen">
        <div className="p-6 border-b bg-white dark:bg-slate-800">
            <Button onClick={onBack} variant="outline" className="mb-4">Voltar para Cursos</Button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{course.name}</h1>
            <p className="text-slate-500">Gerencie todos os aspectos do seu curso.</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="px-6 border-b bg-white dark:bg-slate-800 justify-start rounded-none"><div className="flex space-x-4">{tabs.map(tab => (<TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">{tab.label}</TabsTrigger>))}</div></TabsList>
            <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>{renderTabContent()}</motion.div></AnimatePresence>
        </Tabs>
    </div>
  );
};

const Courses = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      let query;
      if (user.role === 'ADMIN' || user.role === 'PROFESSOR') query = supabase.from('classrooms').select('*');
      else query = supabase.from('classroom_students').select('classrooms(*)').eq('student_id', user.id);
      
      const { data, error } = await query;
      if (error) { toast({variant: 'destructive', title: 'Erro ao buscar cursos'}); setCourses([]); } 
      else { setCourses(user.role === 'ALUNO' ? data.map(item => item.classrooms).filter(Boolean) : data); }
      setLoading(false);
    };
    fetchCourses();
  }, [user, toast]);
  
  if (selectedCourse) {
      if (user.role === 'ALUNO') {
          return <ContentTab course={selectedCourse} user={user} onBack={() => setSelectedCourse(null)} />;
      }
      return <CoursePanel course={selectedCourse} onBack={() => setSelectedCourse(null)} user={user} />;
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8"><h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Meus Cursos</h1><p className="text-slate-600 dark:text-slate-400">Explore e gerencie seus cursos e aulas gravadas de francês.</p></motion.div>
      {loading ? <p>Carregando cursos...</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses.map((course, index) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">{course.name}</h3><p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Nível: {course.level}</p>
                 <Button className="w-full" onClick={() => setSelectedCourse(course)}>{user.role === 'ALUNO' ? 'Acessar Aulas' : 'Gerenciar Curso'} <ChevronRight className="ml-2 w-4 h-4" /></Button>
              </div>
            </motion.div>
          ))}
           {courses.length === 0 && <p className="col-span-full text-center text-slate-500">Você não está associado a nenhum curso ainda.</p>}
        </div>
      )}
    </div>
  );
};

const VideoModal = ({ open, onClose, lesson }) => {
    const [materials, setMaterials] = useState({ aula: [], exercicio: [], adicional: [] });
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    useEffect(() => {
        if (!open || !lesson) return;
        const fetchMaterials = async () => {
            setLoadingMaterials(true);
            const { data, error } = await supabase.from('recorded_lesson_materials').select('materials(*)').eq('lesson_id', lesson.id);
            if (error) console.error("Error fetching materials:", error);
            else {
                const categorized = { aula: [], exercicio: [], adicional: [] };
                data.forEach(item => {
                    if (item.materials && categorized[item.materials.category]) {
                        categorized[item.materials.category].push(item.materials);
                    }
                });
                setMaterials(categorized);
            }
            setLoadingMaterials(false);
        };
        fetchMaterials();
    }, [open, lesson]);

    const embedUrl = useMemo(() => {
        if (!lesson?.video_url) return null;
        const getYouTubeID = (url) => { if (!url) return null; let id = null; try { const urlObj = new URL(url); if (urlObj.hostname === 'youtu.be') id = urlObj.pathname.slice(1); else if (urlObj.hostname.includes('youtube.com')) { if (urlObj.pathname === '/watch') id = urlObj.searchParams.get('v'); else if (urlObj.pathname.startsWith('/embed/')) id = urlObj.pathname.split('/')[2]; else if (urlObj.pathname.startsWith('/live/')) id = urlObj.pathname.split('/')[2]; } } catch (e) { const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/; const match = url.match(regex); if (match) id = match[1]; } return id && id.length === 11 ? id.split('?')[0].split('&')[0] : null; };
        const getGoogleDriveID = (url) => { if (!url) return null; const regex = /(?:https?:\/\/)?drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/; const match = url.match(regex); return match ? match[1] : null; };
        if (lesson.video_provider === 'youtube') { const youtubeID = getYouTubeID(lesson.video_url); return youtubeID ? `https://www.youtube.com/embed/${youtubeID}` : null; }
        if (lesson.video_provider === 'drive') { const driveID = getGoogleDriveID(lesson.video_url); if (lesson.video_url.includes("/preview")) return lesson.video_url; return driveID ? `https://drive.google.com/file/d/${driveID}/preview` : null; }
        if (lesson.video_provider === 'supabase') return lesson.video_url;
        return lesson.video_url;
    }, [lesson]);

    const MaterialSection = ({ title, icon, items }) => (
        items.length > 0 && (
            <div className="mb-6">
                <h4 className="flex items-center text-md font-semibold text-zinc-300 mb-3">{icon} {title}</h4>
                <div className="space-y-2">
                    {items.map(mat => (
                        <a key={mat.id} href={mat.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                            <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-violet-400" /><span className="text-white truncate">{mat.title}</span></div>
                            <Download className="w-5 h-5 text-zinc-400" />
                        </a>
                    ))}
                </div>
            </div>
        )
    );

    if (!open || !lesson) return null;
    
    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
            <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <Tabs defaultValue="video" className="w-full">
                    <div className="aspect-video w-full bg-black">
                        <TabsContent value="video" className="h-full w-full">{lesson.video_provider === 'supabase' ? ( <video controls autoPlay className="h-full w-full" src={embedUrl}>Video not supported.</video> ) : ( <iframe className="h-full w-full" src={embedUrl} title={lesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> )}</TabsContent>
                        <TabsContent value="materials" className="h-full w-full p-6 overflow-y-auto">
                            <h3 className="text-xl font-semibold text-white mb-6">Materiais da Aula</h3>
                            {loadingMaterials ? <p className="text-zinc-400">Carregando...</p> : (
                                (materials.aula.length > 0 || materials.exercicio.length > 0 || materials.adicional.length > 0) ? (
                                    <>
                                        <MaterialSection title="Material Principal" icon={<Folder className="mr-2 h-5 w-5" />} items={materials.aula} />
                                        <MaterialSection title="Exercícios" icon={<Activity className="mr-2 h-5 w-5" />} items={materials.exercicio} />
                                        <MaterialSection title="Material Adicional" icon={<File className="mr-2 h-5 w-5" />} items={materials.adicional} />
                                    </>
                                ) : <p className="text-zinc-400">Nenhum material disponível para esta aula.</p>
                            )}
                        </TabsContent>
                    </div>
                    <div className="flex items-start justify-between gap-4 p-4 bg-zinc-900/80 backdrop-blur-sm">
                        <div><h4 className="text-xl font-semibold text-white">{lesson.title}</h4>{lesson.description && <p className="mt-1 max-w-3xl text-sm text-zinc-300">{lesson.description}</p>}</div>
                        <div className="flex flex-col items-end gap-2"><TabsList><TabsTrigger value="video">Vídeo</TabsTrigger><TabsTrigger value="materials">Materiais</TabsTrigger></TabsList><Button onClick={onClose} variant="secondary">Fechar</Button></div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default Courses;