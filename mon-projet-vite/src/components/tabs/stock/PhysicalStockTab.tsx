import React, { useState, useMemo, useEffect } from 'react';
import { Package, Search, AlertTriangle, CheckCircle, Lock, Zap, Clock, RotateCcw, FileDown, Mail, Printer, Play } from 'lucide-react';
import type { ProductCategory } from '../../../types';
import { PinModal } from '../../ui/PinModal';
import { syncService } from '../../../services/syncService';
import type { PhysicalStock } from '../../../services/syncService';
import '../../../styles/general-stock-compact.css';

interface PhysicalStockItem extends PhysicalStock {
  status: 'ok' | 'low' | 'out';
  minStock: number;
}

export const PhysicalStockTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Tous'>('Tous');
  const [physicalStockData, setPhysicalStockData] = useState<PhysicalStockItem[]>([]);
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // États pour la RAZ
  const [showRazModal, setShowRazModal] = useState(false);
  const [razLoading, setRazLoading] = useState(false);
  const [razStep, setRazStep] = useState<'confirm' | 'processing' | 'completed'>('confirm');
  
  // États pour l'initialisation d'événement
  const [showInitModal, setShowInitModal] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  // Charger le stock physique depuis le syncService
  const loadPhysicalStock = () => {
    try {
      setLoading(true);
      const rawStock = syncService.getCurrentPhysicalStock();
      
      const processedStock: PhysicalStockItem[] = rawStock.map(item => {
        let status: 'ok' | 'low' | 'out' = 'ok';
        if (item.currentStock === 0) status = 'out';
        else if (item.currentStock <= item.minStockAlert) status = 'low';

        return {
          ...item,
          status,
          minStock: item.minStockAlert
        };
      });

      setPhysicalStockData(processedStock);
      console.log(`📦 Stock physique chargé: ${processedStock.length} produits`);
    } catch (error) {
      console.error('Erreur lors du chargement du stock physique:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    loadPhysicalStock();
    
    // Recharger toutes les 30 secondes pour synchroniser avec N8N
    const interval = setInterval(loadPhysicalStock, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fonction pour mettre à jour le stock physique
  const updatePhysicalStock = (productName: string, category: string, newQuantity: number) => {
    const success = syncService.updateProductStock(
      productName, 
      category, 
      newQuantity, 
      'Correction manuelle depuis interface'
    );
    
    if (success) {
      // Recharger les données pour refléter les changements
      loadPhysicalStock();
    } else {
      console.error(`Erreur lors de la mise à jour du stock pour ${productName}`);
    }
  };

  // Fonction pour effectuer la RAZ
  const handleRAZ = async () => {
    try {
      setRazLoading(true);
      setRazStep('processing');
      
      console.log('🔄 Début de la RAZ (Remise À Zéro)...');
      
      // Effectuer la RAZ via le syncService
      const razResult = await syncService.performRAZ();
      
      if (razResult.success) {
        console.log('✅ RAZ effectuée avec succès');
        setRazStep('completed');
        
        // Recharger le stock physique pour refléter la remise à zéro
        loadPhysicalStock();
        
        // Fermer la modale après 3 secondes
        setTimeout(() => {
          setShowRazModal(false);
          setRazStep('confirm');
        }, 3000);
      } else {
        console.error('❌ Erreur lors de la RAZ:', razResult.error);
        alert(`Erreur lors de la RAZ: ${razResult.error}`);
        setRazStep('confirm');
      }
    } catch (error) {
      console.error('❌ Erreur critique lors de la RAZ:', error);
      alert('Erreur critique lors de la RAZ. Consultez les logs.');
      setRazStep('confirm');
    } finally {
      setRazLoading(false);
    }
  };

  // Fonction pour initialiser le stock d'événement
  const handleInitEvent = async () => {
    try {
      setInitLoading(true);
      
      console.log('🚀 Initialisation du stock d\'événement...');
      
      // Utiliser des données d'exemple pour l'initialisation (à personnaliser selon les besoins)
      const stockData = [
        { productName: 'Matelas Simmons 140x190', category: 'Matelas', quantity: 10 },
        { productName: 'Sur-matelas Duo', category: 'Sur-matelas', quantity: 15 },
        { productName: 'Couette 220x240', category: 'Couettes', quantity: 20 },
        { productName: 'Oreiller Dual', category: 'Oreillers', quantity: 25 },
        { productName: 'Plateau fixe', category: 'Plateau', quantity: 8 },
        { productName: 'Protège-matelas', category: 'Accessoires', quantity: 30 }
      ];
      
      // Initialiser le stock physique
      const initResult = syncService.initializeEventStock(stockData);
      
      if (initResult) {
        console.log('✅ Stock d\'événement initialisé avec succès');
        
        // Recharger le stock physique pour refléter l'initialisation
        loadPhysicalStock();
        
        // Fermer la modale
        setShowInitModal(false);
        
        alert('Stock physique initialisé avec succès !');
      } else {
        console.error('❌ Erreur lors de l\'initialisation du stock');
        alert('Erreur lors de l\'initialisation du stock d\'événement.');
      }
    } catch (error) {
      console.error('❌ Erreur critique lors de l\'initialisation:', error);
      alert('Erreur critique lors de l\'initialisation. Consultez les logs.');
    } finally {
      setInitLoading(false);
    }
  };

  // Filtrage des produits
  const filteredStock = useMemo(() => {
    return physicalStockData.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [physicalStockData, searchTerm, selectedCategory]);

  // Statistiques de stock
  const stockStats = useMemo(() => {
    const totalItems = physicalStockData.length;
    const outOfStock = physicalStockData.filter(item => item.status === 'out').length;
    const lowStock = physicalStockData.filter(item => item.status === 'low').length;
    const okStock = physicalStockData.filter(item => item.status === 'ok').length;

    return { totalItems, outOfStock, lowStock, okStock };
  }, [physicalStockData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out': return '#DC2626';
      case 'low': return '#F59E0B';
      case 'ok': return '#16A34A';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'out': return AlertTriangle;
      case 'low': return AlertTriangle;
      case 'ok': return CheckCircle;
      default: return Package;
    }
  };

  const categories: (ProductCategory | 'Tous')[] = ['Tous', 'Matelas', 'Sur-matelas', 'Couettes', 'Oreillers', 'Plateau', 'Accessoires'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="text-lg text-gray-600">Chargement du stock physique...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header principal avec titre élégant et bouton d'édition */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.025em'
          }}>
            Stock physique
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-lg text-gray-600 font-medium">
              Stock réel avec déductions automatiques N8N et ventes locales
            </p>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
              <Zap size={14} className="text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Synchronisé</span>
            </div>
          </div>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex items-center gap-3">
          {/* Bouton d'initialisation d'événement */}
          <button
            onClick={() => setShowInitModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:shadow-lg"
            style={{
              borderColor: '#16A34A',
              backgroundColor: '#F0FDF4',
              color: '#16A34A'
            }}
          >
            <Play size={16} />
            <span className="font-semibold">Nouvel événement</span>
          </button>
          
          {/* Bouton RAZ (Remise À Zéro) */}
          <button
            onClick={() => setShowRazModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:shadow-lg"
            style={{
              borderColor: '#DC2626',
              backgroundColor: '#FEF2F2',
              color: '#DC2626'
            }}
          >
            <RotateCcw size={16} />
            <span className="font-semibold">RAZ Stock</span>
          </button>
          
          {/* Bouton de verrouillage/déverrouillage de l'édition */}
          {isEditUnlocked ? (
            <button
              onClick={() => setIsEditUnlocked(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: '#DC2626',
                backgroundColor: '#FEF2F2',
                color: '#DC2626'
              }}
            >
              <Lock size={16} />
              <span className="font-semibold">Verrouiller l'édition</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: '#16A34A',
                backgroundColor: '#F0FDF4',
                color: '#16A34A'
              }}
            >
              <Lock size={16} />
              <span className="font-semibold">Déverrouiller l'édition</span>
            </button>
          )}
        </div>
      </div>

      {/* Ligne compacte : Statistiques + Recherche + Filtres */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          
          {/* Statistiques compactes sur la gauche - Police doublée et très contrastée */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* Références totales - Marron */}
            <div className="stat-item-compact flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FDF6E3' }}>
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: '#654321', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{stockStats.totalItems}</div>
                <div className="text-sm font-bold" style={{ color: '#654321' }}>Références</div>
              </div>
            </div>

            {/* Stock OK - Vert */}
            <div className="stat-item-compact flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: '#15803D', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{stockStats.okStock}</div>
                <div className="text-sm font-bold" style={{ color: '#15803D' }}>Stock OK</div>
              </div>
            </div>

            {/* Stock faible - Orange */}
            <div className="stat-item-compact flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FFFBEB' }}>
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: '#EA580C', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{stockStats.lowStock}</div>
                <div className="text-sm font-bold" style={{ color: '#EA580C' }}>Stock faible</div>
              </div>
            </div>

            {/* Rupture - Rouge */}
            <div className="stat-item-compact flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                <span className="text-2xl">🚨</span>
              </div>
              <div>
                <div className="text-2xl font-black" style={{ color: '#B91C1C', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{stockStats.outOfStock}</div>
                <div className="text-sm font-bold" style={{ color: '#B91C1C' }}>Rupture</div>
              </div>
            </div>
          </div>

          {/* Séparateur vertical */}
          <div className="hidden lg:block w-px h-12 bg-gray-200"></div>

          {/* Recherche et filtres compacts sur la droite */}
          <div className="flex flex-1 gap-3 min-w-0">
            {/* Recherche */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: '#6B7280' }} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: '#D1D5DB' }}
                />
              </div>
            </div>

            {/* Filtre par catégorie */}
            <div className="w-40">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'Tous')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                style={{ borderColor: '#D1D5DB' }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Bouton de rechargement */}
            <button
              onClick={loadPhysicalStock}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#D1D5DB' }}
              title="Recharger le stock physique"
            >
              <Clock size={16} className="text-gray-600" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ color: '#000000' }}>
            Stock physique en temps réel ({filteredStock.length} produits)
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
            <Package size={16} />
            <span>💡 Stock déduit automatiquement des factures N8N et ventes locales</span>
          </div>
        </div>

        {filteredStock.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
            <p className="text-lg" style={{ color: '#000000' }}>
              Aucun produit trouvé
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#E5E7EB' }}>
                  <th className="text-left py-3 px-4 font-bold" style={{ color: '#000000' }}>Statut</th>
                  <th className="text-left py-3 px-4 font-bold" style={{ color: '#000000' }}>Produit</th>
                  <th className="text-left py-3 px-4 font-bold" style={{ color: '#000000' }}>Catégorie</th>
                  <th className="text-center py-3 px-4 font-bold" style={{ color: '#000000' }}>Stock actuel</th>
                  <th className="text-center py-3 px-4 font-bold" style={{ color: '#000000' }}>Stock réservé</th>
                  <th className="text-center py-3 px-4 font-bold" style={{ color: '#000000' }}>Stock disponible</th>
                  <th className="text-center py-3 px-4 font-bold" style={{ color: '#000000' }}>Dernière MAJ</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item, index) => {
                  const StatusIcon = getStatusIcon(item.status);
                  const statusColor = getStatusColor(item.status);
                  const productKey = `${item.productName}-${index}`;
                  
                  return (
                    <tr 
                      key={productKey}
                      className="border-b hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#F3F4F6' }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon size={20} style={{ color: statusColor }} />
                          <span className="text-sm font-semibold" style={{ color: statusColor }}>
                            {item.status === 'ok' ? 'OK' : item.status === 'low' ? 'Faible' : 'Rupture'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold" style={{ color: '#000000' }}>
                          {item.productName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm" style={{ color: '#6B7280' }}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEditUnlocked ? (
                          <input
                            type="number"
                            min="0"
                            value={item.currentStock}
                            onChange={(e) => updatePhysicalStock(item.productName, item.category, parseInt(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                updatePhysicalStock(item.productName, item.category, item.currentStock + 1);
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                updatePhysicalStock(item.productName, item.category, Math.max(0, item.currentStock - 1));
                              }
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-lg border rounded transition-all hover:shadow-md focus:shadow-lg focus:outline-none focus:ring-2"
                            style={{ 
                              color: statusColor,
                              borderColor: statusColor,
                              backgroundColor: item.status === 'out' ? '#FEF2F2' : 
                                             item.status === 'low' ? '#FFFBEB' : '#F0FDF4'
                            }}
                            title="Utilisez ↑/↓ pour modifier rapidement"
                          />
                        ) : (
                          <div
                            className="w-20 mx-auto px-2 py-1 text-center font-bold text-lg border rounded bg-gray-100"
                            style={{ 
                              borderColor: '#D1D5DB',
                              backgroundColor: '#F9FAFB',
                              color: statusColor,
                              opacity: 0.7
                            }}
                            title="Déverrouillez l'édition pour modifier"
                          >
                            {item.currentStock}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>
                          {item.reservedStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-bold" style={{ color: '#16A34A' }}>
                          {item.availableStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs" style={{ color: '#6B7280' }}>
                          {new Date(item.lastUpdated).toLocaleString('fr-FR')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info sur la synchronisation */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
              <Zap size={16} className="text-purple-500" />
              <span>
                Stock synchronisé automatiquement avec les factures N8N et les ventes locales
              </span>
            </div>
            <div className="text-xs" style={{ color: '#6B7280' }}>
              Dernière actualisation : {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Modal PIN pour déverrouiller l'édition */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => setIsEditUnlocked(true)}
        title="Déverrouiller l'édition du stock physique"
      />

      {/* Modal de confirmation RAZ */}
      {showRazModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            {razStep === 'confirm' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-red-100">
                    <RotateCcw size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Remise À Zéro (RAZ)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Fin d'événement - Génération des rapports
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Cette opération va :
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <FileDown size={16} className="text-blue-500" />
                      Générer le rapport du stock physique restant
                    </li>
                    <li className="flex items-center gap-2">
                      <Printer size={16} className="text-green-500" />
                      Créer la feuille de caisse complète
                    </li>
                    <li className="flex items-center gap-2">
                      <Mail size={16} className="text-purple-500" />
                      Envoyer les rapports par email
                    </li>
                    <li className="flex items-center gap-2">
                      <RotateCcw size={16} className="text-red-500" />
                      Remettre le stock physique à zéro
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Attention : Cette action est irréversible
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Le stock général sera conservé, seul le stock physique sera remis à zéro.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRazModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRAZ}
                    disabled={razLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {razLoading ? 'Traitement...' : 'Confirmer la RAZ'}
                  </button>
                </div>
              </>
            )}

            {razStep === 'processing' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Traitement en cours...
                </h3>
                <p className="text-gray-600">
                  Génération des rapports et remise à zéro du stock physique
                </p>
              </div>
            )}

            {razStep === 'completed' && (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-green-100 mx-auto w-fit mb-4">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  RAZ effectuée avec succès !
                </h3>
                <p className="text-gray-600">
                  Les rapports ont été générés et le stock physique a été remis à zéro.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal d'initialisation d'événement */}
      {showInitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <Play size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Nouvel événement
                </h3>
                <p className="text-sm text-gray-600">
                  Initialisation du stock physique
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Cette opération va initialiser le stock physique avec des quantités d'exemple pour démarrer un nouvel événement.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Stock d'exemple qui sera initialisé
                  </span>
                </div>
                <ul className="text-xs text-blue-700 mt-2 space-y-1">
                  <li>• Matelas Simmons 140x190 : 10 unités</li>
                  <li>• Sur-matelas Duo : 15 unités</li>
                  <li>• Couette 220x240 : 20 unités</li>
                  <li>• Oreiller Dual : 25 unités</li>
                  <li>• Plateau fixe : 8 unités</li>
                  <li>• Protège-matelas : 30 unités</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleInitEvent}
                disabled={initLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {initLoading ? 'Initialisation...' : 'Initialiser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
