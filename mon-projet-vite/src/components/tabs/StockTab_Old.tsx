import React, { useState, useMemo } from 'react';
import { Archive, Package, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import type { CatalogProduct, ProductCategory } from '../../types';
import { productCatalog } from '../../data';

// Props pour les futures fonctionnalités de gestion du stock
type StockTabProps = Record<string, never>;

interface StockItem extends CatalogProduct {
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'ok' | 'low' | 'out';
}

export const StockTab: React.FC<StockTabProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Tous'>('Tous');
  const [stockQuantities, setStockQuantities] = useState<Record<string, number>>({});

  // Simulation des données de stock (à remplacer par de vraies données plus tard)
  const stockData: StockItem[] = useMemo(() => {
    return productCatalog.map((product: CatalogProduct, index) => {
      const productKey = `${product.name}-${index}`;
      // Utiliser la quantité personnalisée ou une valeur par défaut
      const currentStock = stockQuantities[productKey] ?? Math.floor(Math.random() * 50);
      const minStock = 5;
      const maxStock = 100;
      
      let status: 'ok' | 'low' | 'out' = 'ok';
      if (currentStock === 0) status = 'out';
      else if (currentStock <= minStock) status = 'low';

      return {
        ...product,
        currentStock,
        minStock,
        maxStock,
        status
      };
    });
  }, [stockQuantities]);

  // Fonction pour mettre à jour le stock
  const updateStock = (productKey: string, newQuantity: number) => {
    setStockQuantities(prev => ({
      ...prev,
      [productKey]: Math.max(0, newQuantity) // S'assurer que la quantité est positive
    }));
  };

  // Filtrage des produits
  const filteredStock = useMemo(() => {
    return stockData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stockData, searchTerm, selectedCategory]);

  // Statistiques de stock
  const stockStats = useMemo(() => {
    const totalItems = stockData.length;
    const outOfStock = stockData.filter(item => item.status === 'out').length;
    const lowStock = stockData.filter(item => item.status === 'low').length;
    const okStock = stockData.filter(item => item.status === 'ok').length;
    const totalValue = stockData.reduce((sum, item) => sum + (item.currentStock * item.priceTTC), 0);

    return { totalItems, outOfStock, lowStock, okStock, totalValue };
  }, [stockData]);

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

  return (
    <div className="animate-fadeIn">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>
          Gestion du Stock
        </h2>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
          <Archive size={16} />
          <span>Suivi en temps réel</span>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center" style={{ borderLeft: '4px solid #16A34A' }}>
          <div className="text-2xl font-bold" style={{ color: '#000000' }}>{stockStats.totalItems}</div>
          <div className="text-sm font-semibold" style={{ color: '#000000' }}>Références totales</div>
        </div>
        <div className="card text-center" style={{ borderLeft: '4px solid #16A34A' }}>
          <div className="text-2xl font-bold" style={{ color: '#16A34A' }}>{stockStats.okStock}</div>
          <div className="text-sm font-semibold" style={{ color: '#000000' }}>Stock OK</div>
        </div>
        <div className="card text-center" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{stockStats.lowStock}</div>
          <div className="text-sm font-semibold" style={{ color: '#000000' }}>Stock faible</div>
        </div>
        <div className="card text-center" style={{ borderLeft: '4px solid #DC2626' }}>
          <div className="text-2xl font-bold" style={{ color: '#DC2626' }}>{stockStats.outOfStock}</div>
          <div className="text-sm font-semibold" style={{ color: '#000000' }}>Rupture</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={20} style={{ color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg text-lg"
                style={{ borderColor: '#D1D5DB' }}
              />
            </div>
          </div>

          {/* Filtre par catégorie */}
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'Tous')}
              className="w-full px-4 py-3 border rounded-lg text-lg"
              style={{ borderColor: '#D1D5DB' }}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ color: '#000000' }}>
            Inventaire ({filteredStock.length} produits)
          </h3>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
            <Package size={16} />
            <span>💡 Cliquez sur les stocks pour les modifier (↑/↓ pour ajuster)</span>
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
                  <th className="text-center py-3 px-4 font-bold" style={{ color: '#000000' }}>Stock min</th>
                  <th className="text-right py-3 px-4 font-bold" style={{ color: '#000000' }}>Prix TTC</th>
                  <th className="text-right py-3 px-4 font-bold" style={{ color: '#000000' }}>Valeur</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item, index) => {
                  const StatusIcon = getStatusIcon(item.status);
                  const statusColor = getStatusColor(item.status);
                  const productKey = `${item.name}-${index}`;
                  
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
                          {item.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm" style={{ color: '#6B7280' }}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.currentStock}
                          onChange={(e) => updateStock(productKey, parseInt(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              updateStock(productKey, item.currentStock + 1);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              updateStock(productKey, Math.max(0, item.currentStock - 1));
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
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm" style={{ color: '#6B7280' }}>
                          {item.minStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold" style={{ color: '#000000' }}>
                          {item.priceTTC > 0 ? `${item.priceTTC.toFixed(2)}€` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold" style={{ color: '#000000' }}>
                          {item.priceTTC > 0 ? `${(item.currentStock * item.priceTTC).toFixed(2)}€` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Résumé de la valeur totale */}
        {filteredStock.length > 0 && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold" style={{ color: '#000000' }}>
                Valeur totale du stock filtré :
              </span>
              <span className="text-2xl font-bold" style={{ color: '#16A34A' }}>
                {filteredStock
                  .reduce((sum, item) => sum + (item.currentStock * item.priceTTC), 0)
                  .toFixed(2)}€
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
