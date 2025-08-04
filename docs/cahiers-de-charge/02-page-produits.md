# Cahier de Charge - Page Produits

## 📋 Vue d'ensemble
La page produits correspond à l'onglet "Produits" et permet l'ajout d'articles au panier. C'est le cœur métier de l'application de caisse.

## 🎯 Objectifs
- Afficher le catalogue complet des produits MyConfort
- Permettre la recherche et le filtrage par catégorie
- Ajouter des articles au panier avec gestion des quantités
- Bloquer l'accès si aucune vendeuse n'est sélectionnée

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~730 (`{activeTab === 'produits' && !selectedVendor && (`) - Cas bloqué
- **Ligne de départ** : ~751 (`{activeTab === 'produits' && selectedVendor && (`) - Cas fonctionnel

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [selectedVendor, setSelectedVendor] = useLocalStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Tous'>('Tous');
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

### Interface CatalogProduct
```typescript
interface CatalogProduct {
  name: string;
  category: ProductCategory;
  priceTTC: number; // 0 = non vendu seul
  description?: string;
}

type ProductCategory = 'Matelas' | 'Sur-matelas' | 'Couettes' | 'Oreillers' | 'Plateau' | 'Accessoires';
```

### Interface ExtendedCartItem
```typescript
interface ExtendedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  addedAt: Date;
}
```

## 🗄️ Catalogue des produits

### Structure du catalogue
Le catalogue est défini dans `productCatalog: CatalogProduct[]` avec:

#### Matelas (10 références)
- MATELAS BAMBOU de 70x190 (900€) à 200x200 (2300€)

#### Sur-matelas (9 références)  
- SURMATELAS BAMBOU de 70x190 (220€) à 200x200 (630€)

#### Couettes (2 références)
- Couette 220x240 (300€)
- Couette 240x260 (350€)

#### Oreillers (13 références)
- Oreillers individuels : Douceur (80€), Thalasso (60€), etc.
- Packs d'oreillers : Pack de 2 oreillers (100€), etc.
- Traversins : 140 (140€), 160 (160€)

#### Plateaux (9 références)
- PLATEAU PRESTIGE de 70x190 (70€) à 200x200 (230€)

#### Accessoires (4 références)
- Le régule jambes (70€)
- Articles non vendus seuls (priceTTC: 0)

## 🎨 Comportement UI

### Cas 1: Aucune vendeuse sélectionnée
- **Titre** : "Vendeuse non sélectionnée"
- **Icône** : AlertCircle (rouge #F55D3E)
- **Message** : "Vous pouvez naviguer librement dans tous les onglets, mais pour ajouter des produits au panier, veuillez d'abord sélectionner une vendeuse."
- **Action** : Bouton "Sélectionner une vendeuse" → `setActiveTab('vendeuse')`

### Cas 2: Vendeuse sélectionnée - Interface active

#### Barre de recherche
- **Input** : `className="input w-full md:w-96"`
- **Placeholder** : "Rechercher un produit..."
- **Debounce** : 300ms sur la saisie
- **Recherche** : Insensible à la casse, cherche dans le nom du produit

#### Filtres par catégorie
- **Layout** : Boutons horizontaux avec scroll
- **Catégories** : ['Tous', 'Matelas', 'Sur-matelas', 'Couettes', 'Oreillers', 'Plateau', 'Accessoires']
- **Style actif** : `btn-primary` (vert MyConfort)
- **Style inactif** : Fond blanc

#### Grille des produits
- **Layout** : `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Filtrage** : Combinaison catégorie + recherche textuelle
- **Animation** : `animate-fadeIn` au chargement

### Affichage des produits

#### Affichage standard
```typescript
// Produit vendable standard
<h3>{product.name}</h3>
<p className="text-2xl font-bold" style={{ color: '#477A0C' }}>
  {product.priceTTC}€
</p>

// Produit non vendu seul
<p className="text-2xl font-bold" style={{ color: '#477A0C' }}>
  Non vendu seul
</p>
// Bouton désactivé avec opacity-50
```

#### Affichage spécial Matelas/Sur-matelas
Pour les produits de catégorie "Matelas" et "Sur-matelas", un affichage spécialisé avec couleur de fond et typographie renforcée est requis :

```typescript
// Structure d'affichage pour matelas avec couleur de fond MyConfort
<button
  onClick={() => addToCart(product)}
  className="card touch-feedback matelas-card"
  style={{
    backgroundColor: '#477A0C', // Couleur de fond OBLIGATOIRE pour tous les matelas
    color: 'white',
    border: '2px solid #477A0C'
  }}
>
  {/* Nom du produit sans dimensions */}
  <h3 className="matelas-name">{product.name.replace(/ \d+x\d+/, '')}</h3>
  
  {/* Dimensions extraites avec typographie spécifique */}
  <div className="matelas-dimensions">
    <span className="dimensions-size">
      {extractDimensions(product.name)} {/* Ex: "70 x 190" */}
    </span>
  </div>
  
  {/* Prix */}
  <p className="matelas-price">{product.priceTTC}€</p>
</button>
```

#### Spécifications CSS obligatoires pour matelas
```css
/* Couleur de fond obligatoire pour tous les matelas */
.matelas-card {
  background-color: #477A0C !important; /* Vert MyConfort OBLIGATOIRE */
  color: white !important;
  border: 2px solid #477A0C !important;
}

/* Dimensions en blanc, taille double, positionnées sous le nom */
.matelas-card .dimensions-size {
  color: white !important;           /* Police blanche OBLIGATOIRE */
  font-size: 2rem !important;        /* Taille DOUBLÉE (32px au lieu de 16px) */
  font-weight: bold !important;
  text-align: center;
  display: block;
  width: 100%;
  margin: 12px 0;                    /* Espacement vertical */
  padding: 8px;
  background-color: rgba(255,255,255,0.1); /* Fond léger pour contraste */
  border-radius: 6px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3); /* Ombre pour lisibilité */
}

/* Nom du matelas */
.matelas-card .matelas-name {
  color: white !important;
  font-size: 1rem;
  margin-bottom: 8px;
  text-align: center;
}

/* Prix du matelas */
.matelas-card .matelas-price {
  color: white !important;
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 12px;
  text-align: center;
}

/* Responsive pour les dimensions */
@media (max-width: 768px) {
  .matelas-card .dimensions-size {
    font-size: 1.75rem; /* Adapté pour mobile mais toujours doublé */
  }
}

@media (max-width: 480px) {
  .matelas-card .dimensions-size {
    font-size: 1.5rem; /* Minimum pour très petits écrans */
  }
}
```

#### Fonction d'extraction des dimensions
```typescript
const extractDimensions = (productName: string): string => {
  const dimensionMatch = productName.match(/(\d+)\s*x\s*(\d+)/);
  return dimensionMatch ? `${dimensionMatch[1]} x ${dimensionMatch[2]}` : '';
};
```

#### Exemples d'affichage matelas
- **MATELAS BAMBOU 70 x 190** →
  - **Fond** : Vert MyConfort (#477A0C)
  - **Titre** : "MATELAS BAMBOU" (blanc, taille normale, centré)
  - **Dimensions** : **"70 x 190"** (blanc, **taille DOUBLÉE**, centré, sous le titre)
  - **Prix** : "900€" (blanc, gras, centré)

- **SURMATELAS BAMBOU 160 x 200** →
  - **Fond** : Vert MyConfort (#477A0C)
  - **Titre** : "SURMATELAS BAMBOU" (blanc, taille normale, centré)
  - **Dimensions** : **"160 x 200"** (blanc, **taille DOUBLÉE**, centré, sous le titre)
  - **Prix** : "490€" (blanc, gras, centré)
  
  {/* Dimensions extraites et stylisées */}
  <div className="product-dimensions">
    <span className="dimensions-text">
      {extractDimensions(product.name)} {/* Ex: "70 x 190" */}
    </span>
  </div>
  
  {/* Prix */}
  <p className="product-price">{product.priceTTC}€</p>
</div>
```

#### Spécifications CSS pour dimensions matelas
```css
.matelas-card .dimensions-text {
  color: white !important;           /* Police blanche obligatoire */
  font-size: 2rem !important;        /* Taille doublée (32px au lieu de 16px) */
  font-weight: bold;
  text-align: center;
  background-color: rgba(0,0,0,0.3); /* Fond semi-transparent pour lisibilité */
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0;
  display: block;
  width: 100%;
}

/* Responsive pour les dimensions */
@media (max-width: 768px) {
  .matelas-card .dimensions-text {
    font-size: 1.75rem; /* Adapté pour mobile */
  }
}
```

