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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from 'framer-motion';
import { UploadCloud, X, FileText } from 'lucide-react';

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

const FileUploadField = ({ label, onFileChange, file, onRemove, acceptedTypes, existingFile, onRemoveExisting }) => (
    <div>
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {existingFile ? (
             <div className="flex items-center justify-between p-2 mt-1 border rounded-md bg-slate-100 dark:bg-slate-700">
                <a href={existingFile.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 truncate hover:underline">
                    <FileText className="h-4 w-4" />
                    {existingFile.title}
                </a>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemoveExisting}>
                    <X className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        ) : file ? (
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


export const EditRecordedLessonDialog = ({ isOpen, onClose, lesson, onLessonUpdated }) => {
  const { toast } = useToast();
  const [uploadType, setUploadType] = useState('link');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [materialAulaFile, setMaterialAulaFile] = useState(null);
  const [exercicioFile, setExercicioFile] = useState(null);
  const [materialAdicionalFile, setMaterialAdicionalFile] = useState(null);
  const [existingMaterials, setExistingMaterials] = useState({ aula: null, exercicio: null, adicional: null });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({});
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const courseId = lesson?.module?.course_id;
  const acceptedFileTypes = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";

  const fetchLessonData = useCallback(async () => {
    if (!isOpen || !lesson) return;

    setFormData({
        ...lesson,
        allowed_class_ids: lesson.allowed_class_ids || [],
        allowed_student_ids: lesson.allowed_student_ids || [],
    });
    setUploadType(lesson.video_provider === 'supabase' ? 'upload' : 'link');

    const { data: modulesData, error: modulesError } = await supabase.from('course_modules').select('id, name').eq('course_id', courseId);
    if (modulesError) toast({ variant: 'destructive', title: 'Erro ao buscar módulos.' }); else setModules(modulesData);
    
    const { data: studentsData, error: studentsError } = await supabase.from('classroom_students').select('profiles(id, name)').eq('classroom_id', courseId);
    if (studentsError) toast({ variant: 'destructive', title: 'Erro ao buscar alunos.' }); else setStudents(studentsData.map(s => s.profiles).filter(Boolean));

    const { data: lessonMaterials, error: lessonMaterialsError } = await supabase.from('recorded_lesson_materials').select('materials(*)').eq('lesson_id', lesson.id);
    if (lessonMaterialsError) toast({ variant: 'destructive', title: 'Erro ao buscar materiais da aula.' });
    else {
        const materialsByCategory = { aula: null, exercicio: null, adicional: null };
        lessonMaterials.forEach(item => {
            if (item.materials) {
                materialsByCategory[item.materials.category] = item.materials;
            }
        });
        setExistingMaterials(materialsByCategory);
    }
  }, [isOpen, lesson, courseId, toast]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

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
      if (file.size > 524288000) { toast({ variant: 'destructive', title: 'Arquivo muito grande!', description: 'O tamanho máximo do vídeo é de 500MB.' }); e.target.value = null; setVideoFile(null); } 
      else { setVideoFile(file); }
    }
  };

  const handleThumbnailFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5242880) { toast({ variant: 'destructive', title: 'Imagem muito grande!', description: 'O tamanho máximo da thumbnail é 5MB.' }); e.target.value = null; setThumbnailFile(null); } 
        else { setThumbnailFile(file); }
    }
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) { if (options[i].selected) { value.push(options[i].value); } }
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const getPathFromUrl = (url) => { try { const urlObj = new URL(url); return urlObj.pathname.split('/').slice(2).join('/'); } catch(e) { return null; } };

  const uploadMaterial = async (file, category, lessonId) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}/${lessonId}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('lesson_materials').upload(fileName, file);
    if (uploadError) throw new Error(`Erro no upload do material (${category}): ${uploadError.message}`);
    
    const { data: urlData } = supabase.storage.from('lesson_materials').getPublicUrl(fileName);
    
    const { data: materialData, error: dbError } = await supabase
      .from('materials')
      .insert({ title: file.name, level: formData.level, type: file.type, file_url: urlData.publicUrl, category: category })
      .select('id').single();
      
    if (dbError) throw new Error(`Erro ao salvar material (${category}) no banco: ${dbError.message}`);
    return materialData.id;
  };

  const removeExistingMaterial = async (category) => {
    const materialToRemove = existingMaterials[category];
    if (!materialToRemove) return;

    const { error: linkError } = await supabase.from('recorded_lesson_materials').delete().match({ lesson_id: lesson.id, material_id: materialToRemove.id });
    if (linkError) throw new Error(`Erro ao remover link do material: ${linkError.message}`);

    const { error: materialError } = await supabase.from('materials').delete().eq('id', materialToRemove.id);
    if (materialError) throw new Error(`Erro ao remover material: ${materialError.message}`);

    const filePath = getPathFromUrl(materialToRemove.file_url);
    if (filePath) {
        const { error: storageError } = await supabase.storage.from('lesson_materials').remove([filePath]);
        if (storageError) throw new Error(`Erro ao remover arquivo do storage: ${storageError.message}`);
    }

    setExistingMaterials(prev => ({ ...prev, [category]: null }));
    toast({ title: "Material removido com sucesso!" });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    let finalVideoUrl = formData.video_url;
    let video_provider = formData.video_provider;
    let finalThumbnailUrl = formData.thumbnail_url;

    try {
        if (thumbnailFile) {
            if(formData.thumbnail_url) { const oldPath = getPathFromUrl(formData.thumbnail_url); if(oldPath) await supabase.storage.from('lesson_thumbnails').remove([oldPath]); }
            const thumbExt = thumbnailFile.name.split('.').pop();
            const thumbName = `${Math.random()}.${thumbExt}`;
            const { error: thumbError } = await supabase.storage.from('lesson_thumbnails').upload(thumbName, thumbnailFile);
            if (thumbError) throw new Error(`Erro no upload da thumbnail: ${thumbError.message}`);
            const { data: thumbUrlData } = supabase.storage.from('lesson_thumbnails').getPublicUrl(thumbName);
            finalThumbnailUrl = thumbUrlData.publicUrl;
        }

        if (uploadType === 'upload' && videoFile) {
            if (formData.video_provider === 'supabase' && formData.video_url) { const oldPath = getPathFromUrl(formData.video_url); if(oldPath) await supabase.storage.from('recorded_videos').remove([oldPath]); }
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
            else video_provider = 'other';
        }
        
        const { module, ...lessonData } = formData;
        const dataToUpdate = {
          ...lessonData,
          video_url: finalVideoUrl,
          thumbnail_url: finalThumbnailUrl,
          video_provider,
          allowed_class_ids: formData.visibility_scope === 'class' ? formData.allowed_class_ids : [],
          allowed_student_ids: formData.visibility_scope === 'students' ? formData.allowed_student_ids : [],
        };

        const { error: lessonUpdateError } = await supabase.from('recorded_lessons').update(dataToUpdate).eq('id', lesson.id);
        if (lessonUpdateError) throw new Error(`Erro ao atualizar aula: ${lessonUpdateError.message}`);

        const materialAulaId = await uploadMaterial(materialAulaFile, 'aula', lesson.id);
        const exercicioId = await uploadMaterial(exercicioFile, 'exercicio', lesson.id);
        const materialAdicionalId = await uploadMaterial(materialAdicionalFile, 'adicional', lesson.id);

        const newMaterialLinks = [materialAulaId, exercicioId, materialAdicionalId]
            .filter(id => id !== null)
            .map(matId => ({ lesson_id: lesson.id, material_id: matId }));

        if (newMaterialLinks.length > 0) {
            const { error: materialError } = await supabase.from('recorded_lesson_materials').insert(newMaterialLinks);
            if (materialError) throw new Error(`Erro ao associar novos materiais: ${materialError.message}`);
        }

        toast({ title: 'Aula atualizada com sucesso!' });
        onLessonUpdated();
        onClose();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Ocorreu um erro', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  if (!lesson) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Editar Aula Gravada</DialogTitle>
          <DialogDescription>Ajuste os detalhes da aula abaixo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex space-x-2 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <Button variant={uploadType === 'link' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setUploadType('link')}>Link Externo</Button>
            <Button variant={uploadType === 'upload' ? 'secondary' : 'ghost'} className="flex-1" onClick={() => setUploadType('upload')}>Upload de Vídeo</Button>
          </div>

          <InputField name="title" label="Título da Aula" value={formData.title || ''} onChange={handleInputChange} />
          
          <div>
            <label htmlFor="thumbnail_file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Thumbnail da Aula</label>
            {formData.thumbnail_url && !thumbnailFile && ( <div className="mb-2"><img src={formData.thumbnail_url} alt="Thumbnail atual" className="w-32 h-auto rounded-md" /></div> )}
            <input id="thumbnail_file" name="thumbnail_file" type="file" accept="image/png, image/jpeg, image/webp" onChange={handleThumbnailFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
            <p className="text-xs text-slate-400 mt-1">Tamanho máximo: 5MB. Envie uma nova imagem para substituir a atual.</p>
          </div>

          {uploadType === 'link' ? (
            <InputField name="video_url" label="Link do Vídeo (YouTube ou Google Drive)" value={formData.video_url || ''} onChange={handleInputChange} />
          ) : (
            <div>
              <label htmlFor="video_file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arquivo de Vídeo</label>
               {formData.video_provider === 'supabase' && !videoFile && ( <p className="text-sm text-slate-500 mb-2">Vídeo atual: <a href={formData.video_url} target="_blank" rel="noopener noreferrer" className="underline">Ver vídeo</a></p> )}
              <input id="video_file" name="video_file" type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
              <p className="text-xs text-slate-400 mt-1">Tamanho máximo: 500MB. Envie um novo vídeo para substituir o atual.</p>
            </div>
          )}

          {isSaving && uploadType === 'upload' && (
            <div>
              <Label>Progresso do Upload</Label>
              <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-1"><motion.div className="bg-blue-600 h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} /></div>
            </div>
          )}

          <SelectField name="level" label="Nível" value={formData.level || 'A1'} onChange={handleInputChange}>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
          </SelectField>
          
          <SelectField name="module_id" label="Módulo" value={formData.module_id || ''} onChange={handleInputChange}>
            <option value="">Selecione um módulo</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </SelectField>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" rows="3" />
          </div>

          <div className="space-y-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800/50">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">Materiais da Aula</h4>
            <FileUploadField label="Material Principal (PDF, Slides)" file={materialAulaFile} onFileChange={(e) => handleFileChange(e, setMaterialAulaFile)} onRemove={() => setMaterialAulaFile(null)} acceptedTypes={acceptedFileTypes} existingFile={existingMaterials.aula} onRemoveExisting={() => removeExistingMaterial('aula')} />
            <FileUploadField label="Exercícios" file={exercicioFile} onFileChange={(e) => handleFileChange(e, setExercicioFile)} onRemove={() => setExercicioFile(null)} acceptedTypes={acceptedFileTypes} existingFile={existingMaterials.exercicio} onRemoveExisting={() => removeExistingMaterial('exercicio')} />
            <FileUploadField label="Materiais Adicionais" file={materialAdicionalFile} onFileChange={(e) => handleFileChange(e, setMaterialAdicionalFile)} onRemove={() => setMaterialAdicionalFile(null)} acceptedTypes={acceptedFileTypes} existingFile={existingMaterials.adicional} onRemoveExisting={() => removeExistingMaterial('adicional')} />
          </div>

          <SelectField name="visibility_scope" label="Visibilidade" value={formData.visibility_scope || 'class'} onChange={handleInputChange}>
            <option value="class">Turma(s)</option>
            <option value="students">Alunos Específicos</option>
          </SelectField>

          {formData.visibility_scope === 'class' ? (
             <p className="text-sm text-slate-500">A aula será visível para a turma atual.</p>
          ) : (
             <SelectField name="allowed_student_ids" label="Selecionar Alunos" multiple value={formData.allowed_student_ids || []} onChange={handleMultiSelectChange} className="h-32">
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </SelectField>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch id="published" checked={formData.published || false} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))} />
            <Label htmlFor="published">Publicar aula</Label>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Atualizando...' : 'Salvar Alterações'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};