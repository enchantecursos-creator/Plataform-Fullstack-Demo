import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, User, Mail } from 'lucide-react';
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

export const UserDialog = ({ user, isOpen, onClose, onSave, userType }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const initialFormState = {
    name: '',
    email: '',
    password: '',
    role: userType,
    whatsapp: '',
    cpf: '',
    rg: '',
    address: '',
    marital_status: '',
    profession: '',
    language: 'Francês',
    monthly_fee: 0,
    material_plan: 'Básico',
    can_emit_charges: false,
    canAddStudents: false,
    languages: [],
  };

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          ...initialFormState,
          ...user,
          languages: user.languages || [],
          password: '',
        });
      } else {
        setFormData(initialFormState);
      }
    }
  }, [user, isOpen, userType]);

  const handleSave = async () => {
    if (!user && !formData.password) {
      toast({
        variant: "destructive",
        title: "Senha obrigatória",
        description: "É necessário definir uma senha para novos usuários."
      });
      return;
    }
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleMultiSelectChange = (e) => {
    const { options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setFormData(prev => ({ ...prev, languages: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-800 dark:text-white">{user ? 'Editar' : 'Adicionar'} {userType === 'ALUNO' ? 'Aluno' : 'Professor'}</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          <InputField name="name" label="Nome Completo" value={formData.name || ''} onChange={handleInputChange} />
          <InputField name="email" label="Email" value={formData.email || ''} onChange={handleInputChange} type="email" disabled={!!user} />
          {!user && <InputField name="password" label="Senha" value={formData.password || ''} onChange={handleInputChange} type="password" placeholder="Mínimo 6 caracteres"/>}
          <InputField name="whatsapp" label="WhatsApp" value={formData.whatsapp || ''} onChange={handleInputChange} />
          <InputField name="cpf" label="CPF" value={formData.cpf || ''} onChange={handleInputChange} />
          <InputField name="rg" label="RG" value={formData.rg || ''} onChange={handleInputChange} />
          
          {userType === 'ALUNO' && (
            <>
              <InputField name="address" label="Endereço" value={formData.address || ''} onChange={handleInputChange} className="md:col-span-2" />
              <InputField name="marital_status" label="Estado Civil" value={formData.marital_status || ''} onChange={handleInputChange} />
              <InputField name="profession" label="Profissão" value={formData.profession || ''} onChange={handleInputChange} />
              <InputField name="language" label="Idioma Principal" value={formData.language || ''} onChange={handleInputChange} />
              <InputField name="monthly_fee" label="Mensalidade (R$)" value={formData.monthly_fee || 0} onChange={handleInputChange} type="number" />
              <SelectField name="material_plan" label="Plano de Materiais" value={formData.material_plan || 'Básico'} onChange={handleInputChange} options={['Básico', 'Premium']} />
            </>
          )}

          {userType === 'PROFESSOR' && (
            <>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Idiomas</label>
                <select multiple name="languages" value={formData.languages} onChange={handleMultiSelectChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white h-24">
                  <option value="Francês">Francês</option>
                  <option value="Inglês">Inglês</option>
                  <option value="Espanhol">Espanhol</option>
                  <option value="Italiano">Italiano</option>
                  <option value="Alemão">Alemão</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 col-span-1">
                <input id="canAddStudents" name="canAddStudents" type="checkbox" checked={formData.canAddStudents || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <label htmlFor="canAddStudents" className="text-sm font-medium text-slate-700 dark:text-slate-300">Pode adicionar alunos?</label>
              </div>
              <div className="flex items-center space-x-2 col-span-1">
                <input id="can_emit_charges" name="can_emit_charges" type="checkbox" checked={formData.can_emit_charges || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <label htmlFor="can_emit_charges" className="text-sm font-medium text-slate-700 dark:text-slate-300">Pode emitir cobranças?</label>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InputField = ({ name, label, ...props }) => (
  <div className={props.className}>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <input id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white" />
  </div>
);

const SelectField = ({ name, label, options, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
    <select id={name} name={name} {...props} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const StudentsPanel = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    // SCHEMA FIX: Use Explicit Join classrooms!classroom_students for students
    const { data, error } = await supabase
      .from('profiles')
      .select('*, classrooms!classroom_students(*)')
      .eq('role', 'ALUNO')
      .eq('teacher_id', user.id)
      .order('name');

    if (error) {
      toast({ variant: "destructive", title: "Erro ao buscar alunos", description: error.message });
    } else {
      setUsers(data);
    }
    setLoading(false);
  }, [toast, user.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveUser = async (formData) => {
    const { id, email, ...updateData } = formData;
    
    if (selectedUser) { // Editing existing user
      delete updateData.password; 
      updateData.teacher_id = user.id; // Ensure teacher_id is set
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedUser.id);
      
      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
      } else {
        toast({ title: "Aluno atualizado com sucesso!" });
        fetchUsers();
        setIsDialogOpen(false);
      }
    } else { // Creating new user
        updateData.teacher_id = user.id;
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: { email, password: formData.password, ...updateData },
        });

        if (error || (data && data.error)) {
            toast({ variant: "destructive", title: "Erro ao criar usuário", description: error?.message || data?.error });
        } else {
            toast({ title: "Usuário criado com sucesso!" });
            fetchUsers();
            setIsDialogOpen(false);
        }
    }
  };

  const handleDeleteUser = async (userId) => {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });

    if (error || (data && data.error)) {
      toast({ variant: "destructive", title: "Erro ao excluir usuário", description: error?.message || data?.error });
    } else {
      toast({ title: "Usuário excluído com sucesso!" });
      fetchUsers();
    }
  };

  const handleOpenDialog = (user = null) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  return (
     <div className="p-6 space-y-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gerenciamento de Alunos</h2>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Aluno
            </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                <tr>
                    <th scope="col" className="px-6 py-3">Nome</th>
                    <th scope="col" className="px-6 py-3">Contato</th>
                    <th scope="col" className="px-6 py-3">Plano</th>
                    <th scope="col" className="px-6 py-3 text-center">Ações</th>
                </tr>
                </thead>
                <tbody>
                {loading ? (
                    <tr><td colSpan="4" className="text-center p-6">Carregando...</td></tr>
                ) : (
                    users.map(u => (
                    <tr key={u.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{u.name || 'N/A'}</td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3" /> {u.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs mt-1">
                            <User className="w-3 h-3" /> {u.whatsapp || "Não informado"}
                        </div>
                        </td>
                        <td className="px-6 py-4">{u.material_plan}</td>
                        <td className="px-6 py-4 text-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(u)}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação é irreversível e excluirá permanentemente o aluno e seus dados associados.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>
        <UserDialog user={selectedUser} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveUser} userType="ALUNO" />
        </motion.div>
    </div>
  );
};

export default StudentsPanel;