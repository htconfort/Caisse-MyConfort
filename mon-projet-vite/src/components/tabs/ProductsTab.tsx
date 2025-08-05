import { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import type { 
  TabType, 
  Vendor, 
  CatalogProduct, 
  ProductCategory 
} from '../../types';
import { productCatalog } from '../../data';
import { categories } from '../../data/constants';
import { 
  extractDimensions,
  getProductNameWithoutDimensions,
  isMatressProduct,
  getCategoryBackgroundColor,
  getTextColor
} from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchBar } from '../ui/SearchBar';

interface ProductsTabProps {
  selectedVendor: Vendor | null;
  setActiveTab: (tab: TabType) => void;
  addToCart: (product: CatalogProduct) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function ProductsTab({
  selectedVendor,
  setActiveTab,
  addToCart,
  searchTerm,
  setSearchTerm
}: ProductsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Tous'>('Matelas');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    return productCatalog.filter(product => {
      const matchesCategory = product.category === selectedCategory;
      const matchesSearch = debouncedSearchTerm === '' || 
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, debouncedSearchTerm]);

  // Si pas de vendeuse sélectionnée
  if (!selectedVendor) {
    return (
      <div className="max-w-2xl mx-auto text-center animate-fadeIn">
        <div className="card">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--warning-red)' }} />
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--dark-green)' }}>
            Vendeuse non sélectionnée
          </h2>
          <p className="mb-6" style={{ color: '#6B7280' }}>
            Vous pouvez naviguer librement dans tous les onglets, mais pour ajouter des produits au panier, 
            veuillez d'abord sélectionner une vendeuse.
          </p>
          <button
            onClick={() => setActiveTab('vendeuse')}
            className="btn-primary"
          >
            Sélectionner une vendeuse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Categories - maintenant en premier */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all touch-feedback ${
              selectedCategory === category
                ? 'btn-primary text-black shadow-md'
                : 'bg-white hover:shadow-md'
            }`}
            style={{
              color: '#000000'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* SearchBar - maintenant en deuxième */}
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Compteur de produits */}
      <div className="mb-4 p-3 bg-blue-100 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span><strong>Total catalogue:</strong> {productCatalog.length} produits</span>
          <span><strong>Affichés ({selectedCategory}):</strong> {filteredProducts.length} produits</span>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Matelas: {productCatalog.filter(p => p.category === 'Matelas').length} | 
          Sur-matelas: {productCatalog.filter(p => p.category === 'Sur-matelas').length} | 
          Couettes: {productCatalog.filter(p => p.category === 'Couettes').length} | 
          Oreillers: {productCatalog.filter(p => p.category === 'Oreillers').length} | 
          Plateaux: {productCatalog.filter(p => p.category === 'Plateau').length} | 
          Accessoires: {productCatalog.filter(p => p.category === 'Accessoires').length}
        </div>
      </div>

      {/* Products Grid - OPTIMISÉE 3×3 */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          width: '100%',
          maxWidth: 'calc(100% - 370px)', // Espace pour le panier optimisé
          padding: '0 12px',
          marginRight: '10px', // Marge pour éviter que ça colle au panier
          height: 'calc(100vh - 300px)',
          overflowY: 'auto'
        }}
      >
        {filteredProducts.map((product, index) => {
          const isMatress = isMatressProduct(product.category);
          const dimensions = extractDimensions(product.name);
          const productNameOnly = dimensions ? getProductNameWithoutDimensions(product.name) : product.name;
          const backgroundColor = getCategoryBackgroundColor(product.category);
          const textColor = getTextColor(backgroundColor);
          const isSpecialCategory = backgroundColor !== 'white';
          
          const discountedPrice = isMatress ? Math.round(product.priceTTC * 0.8) : product.priceTTC;
          
          return (
            <div
              key={`${product.name}-${index}`}
              onClick={() => addToCart({...product, priceTTC: discountedPrice})}
              className="touch-feedback cursor-pointer relative overflow-hidden transition-all hover:shadow-lg"
              style={{
                backgroundColor: backgroundColor,
                color: textColor,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '12px',
                minHeight: '160px', // Hauteur optimisée pour 3×3
                maxHeight: '180px',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                opacity: product.priceTTC === 0 ? 0.5 : 1,
                pointerEvents: product.priceTTC === 0 ? 'none' : 'auto',
                transform: 'scale(1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {/* Badge de remise pour les matelas */}
              {isMatress && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: '#FF0000',
                  color: 'white',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  zIndex: 10,
                  lineHeight: '1'
                }}>
                  -20%
                </div>
              )}
              
              {/* Nom du produit */}
              <h3 style={{ 
                color: textColor,
                fontSize: isSpecialCategory ? '16px' : '15px', // Taille réduite pour s'adapter
                fontWeight: 'bold',
                marginBottom: '4px',
                lineHeight: '1.2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                maxHeight: '38px'
              }}>
                {productNameOnly}
              </h3>
              
              {/* Dimensions */}
              {dimensions && (
                <div style={{ marginBottom: '6px' }}>
                  <p style={{ 
                    color: textColor,
                    fontSize: '18px', // Taille optimisée
                    fontWeight: 'bold',
                    lineHeight: '1.1'
                  }}>
                    {dimensions}
                  </p>
                </div>
              )}
              
              {/* Prix */}
              <p style={{ 
                color: '#000000',
                fontSize: '20px', // Taille optimisée
                fontWeight: 'bold',
                lineHeight: '1',
                margin: 0
              }}>
                {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
              </p>
              
              {/* Prix barré pour les matelas */}
              {isMatress && product.priceTTC > 0 && (
                <p style={{ 
                  color: isSpecialCategory ? 'white' : '#666666',
                  textDecoration: 'line-through',
                  fontSize: '14px',
                  marginTop: '2px',
                  lineHeight: '1',
                  margin: 0
                }}>
                  {product.priceTTC}€
                </p>
              )}
              
              {product.priceTTC === 0 && (
                <p style={{ 
                  color: isSpecialCategory ? '#666666' : 'var(--warning-red)',
                  fontSize: '14px',
                  marginTop: '2px',
                  lineHeight: '1',
                  margin: 0
                }}>
                  ⚠️ Complémentaire
                </p>
              )}
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px',
            color: '#6B7280'
          }}>
            <p>Aucun produit trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
