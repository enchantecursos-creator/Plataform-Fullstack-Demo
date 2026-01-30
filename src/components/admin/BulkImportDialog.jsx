import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

const BulkImportDialog = ({ isOpen, onClose, onImportComplete }) => {
    const [pastedData, setPastedData] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const { toast } = useToast();

    const handleImport = async () => {
        setIsImporting(true);
        setImportResults(null);
        
        if (!pastedData.trim()) {
             toast({
                variant: "destructive",
                title: "Nenhum dado encontrado",
                description: "Por favor, cole os dados dos alunos.",
            });
            setIsImporting(false);
            return;
        }

        const { data, error } = await supabase.functions.invoke('bulk-create-users-from-text', {
            body: { text_data: pastedData },
        });
        
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro na importação em massa',
                description: error.message,
            });
            setIsImporting(false);
            return;
        }

        if (data.error) {
             toast({
                variant: 'destructive',
                title: 'Erro no servidor durante a importação',
                description: data.error,
            });
            setIsImporting(false);
            return;
        }

        setImportResults(data.results);
        const successCount = data.results.filter(r => r.success).length;
        const totalCount = data.results.length;

        toast({
            title: "Importação concluída!",
            description: `${successCount} de ${totalCount} alunos importados.`,
        });

        setIsImporting(false);
        setPastedData(''); // Clear text area
        if (successCount > 0) {
            onImportComplete(); // Refresh user list if at least one was successful
        }
    };

    const handleClose = () => {
        if (isImporting) return;
        setPastedData('');
        setImportResults(null);
        onClose();
    };
    
    const copyResultsToClipboard = () => {
        if (!importResults) return;
        const textToCopy = importResults
            .map(result => `Nome: ${result.name}\nEmail: ${result.email}\nStatus: ${result.success ? `Sucesso - Senha: ${result.password}` : `Erro - ${result.error}`}`)
            .join('\n\n');
        navigator.clipboard.writeText(textToCopy);
        toast({ title: 'Resultados copiados para a área de transferência!' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-slate-800 dark:text-white">Importar Alunos em Massa</DialogTitle>
                    <DialogDescription>
                        Cole a lista de alunos (copiada do email, bloco de notas, etc). O sistema identificará os campos automaticamente.
                    </DialogDescription>
                </DialogHeader>

                {!importResults ? (
                    <div className="py-4 space-y-4">
                        <Textarea
                            placeholder="Cole os dados aqui..."
                            value={pastedData}
                            onChange={(e) => setPastedData(e.target.value)}
                            className="h-64 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                ) : (
                    <div className="py-4">
                         <h3 className="font-semibold mb-2 dark:text-white">Resultados da Importação:</h3>
                         <ScrollArea className="h-64 w-full rounded-md border p-4 dark:border-slate-700">
                             <div className="space-y-2">
                                 {importResults.map((result, index) => (
                                     <div key={index} className={`text-sm p-2 rounded-md ${result.success ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                         <p className="font-semibold dark:text-white">{result.name} ({result.email})</p>
                                         {result.success ? (
                                             <p className="text-green-700 dark:text-green-400">Sucesso! Senha: <span className="font-bold">{result.password}</span></p>
                                         ) : (
                                             <p className="text-red-700 dark:text-red-400">Erro: {result.error}</p>
                                         )}
                                     </div>
                                 ))}
                             </div>
                         </ScrollArea>
                    </div>
                )}
                
                <DialogFooter>
                    {importResults ? (
                         <>
                            <Button variant="outline" onClick={copyResultsToClipboard}>Copiar Resultados</Button>
                            <Button onClick={handleClose}>Fechar</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button onClick={handleImport} disabled={isImporting || !pastedData} className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                                {isImporting ? 'Importando...' : 'Importar Alunos'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BulkImportDialog;