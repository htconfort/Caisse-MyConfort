import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Package, Search, AlertTriangle, CheckCircle, Lock, Zap, Clock, RotateCcw, FileDown, Mail, Printer, Play } from 'lucide-react';
import type { ProductCategory } from '../../../types';
import { PinModal } from '../../ui/PinModal';
import { syncService } from '@/services';
import type { PhysicalStock } from '@/services';
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

  // Fonction pour effectuer la RAZ (Remise À Zéro)
  const performRAZ = useCallback(() => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION : Cette action va remettre TOUT le stock physique à zéro.\n\n' +
      'Cette action est irréversible.\n\n' +
      'Voulez-vous vraiment continuer ?'
    );

    if (confirmed) {
      const doubleConfirm = window.confirm(
        '🔴 DERNIÈRE CONFIRMATION\n\n' +
        'Vous allez EFFACER tout le stock physique.\n\n' +
        'Êtes-vous ABSOLUMENT sûr ?'
      );

      if (doubleConfirm) {
        try {
          setRazLoading(true);
          setRazStep('processing');
          
          console.log('🔄 Début de la RAZ (Remise À Zéro)...');
          
          // Remettre toutes les quantités à 0 dans les données locales
          const resetStockData = physicalStockData.map(item => ({
            ...item,
            currentStock: 0,
            status: 'out' as const
          }));
          
          setPhysicalStockData(resetStockData);
          
          // Sauvegarder en localStorage pour persistence
          const stockUpdate = resetStockData.reduce((acc, item) => {
            acc[item.productName] = 0;
            return acc;
          }, {} as Record<string, number>);
          
          localStorage.setItem('physical-stock-quantities', JSON.stringify(stockUpdate));
          
          console.log('✅ RAZ effectuée avec succès');
          setRazStep('completed');
          
          // Fermer la modale après 3 secondes
          setTimeout(() => {
            setShowRazModal(false);
            setRazStep('confirm');
          }, 3000);
          
          console.log('📊 RAZ Stock Physique:', {
            timestamp: new Date().toISOString(),
            productsReset: resetStockData.length,
            action: 'RESET_ALL_PHYSICAL_STOCK'
          });
          
        } catch (error) {
          console.error('❌ Erreur critique lors de la RAZ:', error);
          alert('Erreur critique lors de la RAZ. Consultez les logs.');
          setRazStep('confirm');
        } finally {
          setRazLoading(false);
        }
      }
    }
  }, [physicalStockData]);

  // Fonction d'origine renommée pour compatibilité
  const handleRAZ = performRAZ;

  // Fonction d'initialisation du stock pour un événement
  const initializeEventStock = useCallback(() => {
    const eventTypes = [
      'Salon de l\'Habitat',
      'Foire Commerciale', 
      'Événement Magasin',
      'Présentation Client',
      'Stock Personnalisé'
    ];

    const selectedEvent = window.prompt(
      '🎪 INITIALISATION STOCK ÉVÉNEMENT\n\n' +
      'Choisissez le type d\'événement :\n' +
      eventTypes.map((type, index) => `${index + 1}. ${type}`).join('\n') + '\n\n' +
      'Entrez le numéro (1-5) :'
    );

    const eventIndex = parseInt(selectedEvent || '0') - 1;
    
    if (eventIndex >= 0 && eventIndex < eventTypes.length) {
      const eventType = eventTypes[eventIndex];
      
      // Quantités prédéfinies selon le type d'événement
      const eventStockPresets: Record<string, Record<string, number>> = {
        'Salon de l\'Habitat': {
          'Matelas Simmons 140x190': 5,
          'Sur-matelas Duo': 15,
          'Couette 220x240': 20,
          'Oreiller Dual': 25,
          'Plateau fixe': 8,
          'Protège-matelas': 30
        },
        'Foire Commerciale': {
          'Matelas Simmons 140x190': 8,
          'Sur-matelas Duo': 20,
          'Couette 220x240': 25,
          'Oreiller Dual': 35,
          'Plateau fixe': 12,
          'Protège-matelas': 40
        },
        'Événement Magasin': {
          'Matelas Simmons 140x190': 3,
          'Sur-matelas Duo': 10,
          'Couette 220x240': 15,
          'Oreiller Dual': 20,
          'Plateau fixe': 5,
          'Protège-matelas': 25
        },
        'Présentation Client': {
          'Matelas Simmons 140x190': 1,
          'Sur-matelas Duo': 5,
          'Couette 220x240': 8,
          'Oreiller Dual': 10,
          'Plateau fixe': 2,
          'Protège-matelas': 15
        }
      };

      let targetQuantities: Record<string, number> = {};

      if (eventIndex === 4) { // Stock Personnalisé
        const customAmount = window.prompt(
          '📦 STOCK PERSONNALISÉ\n\n' +
          'Entrez une quantité de base (ex: 5) qui servira à définir les niveaux pour chaque produit:',
          '5'
        );
        const base = Number(customAmount ?? '0');
        const safeBase = Number.isFinite(base) && base >= 0 ? base : 0;
        targetQuantities = {
          'Matelas Simmons 140x190': safeBase,
          'Sur-matelas Duo': safeBase * 3,
          'Couette 220x240': safeBase * 4,
          'Oreiller Dual': safeBase * 5,
          'Plateau fixe': Math.max(1, Math.round(safeBase / 2)),
          'Protège-matelas': safeBase * 6
        };
      } else {
        targetQuantities = eventStockPresets[eventType];
      }

      // Appliquer les quantités cibles
      const updated = physicalStockData.map(item => {
        const q = targetQuantities[item.productName];
        return typeof q === 'number'
          ? { ...item, currentStock: q, status: q === 0 ? 'out' : (q <= item.minStock ? 'low' : 'ok') }
          : item;
      });

      setPhysicalStockData(updated);
      
      // Persister en localStorage (même clé que RAZ pour cohérence)
      const persisted = updated.reduce((acc, item) => {
        acc[item.productName] = item.currentStock;
        return acc;
      }, {} as Record<string, number>);
      localStorage.setItem('physical-stock-quantities', JSON.stringify(persisted));

      console.log(`🎪 Initialisation "${eventType}" appliquée`);
      alert(`Initialisation "${eventType}" appliquée avec succès.`);
    } else {
      alert('Type d\'événement invalide.');
    }
  }, [physicalStockData]);

  const filteredStockData = useMemo(() => {
    return physicalStockData.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [physicalStockData, searchTerm, selectedCategory]);

  const handleEditUnlock = (pin: string) => {
    if (pin === '0000') {
      setIsEditUnlocked(true);
      setShowPinModal(false);
      alert('Accès au mode édition : ✅');
    } else {
      alert('Code PIN incorrect. Accès refusé.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion du Stock Physique</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Rechercher un produit
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Nom du produit..."
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Catégorie
        </label>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as ProductCategory)}
          className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="Tous">Toutes les catégories</option>
          <option value="literie">Literie</option>
          <option value="mobilier">Mobilier</option>
          <option value="decoration">Décoration</option>
          <option value="electromenager">Électroménager</option>
        </select>
      </div>
      
      <div className="mb-4">
        <button
          onClick={() => setShowRazModal(true)}
          className="mr-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <RotateCcw className="h-5 w-5 mr-2" aria-hidden="true" />
          Remise À Zéro du Stock
        </button>
        
        <button
          onClick={() => setShowInitModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Play className="h-5 w-5 mr-2" aria-hidden="true" />
          Initialiser Stock Événement
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-4">
          <svg className="animate-spin h-5 w-5 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
          </svg>
          <p className="text-sm text-gray-500">Chargement des données...</p>
        </div>
      ) : (
        <div>
          {filteredStockData.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Aucun produit trouvé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStockData.map(item => (
                <div key={item.productName} className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{item.productName}</h2>
                      <p className="text-sm text-gray-500">{item.category}</p>
                    </div>
                    <div>
                      {item.status === 'ok' && (
                        <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
                      )}
                      {item.status === 'low' && (
                        <AlertTriangle className="h-6 w-6 text-yellow-500" aria-hidden="true" />
                      )}
                      {item.status === 'out' && (
                        <Lock className="h-6 w-6 text-red-500" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{item.currentStock}</span> /{' '}
                    <span className="text-sm text-gray-400">Min: {item.minStock}</span>
                  </div>
                  <div className="mt-4 flex">
                    <button
                      onClick={() => updatePhysicalStock(item.productName, item.category, item.currentStock + 1)}
                      className="flex-1 bg-indigo-600 text-white rounded-md px-4 py-2 mr-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Zap className="h-5 w-5 mr-2" aria-hidden="true" />
                      Ajouter 1
                    </button>
                    <button
                      onClick={() => updatePhysicalStock(item.productName, item.category, item.currentStock - 1)}
                      className="flex-1 bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FileDown className="h-5 w-5 mr-2" aria-hidden="true" />
                      Retirer 1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Modale RAZ */}
      {showRazModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Remise À Zéro du Stock</h2>
            
            {razStep === 'confirm' && (
              <div>
                <p className="text-sm text-gray-700 mb-4">
                  Êtes-vous sûr de vouloir remettre tout le stock physique à zéro ?
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRazModal(false)}
                    className="mr-2 px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={performRAZ}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            )}
            
            {razStep === 'processing' && (
              <div className="text-center py-4">
                <svg className="animate-spin h-5 w-5 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
                </svg>
                <p className="text-sm text-gray-500">Traitement en cours...</p>
              </div>
            )}
            
            {razStep === 'completed' && (
              <div className="text-center py-4">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500" aria-hidden="true" />
                <p className="mt-2 text-sm text-gray-700">
                  La remise À zéro du stock a été effectuée avec succès.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modale Initialisation Événement */}
      {showInitModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Initialisation Stock Événement</h2>
            
            <p className="text-sm text-gray-700 mb-4">
              Choisissez un type d'événement pour initialiser le stock :
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => {
                  setInitLoading(true);
                  initializeEventStock();
                }}
                className="flex items-center justify-center bg-green-600 text-white rounded-md px-4 py-2 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Play className="h-5 w-5 mr-2" aria-hidden="true" />
                Initialiser
              </button>
              
              <button
                onClick={() => setShowInitModal(false)}
                className="flex items-center justify-center bg-gray-200 rounded-md px-4 py-2 hover:bg-gray-300 focus:outline-none"
              >
                Annuler
              </button>
            </div>
            
            {initLoading && (
              <div className="mt-4 text-center">
                <svg className="animate-spin h-5 w-5 mx-auto text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
                </svg>
                <p className="text-sm text-gray-500">Initialisation en cours...</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modale PIN */}
      {showPinModal && (
        <PinModal 
          onUnlock={handleEditUnlock}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
};
