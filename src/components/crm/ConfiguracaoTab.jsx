import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCRM } from '@/hooks/useCRM';
import { Eye, EyeOff, Save, CheckCircle2, Activity, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';

const ConfiguracaoTab = ({ user }) => {
  const { saveConfig, getCaktoConfig, testCaktoConnection } = useCRM();
  const [caktoKey, setCaktoKey] = useState('');
  const [caktoSecret, setCaktoSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState([]);

  useEffect(() => {
    // Load config
    getCaktoConfig().then(config => {
        if (config?.clientId) setCaktoKey(config.clientId);
        // Secret is usually not returned fully for security, or we return placeholder
    });
    
    // Load recent webhooks
    fetchWebhooks();
  }, [getCaktoConfig]);

  const fetchWebhooks = async () => {
    const { data } = await supabase.from('crm_webhooks_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    if (data) setWebhooks(data);
  };

  const handleSaveCakto = async () => {
    setLoading(true);
    await saveConfig('CAKTO_CLIENT_ID', caktoKey, user.id);
    await saveConfig('CAKTO_CLIENT_SECRET', caktoSecret, user.id);
    setLoading(false);
  };

  const handleTestConnection = async () => {
    await testCaktoConnection();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Integrações</CardTitle>
                <CardDescription>Gerencie as conexões externas do CRM</CardDescription>
                </CardHeader>
                <CardContent>
                <Tabs defaultValue="cakto">
                    <TabsList className="mb-4">
                    <TabsTrigger value="cakto">Cakto</TabsTrigger>
                    <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                    </TabsList>

                    <TabsContent value="cakto" className="space-y-4">
                    <div className="space-y-2">
                        <Label>Client ID (API Key)</Label>
                        <Input 
                            value={caktoKey} 
                            onChange={(e) => setCaktoKey(e.target.value)} 
                            placeholder="Insira seu Client ID" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Client Secret</Label>
                        <div className="relative">
                        <Input 
                            type={showSecret ? 'text' : 'password'} 
                            value={caktoSecret} 
                            onChange={(e) => setCaktoSecret(e.target.value)} 
                            placeholder="Insira seu Client Secret" 
                        />
                        <button 
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button onClick={handleSaveCakto} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Salvando...' : 'Salvar Credenciais'}
                        </Button>
                        <Button variant="outline" onClick={handleTestConnection}>
                        <Activity className="w-4 h-4 mr-2" /> Testar Conexão
                        </Button>
                    </div>
                    </TabsContent>

                    <TabsContent value="whatsapp">
                    <div className="p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold">WhatsApp Web Ativo</span>
                        </div>
                        <p className="text-sm">A integração está funcionando através do Edge Function de sincronização.</p>
                    </div>
                    </TabsContent>
                </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" /> Logs de Webhooks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {webhooks.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-4">Nenhum evento registrado recentemente.</div>
                        ) : (
                            webhooks.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={log.status === 'PROCESSED' ? 'success' : 'secondary'}>
                                            {log.status}
                                        </Badge>
                                        <span className="font-mono font-medium">{log.event_type}</span>
                                        <span className="text-slate-500 text-xs uppercase">{log.webhook_type}</span>
                                    </div>
                                    <span className="text-slate-400 text-xs">
                                        {new Date(log.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                        <Button variant="link" size="sm" className="w-full mt-2" onClick={fetchWebhooks}>Atualizar Logs</Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                 <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Endpoint de Webhook</h4>
                 <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                     Configure este URL no painel da Cakto para receber atualizações de vendas.
                 </p>
                 <code className="block bg-white dark:bg-black/20 p-2 rounded text-xs break-all mb-2 select-all">
                     https://[PROJECT_REF].supabase.co/functions/v1/webhooks-cakto
                 </code>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoTab;