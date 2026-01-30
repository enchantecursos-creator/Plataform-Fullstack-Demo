import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Key, Send, BrainCircuit, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/customSupabaseClient';

const AdminAI = () => {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState('');
    const [isKeySet, setIsKeySet] = useState(null);
    const [isLoadingKey, setIsLoadingKey] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const scrollAreaRef = useRef(null);

    const scrollToBottom = () => {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    };

    const checkApiKey = useCallback(async () => {
        setIsLoadingKey(true);
        const { data, error } = await supabase.functions.invoke('check-openai-key');
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao verificar chave de API', description: error.message });
            setIsKeySet(false);
        } else {
            setIsKeySet(data.isSet);
        }
        setIsLoadingKey(false);
    }, [toast]);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);
    
     useEffect(() => {
        if(isKeySet){
            setMessages([{ role: 'assistant', content: 'Olá! Estou pronto para ajudar. Como posso otimizar seu trabalho hoje?' }]);
        }
    }, [isKeySet]);

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            toast({ variant: 'destructive', title: 'Chave de API inválida', description: 'Por favor, insira uma chave de API válida.' });
            return;
        }
        setIsSaving(true);
        const { error } = await supabase.functions.invoke('save-openai-key', {
            body: { apiKey: apiKey },
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar a chave', description: error.message });
        } else {
            toast({ title: 'Chave de API salva com sucesso!' });
            setApiKey('');
            setIsKeySet(true);
        }
        setIsSaving(false);
    };

    const handleSendPrompt = async () => {
        if (!prompt.trim() || isThinking) return;

        const newMessages = [...messages, { role: 'user', content: prompt }];
        setMessages(newMessages);
        setPrompt('');
        setIsThinking(true);
        scrollToBottom();

        try {
            const { data, error } = await supabase.functions.invoke('openai-chat', {
                body: { messages: newMessages }
            });
            
            setIsThinking(false);

            if (error) {
                // This handles network errors or function crashes
                throw new Error(error.message);
            }

            if (data && data.error) {
                // This handles errors returned by the function logic (e.g., from OpenAI API)
                throw new Error(data.error);
            }

            if (data && data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                 throw new Error("A resposta da IA está vazia ou em um formato inesperado.");
            }

        } catch (err) {
            setIsThinking(false);
            const errorMessage = `Desculpe, não consegui processar sua solicitação. Detalhe: ${err.message}`;
            toast({ variant: 'destructive', title: 'Erro ao comunicar com a IA', description: err.message });
            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage}]);
        } finally {
            scrollToBottom();
        }
    };
    
    if (isLoadingKey) {
        return (
             <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Sparkles className="w-8 h-8 mr-4 animate-spin text-purple-500" />
                <p className="text-slate-600 dark:text-slate-400">Verificando conexão com a IA...</p>
            </div>
        )
    }

    if (!isKeySet) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="max-w-md mx-auto">
                    <Key className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Conecte sua Conta OpenAI</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Para ativar o assistente de IA, insira sua chave de API da OpenAI (ChatGPT). Ela será armazenada de forma segura.</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="flex-grow p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <Button onClick={handleSaveKey} disabled={isSaving} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isSaving ? 'Salvando...' : 'Salvar e Conectar'}
                        </Button>
                    </div>
                     <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">Não tem uma chave? Crie uma no <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-500">site da OpenAI</a>.</p>
                </div>
            </motion.div>
        );
    }

    return (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-18rem)] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <header className="p-4 border-b dark:border-slate-700 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-white"/>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Assistente IA</h3>
                    <p className="text-sm text-green-500 flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Conectado
                    </p>
                </div>
            </header>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                </div>
                            )}
                            <div className={`max-w-xl p-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                {msg.content}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex items-start gap-3 justify-start">
                             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t dark:border-slate-700">
                <div className="relative">
                    <Textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Escreva um título para uma aula sobre 'passé composé'..."
                        className="pr-20 min-h-[40px] dark:bg-slate-700"
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey){
                                e.preventDefault();
                                handleSendPrompt();
                            }
                        }}
                    />
                    <Button 
                        size="icon" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600"
                        onClick={handleSendPrompt}
                        disabled={isThinking || !prompt}
                    >
                        <Send className="w-4 h-4"/>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminAI;