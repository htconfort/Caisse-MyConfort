import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Printer, Mail, Eye, EyeOff, RefreshCw, PlayCircle, XCircle } from 'lucide-react';
import type { Sale, Vendor } from '../types';
import type { Invoice } from '@/services/syncService';
import { externalInvoiceService } from '../services/externalInvoiceService';
import WhatsAppIntegrated from './WhatsAppIntegrated';
import { ensureSession as ensureSessionHelper, closeCurrentSession as closeCurrentSessionHelper, computeTodayTotalsFromDB, getCurrentSession as getCurrentSessionHelper, updateCurrentSessionEvent as updateCurrentSessionEventHelper } from '@/services/sessionService';
import type { SessionDB } from '@/types';
import { pendingPaymentsService, type PendingPayment } from '@/services/pendingPaymentsService';
import { RAZGuardModal } from './RAZGuardModal';
import { useRAZGuardSetting } from '../hooks/useRAZGuardSetting';

// Types pour WhatsApp
interface ReportData {
  date: string;
  totalSales: number;
  salesCount: number;
  topVendor: string;
  topVendorSales: number;
  avgSale: number;
  paymentBreakdown: {
    [key: string]: number;
  };
}

interface WhatsAppConfig {
  managerNumber: string;
  teamNumbers: string[];
  autoSendEnabled: boolean;
  sendTime: string;
  includeImage: boolean;
  businessNumber: string;
}

// (Données désormais chargées via pendingPaymentsService)

interface FeuilleDeRAZProProps {
  sales: Sale[];
  invoices: Invoice[];
  vendorStats: Vendor[];
  exportDataBeforeReset: () => void;
  executeRAZ: () => void;
}

interface VendeusesAvecDetail extends Vendor {
  detailPaiements: { carte: number; especes: number; cheque: number; mixte: number; };
  totalCalcule: number;
  nbVentesCalcule: number;
}

