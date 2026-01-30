import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MaterialDialog = ({ isOpen, onClose, onSave, material, onUpload }) => {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [coverToUpload, setCoverToUpload] = useState(null);
    const fileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const types = ['PDF', 'Video', 'Link Externo', 'Áudio', 'Exercício'];

    useEffect(() => {
        if (isOpen) {
            setFormData(material || {
                title: '',
                description: '',
                level: 'A1',
                type: 'PDF',
                tags: '',
                file_url: '',
                cover_url: '',
            });
            setFileToUpload(null);
            setCoverToUpload(null);
        }
    }, [isOpen, material]);

    const handleSave = async () => {
        setIsSaving(true);
        let updatedData = { ...formData };
        
        if(fileToUpload) {
            const fileUrl = await onUpload(fileToUpload, 'material-files');
            if (fileUrl) updatedData.file_url = fileUrl;
        }

        if(coverToUpload) {
            const coverUrl = await onUpload(coverToUpload, 'material-covers');
            if(coverUrl) updatedData.cover_url = coverUrl;
        }

        const tagsArray = typeof updatedData.tags === 'string' ? updatedData.tags.split(',').map(tag => tag.trim()) : updatedData.tags;
        updatedData.tags = tagsArray.filter(tag => tag);

        await onSave(updatedData);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900">
                <DialogHeader><DialogTitle className="text-slate-800 dark:text-white">{material?.id ? 'Editar' : 'Novo'} Material</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <input placeholder="Título" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border rounded bg-transparent" />
                    <textarea placeholder="Descrição" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded bg-transparent" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.level || 'A1'} onChange={e => setFormData({ ...formData, level: e.target.value })} className="w-full p-2 border rounded bg-transparent"><option value="">Selecione um Nível</option>{levels.map(l => <option key={l} value={l}>{l}</option>)}</select>
                        <select value={formData.type || 'PDF'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full p-2 border rounded bg-transparent"><option value="">Selecione um Tipo</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    </div>
                    <input placeholder="Tags (separadas por vírgula)" value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="w-full p-2 border rounded bg-transparent" />
                    <input placeholder="URL do Arquivo (se não for fazer upload)" value={formData.file_url || ''} onChange={e => setFormData({ ...formData, file_url: e.target.value })} className="w-full p-2 border rounded bg-transparent" />
                    
                    <div>
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                            <Upload className="w-4 h-4 mr-2" /> {fileToUpload ? `Arquivo: ${fileToUpload.name}` : "Upload de Material"}
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={(e) => setFileToUpload(e.target.files[0])} className="hidden" />
                    </div>

                    <div>
                        <Button type="button" variant="outline" onClick={() => coverInputRef.current?.click()} className="w-full">
                            <Upload className="w-4 h-4 mr-2" /> {coverToUpload ? `Capa: ${coverToUpload.name}` : "Upload de Capa"}
                        </Button>
                        <input type="file" ref={coverInputRef} onChange={(e) => setCoverToUpload(e.target.files[0])} className="hidden" accept="image/png, image/jpeg" />
                        {formData.cover_url && !coverToUpload && <img src={formData.cover_url} alt="Capa atual" className="mt-2 w-24 h-24 object-cover rounded"/>}
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

const AdminMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const { toast } = useToast();

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
        if (error) toast({ variant: "destructive", title: "Erro ao buscar materiais", description: error.message });
        else setMaterials(data);
        setLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const handleFileUpload = async (file, folder) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const cleanName = file.name.replace(/\.[^/.]+$/, "")
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-');
        const fileName = `${Date.now()}-${cleanName}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('assets').upload(filePath, file);

        if (uploadError) {
            toast({ variant: "destructive", title: `Erro no upload de ${folder === 'material-files' ? 'arquivo' : 'capa'}`, description: uploadError.message });
            return null;
        }
        
        const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSaveMaterial = async (formData) => {
        const { error } = await supabase.from('materials').upsert(formData);
        if (error) toast({ variant: "destructive", title: "Erro ao salvar material", description: error.message });
        else {
            toast({ title: `Material ${formData.id ? 'atualizado' : 'criado'} com sucesso!` });
            fetchMaterials();
            setIsDialogOpen(false);
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        const { error } = await supabase.from('materials').delete().eq('id', materialId);
        if (error) toast({ variant: "destructive", title: "Erro ao excluir material", description: error.message });
        else { toast({ title: 'Material excluído com sucesso!' }); fetchMaterials(); }
    };
    
    const openDialog = (material = null) => {
        setSelectedMaterial(material);
        setIsDialogOpen(true);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gerenciar Materiais</h2>
                <Button onClick={() => openDialog(null)}><PlusCircle className="w-4 h-4 mr-2" />Novo Material</Button>
            </div>
            {loading ? <p>Carregando materiais...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {materials.map(m => (
                        <div key={m.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border overflow-hidden">
                            <img src={m.cover_url || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc3b1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600'} alt={`Capa de ${m.title}`} className="w-full h-40 object-cover" />
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{m.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{m.description}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{m.level}</span>
                                    <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{m.type}</span>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="ghost" size="sm" onClick={() => openDialog(m)}><Edit className="w-4 h-4" /></Button>
                                    <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir Material?</AlertDialogTitle><AlertDialogDescription>Esta ação é permanente e não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => handleDeleteMaterial(m.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <MaterialDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveMaterial} material={selectedMaterial} onUpload={handleFileUpload} />
        </motion.div>
    );
};

export default AdminMaterials;