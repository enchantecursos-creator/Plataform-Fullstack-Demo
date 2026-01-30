import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Filter, BookOpen, Video, Headphones, Image as ImageIcon, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const Materials = ({ user }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const userPlanId = user.material_package_id;

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    let query;

    if (user.role === 'ADMIN') {
      query = supabase.from('materials').select('*');
    } else if (user.role === 'PROFESSOR') {
      const { data: packageIdsData, error: packageIdsError } = await supabase
        .from('professor_material_packages')
        .select('package_id')
        .eq('professor_id', user.id);

      if (packageIdsError) {
        toast({ variant: "destructive", title: "Erro ao buscar pacotes do professor", description: packageIdsError.message });
        setLoading(false);
        return;
      }

      const packageIds = packageIdsData.map(p => p.package_id);

      if (packageIds.length === 0) {
        setMaterials([]);
        setLoading(false);
        return;
      }

      query = supabase
        .from('materials')
        .select(`
            *,
            package_materials!inner(
                package_id
            )
        `)
        .in('package_materials.package_id', packageIds);

    } else { // ALUNO
      if (!userPlanId) {
        setMaterials([]);
        setLoading(false);
        return;
      }
      query = supabase
        .from('materials')
        .select(`
            *,
            package_materials!inner(
                package_id
            )
        `)
        .eq('package_materials.package_id', userPlanId);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar materiais",
        description: error.message
      });
      setMaterials([]);
    } else {
      const uniqueMaterials = Array.from(new Map(data.map(item => [item.id, item])).values());
      setMaterials(uniqueMaterials);
    }
    setLoading(false);
  }, [toast, userPlanId, user.role, user.id]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleActionClick = material => {
    if (!material.file_url) {
      toast({
        title: "🚧 Sem URL",
        description: `Este material ainda não possui um arquivo ou link para visualização/download.`
      });
      return;
    }
    window.open(material.file_url, '_blank');
  };

  const levels = [{
    id: 'all',
    name: 'Todos os Níveis'
  }, {
    id: 'A1',
    name: 'A1 - Iniciante'
  }, {
    id: 'A2',
    name: 'A2 - Básico'
  }, {
    id: 'B1',
    name: 'B1 - Intermediário'
  }, {
    id: 'B2',
    name: 'B2 - Intermediário Superior'
  }, {
    id: 'C1',
    name: 'C1 - Avançado'
  }, {
    id: 'C2',
    name: 'C2 - Proficiente'
  }];

  const materialTypes = [{
    id: 'all',
    name: 'Todos os Tipos',
    icon: FileText
  }, {
    id: 'Slide',
    name: 'Slides',
    icon: ImageIcon
  }, {
    id: 'Plano de aula',
    name: 'Planos de Aula',
    icon: FileText
  }, {
    id: 'Atividades',
    name: 'Atividades',
    icon: BookOpen
  }, {
    id: 'Vídeo',
    name: 'Vídeos',
    icon: Video
  }, {
    id: 'Áudio',
    name: 'Áudios',
    icon: Headphones
  }, {
    id: 'Leitura',
    name: 'Leituras',
    icon: BookOpen
  }, {
    id: 'Exercícios',
    name: 'Exercícios',
    icon: BookOpen
  }, {
    id: 'Outro',
    name: 'Outros',
    icon: FileText
  }];

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) || material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()) || material.tags && material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = selectedLevel === 'all' || material.level === selectedLevel;
    const matchesType = selectedType === 'all' || material.type === selectedType;
    return matchesSearch && matchesLevel && matchesType;
  });

  const getTypeIcon = type => {
    const typeObj = materialTypes.find(t => t.id === type);
    return typeObj ? typeObj.icon : FileText;
  };

  const getTypeColor = type => {
    switch (type) {
      case 'Slide':
        return 'text-purple-500';
      case 'Vídeo':
        return 'text-blue-500';
      case 'Áudio':
        return 'text-green-500';
      default:
        return 'text-red-500';
    }
  };

  const defaultCoverImage = "https://images.unsplash.com/photo-1587822558436-48912b584855?q=80&w=2070&auto=format&fit=crop";

  return <div className="p-6 space-y-6">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Materiais </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Acesse e baixe materiais exclusivos para seu aprendizado. {user.role === 'ALUNO' && `Plano atual: `}<span className="font-bold text-purple-600 dark:text-purple-400">{user.role === 'ALUNO' ? user.plan : 'Acesso Total'}</span>
        </p>
      </motion.div>

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Buscar materiais..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              {materialTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Carregando materiais...</p> : filteredMaterials.map((material, index) => {
        const TypeIcon = getTypeIcon(material.type);
        return <motion.div key={material.id} initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: index * 0.1
        }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
              <div className="relative">
                <img src={material.cover_url || defaultCoverImage} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" alt={`Capa do material: ${material.title}`} />
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${material.level === 'A1' || material.level === 'A2' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : material.level === 'B1' || material.level === 'B2' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'}`}>
                    {material.level}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <div className={`w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg`}>
                    <TypeIcon className={`w-4 h-4 ${getTypeColor(material.type)}`} />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 line-clamp-2">
                  {material.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                  {material.description}
                </p>

                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {Math.floor(Math.random() * 1000)}
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {(Math.random() * (5 - 4.5) + 4.5).toFixed(1)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleActionClick(material)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" onClick={() => handleActionClick(material)}>
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
            </motion.div>;
      })}
      </div>

      {!loading && filteredMaterials.length === 0 && <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
            Nenhum material encontrado
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Você não tem acesso a materiais ou os filtros não retornaram resultados.
          </p>
        </motion.div>}
    </div>;
};
export default Materials;