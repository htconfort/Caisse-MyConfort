# Cahier de Charge - Page Ventes

## 📋 Vue d'ensemble
La page ventes correspond à l'onglet "Ventes" et affiche l'historique complet de toutes les transactions effectuées. C'est l'interface de consultation et de gestion des ventes.

## 🎯 Objectifs
- Afficher l'historique chronologique de toutes les ventes
- Permettre l'export des données en CSV
- Identifier visuellement les ventes annulées
- Fournir un récapitulatif global (total des ventes, nombre de transactions)

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~819 (`{activeTab === 'ventes' && (`)
- **Composant** : Section conditionnelle dans `CaisseMyConfortApp`

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [sales, setSales] = useLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []);
const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
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
  canceled: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';
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

## 🎨 Comportement UI

### Structure de la page
1. **Header** : Titre + Bouton d'export
2. **Statistiques globales** : Cards avec métriques
3. **Liste des ventes** : Historique chronologique

### Header avec export
```typescript
<div className="flex justify-between items-center mb-6">
  <h2 className="text-3xl font-bold">Historique des ventes</h2>
  <button onClick={exportSalesData} className="btn-secondary">
    <Download size={20} />
    Exporter CSV
  </button>
</div>
```

### Statistiques globales (Cards)
```typescript
// Calculs en temps réel
const totalSales = sales.filter(sale => !sale.canceled).length;
const totalRevenue = sales
  .filter(sale => !sale.canceled)
  .reduce((sum, sale) => sum + sale.totalAmount, 0);
const canceledSales = sales.filter(sale => sale.canceled).length;
```

#### Card 1: Total des ventes
- **Titre** : "Total des ventes"
- **Valeur** : `{totalSales}`
- **Couleur** : Vert MyConfort (#477A0C)

#### Card 2: Chiffre d'affaires
- **Titre** : "Chiffre d'affaires"
- **Valeur** : `{totalRevenue}€`
- **Couleur** : Vert MyConfort (#477A0C)

#### Card 3: Ventes annulées
- **Titre** : "Ventes annulées"
- **Valeur** : `{canceledSales}`
- **Couleur** : Rouge d'alerte (#F55D3E)

### Liste des ventes

#### Tri chronologique
```typescript
// Tri décroissant (plus récente en premier)
const sortedSales = [...sales].sort((a, b) => 
  new Date(b.date).getTime() - new Date(a.date).getTime()
);
```

#### Affichage d'une vente
Chaque vente est une carte contenant :
- **Header** : Date/heure + Vendeuse + Statut (Normal/Annulée)
- **Détails** : Liste des articles
- **Footer** : Mode de paiement + Total

```typescript
// Vente normale
<div className="card">
  // Contenu normal
</div>

// Vente annulée
<div className="card" style={{ 
  backgroundColor: '#FEE2E2',  // Rouge très clair
  border: '2px solid #F87171' // Bordure rouge
}}>
  // Badge "ANNULÉE" en rouge
</div>
```

## ⚡ Export des données

### Fonction exportSalesData
```typescript
const exportSalesData = () => {
  const csvData = sales.map(sale => ({
    'Date': new Date(sale.date).toLocaleString(),
    'Vendeuse': sale.vendorName,
    'Articles': sale.items.map(item => `${item.name} (x${item.quantity})`).join('; '),
    'Total': `${sale.totalAmount}€`,
    'Paiement': getPaymentMethodLabel(sale.paymentMethod),
    'Statut': sale.canceled ? 'ANNULÉE' : 'VALIDE'
  }));
  
  // Conversion en CSV et téléchargement
  const csv = convertToCSV(csvData);
  downloadCSV(csv, `ventes-myconfort-${new Date().toISOString().split('T')[0]}.csv`);
};
```

### Labels des modes de paiement
```typescript
const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels = {
    'cash': 'Espèces',
    'card': 'Carte bancaire', 
    'check': 'Chèque',
    'multi': 'Mixte'
  };
  return labels[method] || method;
};
```

### Utilitaires CSV
```typescript
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => `"${row[header]}"`).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

## 🔄 Gestion des ventes annulées

### Marquage d'annulation
Quand une vente est annulée depuis l'onglet "Annulation" :
```typescript
const cancelSale = (saleId: string) => {
  setSales(prevSales => 
    prevSales.map(sale => 
      sale.id === saleId 
        ? { ...sale, canceled: true }
        : sale
    )
  );
};
```

### Affichage visuel
```typescript
// Badge d'annulation
{sale.canceled && (
  <span className="px-2 py-1 rounded text-xs font-bold"
        style={{ backgroundColor: '#F87171', color: 'white' }}>
    ANNULÉE
  </span>
)}
```

## 🗄️ Persistance des données

### Clé localStorage ventes
- **Clé** : `STORAGE_KEYS.SALES` = `'myconfort-sales'`
- **Type** : `Sale[]`
- **Réhydratation** : Automatique au chargement

### Format de stockage avec versioning
```typescript
const storedData = {
  version: '1.0',
  timestamp: Date.now(),
  data: sales
};
```

## 🚨 Points critiques de debug

### Problème : Ventes non affichées
```javascript
// Vérifier les données en localStorage
console.log('Sales data:', localStorage.getItem('myconfort-sales'));
console.log('Parsed sales:', JSON.parse(localStorage.getItem('myconfort-sales') || '[]'));
```

### Problème : Calculs statistiques incorrects
```javascript
// Vérifier les calculs
const validSales = sales.filter(sale => !sale.canceled);
const canceledSales = sales.filter(sale => sale.canceled);

console.log('Total sales:', validSales.length);
console.log('Canceled sales:', canceledSales.length);
console.log('Revenue calculation:', validSales.reduce((sum, sale) => sum + sale.totalAmount, 0));
```

### Problème : Export CSV ne fonctionne pas
```javascript
// Vérifier la génération CSV
const testData = sales.slice(0, 2); // Prendre 2 ventes de test
console.log('CSV data:', testData);
console.log('CSV string:', convertToCSV(testData));
```

### Problème : Tri chronologique incorrect
```javascript
// Vérifier le tri
console.log('Sales dates:', sales.map(sale => ({ id: sale.id, date: sale.date })));
const sorted = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
console.log('Sorted dates:', sorted.map(sale => ({ id: sale.id, date: sale.date })));
```

## 📱 Responsive Design
- **Mobile** : Cards empilées verticalement
- **Tablette/Desktop** : Cards avec largeur optimisée
- **Bouton export** : Se place sous le titre sur petit écran

## 🔗 Dépendances
- **Icons** : `lucide-react` (BarChart, Download, X)
- **Hook personnalisé** : `useLocalStorage`
- **CSS Classes** : `card`, `btn-secondary`, `animate-fadeIn`

## 🎨 Codes couleurs MyConfort
- **Vert principal** : #477A0C (totaux positifs)
- **Rouge d'alerte** : #F55D3E (annulations)
- **Beige neutre** : #F2EFE2 (fond)
- **Vert foncé** : #14281D (textes)

## ✅ Tests de validation
1. **Affichage ventes** : Toutes les ventes visibles, triées par date décroissante
2. **Statistiques temps réel** : Calculs corrects incluant/excluant les annulations
3. **Export CSV** : Téléchargement fonctionnel avec toutes les colonnes
4. **Ventes annulées** : Badge rouge + fond coloré distinctif
5. **Persistance** : Rechargement → Historique conservé
6. **Performance** : Affichage fluide même avec nombreuses ventes
7. **Responsive** : Interface adaptée à toutes les tailles d'écran
