import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Send,
  FileText,
  History,
  Settings,
  Calendar,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';

// Import sub-components
import SendMessageTab from '@/components/admin/whatsapp/SendMessageTab';
import ScheduledMessagesTab from '@/components/admin/whatsapp/ScheduledMessagesTab';
import AutomationsTab from '@/components/admin/whatsapp/AutomationsTab';
import AutoResponsesTab from '@/components/admin/whatsapp/AutoResponsesTab';

const WhatsAppIntegration = () => {
  const [activeTab, setActiveTab] = useState('send');
  const { getApiKey } = useWhatsAppIntegration();
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check if API key exists to show/hide warning or redirect to settings
    getApiKey().then(key => setHasApiKey(!!key));
  }, [getApiKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-full flex flex-col"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 flex-1 flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Integração WhatsApp
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Hub de comunicação e automação
              </p>
            </div>
          </div>
          {!hasApiKey && (
             <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
               ⚠️ API Key não configurada
             </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="send">
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              <Calendar className="w-4 h-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="automations">
              <Zap className="w-4 h-4 mr-2" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="responses">
              <MessageCircle className="w-4 h-4 mr-2" />
              Respostas Auto
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <TabsContent value="send" className="h-full mt-0">
              <SendMessageTab />
            </TabsContent>

            <TabsContent value="scheduled" className="h-full mt-0">
              <ScheduledMessagesTab />
            </TabsContent>

            <TabsContent value="automations" className="h-full mt-0">
              <AutomationsTab />
            </TabsContent>

            <TabsContent value="responses" className="h-full mt-0">
              <AutoResponsesTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default WhatsAppIntegration;