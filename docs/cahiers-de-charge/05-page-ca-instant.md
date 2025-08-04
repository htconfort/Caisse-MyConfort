# Cahier de Charge - Page CA Instant

## 📋 Vue d'ensemble
La page CA Instant correspond à l'onglet "CA" et affiche le tableau de bord en temps réel du chiffre d'affaires avec répartition par vendeuse. C'est l'interface de pilotage commercial.

## 🎯 Objectifs
- Afficher le chiffre d'affaires global en temps réel
- Montrer la répartition des ventes par vendeuse avec graphiques
- Calculer les statistiques du jour et globales
- Fournir une vue synthétique pour le management

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~1117 (`{activeTab === 'ca' && (`)
- **Composant** : Section conditionnelle dans `CaisseMyConfortApp`

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [sales, setSales] = useLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []);
const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
const [currentDateTime, setCurrentDateTime] = useState(new Date());
```

### Interfaces utilisées
```typescript
interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean;
}

interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
}
```

## 📊 Calculs en temps réel

### Chiffre d'affaires global
```typescript
const totalRevenue = sales
  .filter(sale => !sale.canceled) // Exclure les annulations
  .reduce((sum, sale) => sum + sale.totalAmount, 0);
```

### Statistiques du jour
```typescript
const today = new Date().toDateString();
const todaySales = sales.filter(sale => 
  !sale.canceled && 
  new Date(sale.date).toDateString() === today
);

const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
const todayTransactions = todaySales.length;
```

### Statistiques par vendeuse
```typescript
const vendorSalesStats = vendorStats.map(vendor => {
  const vendorSales = sales.filter(sale => 
    sale.vendorId === vendor.id && !sale.canceled
  );
  
  const vendorTodaySales = vendorSales.filter(sale =>
    new Date(sale.date).toDateString() === today
  );
  
  return {
    ...vendor,
    totalRevenue: vendorSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    todayRevenue: vendorTodaySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    totalTransactions: vendorSales.length,
    todayTransactions: vendorTodaySales.length
  };
});
```

## 🎨 Comportement UI

### Structure de la page
1. **Header** : Titre + Horloge temps réel
2. **Cards de synthèse** : CA global, transactions, moyennes
3. **Graphique des vendeuses** : Barres colorées
4. **Tableau détaillé** : Stats par vendeuse

### Horloge temps réel
```typescript
// Mise à jour chaque seconde
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentDateTime(new Date());
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// Affichage
<p className="text-lg">
  {currentDateTime.toLocaleString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })}
</p>
```

### Cards de synthèse globale

#### Card 1: CA Total
- **Titre** : "Chiffre d'affaires total"
- **Valeur** : `{totalRevenue.toLocaleString()}€`
- **Couleur** : Vert MyConfort (#477A0C)

#### Card 2: CA du jour
- **Titre** : "CA aujourd'hui"  
- **Valeur** : `{todayRevenue.toLocaleString()}€`
- **Couleur** : Lime accent (#C4D144)

#### Card 3: Transactions totales
- **Titre** : "Transactions totales"
- **Valeur** : `{totalTransactions}`
- **Couleur** : Bleu secondaire (#89BBFE)

#### Card 4: Panier moyen
- **Titre** : "Panier moyen"
- **Valeur** : `{averageTransaction}€`
- **Couleur** : Violet accent (#D68FD6)

### Graphique en barres par vendeuse
```typescript
// Calcul du maximum pour l'échelle
const maxRevenue = Math.max(...vendorSalesStats.map(v => v.totalRevenue));

