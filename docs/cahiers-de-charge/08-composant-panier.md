# Cahier de Charge - Composant Panier

## 📋 Vue d'ensemble
Le panier est un composant transversal affiché sur les pages "Produits" et "Annulation". Il gère les articles en cours d'achat, les quantités, et la finalisation des ventes.

## 🎯 Objectifs
- Afficher les articles ajoutés avec quantités et prix
- Permettre la modification des quantités (augmenter/diminuer)
- Supprimer des articles individuels
- Calculer le total en temps réel
- Gérer le processus de paiement et validation
- État minimisé/étendu pour optimiser l'espace

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~1509 (`{['produits', 'annulation'].includes(activeTab) && (`)
- **Affichage conditionnel** : Uniquement sur onglets "Produits" et "Annulation"
- **Position** : Panneau latéral fixe à droite

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
const [isCartMinimized, setIsCartMinimized] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
const [showSuccess, setShowSuccess] = useState(false);
```

### Interface ExtendedCartItem
```typescript
interface ExtendedCartItem {
  id: string;           // ID unique de l'article dans le panier
  name: string;         // Nom du produit
  price: number;        // Prix unitaire (peut être négatif pour réductions)
  quantity: number;     // Quantité
  category: string;     // Catégorie ('Matelas', 'Diverses', etc.)
  addedAt: Date;        // Timestamp d'ajout
}
```

### Types de paiement
```typescript
type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';

const paymentMethods = [
  { id: 'card', label: 'Carte bancaire', icon: CreditCard },
  { id: 'cash', label: 'Espèces', icon: null },
  { id: 'check', label: 'Chèque', icon: null },
  { id: 'multi', label: 'Paiement mixte', icon: null }
];
```

## 🎨 Comportement UI

### Structure du panier
1. **Header** : Titre + Bouton minimiser + Total
2. **Corps** : Liste des articles (si étendu)
3. **Footer** : Boutons d'action (Vider/Payer)

### État étendu (normal)
```typescript
<div className="cart-container">
  {/* Header avec total et bouton minimiser */}
  <div className="cart-header">
    <div className="flex justify-between items-center">
      <h3 className="font-bold">Panier ({cart.length})</h3>
      <button onClick={() => setIsCartMinimized(true)}>
        <Minus size={16} />
      </button>
    </div>
    <div className="total-display">
      <span className="text-2xl font-bold">{totalAmount}€</span>
    </div>
  </div>

  {/* Liste des articles */}
  <div className="cart-items">
    {cart.map(item => (
      <CartItemComponent key={item.id} item={item} />
    ))}
  </div>

  {/* Actions */}
  <div className="cart-actions">
    <button onClick={clearCart} className="btn-secondary">
      Vider le panier
    </button>
    <button 
      onClick={() => setShowPaymentModal(true)}
      disabled={cart.length === 0}
      className="btn-primary"
    >
      Payer ({totalAmount}€)
    </button>
  </div>
</div>
```

### État minimisé
```typescript
<div className="cart-minimized">
  <button 
    onClick={() => setIsCartMinimized(false)}
    className="cart-summary-btn"
  >
    <ShoppingCart size={20} />
    <span>{cart.length} articles</span>
    <span className="font-bold">{totalAmount}€</span>
    <Plus size={16} />
  </button>
</div>
```

### Affichage d'un article dans le panier
```typescript
<div className="cart-item">
  {/* Nom et catégorie */}
  <div className="item-info">
    <h4 className="font-semibold text-sm">{item.name}</h4>
    {item.category === 'Diverses' && (
      <span className="badge badge-diverses">Divers</span>
    )}
  </div>

  {/* Prix unitaire */}
  <div className="item-price">
    <span className={item.price >= 0 ? 'text-green' : 'text-red'}>
      {item.price}€
    </span>
  </div>

  {/* Contrôles de quantité */}
  <div className="quantity-controls">
    <button 
      onClick={() => updateQuantity(item.id, item.quantity - 1)}
      disabled={item.quantity <= 1}
    >
      <Minus size={16} />
    </button>
    <span className="quantity">{item.quantity}</span>
    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
      <Plus size={16} />
    </button>
  </div>

  {/* Prix total de la ligne */}
  <div className="line-total">
    <span className="font-bold">
      {(item.price * item.quantity).toFixed(2)}€
    </span>
  </div>

  {/* Bouton supprimer */}
  <button 
    onClick={() => removeFromCart(item.id)}
    className="remove-btn"
  >
    <X size={16} />
  </button>
