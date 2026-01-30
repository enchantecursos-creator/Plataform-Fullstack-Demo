import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatWhatsAppNumber = (number) => {
  if (!number) return '';
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length < 10) return cleaned;
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const generateDealColor = (stageName) => {
  const colors = {
    'Ganhamos': 'bg-green-100 text-green-800 border-green-200',
    'Perdemos': 'bg-red-100 text-red-800 border-red-200',
    'Lead Recebido': 'bg-slate-100 text-slate-800 border-slate-200',
    'Negociação': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Diagnóstico/Briefing': 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return colors[stageName] || 'bg-white text-slate-800 border-slate-200';
};

export const calculateDealMetrics = (deals) => {
  if (!deals || deals.length === 0) return { total: 0, won: 0, lost: 0, rate: 0 };
  
  const totalValue = deals.reduce((acc, deal) => acc + (Number(deal.value) || 0), 0);
  const wonDeals = deals.filter(d => d.status === 'GANHO');
  const lostDeals = deals.filter(d => d.status === 'PERDIDO');
  const conversionRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

  return {
    totalValue,
    wonCount: wonDeals.length,
    lostCount: lostDeals.length,
    conversionRate: conversionRate.toFixed(1)
  };
};

export const maskSensitiveData = (value) => {
  if (!value) return '';
  if (value.length <= 8) return '********';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};