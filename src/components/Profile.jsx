import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Bell,
  Globe,
  Award,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Profile = ({ user, onUpdate }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const cropperRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birth_date: user.birth_date || '',
        level: user.level || 'A1',
        photo_url: user.photo_url || '',
        preferred_language: user.preferred_language || 'pt',
      });
    }
  }, [user]);

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento",
      description: `${feature} será implementada em breve! Solicite na próxima conversa! 🚀`,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { photo_url, email, level, ...updateData } = formData;
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    setIsSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar perfil", description: error.message });
    } else {
      onUpdate();
      setIsEditing(false);
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas com sucesso." });
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birth_date: user.birth_date || '',
        level: user.level || 'A1',
        photo_url: user.photo_url || '',
        preferred_language: user.preferred_language || 'pt',
      });
    }
    setIsEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageToCrop(URL.createObjectURL(file));
      setIsPhotoDialogOpen(true);
    }
  };

  const handleCrop = async () => {
    if (typeof cropperRef.current?.cropper !== "undefined") {
      const cropper = cropperRef.current?.cropper;
      const canvas = cropper.getCroppedCanvas({ width: 512, height: 512 });
      canvas.toBlob(async (blob) => {
        const fileName = `${user.id}/${Date.now()}.png`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          toast({ variant: "destructive", title: "Erro no upload", description: error.message });
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ photo_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          toast({ variant: "destructive", title: "Erro ao salvar foto", description: updateError.message });
        } else {
          onUpdate();
          toast({ title: "Foto atualizada!" });
        }
        setIsPhotoDialogOpen(false);
        setImageToCrop(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 'image/png');
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Meu Perfil</h1>
        <p className="text-slate-600 dark:text-slate-400">Gerencie suas informações pessoais e preferências</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center"><User className="w-5 h-5 mr-2 text-purple-500" />Informações Pessoais</h2>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-1" />Editar</Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}><X className="w-4 h-4 mr-1" />Cancelar</Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"><Save className="w-4 h-4 mr-1" />{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileField label="Nome Completo" isEditing={isEditing} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <ProfileField label="Email" isEditing={false} value={formData.email} />
              <ProfileField label="Telefone" isEditing={isEditing} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} type="tel" />
              <ProfileField label="Localização" isEditing={isEditing} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <ProfileField label="Data de Nascimento" isEditing={isEditing} value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} type="date" />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nível Atual</label>
                <p className="text-slate-800 dark:text-white font-medium"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm">{formData.level}</span></p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center"><Shield className="w-5 h-5 mr-2 text-purple-500" />Preferências</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Idioma</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Idioma da interface</p>
                  </div>
                </div>
                {isEditing ? (
                  <select value={formData.preferred_language} onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })} className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="pt">Português</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                  </select>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>{formData.preferred_language?.toUpperCase() || 'PT'}</Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Notificações</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Lembretes de aulas e novidades</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleFeatureClick('Alterar notificações')}>Ativado</Button>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4 group">
              {formData.photo_url ? (
                <img src={formData.photo_url} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center"><span className="text-white font-bold text-2xl">{user.name?.charAt(0).toUpperCase() || 'U'}</span></div>
              )}
              <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6" />
              </label>
              <input ref={fileInputRef} id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">{formData.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{user.role}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">Ações da Conta</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button variant="outline" onClick={() => handleFeatureClick('Alterar senha')}>Alterar Senha</Button>
              <Button variant="destructive" onClick={() => handleFeatureClick('Excluir conta')}>Excluir Conta</Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cortar Foto</DialogTitle></DialogHeader>
          {imageToCrop && <Cropper ref={cropperRef} src={imageToCrop} style={{ height: 400, width: '100%' }} aspectRatio={1} viewMode={1} guides={false} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCrop}>Salvar Foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ProfileField = ({ label, isEditing, value, onChange, type = 'text' }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
    {isEditing ? (
      <input type={type} value={value || ''} onChange={onChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
    ) : (
      <p className="text-slate-800 dark:text-white font-medium">{type === 'date' && value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : value || 'Não informado'}</p>
    )}
  </div>
);

export default Profile;