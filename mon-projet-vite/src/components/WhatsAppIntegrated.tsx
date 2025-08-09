import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, X, CheckCircle2, AlertTriangle, Link2 } from 'lucide-react';
import type { Sale, Vendor, Invoice } from '../types';

interface WhatsAppReportPayload {
  to: string;
  time: string;
  auto: boolean;
  message: string;
  meta: { vendors: number; sales: number; invoices: number };
}

interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
}

interface WhatsAppIntegratedProps {
  vendors: Vendor[];
  sales: Sale[];
  invoices?: Invoice[];
  cart?: unknown[]; // optionnel, non utilisé ici
  onSendReport?: (reportData: WhatsAppReportPayload, config: WhatsAppSendResult) => void;
  onClose?: () => void;
}

const fmtEUR = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export default function WhatsAppIntegrated({ vendors, sales, invoices = [], onSendReport, onClose }: WhatsAppIntegratedProps) {
  const [managerPhone, setManagerPhone] = useState<string>('+33 6 12 34 56 78');
  const [sendHour, setSendHour] = useState<string>('20:00');
  const [autoSend, setAutoSend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const stats = useMemo(() => {
    const validSales = sales.filter(s => !s.canceled);
    const caisseByPayment = {
      card: validSales.filter(v => v.paymentMethod === 'card').reduce((s, v) => s + v.totalAmount, 0),
      cash: validSales.filter(v => v.paymentMethod === 'cash').reduce((s, v) => s + v.totalAmount, 0),
      check: validSales.filter(v => v.paymentMethod === 'check').reduce((s, v) => s + v.totalAmount, 0),
      multi: validSales.filter(v => v.paymentMethod === 'multi').reduce((s, v) => s + v.totalAmount, 0),
    };
    const caisseTotal = Object.values(caisseByPayment).reduce((a, b) => a + b, 0);
    const facturierTotal = invoices.reduce((s, inv) => s + inv.totalTTC, 0);
    const caTotal = caisseTotal + facturierTotal;
    const nbVentesTotal = validSales.length + invoices.length;

    const byVendor = vendors.map(v => {
      const sv = validSales.filter(s => s.vendorName === v.name);
      const inv = invoices.filter(i => i.vendorName === v.name);
      const total = sv.reduce((s, it) => s + it.totalAmount, 0) + inv.reduce((s, it) => s + it.totalTTC, 0);
      return { name: v.name, total };
    }).filter(v => v.total > 0).sort((a,b) => b.total - a.total);

    return { caisseByPayment, caisseTotal, facturierTotal, caTotal, nbVentesTotal, byVendor };
  }, [sales, invoices, vendors]);

  const preview = useMemo(() => {
    const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const lines: string[] = [];
    lines.push(`Rapport MyConfort – ${dateStr}`);
    lines.push('');
    lines.push(`CA total: ${fmtEUR(stats.caTotal)} | Ventes: ${stats.nbVentesTotal}`);
    lines.push(`• Caisse: ${fmtEUR(stats.caisseTotal)} | Facturier: ${fmtEUR(stats.facturierTotal)}`);
    lines.push(`• Paiements: CB ${fmtEUR(stats.caisseByPayment.card)} | Espèces ${fmtEUR(stats.caisseByPayment.cash)} | Chèque ${fmtEUR(stats.caisseByPayment.check)} | Mixte ${fmtEUR(stats.caisseByPayment.multi)}`);
    if (stats.byVendor.length) {
      lines.push('');
      lines.push('Top vendeuses:');
      lines.push(...stats.byVendor.slice(0, 5).map(v => `- ${v.name}: ${fmtEUR(v.total)}`));
    }
    return lines.join('\n');
  }, [stats]);

  const testConnection = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/test-connection');
      const data = await res.json();
      setTestStatus(data.success ? 'ok' : 'error');
    } catch (err) {
      console.error(err);
      setTestStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const sendReport = async () => {
    const payload: WhatsAppReportPayload = {
      to: managerPhone,
      time: sendHour,
      auto: autoSend,
      message: preview,
      meta: { vendors: vendors.length, sales: sales.length, invoices: invoices.length }
    };
    try {
      setLoading(true);
      // Simulation d'envoi côté front; si backend dispo, décommentez:
      // const res = await fetch('/api/whatsapp/send-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      // const data: WhatsAppSendResult = await res.json();
      const data: WhatsAppSendResult = { success: true, messageId: `wa_sim_${Date.now()}` };
      onSendReport?.(payload, data);
      alert('Rapport WhatsApp envoyé (simulation).');
    } catch (err) {
      console.error(err);
      alert('Échec envoi WhatsApp (simulation).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 720 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: '#25D366', color: 'white', padding: 8, borderRadius: 10 }}>
            <MessageSquare size={18} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: '#000' }}>WhatsApp – Rapport quotidien</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="touch-feedback" title="Fermer" style={{ background: 'transparent', border: 'none' }}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="card mb-4" style={{ borderLeft: '4px solid #25D366' }}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-semibold" style={{ color: '#000' }}>Numéro du manager</label>
            <input className="input" value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} placeholder="+33 ..." />
          </div>
          <div>
            <label className="text-sm font-semibold" style={{ color: '#000' }}>Heure d'envoi</label>
            <input className="input" type="time" value={sendHour} onChange={(e) => setSendHour(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 mb-2" style={{ color: '#000' }}>
            <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
            Envoi automatique
          </label>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={testConnection} className="whatsapp-button touch-feedback" style={{ backgroundColor: '#e8f9ef', color: '#0f5132', border: '2px solid #25D366', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link2 size={16} /> Tester la connexion
            </button>
            {testStatus === 'ok' && <span className="flex items-center gap-1 text-green-700"><CheckCircle2 size={16} /> OK</span>}
            {testStatus === 'error' && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle size={16} /> Simulation uniquement</span>}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="whatsapp-preview" style={{ background: 'linear-gradient(135deg, #dcf8c6 0%, #b8f5a3 100%)', borderRadius: 12, padding: 15 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', color: '#111', margin: 0 }}>{preview}</pre>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button disabled={loading} onClick={sendReport} className="whatsapp-button touch-feedback" style={{ backgroundColor: '#25D366', color: 'white', padding: '12px 16px', borderRadius: 10, border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.8 : 1 }}>
          <Send size={18} /> Envoyer le rapport
        </button>
      </div>
    </div>
  );
}
