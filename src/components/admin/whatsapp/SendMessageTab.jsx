import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  Filter,
  GraduationCap,
  BookOpen,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useStudentRecipients } from '@/hooks/useStudentRecipients';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const SendMessageTab = () => {
  const { toast } = useToast();
  
  // Hook integration
  const { 
    students,
    loading,
    error,
    refetch,
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
    filteredCount,
    totalCount
  } = useStudentRecipients();

  // Updated: We no longer need getWhatsAppChannelKey as it is handled by backend
  const { sendMessageToStudent } = useWhatsAppIntegration();
  
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendProgress, setSendProgress] = useState(null);

  const handleSendClick = async () => {
    if (selectedIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum aluno selecionado",
        description: "Selecione pelo menos um aluno para enviar a mensagem."
      });
      return;
    }
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Mensagem vazia",
        description: "Digite uma mensagem para enviar."
      });
      return;
    }

    // Key check removed - server side validation will handle it
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirm(false);
    setIsSending(true);
    
    const studentsToSend = getSelectedStudents();
    setSendProgress({ current: 0, total: studentsToSend.length });

    let successCount = 0;
    let failCount = 0;
    let errors = [];

    for (let i = 0; i < studentsToSend.length; i++) {
      const student = studentsToSend[i];
      setSendProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        // Updated: Removed apiKey argument
        const result = await sendMessageToStudent(student.id, message);
        
        if (result && result.success) {
          successCount++;
        } else {
          failCount++;
          if (result && result.error) errors.push(result.error);
        }
      } catch (error) {
        console.error(`Failed to send to student ${student.id}`, error);
        failCount++;
      }
      
      // Throttle
      await new Promise(r => setTimeout(r, 400));
    }

    setIsSending(false);
    setSendProgress(null);
    setMessage('');
    deselectAll();
    
    if (failCount === 0) {
        toast({
            title: "Envio Concluído com Sucesso",
            description: `Mensagem enviada para ${successCount} alunos.`,
            variant: "default",
            className: "bg-green-50 border-green-200"
        });
    } else {
        toast({
            title: "Envio Finalizado com Erros",
            description: `Enviado: ${successCount}. Falhas: ${failCount}. ${errors.length > 0 ? `Erro comum: ${errors[0]}` : ''}`,
            variant: "destructive"
        });
    }
  };

  const handleSelectAllChange = (checked) => {
    if (checked) {
      selectAll();
    } else {
      deselectAll();
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Filtros de Destinatários</h3>
          </div>
          <div className="text-xs text-slate-500">
             Exibindo {filteredCount} de {totalCount} alunos
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              className="pl-9 h-10"
            />
          </div>
          
          <Select 
            value={filters.classId} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, classId: value }))}
          >
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <BookOpen className="w-4 h-4 opacity-50" />
                <SelectValue placeholder="Turma" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Turmas</SelectItem>
              {classrooms.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.level || c.name || 'Turma sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.teacherId} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, teacherId: value }))}
          >
            <SelectTrigger className="h-10">
               <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <GraduationCap className="w-4 h-4 opacity-50" />
                <SelectValue placeholder="Professor" />
               </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Professores</SelectItem>
              {professors.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.paymentStatus} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
          >
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <DollarSign className="w-4 h-4 opacity-50" />
                <SelectValue placeholder="Financeiro" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="paid">✅ Em Dia</SelectItem>
              <SelectItem value="pending">⏳ Pendente</SelectItem>
              <SelectItem value="overdue">🔴 Em Atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
        
        {/* Student Table */}
        <div className="xl:col-span-7 flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] xl:h-auto">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  Lista de Alunos
                </h3>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                  {selectedIds.length} selecionados
                </span>
                {selectedIds.length > 0 && (
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={deselectAll}
                      className="h-6 text-[10px] text-red-500 hover:text-red-600"
                    >
                      Limpar
                    </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto relative">
             {loading ? renderSkeletons() : error ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                  <Button onClick={refetch} variant="outline" size="sm">
                     <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
                  </Button>
                </div>
             ) : (
               <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                           checked={isAllVisibleSelected} 
                           onCheckedChange={handleSelectAllChange}
                           disabled={filteredCount === 0}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead className="hidden md:table-cell">Turma/Prof</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                           Nenhum aluno encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => {
                         const isSelected = selectedIds.includes(student.id);
                         return (
                            <TableRow 
                               key={student.id} 
                               className={`cursor-pointer ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                               onClick={() => toggleSelection(student.id)}
                            >
                               <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox 
                                     checked={isSelected}
                                     onCheckedChange={() => toggleSelection(student.id)}
                                  />
                               </TableCell>
                               <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                     <span>{student.name}</span>
                                     <span className="md:hidden text-xs text-slate-500">{student.className}</span>
                                  </div>
                               </TableCell>
                               <TableCell className="text-slate-600 dark:text-slate-400 text-xs font-mono">
                                  {student.whatsapp}
                               </TableCell>
                               <TableCell className="hidden md:table-cell">
                                  <div className="flex flex-col gap-0.5 text-xs">
                                     <span className="font-medium text-slate-700 dark:text-slate-300">{student.className}</span>
                                     <span className="text-slate-500">{student.teacherName}</span>
                                  </div>
                               </TableCell>
                               <TableCell>
                                  {student.paymentStatus === 'overdue' && (
                                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 whitespace-nowrap">
                                      Atrasado
                                    </Badge>
                                  )}
                                  {student.paymentStatus === 'pending' && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-200 bg-amber-50 whitespace-nowrap">
                                      Pendente
                                    </Badge>
                                  )}
                                  {student.paymentStatus === 'paid' && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-green-600 border-green-200 bg-green-50 whitespace-nowrap">
                                      Em Dia
                                    </Badge>
                                  )}
                               </TableCell>
                            </TableRow>
                         );
                      })
                    )}
                  </TableBody>
               </Table>
             )}
          </div>
        </div>

        {/* Message Composition */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
            <div className="mb-4">
              <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">Mensagem</Label>
              <p className="text-xs text-slate-500 mt-1">
                Envio individual para {selectedIds.length} alunos selecionados.
              </p>
            </div>
            
            <Textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá {{nome}}! Gostaria de informar sobre a turma {{turma}}..."
              className="flex-1 resize-none min-h-[250px] text-base p-4 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20"
            />
            
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                {message.length > 0 && (
                   <span className={message.length > 1000 ? "text-amber-500 font-medium" : ""}>
                     {message.length} caracteres
                   </span>
                )}
              </div>
              
              <Button 
                onClick={handleSendClick}
                disabled={isSending || selectedIds.length === 0 || !message.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm h-12 text-base font-medium transition-all"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Enviando ({sendProgress?.current}/{sendProgress?.total})
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Mensagem ({selectedIds.length})
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 flex gap-3">
             <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
             <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-medium">Variáveis Disponíveis</p>
                <div className="flex flex-wrap gap-2 pt-1">
                   {['{{nome}}', '{{turma}}', '{{email}}', '{{telefone}}'].map(tag => (
                      <code key={tag} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700" onClick={() => setMessage(prev => prev + " " + tag)}>
                        {tag}
                      </code>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Confirmar Envio
            </DialogTitle>
            <DialogDescription>
              Você está prestes a iniciar um envio em massa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                    <span className="block text-2xl font-bold text-blue-600">{selectedIds.length}</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Destinatários</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-700">
                    <span className="block text-2xl font-bold text-green-600">~{(selectedIds.length * 1.5 / 60).toFixed(1)}</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Minutos estimados</span>
                </div>
             </div>
             
             <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500 font-bold">Pré-visualização (exemplo)</Label>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 max-h-[150px] overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                  "{message.replace('{{nome}}', 'Maria').replace('{{turma}}', 'Inglês Básico').replace('{{telefone}}', '(11) 99999-9999')}"
                </div>
             </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleConfirmSend} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
              Confirmar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendMessageTab;