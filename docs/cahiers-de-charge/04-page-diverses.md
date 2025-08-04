# Cahier de Charge - Page Diverses

## 📋 Vue d'ensemble
La page diverses correspond à l'onglet "Diverses" et permet d'ajouter des entrées personnalisées au panier (services, produits hors catalogue, réductions, etc.).

## 🎯 Objectifs
- Permettre l'ajout d'articles personnalisés non présents dans le catalogue
- Gérer les montants positifs (ventes diverses) et négatifs (réductions)
- Valider les saisies utilisateur (description et montant)
- Intégrer directement au panier existant

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~1025 (`{activeTab === 'diverses' && (`)
- **Composant** : Section conditionnelle dans `CaisseMyConfortApp`

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [selectedVendor, setSelectedVendor] = useLocalStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
const [miscDescription, setMiscDescription] = useState('');
const [miscAmount, setMiscAmount] = useState('');
const [showSuccess, setShowSuccess] = useState(false);
```

### Interface pour l'ajout au panier
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

## 🎨 Comportement UI

### Structure de la page
1. **Titre** : "Ventes diverses"
2. **Formulaire de saisie** : Description + Montant
3. **Exemples d'usage** : Guide utilisateur
4. **Bouton d'ajout** : Validation et ajout au panier

### Formulaire de saisie

#### Champ Description
```typescript
<input
  type="text"
  placeholder="Description de l'article (ex: Livraison, Réduction fidélité...)"
  value={miscDescription}
  onChange={(e) => setMiscDescription(e.target.value)}
  className="input w-full"
/>
```

#### Champ Montant
```typescript
<input
  type="number"
  step="0.01"
  placeholder="Montant en € (ex: 50 ou -10 pour une réduction)"
  value={miscAmount}
  onChange={(e) => setMiscAmount(e.target.value)}
  className="input w-full"
/>
```

### Exemples d'usage
Interface avec icônes et suggestions :

#### Montants positifs (ventes)
- **Livraison** : 30€
- **Installation** : 50€
- **Garantie étendue** : 80€
- **Service après-vente** : 25€

#### Montants négatifs (réductions)
- **Réduction fidélité** : -20€
- **Promotion** : -15€
- **Geste commercial** : -10€
- **Remise exceptionnelle** : Montant libre

### Validation du formulaire
```typescript
// Conditions de validation
const isFormValid = miscDescription.trim() !== '' && 
                   miscAmount !== '' && 
                   !isNaN(parseFloat(miscAmount));
```

## ⚡ Actions utilisateur

### Fonction d'ajout - addMiscItem
```typescript
const addMiscItem = () => {
  // Validation des données
  if (!miscDescription.trim() || !miscAmount || isNaN(parseFloat(miscAmount))) {
    alert('Veuillez remplir correctement la description et le montant.');
    return;
  }

  const amount = parseFloat(miscAmount);
  
  // Création de l'article personnalisé
  const miscItem: ExtendedCartItem = {
    id: `misc-${Date.now()}`, // ID unique avec préfixe
    name: miscDescription.trim(),
    price: amount,
    quantity: 1,
    category: 'Diverses', // Catégorie spéciale
    addedAt: new Date()
  };

  // Ajout au panier
  setCart(prevCart => [...prevCart, miscItem]);
  
  // Réinitialisation du formulaire
  setMiscDescription('');
  setMiscAmount('');
  
  // Feedback visuel
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 2000);
};
```

### Feedback de succès
```typescript
{showSuccess && (
  <div className="mt-4 p-4 rounded-lg animate-fadeIn"
       style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981' }}>
    <div className="flex items-center gap-2">
      <Check size={20} style={{ color: '#10B981' }} />
      <span style={{ color: '#065F46', fontWeight: 'bold' }}>
        Article ajouté au panier !
      </span>
    </div>
  </div>
)}
```

## 🛡️ Validation et sécurité

### Validation côté client
```typescript
// Vérification description
const isDescriptionValid = miscDescription.trim().length > 0;

// Vérification montant
const isAmountValid = miscAmount !== '' && 
                     !isNaN(parseFloat(miscAmount)) && 
                     parseFloat(miscAmount) !== 0;

// Vérification format numérique
const amount = parseFloat(miscAmount);
const isValidNumber = !isNaN(amount) && isFinite(amount);
```

### Gestion des cas particuliers
```typescript
// Montant à 0 interdit
if (amount === 0) {
  alert('Le montant ne peut pas être 0€');
  return;
}

// Montants très élevés (sécurité)
if (Math.abs(amount) > 10000) {
  const confirm = window.confirm(`Confirmer ce montant important : ${amount}€ ?`);
  if (!confirm) return;
}

// Description trop longue
if (miscDescription.length > 100) {
  alert('La description est trop longue (max 100 caractères)');
  return;
}
```

## 📊 Intégration au panier

### Catégorie spéciale
Les articles divers ont la catégorie `'Diverses'` pour :
- Les identifier dans le panier
- Les différencier dans les statistiques
- Permettre un traitement spécial si nécessaire

### Affichage dans le panier
```typescript
// Dans le composant panier
{item.category === 'Diverses' && (
  <span className="text-xs px-2 py-1 rounded"
        style={{ backgroundColor: '#E0E7FF', color: '#3730A3' }}>
    Divers
  </span>
)}
```

### Calcul du total
Les montants négatifs sont automatiquement pris en compte :
```typescript
const totalAmount = cart.reduce((sum, item) => 
  sum + (item.price * item.quantity), 0
);
```

## 🗄️ Persistance des données

### Sauvegarde automatique
L'utilisation du hook `useLocalStorage` assure la persistance automatique du panier avec les articles divers.

### Clé localStorage
- **Clé** : `STORAGE_KEYS.CART` = `'myconfort-cart'`
- **Type** : `ExtendedCartItem[]`
- **Inclut** : Articles catalogue + articles divers

## 🚨 Points critiques de debug

### Problème : Formulaire ne se valide pas
```javascript
// Vérifier les validations
console.log('Description:', miscDescription.trim());
console.log('Amount string:', miscAmount);
console.log('Amount parsed:', parseFloat(miscAmount));
console.log('Is valid number:', !isNaN(parseFloat(miscAmount)));
```

### Problème : Article non ajouté au panier
```javascript
// Vérifier l'ajout
console.log('Cart before:', cart);
// Après addMiscItem
console.log('Cart after:', cart);
console.log('New item:', miscItem);
```

### Problème : Montants négatifs non gérés
```javascript
// Vérifier le calcul du total
const positiveItems = cart.filter(item => item.price > 0);
const negativeItems = cart.filter(item => item.price < 0);

console.log('Positive items:', positiveItems);
console.log('Negative items:', negativeItems);
console.log('Total:', cart.reduce((sum, item) => sum + item.price, 0));
```

### Problème : Feedback de succès ne s'affiche pas
```javascript
// Vérifier l'état showSuccess
console.log('Show success state:', showSuccess);

// Vérifier le timeout
setTimeout(() => {
  console.log('Success message should be hidden now');
  setShowSuccess(false);
}, 2000);
```

## 💡 Exemples d'usage métier

### Services additionnels (+)
- Livraison à domicile : 30€
- Installation / Montage : 50€
- Garantie étendue 5 ans : 80€
- Nettoyage ancien matelas : 25€
- Service après-vente : 40€

### Réductions et gestes commerciaux (-)
- Réduction fidélité : -20€
- Promotion du moment : -15€
- Geste commercial : -10€
- Remise quantité : -50€
- Avoir client : -30€

## 📱 Responsive Design
- **Formulaire** : S'adapte à la largeur disponible
- **Exemples** : Grille responsive selon la taille d'écran
- **Boutons** : Taille optimisée pour le tactile

## 🔗 Dépendances
- **Icons** : `lucide-react` (FileText, Plus, Check)
- **Hook personnalisé** : `useLocalStorage`
- **CSS Classes** : `input`, `btn-primary`, `animate-fadeIn`

## ✅ Tests de validation
1. **Validation formulaire** : Champs vides → Bouton désactivé
2. **Montants positifs** : Article ajouté au panier avec bon prix
3. **Montants négatifs** : Réduction appliquée correctement
4. **Montant zéro** : Rejeté avec message d'erreur
5. **Description vide** : Rejetée avec message d'erreur
6. **Feedback succès** : Message vert affiché 2 secondes
7. **Persistance** : Articles divers sauvegardés avec le panier
8. **Réinitialisation** : Formulaire vidé après ajout réussi