</div>
```

## ⚡ Actions sur le panier

### Ajout d'article (depuis pages Produits/Diverses)
```typescript
const addToCart = useCallback((product: CatalogProduct | CustomItem) => {
  const newItem: ExtendedCartItem = {
    id: `${product.name}-${Date.now()}`, // ID unique
    name: product.name,
    price: product.price,
    quantity: 1,
    category: product.category,
    addedAt: new Date()
  };
  
  setCart(prevCart => [...prevCart, newItem]);
}, [setCart]);
```

### Modification de quantité
```typescript
const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
  if (newQuantity <= 0) {
    removeFromCart(itemId);
    return;
  }

  setCart(prevCart =>
    prevCart.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity }
        : item
    )
  );
}, [setCart]);
```

### Suppression d'article
```typescript
const removeFromCart = useCallback((itemId: string) => {
  setCart(prevCart => prevCart.filter(item => item.id !== itemId));
}, [setCart]);
```

### Vider le panier
```typescript
const clearCart = useCallback(() => {
  const confirmClear = window.confirm(
    'Êtes-vous sûr de vouloir vider le panier ?'
  );
  
  if (confirmClear) {
    setCart([]);
  }
}, [setCart]);
```

### Calcul du total
```typescript
const totalAmount = useMemo(() => {
  return cart.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}, [cart]);

// Affichage formaté
const formattedTotal = totalAmount.toLocaleString('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});
```

## 💳 Processus de paiement

### Modale de sélection paiement
```typescript
<div className="payment-modal">
  <div className="modal-content">
    <h3>Finaliser la vente</h3>
    
    {/* Récapitulatif du panier */}
    <div className="sale-summary">
      <p><strong>Vendeuse :</strong> {selectedVendor?.name}</p>
      <p><strong>Articles :</strong> {cart.length}</p>
      <p><strong>Total :</strong> {totalAmount}€</p>
    </div>

    {/* Sélection mode de paiement */}
    <div className="payment-methods">
      {paymentMethods.map(method => (
        <button
          key={method.id}
          onClick={() => setSelectedPaymentMethod(method.id)}
          className={`payment-method-btn ${
            selectedPaymentMethod === method.id ? 'active' : ''
          }`}
        >
          {method.icon && <method.icon size={20} />}
          <span>{method.label}</span>
        </button>
      ))}
    </div>

    {/* Actions */}
    <div className="modal-actions">
      <button onClick={() => setShowPaymentModal(false)}>
        Annuler
      </button>
      <button onClick={processSale} className="btn-primary">
        Confirmer la vente
      </button>
    </div>
  </div>
</div>
```

### Traitement de la vente
```typescript
const processSale = useCallback(() => {
  if (!selectedVendor || cart.length === 0) {
    alert('Impossible de traiter la vente : vendeuse ou panier manquant');
    return;
  }

  // Création de la vente
  const newSale: Sale = {
    id: `sale-${Date.now()}`,
    vendorId: selectedVendor.id,
    vendorName: selectedVendor.name,
    items: [...cart], // Copie des articles
    totalAmount: totalAmount,
    paymentMethod: selectedPaymentMethod,
    date: new Date(),
    canceled: false
  };

  // Sauvegarde de la vente
  setSales(prevSales => [...prevSales, newSale]);

  // Mise à jour des stats vendeuse
  setVendorStats(prevStats =>
    prevStats.map(vendor =>
      vendor.id === selectedVendor.id
        ? {
            ...vendor,
            totalSales: vendor.totalSales + totalAmount,
            dailySales: vendor.dailySales + totalAmount
          }
        : vendor
    )
  );

  // Vider le panier
  setCart([]);

  // Fermer la modale
  setShowPaymentModal(false);

  // Afficher le succès
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 3000);

}, [cart, totalAmount, selectedVendor, selectedPaymentMethod, setSales, setVendorStats, setCart]);
```

## 🎨 Styles et responsive

### CSS Classes principales
```css
.cart-container {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  max-height: calc(100vh - 100px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  overflow: hidden;
}

.cart-minimized {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
}

.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  gap: 8px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #F3F4F6;
  border-radius: 6px;
  padding: 4px;
}
```

### Responsive design
```css
/* Mobile : panier en bas */
@media (max-width: 768px) {
  .cart-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    width: 100%;
    max-height: 50vh;
    border-radius: 12px 12px 0 0;
  }
}

