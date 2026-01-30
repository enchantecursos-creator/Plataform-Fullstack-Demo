import React, { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from 'framer-motion';
import { UploadCloud, X } from 'lucide-react';

const InputField = ({ name, label, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <input id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" />
  </div>
);

const SelectField = ({ name, label, children, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
            {children}
        </select>
    </div>
);

const FileUploadField = ({ label, onFileChange, file, onRemove, acceptedTypes }) => (
    <div>
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {file ? (
            <div className="flex items-center justify-between p-2 mt-1 border rounded-md bg-slate-50 dark:bg-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{file.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        ) : (
            <label className="mt-1 flex justify-center w-full px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md cursor-pointer hover:border-violet-400 dark:hover:border-violet-500">
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                        <span>Clique para enviar</span>
                        <input type="file" className="sr-only" onChange={onFileChange} accept={acceptedTypes} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">PDF, DOCX, PPTX, etc.</p>
                </div>
            </label>
        )}
    </div>
);

export const AddRecordedLessonDialog = ({ isOpen, onClose, courseId, onLessonAdded }) => {
  const { toast } = useToast();
  const [uploadType, setUploadType] = useState('link');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [materialAulaFile, setMaterialAulaFile] = useState(null);
  const [exercicioFile, setExercicioFile] = useState(null);
  const [materialAdicionalFile, setMaterialAdicionalFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'A1',
    video_url: '',
    module_id: '',
    module_name: '', // For creating a new module
    visibility_scope: 'class',
    allowed_class_ids: [],
    allowed_student_ids: [],
    published: false,
  });
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const acceptedFileTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

  useEffect(() => {
    if (!isOpen || !courseId) return;

    const fetchData = async () => {
      const { data: modulesData, error: modulesError } = await supabase.from('course_modules').select('id, name').eq('course_id', courseId);
      if (modulesError) toast({ variant: 'destructive', title: 'Erro ao buscar módulos.' }); else setModules(modulesData);
      
      const { data: studentsData, error: studentsError } = await supabase.from('classroom_students').select('profiles(id, name)').eq('classroom_id', courseId);
      if (studentsError) toast({ variant: 'destructive', title: 'Erro ao buscar alunos.' }); else setStudents(studentsData.map(s => s.profiles).filter(Boolean));
    };

    fetchData();
    setFormData(prev => ({ ...prev, allowed_class_ids: [courseId] }));
  }, [isOpen, courseId, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVideoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 524288000) { // 500MB
        toast({ variant: 'destructive', title: 'Arquivo muito grande!', description: 'O tamanho máximo do vídeo é de 500MB.' });
        e.target.value = null; setVideoFile(null);
      } else { setVideoFile(file); }
    }
  };

  const handleThumbnailFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5242880) { // 5MB
            toast({ variant: 'destructive', title: 'Imagem muito grande!', description: 'O tamanho máximo da thumbnail é 5MB.' });
            e.target.value = null; setThumbnailFile(null);
        } else { setThumbnailFile(file); }
    }
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) { value.push(options[i].value); }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadMaterial = async (file, category, lessonId) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}/${lessonId}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('lesson_materials').upload(fileName, file);
    if (uploadError) throw new Error(`Erro no upload do material (${category}): ${uploadError.message}`);
    
    const { data: urlData } = supabase.storage.from('lesson_materials').getPublicUrl(fileName);
    
    const { data: materialData, error: dbError } = await supabase
      .from('materials')
      .insert({
        title: file.name,
        level: formData.level,
        type: file.type,
        file_url: urlData.publicUrl,
        category: category,
      })
      .select('id')
      .single();
      
    if (dbError) throw new Error(`Erro ao salvar material (${category}) no banco: ${dbError.message}`);
    
    return materialData.id;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    let finalVideoUrl = formData.video_url;
    let video_provider = 'other';
    let finalThumbnailUrl = null;

    try {
        if (thumbnailFile) {
            const thumbExt = thumbnailFile.name.split('.').pop();
            const thumbName = `${Math.random()}.${thumbExt}`;
            const { error: thumbError } = await supabase.storage.from('lesson_thumbnails').upload(thumbName, thumbnailFile);
            if (thumbError) throw new Error(`Erro no upload da thumbnail: ${thumbError.message}`);
            const { data: thumbUrlData } = supabase.storage.from('lesson_thumbnails').getPublicUrl(thumbName);
            finalThumbnailUrl = thumbUrlData.publicUrl;
        }

        if (uploadType === 'upload' && videoFile) {
            const fileExt = videoFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('recorded_videos').upload(fileName, videoFile, { onProgress: (event) => setUploadProgress((event.loaded / event.total) * 100) });
            if (uploadError) throw new Error(`Erro no upload do vídeo: ${uploadError.message}`);
            const { data: urlData } = supabase.storage.from('recorded_videos').getPublicUrl(fileName);
            finalVideoUrl = urlData.publicUrl;
            video_provider = 'supabase';
        } else if (uploadType === 'link') {
            if (formData.video_url.includes('youtube.com') || formData.video_url.includes('youtu.be')) video_provider = 'youtube';
            else if (formData.video_url.includes('drive.google.com')) video_provider = 'drive';
        }

        let currentModuleId = formData.module_id;
        if (formData.module_id === 'new' && formData.module_name) {
          const { data: newModule, error: newModuleError } = await supabase.from('course_modules').insert({ course_id: courseId, name: formData.module_name, order_index: 0 }).select().single();
          if (newModuleError) throw new Error(`Erro ao criar módulo: ${newModuleError.message}`);
          currentModuleId = newModule.id;
        }

        if (!currentModuleId) throw new Error('Módulo é obrigatório');

        const lessonData = {
          ...formData,
          module_id: currentModuleId,
          video_url: finalVideoUrl,
          video_provider,
          thumbnail_url: finalThumbnailUrl,
          allowed_class_ids: formData.visibility_scope === 'class' ? formData.allowed_class_ids : [],
          allowed_student_ids: formData.visibility_scope === 'students' ? formData.allowed_student_ids : [],
          order_index: 0,
        };
        delete lessonData.module_name;

        const { data: savedLesson, error: lessonError } = await supabase.from('recorded_lessons').insert(lessonData).select().single();
        if (lessonError) throw new Error(`Erro ao salvar aula: ${lessonError.message}`);

        const materialAulaId = await uploadMaterial(materialAulaFile, 'aula', savedLesson.id);
        const exercicioId = await uploadMaterial(exercicioFile, 'exercicio', savedLesson.id);
        const materialAdicionalId = await uploadMaterial(materialAdicionalFile, 'adicional', savedLesson.id);

        const materialLinks = [materialAulaId, exercicioId, materialAdicionalId]
            .filter(id => id !== null)
            .map(matId => ({ lesson_id: savedLesson.id, material_id: matId }));

        if (materialLinks.length > 0) {
            const { error: materialError } = await supabase.from('recorded_lesson_materials').insert(materialLinks);
            if (materialError) throw new Error(`Erro ao associar materiais: ${materialError.message}`);
        }

        toast({ title: 'Aula gravada adicionada com sucesso!' });
        onLessonAdded();
        onClose();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Ocorreu um erro', description: error.message });
    } finally {
        setIsSaving(false);
        setUploadProgress(0);
        setVideoFile(null);
        setThumbnailFile(null);
        setMaterialAulaFile(null);
        setExercicioFile(null);
        setMaterialAdicionalFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Aula Gravada</DialogTitle>
          <DialogDescription>Preencha os detalhes da aula abaixo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex space-x-2 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <Button variant={uploadType === 'link' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setUploadType('link')}>Link Externo</Button>
            <Button variant={uploadType === 'upload' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setUploadType('upload')}>Upload de Vídeo</Button>
          </div>

          <InputField name="title" label="Título da Aula" value={formData.title} onChange={handleInputChange} />
          
          <div>
            <label htmlFor="thumbnail_file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Thumbnail da Aula</label>
            <input id="thumbnail_file" name="thumbnail_file" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleThumbnailFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
            {thumbnailFile && <p className="text-xs text-slate-500 mt-1">{thumbnailFile.name}</p>}
            <p className="text-xs text-slate-400 mt-1">Tamanho máximo: 5MB.</p>
          </div>

          {uploadType === 'link' ? (
            <InputField name="video_url" label="Link do Vídeo (YouTube ou Google Drive)" value={formData.video_url} onChange={handleInputChange} />
          ) : (
            <div>
              <label htmlFor="video_file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arquivo de Vídeo</label>
              <input id="video_file" name="video_file" type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
              {videoFile && <p className="text-xs text-slate-500 mt-1">{videoFile.name}</p>}
              <p className="text-xs text-slate-400 mt-1">Tamanho máximo do arquivo: 500MB.</p>
            </div>
          )}

          {isSaving && uploadType === 'upload' && (
            <div>
              <Label>Progresso do Upload</Label>
              <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-1"><motion.div className="bg-blue-600 h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} /></div>
            </div>
          )}

          <SelectField name="level" label="Nível" value={formData.level} onChange={handleInputChange}>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </SelectField>
          
          <SelectField name="module_id" label="Módulo" value={formData.module_id} onChange={handleInputChange}>
            <option value="">Selecione um módulo</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            <option value="new">-- Criar Novo Módulo --</option>
          </SelectField>

          {formData.module_id === 'new' && ( <InputField name="module_name" label="Nome do Novo Módulo" value={formData.module_name} onChange={handleInputChange} /> )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" rows="3" />
          </div>

          <div className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800/50">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Materiais da Aula</h4>
            <FileUploadField label="Material Principal (PDF, Slides)" file={materialAulaFile} onFileChange={(e) => handleFileChange(e, setMaterialAulaFile)} onRemove={() => setMaterialAulaFile(null)} acceptedTypes={acceptedFileTypes} />
            <FileUploadField label="Exercícios" file={exercicioFile} onFileChange={(e) => handleFileChange(e, setExercicioFile)} onRemove={() => setExercicioFile(null)} acceptedTypes={acceptedFileTypes} />
            <FileUploadField label="Materiais Adicionais" file={materialAdicionalFile} onFileChange={(e) => handleFileChange(e, setMaterialAdicionalFile)} onRemove={() => setMaterialAdicionalFile(null)} acceptedTypes={acceptedFileTypes} />
          </div>

          <SelectField name="visibility_scope" label="Visibilidade" value={formData.visibility_scope} onChange={handleInputChange}>
            <option value="class">Turma(s)</option>
            <option value="students">Alunos Específicos</option>
          </SelectField>

          {formData.visibility_scope === 'class' ? (
             <p className="text-sm text-slate-500">A aula será visível para a turma atual.</p>
          ) : (
             <SelectField name="allowed_student_ids" label="Selecionar Alunos" multiple value={formData.allowed_student_ids} onChange={handleMultiSelectChange} className="h-32">
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </SelectField>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch id="published" checked={formData.published} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))} />
            <Label htmlFor="published">Publicar aula</Label>
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