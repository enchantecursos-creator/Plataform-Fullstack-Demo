import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCRM } from '@/hooks/useCRM';

const WhatsAppIntegrationPanel = () => {
  const { syncWhatsAppMessages } = useCRM();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncWhatsAppMessages();
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    }
    setSyncing(false);
  };

  return (
    <Card className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
            WhatsApp Web
            <div className={`w-3 h-3 rounded-full ${syncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} title="Status Conexão" />
        </CardTitle>
        <CardDescription>Sincronização e envio rápido</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sync">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="sync">Sincronização</TabsTrigger>
                <TabsTrigger value="send">Envio Rápido</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sync" className="space-y-4">
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-sm text-slate-500 mb-4">Última sincronização: {lastSync ? lastSync.toLocaleTimeString() : 'Nunca'}</p>
                    <Button onClick={handleSync} disabled={syncing} className="w-full">
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </Button>
                </div>
                <div className="text-xs text-slate-400 text-center">
                    A sincronização busca mensagens novas do WhatsApp Web e atualiza os cards do CRM.
                </div>
            </TabsContent>

            <TabsContent value="send" className="space-y-4">
                <div className="space-y-2">
                    <Label>Número (55...)</Label>
                    <Input placeholder="5511999999999" />
                </div>
                <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea placeholder="Olá, tudo bem?" rows={4} />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4 mr-2" /> Enviar
                </Button>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WhatsAppIntegrationPanel;