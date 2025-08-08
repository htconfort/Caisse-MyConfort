import { useState, useMemo } from 'react';
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
  getCategoryBackgroundColor
} from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchBar } from '../ui/SearchBar';
import { PriceInputModal } from '../ui/PriceInputModal';

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
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Gestion du prix libre
  const handlePriceConfirm = (product: CatalogProduct, price: number) => {
    const productWithPrice = { ...product, priceTTC: price };
    addToCart(productWithPrice);
    setShowPriceModal(false);
    setSelectedProduct(null);
  };

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    return productCatalog.filter(product => {
      const matchesCategory = product.category === selectedCategory;
      const matchesSearch = debouncedSearchTerm === '' || 
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, debouncedSearchTerm]);

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
          // const textColor = getTextColor(backgroundColor); // Supprimé car non utilisé
          const isSpecialCategory = backgroundColor !== 'white';
          
          // Créer un dégradé spécifique à chaque catégorie avec cas spécial pour Pack oreillers
          const getGradientBackground = (category: string, productName?: string) => {
            // Cas spécial: Pack oreillers en rouge
            if (category === 'Oreillers' && productName?.toLowerCase().includes('pack')) {
              return '#DC2626'; // Fond rouge pour Pack oreillers
            }
            
            switch (category) {
              case 'Matelas':
                return 'linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)'; // Bleu
              case 'Sur-matelas':
                return 'linear-gradient(135deg, #10B981 0%, #065F46 100%)'; // Vert
              case 'Couettes':
                return 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)'; // Violet
              case 'Oreillers':
                return '#F2EFE2'; // Fond beige uni pour les oreillers normaux
              case 'Plateau':
                return '#000000'; // Fond noir pour les plateaux
              case 'Accessoires':
                return 'linear-gradient(135deg, #EAB308 0%, #854D0E 100%)'; // Jaune
              default:
                return 'linear-gradient(135deg, #6B7280 0%, #374151 100%)'; // Gris
            }
          };
          
          const discountedPrice = isMatress ? Math.round(product.priceTTC * 0.8) : product.priceTTC;
          
          return (
            <div
              key={`${product.name}-${index}`}
              onClick={() => {
                if (!selectedVendor) {
                  setActiveTab('vendeuse'); // Rediriger vers l'onglet vendeuse
                } else if (product.priceTTC === 0) {
                  // Produit à prix libre - ouvrir le modal de saisie
                  setSelectedProduct(product);
                  setShowPriceModal(true);
                } else if (product.priceTTC > 0) {
                  // Produit avec prix fixe - ajouter directement
                  addToCart({...product, priceTTC: discountedPrice});
                }
              }}
              className={`touch-feedback relative overflow-hidden transition-all hover:shadow-lg ${
                selectedVendor ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
              style={{
                background: getGradientBackground(product.category, product.name),
                color: (product.category === 'Oreillers') ? (product.name.toLowerCase().includes('pack') ? '#FFFFFF' : '#000000') : 'white', // Texte blanc pour pack oreillers rouge, noir pour oreillers normaux, blanc pour les autres
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '12px',
                minHeight: '160px', // Hauteur optimisée pour 3×3
                maxHeight: '180px',
                border: (product.category === 'Oreillers' || product.category === 'Sur-matelas' || product.category === 'Couettes' || product.category === 'Plateau' || product.category === 'Accessoires') ? '3px solid #000000' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                opacity: product.priceTTC === 0 ? 0.5 : (!selectedVendor ? 0.7 : 1),
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
              
              {/* Affichage spécial pour les oreillers et pack de taies : vertical */}
              {product.category === 'Oreillers' || (product.category === 'Accessoires' && product.name.toLowerCase().includes('pack') && product.name.toLowerCase().includes('taies')) ? (
                <>
                  {/* Affichage spécial pour le pack de taies d'oreiller */}
                  {product.category === 'Accessoires' && product.name.toLowerCase().includes('taies') ? (
                    <>
                      {/* 1. "2 taies d'oreiller" en police normale blanche */}
                      <p style={{ 
                        color: '#FFFFFF',
                        fontSize: '16px',
                        fontWeight: 'normal',
                        marginBottom: '8px',
                        lineHeight: '1.1'
                      }}>
                        2 taies d'oreiller
                      </p>
                      
                      {/* 2. "Fraîcheur Actif Cool" en rouge 28px */}
                      <h3 style={{ 
                        color: '#FF0000',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        Fraîcheur Actif Cool
                      </h3>
                      
                      {/* 3. Prix en blanc */}
                      <p style={{ 
                        color: '#FFFFFF',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        margin: 0
                      }}>
                        {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Affichage pour les oreillers normaux */}
                      {/* 1. Catégorie "Oreillers" ou "Pack oreillers" */}
                      <p style={{ 
                        color: product.name.toLowerCase().includes('pack') ? '#FFFFFF' : '#000000',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        lineHeight: '1.1'
                      }}>
                        {product.name.toLowerCase().includes('pack') ? 'Pack oreillers' : 'Oreillers'}
                      </p>
                      
                      {/* 2. Nom spécifique de l'oreiller ou du pack - 28px */}
                      <h3 style={{ 
                        color: product.name.toLowerCase().includes('pack') ? '#FFFFFF' : '#FF0000',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {product.name.toLowerCase().includes('pack') 
                          ? product.name.replace(/Pack\s+(de\s+)?(deux\s+)?oreillers?\s*/i, '').replace(/^oreiller\s+/i, '')
                          : productNameOnly.replace(/^Oreiller\s+/i, '')
                        }
                      </h3>
                      
                      {/* 3. Prix */}
                      <p style={{ 
                        color: product.name.toLowerCase().includes('pack') ? '#FFFFFF' : '#000000',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        margin: 0
                      }}>
                        {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
                      </p>
                    </>
                  )}
                </>
              ) : (product.category === 'Sur-matelas' || product.category === 'Couettes' || product.category === 'Plateau' || product.category === 'Accessoires') ? (
                <>
                  {/* Affichage spécial pour les sur-matelas, couettes, plateaux et accessoires : dimensions en 28px rouge */}
                  {/* Nom du produit */}
                  <h3 style={{ 
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {productNameOnly}
                  </h3>
                  
                  {/* Dimensions en ROUGE 28px */}
                  {dimensions && (
                    <div style={{ marginBottom: '6px' }}>
                      <p style={{ 
                        color: '#FF0000',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        lineHeight: '1.1'
                      }}>
                        {dimensions}
                      </p>
                    </div>
                  )}
                  
                  {/* Prix - BLANC pour les plateaux uniquement, noir pour les autres */}
                  <p style={{ 
                    color: product.category === 'Plateau' ? '#FFFFFF' : '#000000',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    lineHeight: '1',
                    margin: 0
                  }}>
                    {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
                  </p>
                </>
              ) : (
                <>
                  {/* Affichage standard pour les autres produits */}
                  {/* Nom du produit */}
                  <h3 style={{ 
                    color: '#FFFFFF',
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
                        color: (['Sur-matelas', 'Couettes'].includes(product.category)) ? '#FF0000' : '#FFFFFF',
                        fontSize: (['Sur-matelas', 'Couettes'].includes(product.category)) ? '28px' : '18px',
                        fontWeight: 'bold',
                        lineHeight: '1.1'
                      }}>
                        {dimensions}
                      </p>
                    </div>
                  )}
                  
                  {/* Prix */}
                  <p style={{ 
                    color: '#FFFFFF',
                    fontSize: '20px', // Taille optimisée
                    fontWeight: 'bold',
                    lineHeight: '1',
                    margin: 0
                  }}>
                    {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
                  </p>
                </>
              )}
              
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

              {/* Indicateur vendeuse non sélectionnée */}
              {!selectedVendor && product.priceTTC > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  zIndex: 10,
                  border: '2px solid #F59E0B',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  👤 Sélectionner<br/>une vendeuse
                </div>
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
