# Cahier de Charge - Page Frontale (Sélection Vendeuse)

## 📋 Vue d'ensemble
La page frontale correspond à l'onglet "Vendeuse" et constitue le point d'entrée obligatoire de l'application.

## 🎯 Objectifs
- Sélectionner une vendeuse avant d'accéder aux autres fonctionnalités
- Afficher les statistiques de vente de chaque vendeuse
- Rediriger automatiquement vers l'onglet "Produits" après sélection

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~671 (`{activeTab === 'vendeuse' && (`)
- **Composant** : Section conditionnelle dans `CaisseMyConfortApp`

## 🔧 Fonctionnalités techniques

### État requis
```typescript
const [selectedVendor, setSelectedVendor] = useLocalStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
```

### Interface Vendor
```typescript
interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
}
```

### Vendeuses disponibles
```typescript
const vendors: Vendor[] = [
  { id: '1', name: 'Sylvie', dailySales: 0, totalSales: 0, color: '#477A0C' },
  { id: '2', name: 'Babette', dailySales: 0, totalSales: 0, color: '#F55D3E' },
  { id: '3', name: 'Lucia', dailySales: 0, totalSales: 0, color: '#14281D' },
  { id: '4', name: 'Cathy', dailySales: 0, totalSales: 0, color: '#080F0F' },
  { id: '5', name: 'Johan', dailySales: 0, totalSales: 0, color: '#89BBFE' },
  { id: '6', name: 'Sabrina', dailySales: 0, totalSales: 0, color: '#D68FD6' },
  { id: '7', name: 'Billy', dailySales: 0, totalSales: 0, color: '#FFFF99' },
];
```

## 🎨 Comportement UI

### Cas 1: Aucune vendeuse sélectionnée
- **Titre** : "Sélection de la vendeuse (OBLIGATOIRE)"
- **Alerte** : Bandeau jaune avec icône AlertCircle
- **Message** : "Vous devez sélectionner une vendeuse avant de pouvoir utiliser les fonctionnalités de la caisse."

### Cas 2: Vendeuse déjà sélectionnée
- **Titre** : "Sélection de la vendeuse"
- **Aucune alerte**
- **Vendeuse active** : Bordure blanche + icône Check

### Grille des vendeuses
- **Layout** : `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Couleur de fond** : Couleur personnalisée de chaque vendeuse
- **Texte** : Blanc ou noir selon la couleur de fond
- **Animation** : `animate-fadeIn` au chargement

### Logique de couleur de texte
```typescript
// Texte noir pour : Johan, Sabrina, Billy (couleurs claires)
// Texte blanc pour : Sylvie, Babette, Lucia, Cathy (couleurs sombres)
const isDarkText = ['Johan', 'Sabrina', 'Billy'].includes(vendor.name);
```

## ⚡ Actions utilisateur

### Clic sur une vendeuse
1. **Action** : `setSelectedVendor(vendor)`
2. **Persistence** : Sauvegarde automatique en localStorage
3. **Redirection** : `setActiveTab('produits')`
4. **Feedback visuel** : Bordure blanche + icône Check

## 🗄️ Persistance des données

### Clé localStorage
- **Clé** : `STORAGE_KEYS.VENDOR` = `'myconfort-current-vendor'`
- **Type** : `Vendor | null`
- **Réhydratation** : Automatique au chargement de l'app

### Clé statistiques
- **Clé** : `STORAGE_KEYS.VENDORS_STATS` = `'myconfort-vendors'`
- **Type** : `Vendor[]`
- **Mise à jour** : Lors des ventes (incrémente totalSales)

## 🚨 Points critiques de debug

### Problème : Vendeuse non persistée
```javascript
// Vérifier dans DevTools -> Application -> Local Storage
localStorage.getItem('myconfort-current-vendor')
```

### Problème : Pas de redirection automatique
```javascript
// Vérifier que setActiveTab est appelé après setSelectedVendor
console.log('Vendor selected:', vendor.name);
console.log('Redirecting to products...');
```

### Problème : Styles de couleur incorrects
```javascript
// Vérifier la logique de couleur de texte
const isDarkText = ['Johan', 'Sabrina', 'Billy'].includes(vendor.name);
console.log(`${vendor.name} should use ${isDarkText ? 'black' : 'white'} text`);
```

## 📱 Responsive Design
- **iPad Portrait** : 3-4 colonnes
- **iPad Landscape** : 4+ colonnes
- **Touch-friendly** : Classe `touch-feedback` sur tous les boutons

## 🔗 Dépendances
- **Icons** : `lucide-react` (User, AlertCircle, Check)
- **Hook personnalisé** : `useLocalStorage`
- **CSS Classes** : `animate-fadeIn`, `card`, `touch-feedback`

## ✅ Tests de validation
1. **Sélection initiale** : Aucune vendeuse → Affichage de l'alerte
2. **Sélection vendeuse** : Clic → Sauvegarde + redirection
3. **Persistance** : Rechargement page → Vendeuse toujours sélectionnée
4. **Feedback visuel** : Vendeuse active clairement identifiable
5. **Responsive** : Grille adapte selon la taille d'écran
