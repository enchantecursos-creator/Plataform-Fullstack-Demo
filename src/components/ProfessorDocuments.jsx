import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, FileText, Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

const DocumentDialog = ({ document, isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({ document_name: '', user_id: '' });
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [professors, setProfessors] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (document) {
        setFormData({ document_name: document.document_name, user_id: document.user_id });
      } else {
        setFormData({ document_name: '', user_id: user.role === 'ADMIN' ? '' : user.id });
      }
      setFile(null);

      if (user.role === 'ADMIN') {
        const fetchProfessors = async () => {
          const { data, error } = await supabase.from('profiles').select('id, name').eq('role', 'PROFESSOR');
          if (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar professores.' });
          } else {
            setProfessors(data);
          }
        };
        fetchProfessors();
      }
    }
  }, [document, isOpen, user.role, user.id, toast]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!formData.document_name) {
      toast({ variant: 'destructive', title: 'Nome do documento é obrigatório' });
      return;
    }
    if (!document && !file) {
      toast({ variant: 'destructive', title: 'É necessário selecionar um arquivo' });
      return;
    }
    if (user.role === 'ADMIN' && !formData.user_id) {
        toast({ variant: 'destructive', title: 'É necessário selecionar um professor' });
        return;
    }

    setIsSaving(true);
    await onSave(formData, file);
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{document ? 'Editar' : 'Adicionar'} Documento</DialogTitle>
          <DialogDescription>Preencha as informações do documento.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {user.role === 'ADMIN' && (
             <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Professor</label>
                <select id="user_id" name="user_id" value={formData.user_id} onChange={(e) => setFormData(prev => ({...prev, user_id: e.target.value}))} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
                    <option value="">Selecione o professor</option>
                    {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
          )}
          <div>
            <label htmlFor="document_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Documento</label>
            <input id="document_name" value={formData.document_name} onChange={(e) => setFormData(prev => ({...prev, document_name: e.target.value}))} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Arquivo</label>
            <input id="file" type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
            {file && <p className="text-xs text-slate-500 mt-1">{file.name}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProfessorDocuments = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    let query;
    if (user.role === 'ADMIN') {
        query = supabase.from('professor_documents').select('*, user:user_id(name)');
    } else {
        query = supabase.from('professor_documents').select('*').eq('user_id', user.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar documentos', description: error.message });
    } else {
      setDocuments(data);
    }
    setLoading(false);
  }, [user.id, user.role, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSaveDocument = async (formData, file) => {
    let fileUrl = selectedDocument?.file_url;
    const documentUserId = formData.user_id || user.id;

    if (file) {
      const fileName = `${documentUserId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('professor_documents')
        .upload(fileName, file, {
            upsert: !!selectedDocument
        });
      
      if (uploadError) {
        toast({ variant: 'destructive', title: 'Erro no upload', description: uploadError.message });
        setIsDialogOpen(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('professor_documents').getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
    }

    const documentData = {
      user_id: documentUserId,
      document_name: formData.document_name,
      file_url: fileUrl,
    };

    let error;
    if (selectedDocument) {
      const { error: updateError } = await supabase.from('professor_documents').update(documentData).eq('id', selectedDocument.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('professor_documents').insert(documentData);
      error = insertError;
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar documento', description: error.message });
    } else {
      toast({ title: `Documento ${selectedDocument ? 'atualizado' : 'adicionado'}!` });
      fetchDocuments();
      setIsDialogOpen(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    const { error } = await supabase.from('professor_documents').delete().eq('id', doc.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir documento', description: error.message });
    } else {
      try {
        const filePath = new URL(doc.file_url).pathname.split('/professor_documents/')[1];
        await supabase.storage.from('professor_documents').remove([decodeURIComponent(filePath)]);
      } catch (e) {
        console.warn("Could not delete file from storage, it might have been already removed.", e)
      }
      toast({ title: 'Documento excluído!' });
      fetchDocuments();
    }
  };

  const handleOpenDialog = (doc = null) => {
    setSelectedDocument(doc);
    setIsDialogOpen(true);
  };
  
  const handleDownload = async (fileUrl, docName) => {
    try {
        const filePath = new URL(fileUrl).pathname.split('/v1/object/public/professor_documents/')[1];
        const { data, error } = await supabase.storage.from('professor_documents').download(decodeURIComponent(filePath));
        if(error) throw error;
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        const fileExtension = fileUrl.split('.').pop();
        a.download = `${docName}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch(error) {
        console.error("Download error: ", error);
        toast({ variant: "destructive", title: "Erro no download", description: "Não foi possível baixar o arquivo. Verifique as permissões." });
    }
  }

  return (
    <>
      <DocumentDialog 
        document={selectedDocument}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveDocument}
        user={user}
      />
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{user.role === 'ADMIN' ? 'Documentos dos Professores' : 'Meus Documentos'}</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie diplomas, certificados e contratos.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Documentos Cadastrados</h2>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Documento
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : documents.length > 0 ? (
              documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{doc.document_name}</p>
                      {user.role === 'ADMIN' && doc.user && <p className="text-xs text-slate-500 dark:text-slate-400">Professor: {doc.user.name}</p>}
                      <p className="text-xs text-slate-500 dark:text-slate-400">Adicionado em: {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_url, doc.document_name)}><Download className="w-4 h-4" /></Button>
                    {(user.role === 'ADMIN' || user.id === doc.user_id) && (
                    <>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(doc)}><Edit className="w-4 h-4 text-blue-500" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir Documento?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteDocument(doc)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Nenhum documento</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Comece adicionando documentos importantes.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ProfessorDocuments;