#### Fonction d'extraction des dimensions
```typescript
const extractDimensions = (productName: string): string => {
  const dimensionMatch = productName.match(/(\d+)\s*x\s*(\d+)/);
  return dimensionMatch ? `${dimensionMatch[1]} x ${dimensionMatch[2]}` : '';
};
```

#### Exemples d'affichage matelas
- **MATELAS BAMBOU 70 x 190** →
  - Titre : "MATELAS BAMBOU"
  - Dimensions : **"70 x 190"** (blanc, taille double)
  - Prix : "900€"

- **SURMATELAS BAMBOU 160 x 200** →
  - Titre : "SURMATELAS BAMBOU"  
  - Dimensions : **"160 x 200"** (blanc, taille double)
  - Prix : "490€"

## ⚡ Actions utilisateur

### Ajout au panier - Fonction addToCart
```typescript
const addToCart = useCallback((product: CatalogProduct) => {
  if (product.priceTTC <= 0) return; // Sécurité pour produits non vendables
  
  const newItem: ExtendedCartItem = {
    id: `${product.name}-${Date.now()}`, // ID unique
    name: product.name,
    price: product.priceTTC,
    quantity: 1,
    category: product.category,
    addedAt: new Date()
  };
  
  setCart(prevCart => [...prevCart, newItem]);
}, [setCart]);
```

### Logique de filtrage
```typescript
const filteredProducts = useMemo(() => {
  let filtered = productCatalog;
  
  // Filtre par catégorie
  if (selectedCategory !== 'Tous') {
    filtered = filtered.filter(product => product.category === selectedCategory);
  }
  
  // Filtre par recherche textuelle
  if (debouncedSearchTerm) {
    const searchLower = debouncedSearchTerm.toLowerCase();
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(searchLower)
    );
  }
  
  return filtered;
}, [selectedCategory, debouncedSearchTerm]);
```

## 🛒 Panier latéral

### Affichage conditionnel
Le panier est visible uniquement sur les onglets 'produits' et 'annulation':
```typescript
{['produits', 'annulation'].includes(activeTab) && (
  <CartComponent />
)}
```

### États du panier
- **Ouvert** : Panier visible avec liste des articles
- **Minimisé** : `isCartMinimized = true` - Seul le bouton total est visible
- **Basculement** : Clic sur le header du panier

## 🗄️ Persistance des données

### Clé localStorage panier
- **Clé** : `STORAGE_KEYS.CART` = `'myconfort-cart'`
- **Type** : `ExtendedCartItem[]`
- **Réhydratation** : Automatique au chargement

### Hook useDebounce
```typescript
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};
```

## 🚨 Points critiques de debug

### Problème : Produits non visibles
```javascript
// Vérifier le filtrage
console.log('Selected category:', selectedCategory);
console.log('Search term:', debouncedSearchTerm);
console.log('Filtered products:', filteredProducts);
```

### Problème : Ajout au panier ne fonctionne pas
```javascript
// Vérifier la vendeuse sélectionnée
console.log('Selected vendor:', selectedVendor);

// Vérifier le produit cliqué
console.log('Product clicked:', product);
console.log('Price valid:', product.priceTTC > 0);

// Vérifier le panier
console.log('Cart state:', cart);
```

### Problème : Affichage matelas non conforme
```javascript
// Vérifier l'extraction des dimensions
const testProducts = [
  'MATELAS BAMBOU 70 x 190',
  'SURMATELAS BAMBOU 160 x 200',
  'MATELAS BAMBOU 140 x 190'
];

testProducts.forEach(name => {
  const dimensions = extractDimensions(name);
  const title = name.replace(/ \d+x\d+/, '');
  console.log(`Product: ${name}`);
  console.log(`- Title: ${title}`);
  console.log(`- Dimensions: ${dimensions}`);
});

// Vérifier l'application des styles CSS obligatoires
const matelasCards = document.querySelectorAll('.matelas-card');
matelasCards.forEach((card, index) => {
  const style = window.getComputedStyle(card);
  const dimensionElement = card.querySelector('.dimensions-size');
  
  console.log(`Matelas card ${index}:`);
  console.log(`- Background color: ${style.backgroundColor} (should be #477A0C)`);
  console.log(`- Text color: ${style.color} (should be white)`);
  
  if (dimensionElement) {
    const dimStyle = window.getComputedStyle(dimensionElement);
    console.log(`- Dimension font size: ${dimStyle.fontSize} (should be 2rem/32px)`);
    console.log(`- Dimension color: ${dimStyle.color} (should be white)`);
  }
});

