import { externalInvoiceService } from './externalInvoiceService';
import { createSale, type CreateSalePayload } from './salesService';
import type { InvoiceItem, InvoicePayload } from '@/types';

function b64ToUtf8(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return atob(b64);
  }
}

function toInvoicePayload(raw: any): InvoicePayload {
  const number = String(
    raw.invoiceNumber || raw.numero_facture || raw.number || raw.id || `INV-${Date.now()}`
  );
  const date = String(raw.invoiceDate || raw.date_facture || new Date().toISOString());

  const itemsSrc = Array.isArray(raw.items) ? raw.items : Array.isArray(raw.produits) ? raw.produits : [];
  const items: InvoiceItem[] = itemsSrc.map((p: any, idx: number) => {
    const qty = Number(p.qty ?? p.quantite ?? 1);
    const unitPriceHT = Number(p.unitPriceHT ?? p.prix_ht ?? 0);
    const tvaRate = Number(p.tvaRate ?? 0.2);
    return { sku: p.sku || `${number}-${idx}`, name: p.name || p.nom || 'Produit', qty, unitPriceHT, tvaRate };
  });

  const ht = items.reduce((s, it) => s + it.unitPriceHT * it.qty, 0);
  const ttc = Number(raw.totalTTC ?? raw.montant_ttc ?? raw.amount ?? 0) || Math.round(ht * 1.2 * 100) / 100;

  return {
    invoiceNumber: number,
    invoiceDate: date,
    client: { name: raw.client?.name || raw.nom_client || 'Client inconnu' },
    items,
    totals: { ht, tva: Math.max(0, ttc - ht), ttc },
    payment: { method: raw.payment_method || raw.payment?.method || 'card', paid: true, paidAmount: ttc },
    channels: { source: 'Facturation', via: 'DirectImport' },
    idempotencyKey: number,
  };
}

export async function processImportFromHash(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const prefix = '#import=';
  if (!hash.startsWith(prefix)) return false;
  try {
    const b64 = hash.slice(prefix.length);
    const jsonStr = b64ToUtf8(b64);
    const raw = JSON.parse(jsonStr);

    // 1) Normaliser en InvoicePayload et stocker côté factures externes
    const payload = toInvoicePayload(raw);
    externalInvoiceService.receiveInvoice(payload);
    window.dispatchEvent(new CustomEvent('external-invoices-updated'));

    // 2) Créer une vente rattachée à la vendeuse
    const vendorName: string = raw.vendeuse || raw.vendorName || 'Externe';
    const vendorId: string = raw.vendorId || 'external';
    const timestamp = Date.parse(payload.invoiceDate) || Date.now();
    const totalAmount = payload.totals.ttc;
    const paymentMethod = (payload.payment?.method as any) || 'card';

    const items = payload.items.map((it) => ({
      id: `${payload.invoiceNumber}-${it.sku}`,
      name: it.name,
      price: Math.round(it.unitPriceHT * (1 + it.tvaRate) * 100) / 100,
      quantity: it.qty,
      category: 'Externe',
      addedAt: new Date()
    }));

    const salePayload: CreateSalePayload = {
      vendorId,
      vendorName,
      totalAmount,
      paymentMethod,
      canceled: false,
      timestamp,
      items
    } as CreateSalePayload;

    await createSale(salePayload);

    // 3) Nettoyer le hash pour éviter réimport au refresh
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState({}, document.title, url.toString());

    console.log('✅ Import direct terminé');
    return true;
  } catch (e) {
    console.error('❌ Import direct échoué:', e);
    return false;
  }
}


