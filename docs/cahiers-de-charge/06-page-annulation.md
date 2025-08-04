# Cahier de Charge - Page Annulation

## 📋 Vue d'ensemble
La page annulation correspond à l'onglet "Annulation" et permet d'annuler des ventes déjà enregistrées. Elle affiche aussi le panier en cours pour gérer les annulations avant validation.

## 🎯 Objectifs
- Annuler des ventes déjà validées et enregistrées
- Mettre à jour les statistiques des vendeuses après annulation
- Gérer le panier en cours (comme sur la page Produits)
- Traçabilité complète des annulations (vente marquée, pas supprimée)

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~1073 (`{activeTab === 'annulation' && (`)
- **Composant** : Section conditionnelle dans `CaisseMyConfortApp`

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [sales, setSales] = useLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []);
const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
```

### Interface Sale
```typescript
interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean; // ⚠️ Champ critique pour l'annulation
}
```

## 🎨 Comportement UI

### Structure de la page
1. **Section panier** : Panier en cours (identique à la page Produits)
2. **Titre section historique** : "Annuler une vente"
3. **Liste des ventes** : Ventes récentes non annulées
4. **Modales de confirmation** : Double validation pour sécurité

### Affichage du panier
Le panier est affiché de manière identique à la page Produits :
```typescript
{['produits', 'annulation'].includes(activeTab) && (
  <CartComponent />
)}
```

### Liste des ventes annulables
```typescript
// Tri par date décroissante, ventes non annulées seulement
const cancellableSales = sales
  .filter(sale => !sale.canceled) // Exclure les déjà annulées
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 20); // Limiter aux 20 plus récentes pour les performances
```

### Affichage d'une vente annulable
```typescript
<div key={sale.id} className="card cursor-pointer hover:shadow-lg">
  {/* Header avec date et vendeuse */}
  <div className="flex justify-between items-center mb-3">
    <div>
      <p className="font-bold">{new Date(sale.date).toLocaleString()}</p>
      <p className="text-sm text-gray-600">Vendeuse: {sale.vendorName}</p>
    </div>
    <div className="text-right">
      <p className="text-xl font-bold" style={{ color: '#477A0C' }}>
        {sale.totalAmount}€
      </p>
      <p className="text-xs text-gray-500">
        {getPaymentMethodLabel(sale.paymentMethod)}
      </p>
    </div>
  </div>

  {/* Liste des articles */}
  <div className="mb-3">
    <p className="text-sm font-semibold mb-2">Articles:</p>
    {sale.items.map((item, index) => (
      <div key={index} className="flex justify-between text-sm">
        <span>{item.name} x{item.quantity}</span>
        <span>{(item.price * item.quantity)}€</span>
      </div>
    ))}
  </div>

  {/* Bouton d'annulation */}
  <button
    onClick={() => handleCancelSaleClick(sale)}
    className="w-full py-2 px-4 rounded font-semibold text-white"
    style={{ backgroundColor: '#F55D3E' }}
  >
    Annuler cette vente
  </button>
</div>
```

## ⚡ Processus d'annulation

### Étape 1: Clic initial
```typescript
const handleCancelSaleClick = (sale: Sale) => {
  // Sauvegarder la vente à annuler
  setSaleToCancel(sale);
  
  // Afficher la première modale de confirmation
  setShowCancelConfirmation(true);
};
```

### Étape 2: Première confirmation
```typescript
// Modale avec détails de la vente
<div className="modal-overlay">
  <div className="modal-content">
    <h3>Confirmer l'annulation</h3>
    <p>Êtes-vous sûr de vouloir annuler cette vente ?</p>
    
    <div className="sale-details">
      <p><strong>Date:</strong> {new Date(saleToCancel.date).toLocaleString()}</p>
      <p><strong>Vendeuse:</strong> {saleToCancel.vendorName}</p>
      <p><strong>Montant:</strong> {saleToCancel.totalAmount}€</p>
      <p><strong>Articles:</strong></p>
      <ul>
        {saleToCancel.items.map((item, index) => (
          <li key={index}>{item.name} x{item.quantity} = {item.price * item.quantity}€</li>
        ))}
      </ul>
    </div>

    <div className="modal-actions">
      <button onClick={() => setShowCancelConfirmation(false)}>
        Retour
      </button>
      <button 
        onClick={handleSecondConfirmation}
        style={{ backgroundColor: '#F55D3E' }}
      >
        Confirmer l'annulation
      </button>
    </div>
  </div>
</div>
```

### Étape 3: Seconde confirmation (sécurité)
```typescript
const handleSecondConfirmation = () => {
  setShowCancelConfirmation(false);
  setShowFinalConfirmation(true);
};

// Modale finale avec bouton de sécurité
<div className="modal-overlay">
  <div className="modal-content">
    <h3 style={{ color: '#F55D3E' }}>⚠️ ATTENTION</h3>
    <p>Cette action est <strong>irréversible</strong>.</p>
    <p>La vente sera définitivement marquée comme annulée.</p>
    
    <div className="modal-actions">
      <button onClick={() => setShowFinalConfirmation(false)}>
        Retour
      </button>
      <button 
        onClick={confirmCancelSale}
        style={{ backgroundColor: '#DC2626' }}
      >
        ANNULER DÉFINITIVEMENT
      </button>
    </div>
  </div>