// Vérifier que tous les matelas ont la classe matelas-card
const matelasProducts = filteredProducts.filter(p => 
  p.category === 'Matelas' || p.category === 'Sur-matelas'
);
console.log(`Found ${matelasProducts.length} matelas products`);
console.log(`Found ${matelasCards.length} matelas cards in DOM`);
```

### Problème : Couleur de fond matelas non appliquée
```javascript
// Vérifier que la couleur #477A0C est bien appliquée
const checkMatelasColor = () => {
  const matelasCards = document.querySelectorAll('.matelas-card');
  
  matelasCards.forEach((card, index) => {
    const bgColor = window.getComputedStyle(card).backgroundColor;
    // Convertir RGB en hex pour comparaison
    const rgbMatch = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
    
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      const hex = '#' + [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
      
      console.log(`Matelas ${index}: background is ${hex} (expected #477a0c)`);
      
      if (hex.toLowerCase() !== '#477a0c') {
        console.error(`❌ Matelas ${index} has wrong background color!`);
      } else {
        console.log(`✅ Matelas ${index} has correct background color`);
      }
    }
  });
};

checkMatelasColor();
```

### Problème : Recherche ne fonctionne pas
```javascript
// Vérifier le debounce
console.log('Raw search term:', searchTerm);
console.log('Debounced search term:', debouncedSearchTerm);
```

### Problème : Panier non persisté
```javascript
// Vérifier localStorage
localStorage.getItem('myconfort-cart');
```

## 📱 Responsive Design
- **Mobile** : 2 colonnes de produits
- **Tablette** : 3 colonnes
- **Desktop** : 4 colonnes
- **Panier** : S'adapte à la largeur restante

## 🔗 Dépendances
- **Icons** : `lucide-react` (Package, AlertCircle, Plus)
- **Hooks personnalisés** : `useLocalStorage`, `useDebounce`
- **CSS Classes** : `input`, `btn-primary`, `card`, `touch-feedback`

## ✅ Tests de validation
1. **Accès bloqué** : Sans vendeuse → Message d'erreur + redirection
2. **Recherche** : Saisie → Filtrage temps réel avec debounce
3. **Catégories** : Clic catégorie → Filtrage immédiat
4. **Ajout panier** : Clic produit → Article ajouté avec quantité 1
5. **Produits non vendables** : Bouton désactivé + message "Non vendu seul"
6. **Persistance** : Rechargement → Panier conservé
7. **Responsive** : Grille s'adapte selon la taille d'écran

### Tests spécifiques Matelas/Sur-matelas
8. **Couleur de fond obligatoire** : 
   - Tous les matelas ont la couleur #477A0C
   - Tous les sur-matelas ont la couleur #477A0C
   - Aucun autre produit n'a cette couleur de fond

9. **Affichage dimensions** : 
   - Dimensions extraites correctement du nom (ex: "70 x 190")
   - Police blanche sur tous les matelas/sur-matelas
   - Taille de police DOUBLÉE (2rem au lieu de 1rem)
   - Position centrée sous le nom du produit

10. **Contraste et lisibilité** :
    - Texte blanc parfaitement lisible sur fond vert #477A0C
    - Ombre de texte appliquée pour améliorer la lisibilité
    - Fond léger semi-transparent derrière les dimensions

11. **Responsive matelas** :
    - Mobile : Dimensions à 1.75rem (toujours doublé)
    - Très petit écran : Dimensions minimum 1.5rem
    - Desktop : Dimensions à 2rem complet

12. **Structure DOM matelas** :
    - Classe `.matelas-card` présente sur tous les matelas
    - Classe `.dimensions-size` présente sur les dimensions
    - Fonction `extractDimensions()` fonctionne correctement
   - Taille de police doublée (2rem minimum)
   - Positionnement sous le titre du produit
9. **Lisibilité** : Fond semi-transparent pour contraste sur toutes couleurs
10. **Responsive dimensions** : Taille adaptée sur mobile (1.75rem minimum)
11. **Extraction précise** : Regex capture toutes les variations (70x190, 70 x 190, etc.)