// Barre pour chaque vendeuse
{vendorSalesStats.map(vendor => (
  <div key={vendor.id} className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <span className="font-semibold">{vendor.name}</span>
      <span className="font-bold">{vendor.totalRevenue}€</span>
    </div>
    
    <div className="w-full bg-gray-200 rounded-full h-6">
      <div 
        className="h-6 rounded-full transition-all duration-300"
        style={{
          backgroundColor: vendor.color,
          width: `${(vendor.totalRevenue / maxRevenue) * 100}%`
        }}
      />
    </div>
    
    <div className="text-xs text-gray-600 mt-1">
      {vendor.totalTransactions} ventes • Aujourd'hui: {vendor.todayRevenue}€
    </div>
  </div>
))}
```

### Tableau détaillé des vendeuses
```typescript
<table className="w-full">
  <thead>
    <tr style={{ backgroundColor: '#477A0C', color: 'white' }}>
      <th>Vendeuse</th>
      <th>CA Total</th>
      <th>CA Jour</th>
      <th>Ventes Total</th>
      <th>Ventes Jour</th>
      <th>Panier Moyen</th>
    </tr>
  </thead>
  <tbody>
    {vendorSalesStats.map(vendor => (
      <tr key={vendor.id}>
        <td>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: vendor.color }}
            />
            {vendor.name}
          </div>
        </td>
        <td className="font-bold">{vendor.totalRevenue}€</td>
        <td>{vendor.todayRevenue}€</td>
        <td>{vendor.totalTransactions}</td>
        <td>{vendor.todayTransactions}</td>
        <td>
          {vendor.totalTransactions > 0 
            ? Math.round(vendor.totalRevenue / vendor.totalTransactions)
            : 0}€
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## 📈 Métriques calculées

### Panier moyen global
```typescript
const totalTransactions = sales.filter(sale => !sale.canceled).length;
const averageTransaction = totalTransactions > 0 
  ? Math.round(totalRevenue / totalTransactions)
  : 0;
```

### Panier moyen par vendeuse
```typescript
const vendorAverageTransaction = vendor.totalTransactions > 0
  ? Math.round(vendor.totalRevenue / vendor.totalTransactions)
  : 0;
```

### Évolution du jour
```typescript
const yesterdayRevenue = sales
  .filter(sale => {
    const saleDate = new Date(sale.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return !sale.canceled && saleDate.toDateString() === yesterday.toDateString();
  })
  .reduce((sum, sale) => sum + sale.totalAmount, 0);

const dailyGrowth = yesterdayRevenue > 0 
  ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
  : 0;
```

## 🔄 Mise à jour en temps réel

### Rafraîchissement automatique
Les données sont recalculées automatiquement à chaque :
- Nouvelle vente enregistrée
- Annulation de vente
- Changement d'onglet vers "CA"

### Hook de surveillance
```typescript
useEffect(() => {
  // Recalcul des stats quand les ventes changent
  const updatedStats = calculateVendorStats();
  setVendorStats(updatedStats);
}, [sales]);
```

## 🗄️ Persistance des données

### Sources de données
- **Ventes** : `localStorage['myconfort-sales']`
- **Stats vendeuses** : `localStorage['myconfort-vendors']`
- **Pas de persistance** : Les calculs sont toujours en temps réel

## 🚨 Points critiques de debug

### Problème : Calculs CA incorrects
```javascript
// Vérifier les ventes non annulées
const validSales = sales.filter(sale => !sale.canceled);
console.log('Valid sales:', validSales.length);
console.log('Total revenue calculation:', validSales.reduce((sum, sale) => sum + sale.totalAmount, 0));

// Vérifier les dates du jour
const today = new Date().toDateString();
console.log('Today string:', today);
const todaySales = validSales.filter(sale => new Date(sale.date).toDateString() === today);
console.log('Today sales:', todaySales);
```

### Problème : Stats vendeuses incorrectes
```javascript
// Vérifier l'attribution des ventes
sales.forEach(sale => {
  console.log(`Sale ${sale.id}: vendorId=${sale.vendorId}, vendorName=${sale.vendorName}`);
});

// Vérifier les calculs par vendeuse
vendorStats.forEach(vendor => {
  const vendorSales = sales.filter(sale => sale.vendorId === vendor.id && !sale.canceled);
  console.log(`${vendor.name}: ${vendorSales.length} sales, ${vendorSales.reduce((sum, sale) => sum + sale.totalAmount, 0)}€`);
});
```

### Problème : Horloge ne se met pas à jour
```javascript
// Vérifier le timer
console.log('Timer started for clock update');
const timer = setInterval(() => {
  console.log('Clock updating:', new Date().toLocaleString());
  setCurrentDateTime(new Date());
}, 1000);
```

### Problème : Graphiques ne s'affichent pas
```javascript
// Vérifier les données du graphique
console.log('Max revenue for scale:', Math.max(...vendorSalesStats.map(v => v.totalRevenue)));
vendorSalesStats.forEach(vendor => {
  const percentage = (vendor.totalRevenue / maxRevenue) * 100;
  console.log(`${vendor.name}: ${vendor.totalRevenue}€ = ${percentage}% width`);
});
```

## 🎨 Codes couleurs

### Palette MyConfort
- **Vert principal** : #477A0C (CA total)
- **Lime accent** : #C4D144 (CA jour)
- **Bleu secondaire** : #89BBFE (transactions)
- **Violet accent** : #D68FD6 (panier moyen)
- **Couleurs vendeuses** : Couleurs individuelles définies

### Indicateurs visuels
- **Croissance positive** : Vert avec flèche ↗
- **Croissance négative** : Rouge avec flèche ↘
- **Stabilité** : Gris avec ligne →

## 📱 Responsive Design
- **Mobile** : Cards empilées, tableau horizontal scrollable
- **Tablette** : Grille 2x2 pour les cards, graphique sous le tableau
- **Desktop** : Disposition optimale avec tous les éléments visibles

## 🔗 Dépendances
- **Icons** : `lucide-react` (BarChart, TrendingUp, TrendingDown)
- **Hook personnalisé** : `useLocalStorage`
- **CSS Classes** : `card`, `animate-fadeIn`

## ✅ Tests de validation
1. **CA temps réel** : Ajout vente → CA mis à jour immédiatement
2. **Horloge** : Seconde qui s'écoule → Affichage actualisé
3. **Stats vendeuses** : Vente attribuée → Stats vendeuse mises à jour
4. **Graphiques** : Proportions correctes dans les barres
5. **Annulations** : Vente annulée → CA diminué
6. **Panier moyen** : Calcul correct (CA / nombre de transactions)
7. **Responsive** : Interface adaptée à toutes les tailles
8. **Performance** : Calculs fluides même avec nombreuses ventes