</div>
```

### Étape 4: Annulation effective
```typescript
const confirmCancelSale = () => {
  if (!saleToCancel) return;

  // 1. Marquer la vente comme annulée
  setSales(prevSales => 
    prevSales.map(sale => 
      sale.id === saleToCancel.id 
        ? { ...sale, canceled: true }
        : sale
    )
  );

  // 2. Mettre à jour les statistiques de la vendeuse
  setVendorStats(prevStats =>
    prevStats.map(vendor =>
      vendor.id === saleToCancel.vendorId
        ? {
            ...vendor,
            totalSales: Math.max(0, vendor.totalSales - saleToCancel.totalAmount),
            // Note: On pourrait aussi décrémenter le nombre de ventes
          }
        : vendor
    )
  );

  // 3. Fermer les modales
  setShowFinalConfirmation(false);
  setSaleToCancel(null);

  // 4. Afficher un feedback de succès
  setShowCancelSuccess(true);
  setTimeout(() => setShowCancelSuccess(false), 3000);
};
```

## 🛡️ Sécurités et validations

### Limitation temporelle
```typescript
// Optionnel: Empêcher l'annulation de ventes trop anciennes
const isRecentSale = (saleDate: Date): boolean => {
  const now = new Date();
  const timeDiff = now.getTime() - new Date(saleDate).getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  return daysDiff <= 7; // Exemple: 7 jours maximum
};

// Dans le filtre des ventes
const cancellableSales = sales
  .filter(sale => !sale.canceled && isRecentSale(sale.date))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

### Vérification de cohérence
```typescript
const confirmCancelSale = () => {
  // Vérification finale: la vente existe-t-elle encore ?
  const currentSale = sales.find(s => s.id === saleToCancel.id);
  if (!currentSale || currentSale.canceled) {
    alert('Cette vente a déjà été annulée ou n\'existe plus.');
    setShowFinalConfirmation(false);
    return;
  }

  // Vérification: la vendeuse existe-t-elle encore ?
  const vendor = vendorStats.find(v => v.id === saleToCancel.vendorId);
  if (!vendor) {
    alert('La vendeuse associée à cette vente n\'est plus dans le système.');
    return;
  }

  // Procéder à l'annulation...
};
```

## 🔄 Impact sur les statistiques

### Mise à jour du CA
L'annulation impact directement :
- **CA total** : Diminution du montant annulé
- **Stats vendeuse** : Réduction de ses ventes totales
- **Historique** : Vente conservée mais marquée `canceled: true`

### Calculs dans les autres pages
Les autres pages (CA Instant, Ventes) excluent automatiquement les ventes annulées :
```typescript
const validSales = sales.filter(sale => !sale.canceled);
```

## 🗄️ Persistance des données

### Sauvegarde automatique
- **Ventes modifiées** : `localStorage['myconfort-sales']`
- **Stats vendeuses** : `localStorage['myconfort-vendors']`
- **Panier inchangé** : `localStorage['myconfort-cart']`

### Traçabilité
Les ventes annulées restent dans l'historique avec le flag `canceled: true`, permettant :
- Audit des annulations
- Statistiques d'annulation
- Récupération en cas d'erreur (développement futur)

## 🚨 Points critiques de debug

### Problème : Vente ne s'annule pas
```javascript
// Vérifier l'ID de la vente
console.log('Sale to cancel:', saleToCancel);
console.log('Sale ID:', saleToCancel?.id);

// Vérifier la recherche dans le tableau
const foundSale = sales.find(s => s.id === saleToCancel.id);
console.log('Found sale in array:', foundSale);

// Vérifier la mise à jour
setSales(prevSales => {
  const updated = prevSales.map(sale => {
    if (sale.id === saleToCancel.id) {
      console.log('Canceling sale:', sale.id);
      return { ...sale, canceled: true };
    }
    return sale;
  });
  console.log('Updated sales array:', updated);
  return updated;
});
```

### Problème : Stats vendeuse non mises à jour
```javascript
// Vérifier la vendeuse trouvée
const vendor = vendorStats.find(v => v.id === saleToCancel.vendorId);
console.log('Vendor found:', vendor);

// Vérifier le calcul de soustraction
console.log('Previous total sales:', vendor.totalSales);
console.log('Amount to subtract:', saleToCancel.totalAmount);
console.log('New total:', vendor.totalSales - saleToCancel.totalAmount);
```

### Problème : Modales ne s'affichent pas
```javascript
// Vérifier les états des modales
console.log('Show cancel confirmation:', showCancelConfirmation);
console.log('Show final confirmation:', showFinalConfirmation);
console.log('Sale to cancel:', saleToCancel);
```

### Problème : Panier non visible
```javascript
// Vérifier la condition d'affichage
console.log('Active tab:', activeTab);
console.log('Should show cart:', ['produits', 'annulation'].includes(activeTab));
```

## 📱 Responsive Design
- **Liste des ventes** : Cards empilées verticalement
- **Modales** : S'adaptent à la taille d'écran
- **Panier** : Position optimisée selon l'espace disponible

## 🔗 Dépendances
- **Icons** : `lucide-react` (RotateCcw, AlertTriangle, X)
- **Hook personnalisé** : `useLocalStorage`
- **CSS Classes** : `card`, `modal-overlay`, `modal-content`

## ✅ Tests de validation
1. **Affichage ventes** : Seules les ventes non annulées sont listées
2. **Double confirmation** : Deux modales successives obligatoires
3. **Annulation effective** : Vente marquée `canceled: true`
4. **Stats mises à jour** : CA vendeuse diminué du montant annulé
5. **Traçabilité** : Vente reste dans l'historique avec flag
6. **Feedback utilisateur** : Message de confirmation après annulation
7. **Panier fonctionnel** : Même comportement que page Produits
8. **Performance** : Affichage fluide même avec nombreuses ventes
