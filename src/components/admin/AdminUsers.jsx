import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { PlusCircle, Edit, Trash2, User, Mail, ShieldCheck, ShieldOff, Key, Upload } from 'lucide-react';
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
    import BulkImportDialog from './BulkImportDialog';

    /**
     * AdminUsers Component
     * 
     * Handles management of users (ALUNO and PROFESSOR).
     * 
     * Schema Update Note:
     * - Uses 'classrooms!classroom_students' for student class info (Many-to-Many).
     * - Uses 'professor_material_packages' for teacher permissions.
     */

    const UserDialog = ({ user, isOpen, onClose, onSave, userType, classrooms, teachers, materialPackages }) => {
      const [formData, setFormData] = useState({});
      const [isSaving, setIsSaving] = useState(false);
      const [selectedMaterialPackages, setSelectedMaterialPackages] = useState([]);
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
        can_emit_charges: false,
        canAddStudents: false,
        languages: [],
        classroom_id: '',
        teacher_id: '',
        toReceive: 0,
        billing_type: 'none',
        charge_amount: 0,
        charge_description: '',
        subscription_period: 'monthly',
        schedule_details: '',
      };

      useEffect(() => {
        if (isOpen) {
          if (user) {
            setFormData({
              ...initialFormState,
              ...user,
              languages: user.languages || [],
              password: '',
              // SCHEMA FIX: Read classroom from array (M2M)
              classroom_id: user.classrooms?.[0]?.id || '',
              billing_type: 'none',
            });
             if (user.professor_material_packages) {
              setSelectedMaterialPackages(user.professor_material_packages.map(p => p.package_id));
            } else {
              setSelectedMaterialPackages([]);
            }
          } else {
            setFormData(initialFormState);
            setSelectedMaterialPackages([]);
          }
        }
      }, [user, isOpen, userType]);
      
      const handleMaterialPackageChange = (packageId) => {
        setSelectedMaterialPackages(prev => 
            prev.includes(packageId) 
            ? prev.filter(id => id !== packageId) 
            : [...prev, packageId]
        );
      };

      const handleSave = async () => {
        if (!user && !formData.password) {
          toast({
            variant: "destructive",
            title: "Senha obrigatória",
            description: "É necessário definir uma senha para novos usuários."
          });
          return;
        }
        if (formData.billing_type !== 'none' && (!formData.charge_amount || !formData.charge_description)) {
          toast({ variant: "destructive", title: "Dados de Cobrança Incompletos", description: "Valor e descrição são obrigatórios para gerar cobranças." });
          return;
        }
        setIsSaving(true);
        await onSave(formData, selectedMaterialPackages);
        setIsSaving(false);
      };

      const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value);
        setFormData(prev => ({ ...prev, [name]: val }));
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
      
        const groupedPackages = {
            'Básico': materialPackages.filter(p => p.levels?.includes('A1') || p.levels?.includes('A2')),
            'Intermediário': materialPackages.filter(p => p.levels?.includes('B1') || p.levels?.includes('B2')),
            'Avançado': materialPackages.filter(p => p.levels?.includes('C1') || p.levels?.includes('C2')),
        };

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-3xl bg-white dark:bg-slate-800">
            <DialogHeader>
              <DialogTitle className="text-slate-800 dark:text-white">{user ? 'Editar' : 'Adicionar'} {userType === 'ALUNO' ? 'Aluno' : 'Professor'}</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <h3 className="lg:col-span-3 text-lg font-semibold border-b pb-2 mb-2 text-slate-800 dark:text-white">Dados Pessoais</h3>
              <InputField name="name" label="Nome Completo" value={formData.name || ''} onChange={handleInputChange} />
              <InputField name="email" label="Email" value={formData.email || ''} onChange={handleInputChange} type="email" disabled={!!user} />
              {!user && <InputField name="password" label="Senha" value={formData.password || ''} onChange={handleInputChange} type="password" placeholder="Mínimo 6 caracteres"/>}
              <InputField name="whatsapp" label="WhatsApp" value={formData.whatsapp || ''} onChange={handleInputChange} />
              <InputField name="cpf" label="CPF" value={formData.cpf || ''} onChange={handleInputChange} />
              <InputField name="rg" label="RG" value={formData.rg || ''} onChange={handleInputChange} />
              
              {userType === 'ALUNO' && (
                <>
                  <InputField name="address" label="Endereço" value={formData.address || ''} onChange={handleInputChange} className="lg:col-span-3" />
                  <InputField name="marital_status" label="Estado Civil" value={formData.marital_status || ''} onChange={handleInputChange} />
                  <InputField name="profession" label="Profissão" value={formData.profession || ''} onChange={handleInputChange} />
                  <InputField name="language" label="Idioma Principal" value={formData.language || ''} onChange={handleInputChange} />
                  <SelectField name="material_plan" label="Plano de Materiais" value={formData.material_plan || 'Básico'} onChange={handleInputChange} options={['Básico', 'Premium']} />
                  
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Turma</label>
                      <select name="classroom_id" value={formData.classroom_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
                          <option value="">Nenhuma turma</option>
                          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Professor Responsável</label>
                      <select name="teacher_id" value={formData.teacher_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
                          <option value="">Nenhum professor</option>
                          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {!user && (
                     <>
                      <h3 className="lg:col-span-3 text-lg font-semibold border-b pb-2 mt-4 mb-2 text-slate-800 dark:text-white">Cobrança Inicial</h3>
                       <div className="lg:col-span-1">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Cobrança</label>
                          <select name="billing_type" value={formData.billing_type} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
                              <option value="none">Nenhuma</option>
                              <option value="single">Cobrança Única</option>
                              <option value="subscription">Assinatura</option>
                          </select>
                      </div>
                      {formData.billing_type === 'subscription' && (
                         <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frequência</label>
                             <select name="subscription_period" value={formData.subscription_period} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white">
                                <option value="monthly">Mensal (30 dias)</option>
                                <option value="quarterly">Trimestral (90 dias)</option>
                                <option value="semi_annually">Semestral (180 dias)</option>
                            </select>
                        </div>
                      )}
                      {formData.billing_type !== 'none' && (
                        <>
                          <InputField name="charge_amount" label="Valor Total (R$)" value={formData.charge_amount || 0} onChange={handleInputChange} type="number" step="0.01" />
                          <InputField name="toReceive" label="Valor a Receber pelo Professor (R$)" value={formData.toReceive || 0} onChange={handleInputChange} type="number" step="0.01" />
                          <InputField name="charge_description" label="Descrição da Cobrança" value={formData.charge_description || ''} onChange={handleInputChange} className="lg:col-span-3" />
                        </>
                      )}
                      <h3 className="lg:col-span-3 text-lg font-semibold border-b pb-2 mt-4 mb-2 text-slate-800 dark:text-white">Agendamento de Aulas</h3>
                       <InputField name="schedule_details" label="Detalhes das Aulas Recorrentes" value={formData.schedule_details || ''} onChange={handleInputChange} placeholder="Ex: Seg/Qua 19h-20h" className="lg:col-span-3" />
                    </>
                  )}
                </>
              )}

              {userType === 'PROFESSOR' && (
                <>
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Idiomas</label>
                    <select multiple name="languages" value={formData.languages} onChange={handleMultiSelectChange} className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:text-white h-24">
                      <option value="Francês">Francês</option>
                      <option value="Inglês">Inglês</option>
                      <option value="Espanhol">Espanhol</option>
                      <option value="Italiano">Italiano</option>
                      <option value="Alemão">Alemão</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold border-b pb-2 mt-4 mb-2 text-slate-800 dark:text-white">Acesso aos Materiais</h3>
                    {Object.entries(groupedPackages).map(([groupName, packages]) => (
                        packages.length > 0 && (
                            <div key={groupName} className="mb-4">
                                <p className="font-semibold mb-2 text-slate-700 dark:text-slate-300">{groupName}</p>
                                <div className="space-y-2">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`pkg-${pkg.id}`} 
                                                checked={selectedMaterialPackages.includes(pkg.id)}
                                                onChange={() => handleMaterialPackageChange(pkg.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <label htmlFor={`pkg-${pkg.id}`} className="ml-2 text-sm text-slate-600 dark:text-slate-400">{pkg.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                   </div>
                  <div className="flex items-center space-x-2">
                    <input id="canAddStudents" name="canAddStudents" type="checkbox" checked={formData.canAddStudents || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <label htmlFor="canAddStudents" className="text-sm font-medium text-slate-700 dark:text-slate-300">Pode adicionar alunos?</label>
                  </div>
                  <div className="flex items-center space-x-2">
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

    const ChangePasswordDialog = ({ isOpen, onClose, user, onPasswordChange }) => {
        const [password, setPassword] = useState('');
        const [isSaving, setIsSaving] = useState(false);

        const handleSave = async () => {
            setIsSaving(true);
            await onPasswordChange(user.id, password);
            setIsSaving(false);
            setPassword('');
            onClose();
        };

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Senha de {user?.name}</DialogTitle>
                        <DialogDescription>Digite a nova senha abaixo. O usuário será desconectado e precisará usar a nova senha para acessar.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <InputField name="password" label="Nova Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Alterar Senha'}</Button>
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

    const AdminUsers = ({ userType }) => {
      const [users, setUsers] = useState([]);
      const [loading, setLoading] = useState(true);
      const [isDialogOpen, setIsDialogOpen] = useState(false);
      const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
      const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
      const [selectedUser, setSelectedUser] = useState(null);
      const [classrooms, setClassrooms] = useState([]);
      const [teachers, setTeachers] = useState([]);
      const [materialPackages, setMaterialPackages] = useState([]);
      const { toast } = useToast();

      const fetchData = useCallback(async () => {
        setLoading(true);
        
        let userQuery = supabase
          .from('profiles')
          .select('*, classrooms!classroom_students(*)') // Explicit join
          .eq('role', userType)
          .order('name');
          
        if(userType === 'PROFESSOR') {
            userQuery = supabase
              .from('profiles')
              .select('*, professor_material_packages(package_id)')
              .eq('role', userType)
              .order('name');
        }

        const { data, error } = await userQuery;

        if (error) {
          toast({ variant: "destructive", title: "Erro ao buscar usuários", description: error.message });
        } else {
          setUsers(data);
        }

        const [classroomsRes, teachersRes, packagesRes] = await Promise.all([
            supabase.from('classrooms').select('id, name, schedule_details, start_date, end_date'),
            supabase.from('profiles').select('id, name').eq('role', 'PROFESSOR'),
            supabase.from('material_packages').select('*').eq('is_active', true)
        ]);

        if (classroomsRes.error) toast({ variant: "destructive", title: "Erro ao buscar turmas" });
        else setClassrooms(classroomsRes.data);

        if (teachersRes.error) toast({ variant: "destructive", title: "Erro ao buscar professores" });
        else setTeachers(teachersRes.data);
        
        if (packagesRes.error) toast({ variant: "destructive", title: "Erro ao buscar pacotes de materiais" });
        else setMaterialPackages(packagesRes.data);

        setLoading(false);
      }, [toast, userType]);

      useEffect(() => {
        fetchData();
      }, [fetchData]);

    const handleSaveUser = async (formData, selectedPackages) => {
      const {
        id,
        email,
        password,
        classroom_id,
        teacher_id,
        toReceive,
        billing_type,
        charge_amount,
        charge_description,
        subscription_period,
        schedule_details,
        ...rest
       } = formData;

      const normalizedChargeAmount = typeof charge_amount === 'string' ? Number.parseFloat(charge_amount.replace(',', '.')) || 0 : (charge_amount || 0);
      const normalizedToReceive = typeof toReceive === 'string' ? Number.parseFloat(toReceive.replace(',', '.')) || 0 : (toReceive || 0);

      if (selectedUser) {
        const profileUpdate = { ...rest, teacher_id: teacher_id || null, toReceive: normalizedToReceive };
        delete profileUpdate.classroom_students;
        delete profileUpdate.classrooms;
        delete profileUpdate.professor_material_packages;

        const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', selectedUser.id);
        if (error) { toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message }); return; }

        // SCHEMA FIX: Update classroom association in junction table
        if (userType === 'ALUNO') {
            // Remove existing association
            await supabase.from('classroom_students').delete().eq('student_id', selectedUser.id);
            // Insert new association if classroom selected
            if (classroom_id) { 
                await supabase.from('classroom_students').insert({ classroom_id, student_id: selectedUser.id }); 
            }
        }
        
        if (userType === 'PROFESSOR') {
            await supabase.from('professor_material_packages').delete().eq('professor_id', selectedUser.id);
            if (selectedPackages && selectedPackages.length > 0) {
                const linksToInsert = selectedPackages.map(package_id => ({ professor_id: selectedUser.id, package_id }));
                await supabase.from('professor_material_packages').insert(linksToInsert);
            }
        }
        
        toast({ title: 'Usuário atualizado com sucesso!' });
        fetchData();
        setIsDialogOpen(false);
    } else {
         const profileData = {
          ...rest,
          teacher_id: teacher_id || null,
          toReceive: normalizedToReceive,
          classroom_id: classroom_id || null, // Note: edge function should handle inserting into junction table if provided
          billing_type: billing_type || 'none',
          charge_amount: normalizedChargeAmount,
          charge_description: charge_description || '',
          subscription_period: subscription_period || 'monthly',
          schedule_details: schedule_details || '',
        };

        const { data: functionData, error: functionError } = await supabase.functions.invoke('create-user', {
          body: { email, password, profileData },
        });
        
        const fnErrMsg = functionError?.message || (functionData && typeof functionData.error === 'string' ? functionData.error : null);

        if (fnErrMsg) { toast({ variant: 'destructive', title: 'Erro ao criar usuário', description: fnErrMsg }); return; }
        
        const newUserId = functionData?.data?.user?.id;
        if (newUserId && userType === 'PROFESSOR' && selectedPackages && selectedPackages.length > 0) {
            const linksToInsert = selectedPackages.map(package_id => ({ professor_id: newUserId, package_id }));
            await supabase.from('professor_material_packages').insert(linksToInsert);
        }

        // SCHEMA FIX: Manually insert into junction table for ALUNO if the Edge Function doesn't support it directly yet
        // (Assuming edge function handles basic profile creation, we enforce association here to be safe)
        if (newUserId && userType === 'ALUNO' && classroom_id) {
             const { error: junctionError } = await supabase.from('classroom_students').insert({ classroom_id, student_id: newUserId });
             if (junctionError) console.error("Error linking classroom:", junctionError);
        }

        toast({ title: 'Usuário criado com sucesso!' });
        fetchData();
        setIsDialogOpen(false);
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
          fetchData();
        }
      };

      const handleChangePassword = async (userId, newPassword) => {
        if (!newPassword || newPassword.length < 6) {
            toast({ variant: "destructive", title: "Senha inválida", description: "A senha deve ter no mínimo 6 caracteres." });
            return;
        }
        const { data, error } = await supabase.functions.invoke('change-user-password', {
            body: { userId, newPassword },
        });

        if (error || (data && data.error)) {
            toast({ variant: "destructive", title: "Erro ao alterar senha", description: error?.message || data?.error });
        } else {
            toast({ title: "Senha alterada com sucesso!" });
            setIsPasswordDialogOpen(false);
        }
      };

      const handleOpenDialog = (user = null) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
      };
      
      const handleOpenPasswordDialog = (user) => {
          setSelectedUser(user);
          setIsPasswordDialogOpen(true);
      };

      const title = userType === 'ALUNO' ? 'Alunos' : 'Professores';

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gerenciamento de {title}</h2>
            <div className="flex space-x-2">
              {userType === 'ALUNO' && (
                  <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar em Massa
                  </Button>
              )}
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                <PlusCircle className="w-4 h-4 mr-2" />
                Adicionar {title.slice(0, -1)}
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-6 py-3">Nome</th>
                    <th scope="col" className="px-6 py-3">Contato</th>
                    {userType === 'ALUNO' && <th scope="col" className="px-6 py-3">Plano/Turma</th>}
                    {userType === 'PROFESSOR' && <th scope="col" className="px-6 py-3">Permissões</th>}
                    <th scope="col" className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="text-center p-6">Carregando...</td></tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{user.name || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                           <div className="flex items-center gap-1 text-xs mt-1">
                            <User className="w-3 h-3" /> {user.whatsapp || "Não informado"}
                          </div>
                        </td>
                        {userType === 'ALUNO' && <td className="px-6 py-4">{user.material_plan || "N/A"}{user.classrooms?.[0] ? ` - ${user.classrooms[0].name}` : ''}</td>}
                        {userType === 'PROFESSOR' && (
                            <td className="px-6 py-4 text-xs">
                                <p className={`flex items-center ${user.canAddStudents ? 'text-green-500' : 'text-slate-500'}`}>
                                    {user.canAddStudents ? <ShieldCheck className="w-4 h-4 mr-1"/> : <ShieldOff className="w-4 h-4 mr-1"/>} Add Alunos
                                </p>
                                <p className={`flex items-center ${user.can_emit_charges ? 'text-green-500' : 'text-slate-500'}`}>
                                    {user.can_emit_charges ? <ShieldCheck className="w-4 h-4 mr-1"/> : <ShieldOff className="w-4 h-4 mr-1"/>} Emitir Cobrança
                                </p>
                            </td>
                        )}
                        <td className="px-6 py-4 text-center space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(user)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenPasswordDialog(user)}><Key className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação é irreversível e excluirá permanentemente o usuário e seus dados associados.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
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
          <UserDialog user={selectedUser} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveUser} userType={userType} classrooms={classrooms} teachers={teachers} materialPackages={materialPackages} />
          {selectedUser && <ChangePasswordDialog user={selectedUser} isOpen={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)} onPasswordChange={handleChangePassword} />}
          <BulkImportDialog isOpen={isBulkImportOpen} onClose={() => setIsBulkImportOpen(false)} onImportComplete={fetchData} />
        </motion.div>
      );
    };

    export default AdminUsers;