/* Tablette : largeur réduite */
@media (max-width: 1024px) {
  .cart-container {
    width: 300px;
  }
}
```

## 🗄️ Persistance des données

### Clé localStorage panier
- **Clé** : `STORAGE_KEYS.CART` = `'myconfort-cart'`
- **Type** : `ExtendedCartItem[]`
- **Persistence** : Automatique à chaque modification
- **Réhydratation** : Au chargement de l'application

### Structure de sauvegarde
```typescript
// Format localStorage avec versioning
const cartData = {
  version: '1.0',
  timestamp: Date.now(),
  data: cart
};
```

## 🚨 Points critiques de debug

### Problème : Panier ne s'affiche pas
```javascript
// Vérifier la condition d'affichage
console.log('Active tab:', activeTab);
console.log('Should show cart:', ['produits', 'annulation'].includes(activeTab));
console.log('Cart items count:', cart.length);
```

### Problème : Total incorrect
```javascript
// Vérifier le calcul du total
console.log('Cart items:', cart);
cart.forEach((item, index) => {
  console.log(`Item ${index}: ${item.name} - ${item.quantity} x ${item.price} = ${item.quantity * item.price}`);
});
console.log('Total calculated:', cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
```

### Problème : Quantités non mises à jour
```javascript
// Vérifier la fonction updateQuantity
const updateQuantity = (itemId, newQuantity) => {
  console.log('Updating quantity:', itemId, newQuantity);
  setCart(prevCart => {
    const updated = prevCart.map(item => {
      if (item.id === itemId) {
        console.log('Found item to update:', item.name);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    console.log('Updated cart:', updated);
    return updated;
  });
};
```

### Problème : Persistence non fonctionnelle
```javascript
// Vérifier localStorage
console.log('Cart in localStorage:', localStorage.getItem('myconfort-cart'));

// Vérifier useLocalStorage hook
const [cart, setCart] = useLocalStorage('myconfort-cart', []);
console.log('Cart from hook:', cart);
```

### Problème : Vente non enregistrée
```javascript
// Vérifier processSale
const processSale = () => {
  console.log('Processing sale...');
  console.log('Selected vendor:', selectedVendor);
  console.log('Cart items:', cart);
  console.log('Total amount:', totalAmount);
  console.log('Payment method:', selectedPaymentMethod);
};
```

## 📱 Optimisations tactiles (iPad)

### Taille des boutons
- **Minimum** : 44px x 44px pour tous les boutons
- **Quantité** : Boutons +/- de 40px x 40px
- **Suppression** : Bouton X de 32px x 32px

### Feedback visuel
```css
.cart-item button:active {
  transform: scale(0.95);
  background-color: #E5E7EB;
}

.payment-method-btn:active {
  transform: scale(0.98);
}
```

### Prévention zoom accidentel
```css
.cart-container input {
  font-size: 16px !important; /* Empêche le zoom sur iPad */
}
```

## 🔗 Dépendances

### Icônes (lucide-react)
- **Panier** : ShoppingCart, Plus, Minus, X
- **Paiement** : CreditCard, Save
- **Actions** : Check (succès)

### Hooks personnalisés
- **useLocalStorage** : Persistence automatique
- **useMemo** : Calcul optimisé du total
- **useCallback** : Optimisation des fonctions

### CSS Classes
- **Layout** : cart-container, cart-minimized, cart-item
- **Interactivité** : btn-primary, btn-secondary, touch-feedback
- **États** : badge-diverses, payment-method-btn active

## ✅ Tests de validation

### Fonctionnalités de base
1. **Ajout article** : Produit ajouté → Apparaît dans le panier
2. **Modification quantité** : +/- → Quantité et total mis à jour
3. **Suppression article** : X → Article retiré du panier
4. **Vider panier** : Bouton → Confirmation + panier vidé
5. **Total temps réel** : Modification → Total recalculé immédiatement

### États du panier
6. **Minimiser/Étendre** : Bouton → Changement d'état visuel
7. **Panier vide** : Aucun article → Bouton "Payer" désactivé
8. **Articles divers** : Badge "Divers" affiché correctement

### Processus de paiement
9. **Sélection paiement** : Mode sélectionné → Bouton actif
10. **Validation vente** : Confirmer → Vente enregistrée + panier vidé
11. **Stats vendeuse** : Vente → Stats mises à jour
12. **Feedback succès** : Vente → Message 3 secondes

### Persistence et performance
13. **Rechargement page** : Panier conservé en localStorage
14. **Navigation onglets** : Panier affiché seulement sur Produits/Annulation
15. **Performance** : Calculs fluides même avec 50+ articles

### Responsive
16. **Mobile** : Panier en bas d'écran
17. **Tablette** : Largeur adaptée
18. **Tactile** : Tous les boutons facilement cliquables
