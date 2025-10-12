import { useState, useEffect, useCallback } from 'react';
import { syncService, type Invoice, type SyncStats } from '@/services/syncService';
import { externalInvoiceService } from '@/services/externalInvoiceService';
import type { InvoicePayload } from '@/types';

/**
 * Hook pour gérer la synchronisation des factures
 */
export const useSyncInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<SyncStats>({
    totalInvoices: 0,
    pendingInvoices: 0,
    partialInvoices: 0,
    lastSyncTime: null,
    syncStatus: 'idle'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronisation des factures
  const syncInvoices = useCallback(async () => {
    try {
      setStats((prev: SyncStats) => ({ ...prev, syncStatus: 'syncing' }));
      setError(null);
      
      const [invoicesData, statsData] = await Promise.all([
        syncService.getInvoices(),
        syncService.getSyncStats()
      ]);
      
      setInvoices(invoicesData);
      setStats({ ...statsData, syncStatus: 'idle' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de synchronisation';
      setError(errorMessage);
      setStats((prev: SyncStats) => ({ 
        ...prev, 
        syncStatus: 'error', 
        errorMessage 
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  // Mise à jour du statut d'un produit
  const updateItemStatus = useCallback(async (
    invoiceId: string, 
    itemId: string, 
    newStatus: 'pending' | 'available' | 'delivered' | 'cancelled'
  ) => {
    try {
      const success = await syncService.updateItemStatus(invoiceId, itemId, newStatus);
      
      if (success) {
        // Mise à jour optimiste de l'état local
        setInvoices((prev: Invoice[]) => prev.map((invoice: Invoice) => 
          invoice.id === invoiceId 
            ? {
                ...invoice,
                items: invoice.items.map((item) =>
                  item.id === itemId 
                    ? { ...item, status: newStatus }
                    : item
                ),
                updatedAt: new Date()
              }
            : invoice
        ));
        
        // Recalculer les stats
        const newStats = await syncService.getSyncStats();
        setStats((prev: SyncStats) => ({ ...prev, ...newStats }));
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      return false;
    }
  }, []);

  // Filtrer les factures par statut
  const filterInvoicesByStatus = useCallback((status?: Invoice['status']) => {
    if (!status) return invoices;
    return invoices.filter((invoice: Invoice) => invoice.status === status);
  }, [invoices]);

  // Rechercher des factures
  const searchInvoices = useCallback((query: string) => {
    if (!query.trim()) return invoices;
    
    const lowercaseQuery = query.toLowerCase();
    return invoices.filter((invoice: Invoice) => 
      invoice.clientName.toLowerCase().includes(lowercaseQuery) ||
      invoice.number.toLowerCase().includes(lowercaseQuery) ||
      invoice.items.some((item) => 
        item.productName.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [invoices]);

  // Réinitialiser les factures (pour RAZ)
  const resetInvoices = useCallback(() => {
    setInvoices([]);
    setStats({
      totalInvoices: 0,
      pendingInvoices: 0,
      partialInvoices: 0,
      lastSyncTime: null,
      syncStatus: 'idle'
    });
    console.log('🔄 Reset des factures N8N effectué');
  }, []);

  // Effet pour la synchronisation initiale et automatique
  useEffect(() => {
    syncInvoices();
    
    // 🚫 DÉSACTIVÉ : Démarrer la sync auto (pour éviter les boucles infinies)
    // syncService.startAutoSync();
    
    // Écouter les événements de sync
    const unsubscribe = syncService.addListener((data: { type: string }) => {
      if (data.type === 'item_status_updated') {
        // Resynchroniser après une mise à jour
        syncInvoices();
      }
    });
    
    return () => {
      syncService.stopAutoSync();
      unsubscribe();
    };
  }, [syncInvoices]);

  // Pont: écouter les factures externes et alimenter le store 'invoices' utilisé par SalesTab
  useEffect(() => {
    const convertPayloadToInvoice = (p: InvoicePayload): Invoice => {
      const items = (p.items || []).map((it, idx) => ({
        id: `${p.invoiceNumber}-item-${idx}`,
        productName: it.name,
        category: 'Divers',
        quantity: Number(it.qty || 1),
        unitPrice: Number(it.unitPriceHT) * (1 + Number(it.tvaRate || 0)),
        totalPrice: Number(it.unitPriceHT) * (1 + Number(it.tvaRate || 0)) * Number(it.qty || 1),
        status: 'pending' as const,
      }));
      const totalTTC = Number(p.totals?.ttc || items.reduce((s, it) => s + it.totalPrice, 0));
      return {
        id: p.idempotencyKey,
        number: p.invoiceNumber,
        clientName: p.client?.name || 'Client inconnu',
        clientEmail: p.client?.email,
        clientPhone: p.client?.phone,
        items,
        totalHT: Number(p.totals?.ht || Math.round((totalTTC / 1.2) * 100) / 100),
        totalTTC,
        status: 'draft',
        dueDate: new Date(p.invoiceDate),
        createdAt: new Date(p.invoiceDate),
        updatedAt: new Date(),
        vendorId: undefined,
        vendorName: 'N8N',
        notes: p.channels?.source,
        paymentDetails: undefined,
      };
    };

    const refreshFromExternal = () => {
      try {
        const payloads = externalInvoiceService.getAllInvoices();
        if (!payloads || payloads.length === 0) return;
        const mapped: Invoice[] = payloads.map(convertPayloadToInvoice);
        setInvoices(mapped);
        // Mettre à jour le cache pour cohérence avec syncService
        try {
          localStorage.setItem('cachedInvoices', JSON.stringify(mapped));
        } catch {}
      } catch (e) {
        console.warn('Bridge external→sync invoices ignoré:', e);
      }
    };

    // 1) charger immédiatement si dispo
    refreshFromExternal();

    // 2) écouter les mises à jour
    const handler = () => refreshFromExternal();
    if (typeof window !== 'undefined') {
      window.addEventListener('external-invoices-updated', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('external-invoices-updated', handler as EventListener);
      }
    };
  }, []);

  return {
    invoices,
    stats,
    loading,
    error,
    syncInvoices,
    resetInvoices,
    updateItemStatus,
    filterInvoicesByStatus,
    searchInvoices
  };
};
