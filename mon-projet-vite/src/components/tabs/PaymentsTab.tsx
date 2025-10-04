import type { Invoice } from '@/services/syncService';
import { AlertCircle, Calendar, CheckCircle, Clock, CreditCard, Edit, Euro, Plus, Receipt, Save, Store, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { vendors } from '../../data';
import type { Sale } from '../../types';

interface PaymentsTabProps {
  sales: Sale[];
  invoices: Invoice[];
}

// Interface pour unifier les règlements à venir
interface PendingPayment {
  id: string;
  source: 'sale' | 'invoice';
  sourceId: string;
  clientName: string;
  vendorName: string;
  vendorId: string;
  date: Date;
  checkDetails: {
    count: number;
    amount: number;
    totalAmount: number;
    notes?: string;
  };
  saleTotal?: number;
  invoiceNumber?: string;
}

// Interface pour les règlements perçus sur Stand
interface ReceivedPayment {
  id: string;
  clientName: string;
  invoiceNumber: string;
  checkReceived: number;
  numberOfChecks: number;
  vendorName: string;
  vendorId: string;
  date: Date;
}

// Type pour les sous-onglets
type PaymentSubTab = 'pending' | 'received';

// Format € solide
const fmtEUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export function PaymentsTab({ sales, invoices }: PaymentsTabProps) {
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set());
  const [activeSubTab, setActiveSubTab] = useState<PaymentSubTab>('pending');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [receivedPayments, setReceivedPayments] = useState<ReceivedPayment[]>([]);

  // Fonction pour basculer l'expansion d'un paiement
  const togglePaymentExpansion = (paymentId: string) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedPayments(newExpanded);
  };

  // Couleur vendeuse depuis le data store
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280';
  };

  // Extraire tous les règlements à venir des ventes et factures
  const pendingPayments = useMemo<PendingPayment[]>(() => {
    const payments: PendingPayment[] = [];

    // Règlements à venir des ventes caisse
    sales.forEach(sale => {
      if (sale.checkDetails && sale.paymentMethod === 'check' && !sale.canceled) {
        payments.push({
          id: `sale-${sale.id}`,
          source: 'sale',
          sourceId: sale.id,
          clientName: `Client Caisse ${sale.id.slice(-8)}`,
          vendorName: sale.vendorName,
          vendorId: sale.vendorId,
          date: new Date(sale.date),
          checkDetails: sale.checkDetails,
          saleTotal: sale.totalAmount
        });
      }
    });

    // Règlements à venir des factures N8N
    invoices.forEach(invoice => {
      if (invoice.paymentDetails?.checkDetails &&
        invoice.paymentDetails.method === 'check' &&
        invoice.paymentDetails.status !== 'completed') {

        const checkDetails = invoice.paymentDetails.checkDetails;
        payments.push({
          id: `invoice-${invoice.id}`,
          source: 'invoice',
          sourceId: invoice.id,
          clientName: invoice.clientName,
          vendorName: invoice.vendorName || 'N8N',
          vendorId: invoice.vendorId || '1',
          date: new Date(invoice.createdAt),
          checkDetails: {
            count: checkDetails.totalChecks,
            amount: checkDetails.checkAmounts?.[0] || (invoice.totalTTC / checkDetails.totalChecks),
            totalAmount: invoice.totalTTC,
            notes: checkDetails.characteristics || invoice.paymentDetails.paymentNotes
          },
          invoiceNumber: invoice.number
        });
      }
    });

    // Trier par date décroissante
    return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, invoices]);

  // Statistiques des règlements à venir
  const paymentStats = useMemo(() => {
    const totalAmount = pendingPayments.reduce((sum, payment) => sum + payment.checkDetails.totalAmount, 0);
    const totalChecks = pendingPayments.reduce((sum, payment) => sum + payment.checkDetails.count, 0);
    const salesCount = pendingPayments.filter(p => p.source === 'sale').length;
    const invoicesCount = pendingPayments.filter(p => p.source === 'invoice').length;

    return {
      totalAmount,
      totalChecks,
      salesCount,
      invoicesCount,
      totalOperations: pendingPayments.length
    };
  }, [pendingPayments]);

  // Initialisation des données des règlements perçus
  React.useEffect(() => {
    if (receivedPayments.length === 0) {
      // Données d'exemple pour la démonstration
      const mockReceivedPayments: ReceivedPayment[] = [
        {
          id: 'rec-001',
          clientName: 'Marie Dubois',
          invoiceNumber: 'FAC-2024-001',
          checkReceived: 450.00,
          numberOfChecks: 1,
          vendorName: 'Sophie Martin',
          vendorId: '1',
          date: new Date('2024-01-15')
        },
        {
          id: 'rec-002',
          clientName: 'Jean Dupont',
          invoiceNumber: 'FAC-2024-002',
          checkReceived: 320.50,
          numberOfChecks: 1,
          vendorName: 'Claire Bernard',
          vendorId: '2',
          date: new Date('2024-01-14')
        },
        {
          id: 'rec-003',
          clientName: 'Anne Moreau',
          invoiceNumber: 'FAC-2024-003',
          checkReceived: 680.00,
          numberOfChecks: 2,
          vendorName: 'Sophie Martin',
          vendorId: '1',
          date: new Date('2024-01-13')
        }
      ];

      const sortedPayments = mockReceivedPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReceivedPayments(sortedPayments);

      // Sauvegarder dans localStorage pour la feuille de caisse RAZ
      localStorage.setItem('receivedPayments', JSON.stringify(sortedPayments));
    }
  }, [receivedPayments.length]);

  // Fonctions pour l'édition des règlements perçus
  const handleEditPayment = (paymentId: string) => {
    setEditingPayment(paymentId);
  };

  const handleSavePayment = (paymentId: string, updatedPayment: Partial<ReceivedPayment>) => {
    setReceivedPayments(prev => {
      const updated = prev.map(payment =>
        payment.id === paymentId
          ? { ...payment, ...updatedPayment }
          : payment
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Sauvegarder dans localStorage pour la feuille de caisse RAZ
      localStorage.setItem('receivedPayments', JSON.stringify(updated));
      return updated;
    });
    setEditingPayment(null);
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
  };

  const handleAddPayment = (newPayment: Omit<ReceivedPayment, 'id'>) => {
    const id = `rec-${Date.now()}`;
    const paymentWithId: ReceivedPayment = { ...newPayment, id };
    setReceivedPayments(prev => {
      const updated = [...prev, paymentWithId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Sauvegarder dans localStorage pour la feuille de caisse RAZ
      localStorage.setItem('receivedPayments', JSON.stringify(updated));
      return updated;
    });
    setShowAddModal(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    setReceivedPayments(prev => {
      const updated = prev.filter(payment => payment.id !== paymentId);

      // Sauvegarder dans localStorage pour la feuille de caisse RAZ
      localStorage.setItem('receivedPayments', JSON.stringify(updated));
      return updated;
    });
  };

  // Couleurs pour les différents éléments
  const colors = {
    header: {
      bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      border: '#F59E0B'
    },
    stats: {
      totalAmount: { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', border: '#F59E0B', text: '#92400E' },
      totalChecks: { bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', border: '#10B981', text: '#065F46' },
      operations: { bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '#3B82F6', text: '#1E40AF' }
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* En-tête */}
      <div
        className="section-header"
        style={{
          background: colors.header.bg,
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">💳 Règlements</h2>
            <p className="text-lg opacity-90">
              Suivi complet des règlements et paiements
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {activeSubTab === 'pending' ? pendingPayments.length : receivedPayments.length}
            </div>
            <div className="text-sm opacity-90">
              {activeSubTab === 'pending' ? 'en attente' : 'perçus'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation des sous-onglets */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${activeSubTab === 'pending'
            ? 'bg-amber-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <Clock size={18} />
          Règlements à venir
        </button>
        <button
          onClick={() => setActiveSubTab('received')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${activeSubTab === 'received'
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          <Store size={18} />
          Règlement perçu sur Stand
        </button>
      </div>

      {/* Contenu conditionnel selon l'onglet actif */}
      {activeSubTab === 'pending' ? (
        <>
          {/* Statistiques pour règlements à venir */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              className="card text-center"
              style={{
                background: colors.stats.totalAmount.bg,
                borderLeft: `4px solid ${colors.stats.totalAmount.border}`,
                borderTop: `1px solid ${colors.stats.totalAmount.border}20`
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <Euro size={24} style={{ color: colors.stats.totalAmount.text }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.stats.totalAmount.text }}>
                Montant total
              </h3>
              <p className="text-3xl font-bold" style={{ color: colors.stats.totalAmount.text }}>
                {fmtEUR(paymentStats.totalAmount)}
              </p>
            </div>

            <div
              className="card text-center"
              style={{
                background: colors.stats.totalChecks.bg,
                borderLeft: `4px solid ${colors.stats.totalChecks.border}`,
                borderTop: `1px solid ${colors.stats.totalChecks.border}20`
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <CreditCard size={24} style={{ color: colors.stats.totalChecks.text }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.stats.totalChecks.text }}>
                Total chèques
              </h3>
              <p className="text-3xl font-bold" style={{ color: colors.stats.totalChecks.text }}>
                {paymentStats.totalChecks}
              </p>
            </div>

            <div
              className="card text-center"
              style={{
                background: colors.stats.operations.bg,
                borderLeft: `4px solid ${colors.stats.operations.border}`,
                borderTop: `1px solid ${colors.stats.operations.border}20`
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <Clock size={24} style={{ color: colors.stats.operations.text }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.stats.operations.text }}>
                Ventes caisse
              </h3>
              <p className="text-3xl font-bold" style={{ color: colors.stats.operations.text }}>
                {paymentStats.salesCount}
              </p>
            </div>

            <div
              className="card text-center"
              style={{
                background: colors.stats.operations.bg,
                borderLeft: `4px solid ${colors.stats.operations.border}`,
                borderTop: `1px solid ${colors.stats.operations.border}20`
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <AlertCircle size={24} style={{ color: colors.stats.operations.text }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: colors.stats.operations.text }}>
                Factures N8N
              </h3>
              <p className="text-3xl font-bold" style={{ color: colors.stats.operations.text }}>
                {paymentStats.invoicesCount}
              </p>
            </div>
          </div>

          {/* Liste des règlements à venir */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              📋 Règlements en attente
            </h3>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                <p className="text-xl text-gray-500 mb-2">Aucun règlement en attente</p>
                <p className="text-gray-400">Tous les paiements sont à jour !</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                <div className="table-scroll table-sticky">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendeuse</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Chèques</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((payment) => {
                        const isExpanded = expandedPayments.has(payment.id);

                        return (
                          <React.Fragment key={payment.id}>
                            <tr
                              className="border-b cursor-pointer transition-all duration-200 hover:bg-gray-50"
                              style={{
                                borderColor: '#F3F4F6',
                                borderLeft: `6px solid ${getVendorColor(payment.vendorId)}`,
                                background: `${getVendorColor(payment.vendorId)}10`
                              }}
                              onClick={() => togglePaymentExpansion(payment.id)}
                              title="Cliquer pour voir les détails"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-2 py-1 rounded text-xs font-semibold"
                                    style={{
                                      background: payment.source === 'sale' ? '#EBF8FF' : '#F3E8FF',
                                      color: payment.source === 'sale' ? '#1E40AF' : '#7C3AED'
                                    }}
                                  >
                                    {payment.source === 'sale' ? '🛒 Caisse' : '📋 Facture'}
                                  </span>
                                  {payment.invoiceNumber && (
                                    <span className="text-xs text-gray-500">#{payment.invoiceNumber}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {payment.clientName}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: getVendorColor(payment.vendorId) }}
                                  />
                                  <span className="font-semibold text-gray-700">{payment.vendorName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {payment.date.toLocaleDateString('fr-FR')}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                  {payment.checkDetails.count} chèques
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {fmtEUR(payment.checkDetails.totalAmount)}
                              </td>
                            </tr>

                            {/* Ligne de détails expansible */}
                            {isExpanded && (
                              <tr style={{ background: '#F8F9FA' }}>
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                      📄 Détail des chèques à venir
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-sm text-gray-600">Nombre de chèques</div>
                                        <div className="text-2xl font-bold text-amber-600">
                                          {payment.checkDetails.count}
                                        </div>
                                      </div>

                                      <div className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-sm text-gray-600">Montant par chèque</div>
                                        <div className="text-2xl font-bold text-green-600">
                                          {fmtEUR(payment.checkDetails.amount)}
                                        </div>
                                      </div>

                                      <div className="bg-white p-3 rounded border border-gray-200">
                                        <div className="text-sm text-gray-600">Montant total</div>
                                        <div className="text-2xl font-bold text-blue-600">
                                          {fmtEUR(payment.checkDetails.totalAmount)}
                                        </div>
                                      </div>
                                    </div>

                                    {payment.checkDetails.notes && (
                                      <div className="bg-amber-50 border border-amber-200 rounded p-3">
                                        <div className="text-sm font-semibold text-amber-800 mb-1">Notes :</div>
                                        <div className="text-sm text-amber-700">{payment.checkDetails.notes}</div>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
                                      <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {payment.date.toLocaleString('fr-FR')}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <CreditCard size={14} />
                                        Paiement par chèques
                                      </div>
                                      {payment.saleTotal && (
                                        <div className="flex items-center gap-1">
                                          <Euro size={14} />
                                          Total vente: {fmtEUR(payment.saleTotal)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Statistiques pour règlements perçus */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div
              className="card text-center"
              style={{
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                borderLeft: '4px solid #10B981',
                borderTop: '1px solid #10B98120'
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <Store size={24} style={{ color: '#065F46' }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#065F46' }}>
                Total perçu
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#065F46' }}>
                {fmtEUR(receivedPayments.reduce((sum, payment) => sum + payment.checkReceived, 0))}
              </p>
            </div>

            <div
              className="card text-center"
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                borderLeft: '4px solid #3B82F6',
                borderTop: '1px solid #3B82F620'
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <Receipt size={24} style={{ color: '#1E40AF' }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1E40AF' }}>
                Nombre de règlements
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#1E40AF' }}>
                {receivedPayments.length}
              </p>
            </div>

            <div
              className="card text-center"
              style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                borderLeft: '4px solid #F59E0B',
                borderTop: '1px solid #F59E0B20'
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <CreditCard size={24} style={{ color: '#92400E' }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#92400E' }}>
                Total chèques reçus
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#92400E' }}>
                {receivedPayments.reduce((sum, payment) => sum + payment.numberOfChecks, 0)}
              </p>
            </div>

            <div
              className="card text-center"
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                borderLeft: '4px solid #3B82F6',
                borderTop: '1px solid #3B82F620'
              }}
            >
              <div className="flex items-center justify-center mb-2">
                <Euro size={24} style={{ color: '#1E40AF' }} />
              </div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1E40AF' }}>
                Moyenne par règlement
              </h3>
              <p className="text-3xl font-bold" style={{ color: '#1E40AF' }}>
                {receivedPayments.length > 0
                  ? fmtEUR(receivedPayments.reduce((sum, payment) => sum + payment.checkReceived, 0) / receivedPayments.length)
                  : '0€'
                }
              </p>
            </div>
          </div>

          {/* Tableau des règlements perçus */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                💰 Règlements perçus sur Stand
              </h3>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>

            {receivedPayments.length === 0 ? (
              <div className="text-center py-12">
                <Store size={64} className="mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-500 mb-2">Aucun règlement perçu</p>
                <p className="text-gray-400">Les règlements reçus apparaîtront ici</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                <div className="table-scroll table-sticky">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom du client</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Numéro de facture</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Chèque reçu</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Nb chèques</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendeuse</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedPayments.map((payment) => {
                        const isEditing = editingPayment === payment.id;

                        return (
                          <React.Fragment key={payment.id}>
                            <tr
                              className="border-b transition-all duration-200 hover:bg-gray-50"
                              style={{
                                borderColor: '#F3F4F6',
                                borderLeft: `6px solid ${getVendorColor(payment.vendorId)}`,
                                background: isEditing ? '#FEF3C7' : `${getVendorColor(payment.vendorId)}10`
                              }}
                            >
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    defaultValue={payment.clientName}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    id={`clientName-${payment.id}`}
                                  />
                                ) : (
                                  payment.clientName
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    defaultValue={payment.invoiceNumber}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    id={`invoiceNumber-${payment.id}`}
                                  />
                                ) : (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                    {payment.invoiceNumber}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-green-600">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={payment.checkReceived}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                    id={`checkReceived-${payment.id}`}
                                  />
                                ) : (
                                  fmtEUR(payment.checkReceived)
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    defaultValue={payment.numberOfChecks}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                    id={`numberOfChecks-${payment.id}`}
                                  />
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                    {payment.numberOfChecks} chèque{payment.numberOfChecks > 1 ? 's' : ''}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <select
                                    defaultValue={payment.vendorId}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    id={`vendorId-${payment.id}`}
                                  >
                                    {vendors.map(vendor => (
                                      <option key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full"
                                      style={{ background: getVendorColor(payment.vendorId) }}
                                    />
                                    <span className="font-semibold text-gray-700">{payment.vendorName}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {isEditing ? (
                                  <input
                                    type="date"
                                    defaultValue={payment.date.toISOString().split('T')[0]}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    id={`date-${payment.id}`}
                                  />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {payment.date.toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          const updatedPayment = {
                                            clientName: (document.getElementById(`clientName-${payment.id}`) as HTMLInputElement)?.value || payment.clientName,
                                            invoiceNumber: (document.getElementById(`invoiceNumber-${payment.id}`) as HTMLInputElement)?.value || payment.invoiceNumber,
                                            checkReceived: parseFloat((document.getElementById(`checkReceived-${payment.id}`) as HTMLInputElement)?.value || '0'),
                                            numberOfChecks: parseInt((document.getElementById(`numberOfChecks-${payment.id}`) as HTMLInputElement)?.value || '1'),
                                            vendorId: (document.getElementById(`vendorId-${payment.id}`) as HTMLSelectElement)?.value || payment.vendorId,
                                            vendorName: vendors.find(v => v.id === (document.getElementById(`vendorId-${payment.id}`) as HTMLSelectElement)?.value)?.name || payment.vendorName,
                                            date: new Date((document.getElementById(`date-${payment.id}`) as HTMLInputElement)?.value || payment.date.toISOString())
                                          };
                                          handleSavePayment(payment.id, updatedPayment);
                                        }}
                                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                                        title="Sauvegarder"
                                      >
                                        <Save size={16} />
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                        title="Annuler"
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditPayment(payment.id)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Modifier"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Êtes-vous sûr de vouloir supprimer ce règlement ?')) {
                                            handleDeletePayment(payment.id);
                                          }
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                        title="Supprimer"
                                      >
                                        <X size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modale d'ajout de règlement */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Plus size={20} />
              Nouveau règlement perçu
            </h3>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newPayment: Omit<ReceivedPayment, 'id'> = {
                clientName: formData.get('clientName') as string,
                invoiceNumber: formData.get('invoiceNumber') as string,
                checkReceived: parseFloat(formData.get('checkReceived') as string),
                numberOfChecks: parseInt(formData.get('numberOfChecks') as string),
                vendorId: formData.get('vendorId') as string,
                vendorName: vendors.find(v => v.id === formData.get('vendorId'))?.name || '',
                date: new Date(formData.get('date') as string)
              };
              handleAddPayment(newPayment);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client *
                </label>
                <input
                  type="text"
                  name="clientName"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom complet du client"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de facture *
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: FAC-2024-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant du chèque reçu *
                </label>
                <input
                  type="number"
                  name="checkReceived"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de chèques *
                </label>
                <input
                  type="number"
                  name="numberOfChecks"
                  min="1"
                  required
                  defaultValue="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendeuse *
                </label>
                <select
                  name="vendorId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner une vendeuse</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date du règlement *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
