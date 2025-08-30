import { useState, useEffect } from 'react';
import { pendingPaymentsService, type PendingPayment } from '@/services/pendingPaymentsService';

export function useRAZPendingPayments() {
  const [reglementsData, setReglementsData] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await pendingPaymentsService.list();
      setReglementsData(items);
    } catch (err) {
      console.error('Erreur chargement règlements:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des règlements');
    } finally {
      setLoading(false);
    }
  };

  const refreshPendingPayments = () => {
    void loadPendingPayments();
  };

  const clearAllPendingPayments = async () => {
    try {
      await pendingPaymentsService.clearAll();
      await loadPendingPayments();
    } catch (err) {
      console.error('Erreur suppression règlements:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression des règlements');
    }
  };

  useEffect(() => {
    void loadPendingPayments();
  }, []);

  return {
    reglementsData,
    loading,
    error,
    refreshPendingPayments,
    clearAllPendingPayments
  };
}