function FeuilleDeRAZPro({ sales, invoices, vendorStats, exportDataBeforeReset, executeRAZ }: FeuilleDeRAZProProps) {
  const [modeApercu, setModeApercu] = useState(false);
  const [reglementsData, setReglementsData] = useState<PendingPayment[]>([]);
  
  // ===== WORKFLOW SÉCURISÉ =====
  const [isViewed, setIsViewed] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [workflowCompleted, setWorkflowCompleted] = useState(false);

  // ===== RAZ GUARD MODAL =====
  const { mode: razGuardMode, ready: razGuardReady } = useRAZGuardSetting("daily");
  const [showRAZGuardModal, setShowRAZGuardModal] = useState(false);

  // ===== SESSION (uniquement dans l'onglet RAZ) =====
  const [session, setSession] = useState<SessionDB | undefined>();
  const [sessLoading, setSessLoading] = useState(true);
  const [openingSession, setOpeningSession] = useState(false);
  // Champs événement (saisis le premier jour)
  const [eventName, setEventName] = useState('');
  const [eventStart, setEventStart] = useState(''); // yyyy-mm-dd
  const [eventEnd, setEventEnd] = useState('');     // yyyy-mm-dd

  // ===== VALIDATION DATE FIN SESSION =====
  const canEndSessionToday = useMemo(() => {
    if (!session?.eventEnd) return false;
    const today = new Date();
    const sessionEndDate = new Date(session.eventEnd);
    
    // On peut faire RAZ Fin Session seulement si on est à la date de fin ou après
    return today.getTime() >= sessionEndDate.getTime();
  }, [session?.eventEnd]);

  const toInputDate = (ms?: number) => {
    if (!ms) return '';
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const endOfDay = (ms: number) => {
    const d = new Date(ms);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };

  const isTodayFirstDayOf = (openedAt?: number) => {
    if (!openedAt) return false;
    const o = new Date(openedAt); o.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return o.getTime() === t.getTime();
  };

  const refreshSession = useCallback(async () => {
    try {
      const s = await getCurrentSessionHelper();
      setSession(s);
      // Hydrater les champs événement depuis la session
      if (s) {
        setEventName(s.eventName ?? '');
        setEventStart(toInputDate(s.eventStart));
        setEventEnd(toInputDate(s.eventEnd));
      }
    } finally {
      setSessLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  // Charger les règlements à venir depuis le service
  useEffect(() => {
    (async () => {
      const items = await pendingPaymentsService.list();
      setReglementsData(items);
    })();
  }, []);

  const openSession = useCallback(async () => {
    setOpeningSession(true);
    try {
      console.log('🔄 Ouverture de session...', { eventName, eventStart, eventEnd });
      
      // Convertir les dates en format approprié
      const eventStartMs = eventStart ? new Date(eventStart).getTime() : undefined;
      const eventEndMs = eventEnd ? new Date(eventEnd).getTime() : undefined;
      
      // Passer les infos d'événement si fournies
      const sessionParams = {
        openedBy: 'system',
        ...(eventName && { eventName }),
        ...(eventStartMs && { eventStart: eventStartMs }),
        ...(eventEndMs && { eventEnd: eventEndMs })
      };
      
      console.log('📝 Paramètres session:', sessionParams);
      
      await ensureSessionHelper(sessionParams);
      console.log('✅ Session ouverte avec succès');
      
      await refreshSession();
    } catch (e) {
      console.error('❌ Erreur ouverture session:', e);
      alert("Erreur lors de l'ouverture de la session: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOpeningSession(false);
    }
  }, [eventName, eventStart, eventEnd, refreshSession]);

  const onSaveEventFirstDay = useCallback(async () => {
    try {
      await updateCurrentSessionEventHelper({ eventName: eventName || undefined, eventStart: eventStart || undefined, eventEnd: eventEnd || undefined });
      await refreshSession();
      alert('Détails de l\'événement enregistrés.');
    } catch (e) {
      console.error('Erreur mise à jour événement:', e);
      const msg = e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement de l\'événement';
      alert(msg);
    }
  }, [eventName, eventStart, eventEnd, refreshSession]);

  const closeSession = useCallback(async () => {
    // Empêcher la clôture si le dernier jour n'est pas passé
    if (session?.eventEnd) {
      const now = Date.now();
      if (now < endOfDay(session.eventEnd)) {
        alert(`La session ne peut pas être clôturée avant la fin de l'événement (dernier jour: ${new Date(session.eventEnd).toLocaleDateString('fr-FR')}).`);
        return;
      }
    }
    const ok = window.confirm('Clôturer la session de caisse en cours ?');
    if (!ok) return;
    try {
      const totals = await computeTodayTotalsFromDB();
      await closeCurrentSessionHelper({ closedBy: 'system', totals });
      await refreshSession();
    } catch (e) {
      console.error('Erreur fermeture session:', e);
      const msg = e instanceof Error ? e.message : 'Erreur lors de la fermeture de la session';
      alert(msg);
    }
  }, [session, refreshSession]);

  // ===== CALCULS =====
  const calculs = useMemo(() => {
    const validSales = sales.filter(sale => !sale.canceled);

    const caisseParPaiement = {
      carte: validSales.filter(v => v.paymentMethod === 'card').reduce((s, v) => s + v.totalAmount, 0),
      especes: validSales.filter(v => v.paymentMethod === 'cash').reduce((s, v) => s + v.totalAmount, 0),
      cheque: validSales.filter(v => v.paymentMethod === 'check').reduce((s, v) => s + v.totalAmount, 0),
      mixte: validSales.filter(v => v.paymentMethod === 'multi').reduce((s, v) => s + v.totalAmount, 0),
    };

    const caisseTotal = Object.values(caisseParPaiement).reduce((s: number, a) => s + a, 0);
    const caisseNbVentes = validSales.length;
    const caisseTicketMoyen = caisseNbVentes > 0 ? caisseTotal / caisseNbVentes : 0;

    const facturierTotal = invoices.reduce((s, inv) => s + inv.totalTTC, 0);
    const facturierNbVentes = invoices.length;
    const facturierTicketMoyen = facturierNbVentes > 0 ? facturierTotal / facturierNbVentes : 0;

    const caTotal = caisseTotal + facturierTotal;
    const nbVentesTotal = caisseNbVentes + facturierNbVentes;
    const ticketMoyen = nbVentesTotal > 0 ? caTotal / nbVentesTotal : 0;

    const vendeusesAvecDetail = vendorStats.map(vendeur => {
      const ventesVendeur = validSales.filter(v => v.vendorName === vendeur.name);
      const facturesVendeur = invoices.filter(f => f.vendorName === vendeur.name);

      const detailPaiements = {
        carte: ventesVendeur.filter(v => v.paymentMethod === 'card').reduce((s, v) => s + v.totalAmount, 0),
        especes: ventesVendeur.filter(v => v.paymentMethod === 'cash').reduce((s, v) => s + v.totalAmount, 0),
        cheque: ventesVendeur.filter(v => v.paymentMethod === 'check').reduce((s, v) => s + v.totalAmount, 0),
        mixte: ventesVendeur.filter(v => v.paymentMethod === 'multi').reduce((s, v) => s + v.totalAmount, 0),
      };

      const totalCaisseVendeur = Object.values(detailPaiements).reduce((s: number, a) => s + a, 0);
      const totalFacturierVendeur = facturesVendeur.reduce((s, f) => s + f.totalTTC, 0);
      const totalVendeur = totalCaisseVendeur + totalFacturierVendeur;
      const nbVentesVendeur = ventesVendeur.length + facturesVendeur.length;

      return {
        ...vendeur,
        detailPaiements,
        totalCaisse: totalCaisseVendeur,
        totalFacturier: totalFacturierVendeur,
        totalCalcule: totalVendeur,
        nbVentesCalcule: nbVentesVendeur,
        nbVentesCaisse: ventesVendeur.length,
        nbVentesFacturier: facturesVendeur.length
      };
    });

    const vendeusesActives = vendeusesAvecDetail.filter(v => v.totalCalcule > 0).length;

    const totalReglementsAVenir = reglementsData.reduce((total: number, r: PendingPayment) => total + (r.nbCheques * r.montantCheque), 0);
    const nbClientsAttente = reglementsData.length;
    const nbChequesTotal = reglementsData.reduce((total: number, r: PendingPayment) => total + r.nbCheques, 0);

    return {
      parPaiement: caisseParPaiement,
      caTotal,
      nbVentesTotal,
      ticketMoyen,
      vendeusesActives,
      vendeusesAvecDetail,
      caisseTotal,
      caisseNbVentes,
      caisseTicketMoyen,
      caisseParPaiement,
      facturierTotal,
      facturierNbVentes,
      facturierTicketMoyen,
      totalReglementsAVenir,
      nbClientsAttente,
      nbChequesTotal
    };
  }, [sales, invoices, vendorStats, reglementsData]);

  // ===== IMPRESSION POPUP - COMPACT A4 =====
  const imprimer = () => {
    try {
      const w = window.open('', '_blank');
      if (!w) {
        alert('Autorisez les popups pour imprimer.');
        return;
      }
      const html = genererHTMLImpression(calculs, reglementsData);
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
      w.close();
    } catch (e) {
      console.error('Erreur impression', e);
      alert('Erreur lors de l\'impression.');
    }
  };

  const genererHTMLImpression = (calculsData: {
    parPaiement: { carte: number; especes: number; cheque: number; mixte: number };
    caTotal: number; nbVentesTotal: number; ticketMoyen: number;
    vendeusesActives: number; vendeusesAvecDetail: VendeusesAvecDetail[];
    totalReglementsAVenir: number; nbClientsAttente: number; nbChequesTotal: number;
  }, reglementsData: PendingPayment[]) => {
    const eventLine = session?.eventName
      ? `<p style="margin:2px 0 6px; font-weight:700;">ÉVÉNEMENT : ${session.eventName}${session.eventStart && session.eventEnd ? ` (du ${new Date(session.eventStart).toLocaleDateString('fr-FR')} au ${new Date(session.eventEnd).toLocaleDateString('fr-FR')})` : ''}</p>`
      : '';
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>MyConfort - Feuille de caisse</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body { margin:0; padding:0; background:#fff; }
  body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.25; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet {
    width: 190mm; min-height: calc(297mm - 20mm); max-height: calc(297mm - 20mm);
    margin: 0 auto; padding: 8mm; overflow: hidden; color: #000;
  }
  h1 { font-size: 22pt; margin: 0 0 2mm; }
  h2 { font-size: 16pt; margin: 0 0 2mm; }
  h3 { font-size: 12pt; margin: 0 0 2mm; }
  table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; }
  th, td { border: 1px solid #000; padding: 4px 6px; }
  thead th { background:#f0f0f0; font-weight: 700; }
  .text-center { text-align:center; }
  .text-right { text-align:right; }
  .font-bold { font-weight:700; }
  .bg-gray { background:#f7f7f7; }
  .section { margin-bottom: 10px; }
  .section-title { font-size: 12pt; font-weight:700; border-bottom:1.5px solid #000; padding-bottom:3px; margin-bottom:6px; }
  .kpi-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom: 10px; }
  .kpi { text-align:center; padding:10px; border:1.5px solid #000; background:#f8f8f8; }
  .kpi h3 { font-size: 11pt; margin:0 0 4px; }
  .kpi p  { margin:0; font-size:16pt; font-weight:700; }
  .kpi .sub { margin-top:3px; font-size:9pt; }
  /* Paiements compact + option pour masquer % */
  .payments th, .payments td { padding: 4px 5px; font-size: 10pt; }
  .payments .col-percent { width: 16mm; }
  /* Pour masquer la colonne % si besoin : */
  /* @media print { .payments .col-percent { display:none !important; } } */
</style>
</head>
<body>
<div class="sheet">
  <div style="text-align:center; margin-bottom:8px; padding-bottom:6px; border-bottom: 1.5px solid #000;">
    <h1 style="letter-spacing:2px; margin:0;">MYCONFORT</h1>
    <h2 style="margin:4px 0 2px;">FEUILLE DE CAISSE</h2>
    ${eventLine}
    <p style="margin:0; font-weight:700;">${
      new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase()
    }</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><h3>CHIFFRE D'AFFAIRES</h3><p>${calculsData.caTotal.toFixed(2)} €</p></div>
    <div class="kpi"><h3>NOMBRE DE VENTES</h3><p>${calculsData.nbVentesTotal}</p></div>
    <div class="kpi"><h3>TICKET MOYEN</h3><p>${calculsData.ticketMoyen.toFixed(2)} €</p></div>
    <div class="kpi"><h3>RÈGLEMENTS À VENIR</h3><p style="font-size:14pt">${calculsData.totalReglementsAVenir.toFixed(2)} €</p><div class="sub">${calculsData.nbChequesTotal} chèques</div></div>
  </div>

  <div class="section">
    <div class="section-title">CHIFFRE D'AFFAIRES PAR VENDEUSE ET MODE DE PAIEMENT</div>
    <table>
      <thead><tr>
        <th>VENDEUSE</th><th class="text-center">NB</th>
        <th class="text-right">CARTE (€)</th><th class="text-right">ESPÈCES (€)</th><th class="text-right">CHÈQUE (€)</th><th class="text-right">MIXTE (€)</th>
        <th class="text-right">TOTAL (€)</th>
      </tr></thead>
      <tbody>
        ${calculsData.vendeusesAvecDetail
          .filter(v => v.totalCalcule > 0)
          .sort((a, b) => b.totalCalcule - a.totalCalcule)
          .map(v => `
            <tr>
              <td class="font-bold">${v.name}</td>
              <td class="text-center">${v.nbVentesCalcule}</td>
              <td class="text-right font-bold">${v.detailPaiements.carte > 0 ? v.detailPaiements.carte.toFixed(2) : '-'}</td>
              <td class="text-right font-bold">${v.detailPaiements.especes > 0 ? v.detailPaiements.especes.toFixed(2) : '-'}</td>
              <td class="text-right font-bold">${v.detailPaiements.cheque > 0 ? v.detailPaiements.cheque.toFixed(2) : '-'}</td>
              <td class="text-right font-bold">${v.detailPaiements.mixte > 0 ? v.detailPaiements.mixte.toFixed(2) : '-'}</td>
              <td class="text-right font-bold bg-gray">${v.totalCalcule.toFixed(2)}</td>
            </tr>
          `).join('')}
        <tr style="background:#eee; font-weight:700;">
          <td style="border-width:1.5px">TOTAL</td>
          <td class="text-center" style="border-width:1.5px">${calculsData.nbVentesTotal}</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.parPaiement.carte.toFixed(2)}</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.parPaiement.especes.toFixed(2)}</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.parPaiement.cheque.toFixed(2)}</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.parPaiement.mixte.toFixed(2)}</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.caTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${reglementsData.length > 0 ? `
  <div class="section">
    <div class="section-title">RÈGLEMENTS À VENIR (FACTURIER)</div>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:8px; text-align:center;">
      <div style="padding:8px; background:#f0f0f0; border:1px solid #000; font-weight:700;">TOTAL ATTENDU<br/><span style="font-size:14pt">${(calculsData.totalReglementsAVenir).toFixed(2)} €</span></div>
      <div style="padding:8px; background:#f0f0f0; border:1px solid #000; font-weight:700;">CLIENTS EN ATTENTE<br/><span style="font-size:14pt">${calculsData.nbClientsAttente}</span></div>
      <div style="padding:8px; background:#f0f0f0; border:1px solid #000; font-weight:700;">CHÈQUES TOTAUX<br/><span style="font-size:14pt">${calculsData.nbChequesTotal}</span></div>
    </div>
    <table>
      <thead><tr>
        <th>VENDEUSE</th><th>CLIENT</th><th class="text-center">NB CHÈQUES</th><th class="text-right">MONTANT/CHÈQUE</th><th class="text-right">TOTAL CLIENT</th><th class="text-center">PROCHAINE ÉCHÉANCE</th>
      </tr></thead>
      <tbody>
        ${reglementsData
          .sort((a: PendingPayment, b: PendingPayment) => a.vendorName.localeCompare(b.vendorName))
          .map((r: PendingPayment) => `
            <tr>
              <td class="font-bold">${r.vendorName}</td>
              <td>${r.clientName}</td>
              <td class="text-center font-bold">${r.nbCheques}</td>
              <td class="text-right font-bold">${r.montantCheque.toFixed(2)} €</td>
              <td class="text-right font-bold bg-gray">${(r.nbCheques * r.montantCheque).toFixed(2)} €</td>
              <td class="text-center">${new Date(r.dateProchain).toLocaleDateString('fr-FR')}</td>
            </tr>
          `).join('')}
        <tr style="background:#eee; font-weight:700;">
          <td colspan="4" class="text-right" style="border-width:1.5px">TOTAL RÈGLEMENTS À VENIR :</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.totalReglementsAVenir.toFixed(2)} €</td>
          <td class="text-center" style="border-width:1.5px">${calculsData.nbChequesTotal} chèques</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">RÉPARTITION PAR MODE DE PAIEMENT</div>
    <table class="payments">
      <thead><tr>
        <th>MODE DE PAIEMENT</th>
        <th class="text-right">MONTANT (€)</th>
        <th class="text-center col-percent">%</th>
      </tr></thead>
      <tbody>
        <tr><td class="font-bold">CARTE BANCAIRE</td><td class="text-right font-bold">${calculsData.parPaiement.carte.toFixed(2)}</td><td class="text-center col-percent">${calculsData.caTotal>0?((calculsData.parPaiement.carte/calculsData.caTotal)*100).toFixed(1):'0.0'}%</td></tr>
        <tr><td class="font-bold">ESPÈCES</td><td class="text-right font-bold">${calculsData.parPaiement.especes.toFixed(2)}</td><td class="text-center col-percent">${calculsData.caTotal>0?((calculsData.parPaiement.especes/calculsData.caTotal)*100).toFixed(1):'0.0'}%</td></tr>
        <tr><td class="font-bold">CHÈQUE</td><td class="text-right font-bold">${calculsData.parPaiement.cheque.toFixed(2)}</td><td class="text-center col-percent">${calculsData.caTotal>0?((calculsData.parPaiement.cheque/calculsData.caTotal)*100).toFixed(1):'0.0'}%</td></tr>
        <tr><td class="font-bold">MIXTE</td><td class="text-right font-bold">${calculsData.parPaiement.mixte.toFixed(2)}</td><td class="text-center col-percent">${calculsData.caTotal>0?((calculsData.parPaiement.mixte/calculsData.caTotal)*100).toFixed(1):'0.0'}%</td></tr>
        <tr style="background:#eee; font-weight:700;">
          <td style="border-width:1.5px">TOTAL</td>
          <td class="text-right" style="border-width:1.5px">${calculsData.caTotal.toFixed(2)}</td>
          <td class="text-center col-percent" style="border-width:1.5px">100.0%</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section" style="margin-top:12px; padding-top:8px; border-top:1.5px solid #000;">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
      <div>
        <p style="margin:0 0 10px; font-weight:700;">RESPONSABLE DE CAISSE :</p>
        <div style="border-bottom:1.5px solid #000; height:24px; margin-bottom:6px;"></div>
        <p style="margin:0; font-size:9pt;">Signature et date</p>
      </div>
      <div>
        <p style="margin:0 0 6px; font-weight:700;">CLÔTURE :</p>
        <p style="margin:0; font-size:11pt; font-weight:700;">${
          new Date().toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
        }</p>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
  };

  // ===== EMAIL (inchangé) =====
  const envoyerEmail = () => {
    const dateJour = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    let contenuEmail = `MYCONFORT - FEUILLE DE CAISSE\n${dateJour.toUpperCase()}\n\n`;
    if (session?.eventName) {
      contenuEmail += `ÉVÉNEMENT : ${session.eventName}`;
      if (session.eventStart && session.eventEnd) {
        contenuEmail += ` (du ${new Date(session.eventStart).toLocaleDateString('fr-FR')} au ${new Date(session.eventEnd).toLocaleDateString('fr-FR')})`;
      }
      contenuEmail += `\n\n`;
    }
    contenuEmail += `RÉSUMÉ DU JOUR :\n- Chiffre d'affaires : ${calculs.caTotal.toFixed(2)} €\n- Nombre de ventes : ${calculs.nbVentesTotal}\n- Ticket moyen : ${calculs.ticketMoyen.toFixed(2)} €\n- Vendeuses actives : ${calculs.vendeusesActives}\n\n`;
    contenuEmail += `DÉTAIL PAR VENDEUSE :\n`;
    calculs.vendeusesAvecDetail.filter(v => v.totalCalcule>0).sort((a,b)=>b.totalCalcule-a.totalCalcule).forEach(v=>{
      contenuEmail += `${v.name} : ${v.totalCalcule.toFixed(2)} € (${v.nbVentesCalcule} ventes)\n`;
      contenuEmail += `  • Carte : ${v.detailPaiements.carte.toFixed(2)} €\n  • Espèces : ${v.detailPaiements.especes.toFixed(2)} €\n  • Chèque : ${v.detailPaiements.cheque.toFixed(2)} €\n`;
      if (v.detailPaiements.mixte>0) contenuEmail += `  • Mixte : ${v.detailPaiements.mixte.toFixed(2)} €\n`;
      contenuEmail += `\n`;
    });
    contenuEmail += `TOTAUX PAR MODE DE PAIEMENT :\n- Carte bancaire : ${calculs.parPaiement.carte.toFixed(2)} €\n- Espèces : ${calculs.parPaiement.especes.toFixed(2)} €\n- Chèque : ${calculs.parPaiement.cheque.toFixed(2)} €\n- Mixte : ${calculs.parPaiement.mixte.toFixed(2)} €\n\n`;
    contenuEmail += `RÈGLEMENTS À VENIR (FACTURIER) :\nTotal attendu : ${calculs.totalReglementsAVenir.toFixed(2)} € (${calculs.nbChequesTotal} chèques)\n\n`;
    reglementsData.forEach((r: PendingPayment)=>{
      const totalClient = r.nbCheques * r.montantCheque;
      contenuEmail += `${r.vendorName} - ${r.clientName} :\n  ${r.nbCheques} chèques de ${r.montantCheque.toFixed(2)} € = ${totalClient.toFixed(2)} €\n  Prochaine échéance : ${new Date(r.dateProchain).toLocaleDateString('fr-FR')}\n\n`;
    });
    contenuEmail += `Rapport généré automatiquement le ${new Date().toLocaleString('fr-FR')}\nMyConfort - Système de caisse`;
    const sujet = `MyConfort - Feuille de caisse du ${new Date().toLocaleDateString('fr-FR')}`;
    const to = 'myconfort66@gmail.com';
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(contenuEmail)}`;
    window.location.href = mailtoUrl;
  };

  // ===== FONCTIONS WORKFLOW SÉCURISÉ =====
  
  const effectuerVisualisation = () => {
    setModeApercu(true);
    setIsViewed(true);
  };

  const effectuerImpression = () => {
    if (!isViewed) {
      alert('⚠️ Veuillez d\'abord visualiser la feuille de RAZ.');
      return;
    }
    window.print();
    setIsPrinted(true);
  };

  const envoyerEmailSecurise = () => {
    if (!isViewed || !isPrinted) {
      alert('⚠️ Veuillez d\'abord visualiser et imprimer la feuille de RAZ.');
      return;
    }
    envoyerEmail(); // Appelle la fonction email existante
    setIsEmailSent(true);
    setWorkflowCompleted(true);
  };

  const effectuerRAZJourneeSecurisee = async () => {
    // Afficher le modal RAZ Guard au lieu des alerts
    setShowRAZGuardModal(true);
  };

  const confirmerRAZJournee = async () => {
    setShowRAZGuardModal(false);
    
    try {
      // 1. SAUVEGARDE AUTOMATIQUE FORCÉE
      console.log('🛡️ Sauvegarde automatique avant RAZ Journée...');
      await exportDataBeforeReset();
      
      // 2. Attendre 1.5 secondes pour que l'utilisateur voie la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 3. RAZ normale
      externalInvoiceService.clearAllInvoices();
      console.log('🧹 Factures externes nettoyées (RAZ Journée)');
      
      // 4. Réinitialiser le workflow
      setIsViewed(false);
      setIsPrinted(false);
      setIsEmailSent(false);
      setWorkflowCompleted(false);
      setModeApercu(false);
      
      alert('✅ RAZ Journée terminée avec succès !');
      executeRAZ();
    } catch (error) {
      console.error('❌ Erreur RAZ Journée:', error);
      alert('❌ Erreur lors de la RAZ Journée: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // RAZ Fin de session (purge aussi règlements à venir + clôture) - AVEC SAUVEGARDE AUTO
  const effectuerRAZFinSessionSecurisee = async () => {
    try {
      // 0. VÉRIFICATION DATE OBLIGATOIRE
      if (!canEndSessionToday) {
        const dateFinMessage = session?.eventEnd ? 
          `Vous pouvez effectuer la RAZ Fin Session à partir du ${new Date(session.eventEnd).toLocaleDateString('fr-FR')}.` :
          'Aucune date de fin de session configurée.';
        alert(`🚫 RAZ Fin Session non autorisée aujourd'hui.\n\n${dateFinMessage}\n\nSeule la RAZ Journée est disponible actuellement.`);
        return;
      }
      
      // 1. SAUVEGARDE AUTOMATIQUE FORCÉE
      console.log('🛡️ Sauvegarde automatique avant RAZ Fin Session...');
      await exportDataBeforeReset();
      
      // 2. Attendre 1.5 secondes pour que l'utilisateur voie la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 3. Confirmation avec mention de la sauvegarde
      const ok = window.confirm(
        '✅ Sauvegarde automatique effectuée !\n\n' +
        '⚠️ Cette action va remettre à zéro la session complète.\n' +
        'Les règlements à venir (chèques différés) et les factures externes seront supprimés, puis la session sera clôturée.\n\n' +
        'Confirmer la REMISE À ZÉRO FIN DE SESSION ?'
      );
      if (!ok) return;
      
      // 4. RAZ complète
      // 1) Nettoyer factures externes
      externalInvoiceService.clearAllInvoices();
      console.log('🧹 Factures externes nettoyées (RAZ Fin de session)');

      // 2) Purger règlements à venir
      await pendingPaymentsService.clearAll();
      setReglementsData([]);
      console.log('🧹 Règlements à venir nettoyés (RAZ Fin de session)');

      // 3) Fermer la session en base (si événement terminé, sinon on force la clôture logique)
      try {
        const totals = await computeTodayTotalsFromDB();
        await closeCurrentSessionHelper({ closedBy: 'system', totals });
        await refreshSession();
      } catch (err) {
        console.warn('⚠️ Impossible de clôturer proprement la session, on continue la RAZ fin de session:', err);
      }

      // 4) RAZ "de base" réutilisée
      await Promise.resolve(executeRAZ());
      console.log('✅ RAZ fin de session effectuée');
    } catch (e) {
      console.error('Erreur RAZ fin de session sécurisée:', e);
      alert('Erreur lors de la remise à zéro fin de session.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Modal RAZ Guard - Notification sécurisée avec emoji 😃 */}
      {razGuardReady && showRAZGuardModal && (
        <RAZGuardModal
          isViewed={isViewed}
          isPrinted={isPrinted}
          isEmailSent={isEmailSent}
          sessionId={session?.eventName ? `${session.eventName.replace(/\s+/g, '_').toLowerCase()}_${new Date().getDate()}` : 'caisse_myconfort'}
          showMode={razGuardMode}
          chimeSrc="/sounds/ding.mp3"
          onAcknowledge={() => {
            console.log('🛡️ RAZ Guard: Utilisateur a confirmé avoir lu les règles pour RAZ Journée');
            setShowRAZGuardModal(false);
            confirmerRAZJournee();
          }}
        />
      )}
      
      {/* UI iPad (masquée à l'impression) */}
      <div className="no-print" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: '30px', padding: '20px', backgroundColor: '#477A0C', color: 'white', borderRadius: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '2.2em', fontWeight: 'bold' }}>📋 FEUILLE DE CAISSE MYCONFORT</h1>
            <p style={{ margin: '10px 0 0 0', fontSize: '1.1em' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>

          {/* Session - ouverture/statut (haut de page) */}
          <div style={{ background: '#fff', border: '2px solid #DC2626', borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {sessLoading ? (
              <div style={{ color: '#991B1B', fontWeight: 600 }}>Chargement de la session...</div>
            ) : !session ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ color: '#991B1B', fontWeight: 700, fontSize: 16 }}>Aucune session de caisse ouverte</div>
                  <div style={{ color: '#7F1D1D' }}>Ouvrez une session pour enregistrer les ventes du jour.</div>
                </div>
                {/* Champs événement (facultatifs) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: 10 }}>
                  <input placeholder="Nom de l'événement (ex: Foire de Perpignan)" value={eventName} onChange={e=>setEventName(e.target.value)} style={inputStyle} />
                  <input type="date" placeholder="Début" value={eventStart} onChange={e=>setEventStart(e.target.value)} style={inputStyle} />
                  <input type="date" placeholder="Fin" value={eventEnd} onChange={e=>setEventEnd(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={openSession} 
                    disabled={openingSession}
                    style={{ 
                      ...btn(openingSession ? '#9CA3AF' : '#16A34A'), 
                      minWidth: 200,
                      opacity: openingSession ? 0.7 : 1,
                      cursor: openingSession ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <PlayCircle size={20} /> {openingSession ? 'Ouverture...' : 'Ouvrir la session'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#065F46', fontWeight: 700, fontSize: 16 }}>Session ouverte</div>
                    <div style={{ color: '#7F1D1D' }}>Depuis {new Date(session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    {session.eventName && (
                      <div style={{ marginTop: 6, color: '#7F1D1D', fontWeight: 600 }}>
                        Événement : {session.eventName}
                        {session.eventStart && session.eventEnd && (
                          <span> (du {new Date(session.eventStart).toLocaleDateString('fr-FR')} au {new Date(session.eventEnd).toLocaleDateString('fr-FR')})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ color: '#991B1B', fontWeight: 600 }}>Gestion de session en bas de page</div>
                </div>
                {/* Si premier jour: permettre de fixer/modifier l'événement */}
                {isTodayFirstDayOf(session.openedAt) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: 10, alignItems: 'center' }}>
                    <input placeholder="Nom de l'événement" value={eventName} onChange={e=>setEventName(e.target.value)} style={inputStyle} />
                    <input type="date" value={eventStart} onChange={e=>setEventStart(e.target.value)} style={inputStyle} />
                    <input type="date" value={eventEnd} onChange={e=>setEventEnd(e.target.value)} style={inputStyle} />
                    <button onClick={onSaveEventFirstDay} style={btn('#16A34A')}>
                      Enregistrer l'événement
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boutons - Interface Améliorée */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 30 }}>
            {/* 🖤 Bouton Noir : Voir feuille de caisse */}
            <button 
              onClick={effectuerVisualisation} 
              style={btn(isViewed ? '#4A5568' : '#1A202C', true)}
              title={isViewed ? 'Feuille visualisée ✓' : 'Étape 1: Visualiser la feuille'}
            >
              {isViewed ? <EyeOff size={20} /> : <Eye size={20} />}
              {isViewed ? "Feuille vue ✓" : 'Voir la feuille'}
            </button>
            
            {/* 🟢 Bouton Vert : Imprimer feuille de caisse */}
            <button 
              onClick={effectuerImpression} 
              style={!isViewed ? btnDisabled('#22C55E') : btn('#22C55E')} 
              disabled={!isViewed}
              title={!isViewed ? 'Visualisez d\'abord la feuille' : isPrinted ? 'Impression effectuée ✓' : 'Étape 2: Imprimer la feuille'}
            >
              <Printer size={20}/>
              {isPrinted ? 'Imprimé ✓' : 'Imprimer'}
            </button>
            
            {/* 🟡 Bouton Jaune-Vert : Envoyer par email */}
            <button 
              onClick={envoyerEmailSecurise} 
              style={(!isViewed || !isPrinted) ? btnDisabled('#84CC16') : btn('#84CC16', false, '#1A202C')} 
              disabled={!isViewed || !isPrinted}
              title={!isViewed || !isPrinted ? 'Visualisez et imprimez d\'abord' : isEmailSent ? 'Email envoyé ✓' : 'Étape 3: Envoyer par email'}
            >
              <Mail size={20}/>
              {isEmailSent ? 'Email envoyé ✓' : 'Envoyer par Email'}
            </button>
            
            {/* 🔴 Bouton Rouge : RAZ Journée (avec sauvegarde auto) */}
            <button 
              onClick={effectuerRAZJourneeSecurisee} 
              style={!workflowCompleted ? btnDisabled('#DC2626') : btn('#DC2626')} 
              disabled={!workflowCompleted}
              title={!workflowCompleted ? 'Terminez d\'abord le workflow complet' : 'Étape 4: RAZ Journée sécurisée'}
            >
              <RefreshCw size={20}/>
              RAZ Journée
            </button>
            
            {/* 🔴 Bouton Rouge Foncé : RAZ Fin Session (avec sauvegarde auto) */}
            <button 
              onClick={effectuerRAZFinSessionSecurisee} 
              style={!canEndSessionToday ? btnDisabled('#7C2D12') : btn('#7C2D12')} 
              disabled={!canEndSessionToday}
              title={!canEndSessionToday ? 
                `RAZ Fin Session disponible seulement à partir du ${session?.eventEnd ? new Date(session.eventEnd).toLocaleDateString('fr-FR') : 'date de fin'}` : 
                'RAZ Fin Session - Supprime TOUT'
              }
            >
              <RefreshCw size={20}/>
              RAZ Fin Session
            </button>
          </div>

          {/* Aperçu */}
          {modeApercu && (
            <div style={{ background: '#fff', padding: 20, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '2px dashed #477A0C' }}>
              <h2 style={{ textAlign: 'center', color: '#477A0C', marginBottom: 16 }}>📄 APERÇU DE LA FEUILLE DE CAISSE</h2>
              <div id="feuille-imprimable"><FeuilleImprimable calculs={calculs} event={session ? { name: session.eventName, start: session.eventStart, end: session.eventEnd } : undefined} reglementsData={reglementsData} /></div>
            </div>
          )}

          {/* Section WhatsApp Business */}
          <div style={{ 
            background: 'white', 
            borderRadius: '10px', 
            marginTop: '30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '2px solid #25d366'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #25d366 0%, #075e54 100%)',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '8px 8px 0 0',
              marginBottom: '0'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.4em', fontWeight: 'bold' }}>
                📱 WhatsApp Business - Envoi automatique
              </h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', opacity: 0.9 }}>
                Rapports quotidiens et alertes objectifs via WhatsApp
              </p>
            </div>
            
            <WhatsAppIntegrated
              currentData={calculs}
              vendors={calculs.vendeusesAvecDetail.map(v => ({
                id: v.id,
                name: v.name,
                dailySales: v.totalCalcule,
                totalSales: v.totalCalcule
              }))}
              sales={sales.map(sale => ({
                id: sale.id,
                amount: sale.totalAmount,
                vendor: sale.vendorName,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              }))}
              cart={[]}
              onSendReport={(reportData: ReportData, config: WhatsAppConfig) => {
                console.log('📱 Rapport WhatsApp envoyé:', reportData);
                console.log('🔧 Configuration utilisée:', config);
                // Ici vous pourrez ajouter une logique de callback si nécessaire
              }}
            />
          </div>

          {/* Session - clôture (bas de page) */}
          <div style={{ background: '#fff', border: '2px solid #DC2626', borderRadius: 10, padding: 16, marginTop: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {sessLoading ? (
              <div style={{ color: '#991B1B', fontWeight: 600 }}>Chargement de la session...</div>
            ) : !session ? (
              <div style={{ color: '#991B1B' }}>Aucune session n'est ouverte actuellement.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ color: '#065F46', fontWeight: 700, fontSize: 16 }}>Session ouverte</div>
                  <div style={{ color: '#7F1D1D' }}>Ouverte à {new Date(session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  {session.eventName && (
                    <div style={{ marginTop: 6, color: '#7F1D1D', fontWeight: 600 }}>
                      Événement : {session.eventName}
                      {session.eventStart && session.eventEnd && (
                        <span> (du {new Date(session.eventStart).toLocaleDateString('fr-FR')} au {new Date(session.eventEnd).toLocaleDateString('fr-FR')})</span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={closeSession} style={{ ...btn('#DC2626'), minWidth: 220 }} disabled={Boolean(session.eventEnd && Date.now() < endOfDay(session.eventEnd))} title={session?.eventEnd && Date.now() < endOfDay(session.eventEnd) ? `Clôture autorisée à partir du ${new Date(session.eventEnd).toLocaleDateString('fr-FR')}` : undefined}>
                  <XCircle size={20} /> Clôturer la session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version imprimable */}
      <div className="print-only">
        <FeuilleImprimable calculs={calculs} event={session ? { name: session.eventName, start: session.eventStart, end: session.eventEnd } : undefined} reglementsData={reglementsData} />
      </div>

      {/* Styles impression (séparation écran/print) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            .no-print { display:none !important; visibility:hidden !important; }
            .print-only { display:block !important; visibility:visible !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow:none !important; text-shadow:none !important; }
            body { margin:0 !important; padding:0 !important; background:#fff !important; color:#000 !important; font-family: Arial, sans-serif !important; font-size:11pt !important; line-height:1.25 !important; }
            @page { size: A4 portrait; margin:10mm; }
          }
          @media screen { .print-only { display:none; } .no-print { display:block; } }
        `
        }}
      />

      {/* Style pour option masquer colonne % */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Dé-commente pour masquer la colonne % si ça déborde encore */
          /* .payments .col-percent { display: none !important; } */
        }
      `}}/>
    </div>
  );
}

const btn = (bg: string, white = true, color?: string) => ({
  padding: '15px 25px',
  fontSize: '1.05em',
  fontWeight: 'bold',
  backgroundColor: bg,
  color: color ?? (white ? 'white' : '#14281D'),
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10
});

const btnDisabled = (bg: string, white = true, color?: string) => ({
  ...btn(bg, white, color),
  backgroundColor: '#9CA3AF',
  color: '#6B7280',
  cursor: 'not-allowed',
  opacity: 0.6
});

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  fontSize: '0.95em'
};

interface FeuilleImprimableProps {
  calculs: {
    parPaiement: { carte: number; especes: number; cheque: number; mixte: number; };
    caTotal: number; nbVentesTotal: number; ticketMoyen: number;
    vendeusesActives: number; vendeusesAvecDetail: VendeusesAvecDetail[];
    totalReglementsAVenir: number; nbClientsAttente: number; nbChequesTotal: number;
  };
  event?: { name?: string; start?: number; end?: number };
  reglementsData?: PendingPayment[];
}

function FeuilleImprimable({ calculs, event, reglementsData = [] }: FeuilleImprimableProps) {
  return (
    <div style={{
      backgroundColor: '#fff', color: '#000', padding: '5mm',
      fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: 1.2,
      maxWidth: '210mm', margin: '0 auto', minHeight: '297mm'
    }}>
      {/* En-tête */}
      <div className="print-section" style={{ textAlign: 'center', marginBottom: 6, paddingBottom: 4, borderBottom: '1.5px solid #000' }}>
        <h1 style={{ margin: 0, fontSize: '20pt', fontWeight: 700, letterSpacing: '2px' }}>MYCONFORT</h1>
        <h2 style={{ margin: '3px 0 2px', fontSize: '14pt', fontWeight: 700 }}>FEUILLE DE CAISSE</h2>
        {event?.name && (
          <p style={{ margin: '2px 0 4px', fontWeight: 700, fontSize: '12pt', color: '#2563eb' }}>
            ÉVÉNEMENT : {event.name.toUpperCase()}
            {event.start && event.end && (
              <span> (du {new Date(event.start).toLocaleDateString('fr-FR')} au {new Date(event.end).toLocaleDateString('fr-FR')})</span>
            )}
          </p>
        )}
        <p style={{ margin: 0, fontWeight: 700 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
        </p>
      </div>

      {/* KPIs */}
      <div className="print-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 8 }}>
        {[
          ['CHIFFRE D\'AFFAIRES', `${calculs.caTotal.toFixed(2)} €`],
          ['NOMBRE DE VENTES', `${calculs.nbVentesTotal}`],
          ['TICKET MOYEN', `${calculs.ticketMoyen.toFixed(2)} €`],
          ['RÈGLEMENTS À VENIR', `${calculs.totalReglementsAVenir.toFixed(2)} €`],
        ].map(([title, value], i) => (
          <div key={i} style={{ textAlign: 'center', padding: 8, border: '1.5px solid #000', background: '#f8f8f8' }}>
            <h3 style={{ margin: '0 0 3px', fontSize: '10pt' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: '14pt', fontWeight: 700 }}>{value}</p>
            {i === 3 && <div style={{ marginTop: 2, fontSize: '8pt' }}>{calculs.nbChequesTotal} chèques</div>}
          </div>
        ))}
      </div>

      {/* Vendeuses */}
      <div className="print-section" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '11pt', fontWeight: 700, borderBottom: '1.5px solid #000', paddingBottom: 2, marginBottom: 4 }}>
          CHIFFRE D'AFFAIRES PAR VENDEUSE ET MODE DE PAIEMENT
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '9pt' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>VENDEUSE</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>NB</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>CARTE (€)</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>ESPÈCES (€)</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>CHÈQUE (€)</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>MIXTE (€)</th>
              <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>TOTAL (€)</th>
            </tr>
          </thead>
          <tbody>
            {calculs.vendeusesAvecDetail
              .filter(v => v.totalCalcule > 0)
              .sort((a, b) => b.totalCalcule - a.totalCalcule)
              .map(v => (
                <tr key={v.id}>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: 700 }}>{v.name}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>{v.nbVentesCalcule}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{v.detailPaiements.carte > 0 ? v.detailPaiements.carte.toFixed(2) : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{v.detailPaiements.especes > 0 ? v.detailPaiements.especes.toFixed(2) : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{v.detailPaiements.cheque > 0 ? v.detailPaiements.cheque.toFixed(2) : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{v.detailPaiements.mixte > 0 ? v.detailPaiements.mixte.toFixed(2) : '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700, background: '#f7f7f7' }}>{v.totalCalcule.toFixed(2)}</td>
                </tr>
              ))}
            <tr style={{ background: '#eee', fontWeight: 700 }}>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid' }}>TOTAL</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}>{calculs.nbVentesTotal}</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>{calculs.parPaiement.carte.toFixed(2)}</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>{calculs.parPaiement.especes.toFixed(2)}</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>{calculs.parPaiement.cheque.toFixed(2)}</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>{calculs.parPaiement.mixte.toFixed(2)}</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>{calculs.caTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Règlements à venir */}
      {reglementsData.length > 0 && (
        <div className="print-section" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '11pt', fontWeight: 700, borderBottom: '1.5px solid #000', paddingBottom: 2, marginBottom: 4 }}>
            RÈGLEMENTS À VENIR (FACTURIER)
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 6, textAlign: 'center' }}>
            <div style={{ padding: 6, background: '#f0f0f0', border: '1px solid #000', fontWeight: 700, fontSize: '9pt' }}>
              TOTAL ATTENDU<br/>
              <span style={{ fontSize: '12pt' }}>{calculs.totalReglementsAVenir.toFixed(2)} €</span>
            </div>
            <div style={{ padding: 6, background: '#f0f0f0', border: '1px solid #000', fontWeight: 700, fontSize: '9pt' }}>
              CLIENTS EN ATTENTE<br/>
              <span style={{ fontSize: '12pt' }}>{calculs.nbClientsAttente}</span>
            </div>
            <div style={{ padding: 6, background: '#f0f0f0', border: '1px solid #000', fontWeight: 700, fontSize: '9pt' }}>
              CHÈQUES TOTAUX<br/>
              <span style={{ fontSize: '12pt' }}>{calculs.nbChequesTotal}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '8pt' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>VENDEUSE</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'left' }}>CLIENT</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>NB CHÈQUES</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>MONTANT/CHÈQUE</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right' }}>TOTAL CLIENT</th>
                <th style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>PROCHAINE ÉCHÉANCE</th>
              </tr>
            </thead>
            <tbody>
              {reglementsData
                .sort((a: PendingPayment, b: PendingPayment) => a.vendorName.localeCompare(b.vendorName))
                .map((reglement: PendingPayment, index: number) => {
                  const totalClient = reglement.nbCheques * reglement.montantCheque;
                  return (
                    <tr key={index}>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: 700 }}>{reglement.vendorName}</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px' }}>{reglement.clientName}</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{reglement.nbCheques}</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700 }}>{reglement.montantCheque.toFixed(2)} €</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'right', fontWeight: 700, background: '#f7f7f7' }}>{totalClient.toFixed(2)} €</td>
                      <td style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center', fontSize: '9pt' }}>{new Date(reglement.dateProchain).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  );
                })}
              <tr style={{ background: '#eee', fontWeight: 700 }}>
                <td colSpan={4} style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>TOTAL RÈGLEMENTS À VENIR :</td>
                <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'right' }}>{calculs.totalReglementsAVenir.toFixed(2)} €</td>
                <td style={{ borderWidth: '1.5px', borderStyle: 'solid', textAlign: 'center' }}>{calculs.nbChequesTotal} chèques</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tableau modes de paiement COMPACT */}
      <div className="print-section" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '12pt', fontWeight: 700, borderBottom: '1.5px solid #000', paddingBottom: 3, marginBottom: 6 }}>
          RÉPARTITION PAR MODE DE PAIEMENT
        </div>
        
        <table className="payments" style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'left', fontSize: '10pt' }}>MODE DE PAIEMENT</th>
              <th style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'right', fontSize: '10pt' }}>MONTANT (€)</th>
              <th className="col-percent" style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'center', fontSize: '10pt', width: '16mm' }}>%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 5px', fontSize: '10pt', fontWeight: 700 }}>CARTE BANCAIRE</td>
              <td style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'right', fontSize: '10pt', fontWeight: 700 }}>{calculs.parPaiement.carte.toFixed(2)}</td>
              <td className="col-percent" style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'center', fontSize: '10pt' }}>{calculs.caTotal > 0 ? ((calculs.parPaiement.carte / calculs.caTotal) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 5px', fontSize: '10pt', fontWeight: 700 }}>ESPÈCES</td>
              <td style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'right', fontSize: '10pt', fontWeight: 700 }}>{calculs.parPaiement.especes.toFixed(2)}</td>
              <td className="col-percent" style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'center', fontSize: '10pt' }}>{calculs.caTotal > 0 ? ((calculs.parPaiement.especes / calculs.caTotal) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 5px', fontSize: '10pt', fontWeight: 700 }}>CHÈQUE</td>
              <td style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'right', fontSize: '10pt', fontWeight: 700 }}>{calculs.parPaiement.cheque.toFixed(2)}</td>
              <td className="col-percent" style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'center', fontSize: '10pt' }}>{calculs.caTotal > 0 ? ((calculs.parPaiement.cheque / calculs.caTotal) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '4px 5px', fontSize: '10pt', fontWeight: 700 }}>MIXTE</td>
              <td style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'right', fontSize: '10pt', fontWeight: 700 }}>{calculs.parPaiement.mixte.toFixed(2)}</td>
              <td className="col-percent" style={{ border: '1px solid #000', padding: '4px 5px', textAlign: 'center', fontSize: '10pt' }}>{calculs.caTotal > 0 ? ((calculs.parPaiement.mixte / calculs.caTotal) * 100).toFixed(1) : '0.0'}%</td>
            </tr>
            <tr style={{ background: '#eee', fontWeight: 700 }}>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', padding: '4px 5px', fontSize: '10pt' }}>TOTAL GÉNÉRAL</td>
              <td style={{ borderWidth: '1.5px', borderStyle: 'solid', padding: '4px 5px', textAlign: 'right', fontSize: '10pt' }}>{calculs.caTotal.toFixed(2)}</td>
              <td className="col-percent" style={{ borderWidth: '1.5px', borderStyle: 'solid', padding: '4px 5px', textAlign: 'center', fontSize: '10pt' }}>100.0%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pied de page */}
      <div className="print-section" style={{ marginTop: 12, paddingTop: 8, borderTop: '1.5px solid #000' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <p style={{ margin: '0 0 10px', fontWeight: 700 }}>RESPONSABLE DE CAISSE :</p>
            <div style={{ borderBottom: '1.5px solid #000', height: 24, marginBottom: 6 }}></div>
            <p style={{ margin: 0, fontSize: '9pt' }}>Signature et date</p>
          </div>
          
          <div>
            <p style={{ margin: '0 0 6px', fontWeight: 700 }}>CLÔTURE :</p>
            <p style={{ margin: 0, fontSize: '11pt', fontWeight: 700 }}>
              {new Date().toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeuilleDeRAZPro;
