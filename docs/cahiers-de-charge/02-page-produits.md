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
```typescript
// Produit vendable
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
