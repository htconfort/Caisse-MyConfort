# Cahier de Charge - Page RAZ (Remise à Zéro)

## 📋 Vue d'ensemble
La page RAZ correspond à l'onglet "RAZ" et permet la remise à zéro complète du système en fin de journée ou période. C'est une fonction critique de maintenance réservée aux administrateurs.

## 🎯 Objectifs
- Effectuer une remise à zéro complète des données
- Sauvegarder les données avant suppression (export automatique)
- Processus sécurisé avec triple validation
- Réinitialiser tous les compteurs et historiques

## 📍 Localisation dans le code
- **Fichier principal** : `src/App.tsx`
- **Ligne de départ** : ~1401 (`{activeTab === 'raz' && (`)
- **Composant** : Section conditionnelle dans `CaisseMyConfortApp`

## 🔧 Fonctionnalités techniques

### États requis
```typescript
const [sales, setSales] = useLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []);
const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
const [selectedVendor, setSelectedVendor] = useLocalStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
const [showResetModal, setShowResetModal] = useState(false);
const [resetStep, setResetStep] = useState(1);
```

### Types d'actions RAZ
```typescript
type ResetAction = 'daily' | 'weekly' | 'complete';

interface ResetOptions {
  action: ResetAction;
  keepVendors: boolean;
  exportBeforeReset: boolean;
  resetDateTime: Date;
}
```

## 🎨 Comportement UI

### Structure de la page
1. **Avertissement de sécurité** : Bandeau rouge avec mise en garde
2. **Options de RAZ** : Différents niveaux de remise à zéro
3. **Boutons d'action** : Déclenchement du processus
4. **Processus en 3 étapes** : Validation progressive

### Avertissement de sécurité
```typescript
<div className="mb-6 p-4 rounded-lg" 
     style={{ backgroundColor: '#FEE2E2', border: '2px solid #F87171' }}>
  <div className="flex items-center gap-3 mb-3">
    <AlertTriangle size={24} style={{ color: '#DC2626' }} />
    <h3 className="text-xl font-bold" style={{ color: '#DC2626' }}>
      ⚠️ ZONE CRITIQUE - REMISE À ZÉRO
    </h3>
  </div>
  
  <div style={{ color: '#7F1D1D' }}>
    <p className="mb-2">
      <strong>ATTENTION :</strong> Cette section permet la suppression définitive des données.
    </p>
    <p className="mb-2">
      • Toutes les ventes seront supprimées
    </p>
    <p className="mb-2">
      • Les statistiques des vendeuses seront remises à zéro
    </p>
    <p>
      • Cette action est <strong>IRRÉVERSIBLE</strong>
    </p>
  </div>
</div>
```

### Options de RAZ

#### RAZ Quotidienne
- **Description** : Remet à zéro les ventes du jour
- **Conserve** : Historique global, stats cumulées
- **Usage** : Fin de journée

```typescript
<div className="card mb-4">
  <h4 className="font-bold mb-2">RAZ Quotidienne</h4>
  <p className="text-sm mb-3">
    Supprime uniquement les ventes d'aujourd'hui. 
    Conserve l'historique et les statistiques globales.
  </p>
  <button 
    onClick={() => startResetProcess('daily')}
    className="btn-warning"
  >
    RAZ du jour
  </button>
</div>
```

#### RAZ Hebdomadaire
- **Description** : Remet à zéro les ventes de la semaine
- **Conserve** : Statistiques mensuelles, vendeuses
- **Usage** : Fin de semaine

```typescript
<div className="card mb-4">
  <h4 className="font-bold mb-2">RAZ Hebdomadaire</h4>
  <p className="text-sm mb-3">
    Supprime les ventes de la semaine. 
    Conserve les statistiques mensuelles et les vendeuses.
  </p>
  <button 
    onClick={() => startResetProcess('weekly')}
    className="btn-warning"
  >
    RAZ de la semaine
  </button>
</div>
```

#### RAZ Complète
- **Description** : Suppression totale de toutes les données
- **Supprime** : Tout (ventes, stats, sélection vendeuse, panier)
- **Usage** : Nouveau départ, maintenance majeure

```typescript
<div className="card mb-4" style={{ borderColor: '#DC2626', borderWidth: '2px' }}>
  <h4 className="font-bold mb-2" style={{ color: '#DC2626' }}>
    RAZ Complète (DANGER)
  </h4>
  <p className="text-sm mb-3" style={{ color: '#7F1D1D' }}>
    Supprime TOUTES les données : ventes, statistiques, panier, sélection vendeuse.
    Retour à l'état initial de l'application.
  </p>
  <button 
    onClick={() => startResetProcess('complete')}
    className="btn-danger"
  >
    RAZ TOTALE
  </button>
</div>
```

## ⚡ Processus de RAZ en 3 étapes

### Étape 1: Confirmation initiale
```typescript
const startResetProcess = (action: ResetAction) => {
  setResetAction(action);
  setResetStep(1);
  setShowResetModal(true);
};

// Modale étape 1
<div className="modal-content">
  <h3>Confirmer la remise à zéro</h3>
  <p>Type de RAZ sélectionnée : <strong>{getResetActionLabel(resetAction)}</strong></p>
  
  {/* Récapitulatif des données qui seront supprimées */}
  <div className="data-summary">
    {resetAction === 'daily' && (
      <p>Ventes du jour : {getTodaySalesCount()} transactions</p>
    )}
    {resetAction === 'weekly' && (
      <p>Ventes de la semaine : {getWeekSalesCount()} transactions</p>
    )}
    {resetAction === 'complete' && (
      <div>
        <p>Toutes les ventes : {sales.length} transactions</p>
        <p>Toutes les statistiques vendeuses</p>
        <p>Panier en cours : {cart.length} articles</p>
        <p>Sélection vendeuse actuelle</p>
      </div>
    )}
  </div>

  <div className="modal-actions">
    <button onClick={() => setShowResetModal(false)}>Annuler</button>
    <button onClick={() => setResetStep(2)}>Continuer</button>
  </div>
</div>
```

### Étape 2: Export automatique
```typescript
// Modale étape 2
<div className="modal-content">
  <h3>Export de sauvegarde</h3>
  <p>Avant la suppression, les données vont être exportées automatiquement.</p>
  
  <div className="export-options">
    <label>
      <input 
        type="checkbox" 
        checked={exportBeforeReset} 
        onChange={(e) => setExportBeforeReset(e.target.checked)}
      />
      Exporter les données avant suppression (recommandé)
    </label>
  </div>

  <div className="modal-actions">
    <button onClick={() => setResetStep(1)}>Retour</button>
    <button onClick={() => setResetStep(3)}>
      {exportBeforeReset ? 'Exporter et continuer' : 'Continuer sans export'}
    </button>
  </div>
</div>
```

### Étape 3: Confirmation finale
```typescript
// Modale étape 3 - Validation finale
<div className="modal-content" style={{ borderColor: '#DC2626' }}>
  <h3 style={{ color: '#DC2626' }}>⚠️ CONFIRMATION FINALE</h3>
  
  <div className="final-warning">
    <p><strong>VOUS ÊTES SUR LE POINT DE SUPPRIMER DÉFINITIVEMENT :</strong></p>
    <ul>
      {getItemsToDelete(resetAction).map((item, index) => (
        <li key={index} style={{ color: '#DC2626' }}>• {item}</li>
      ))}
    </ul>
  </div>

  <div className="confirmation-input">
    <p>Pour confirmer, tapez : <strong>CONFIRMER RAZ</strong></p>
    <input 
      type="text" 
      value={confirmationText}
      onChange={(e) => setConfirmationText(e.target.value)}
      placeholder="Tapez exactement: CONFIRMER RAZ"
      className="input"
    />
  </div>

  <div className="modal-actions">
    <button onClick={() => setResetStep(2)}>Retour</button>
    <button 
      onClick={executeReset}
      disabled={confirmationText !== 'CONFIRMER RAZ'}
      className="btn-danger"
      style={{ 
        opacity: confirmationText === 'CONFIRMER RAZ' ? 1 : 0.5 
      }}
    >
      EXÉCUTER LA RAZ
    </button>
  </div>
</div>
```

## 🔄 Exécution de la RAZ

### Fonction principale executeReset
```typescript
const executeReset = async () => {
  try {
    // 1. Export de sauvegarde si demandé
    if (exportBeforeReset) {
      await performBackupExport();
    }

    // 2. Exécution selon le type de RAZ
    switch (resetAction) {
      case 'daily':
        await executeDailyReset();
        break;
      case 'weekly':
        await executeWeeklyReset();
        break;
      case 'complete':
        await executeCompleteReset();
        break;
    }

    // 3. Feedback de succès
    setShowResetModal(false);
    setShowResetSuccess(true);
    setTimeout(() => setShowResetSuccess(false), 5000);

  } catch (error) {
    console.error('Erreur lors de la RAZ:', error);
    alert('Erreur lors de la remise à zéro. Opération annulée.');
  }
};
```

### RAZ Quotidienne
```typescript
const executeDailyReset = () => {
  const today = new Date().toDateString();
  
  // Supprimer uniquement les ventes du jour
  setSales(prevSales => 
    prevSales.filter(sale => 
      new Date(sale.date).toDateString() !== today
    )
  );
  
  // Vider le panier actuel
  setCart([]);
  
  // Note: Les stats vendeuses et la sélection sont conservées
};
```

### RAZ Hebdomadaire
```typescript
const executeWeeklyReset = () => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // Supprimer les ventes de la semaine
  setSales(prevSales => 
    prevSales.filter(sale => 
      new Date(sale.date) < weekAgo
    )
  );
  
  // Vider le panier
  setCart([]);
  
  // Réinitialiser les stats journalières des vendeuses
  setVendorStats(prevStats =>
    prevStats.map(vendor => ({
      ...vendor,
      dailySales: 0
    }))
  );
};
```

### RAZ Complète
```typescript
const executeCompleteReset = () => {
  // Supprimer toutes les ventes
  setSales([]);
  
  // Vider le panier
  setCart([]);
  
  // Réinitialiser les stats vendeuses
  setVendorStats(vendors.map(vendor => ({
    ...vendor,
    dailySales: 0,
    totalSales: 0
  })));
  
  // Désélectionner la vendeuse
  setSelectedVendor(null);
  
  // Retour à l'onglet vendeuse
  setActiveTab('vendeuse');
};
```

## 💾 Export de sauvegarde

### Fonction performBackupExport
```typescript
const performBackupExport = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupData = {
    exportDate: new Date().toISOString(),
    resetType: resetAction,
    data: {
      sales: sales,
      vendorStats: vendorStats,
      cart: cart,
      selectedVendor: selectedVendor
    }
  };

  // Export JSON complet
  const jsonData = JSON.stringify(backupData, null, 2);
  downloadFile(jsonData, `backup-raz-${timestamp}.json`, 'application/json');

  // Export CSV des ventes si nécessaire
  if (sales.length > 0) {
    const csvData = convertSalesToCSV(sales);
    downloadFile(csvData, `ventes-backup-${timestamp}.csv`, 'text/csv');
  }
};
```

## 🚨 Points critiques de debug

### Problème : RAZ ne s'exécute pas
```javascript
// Vérifier l'état du processus
console.log('Reset step:', resetStep);
console.log('Reset action:', resetAction);
console.log('Confirmation text:', confirmationText);
console.log('Modal visible:', showResetModal);
```

### Problème : Données partiellement supprimées
```javascript
// Vérifier chaque étape de suppression
console.log('Sales before reset:', sales.length);
console.log('Cart before reset:', cart.length);
console.log('Vendor stats before reset:', vendorStats);

// Après RAZ
console.log('Sales after reset:', sales.length);
console.log('Cart after reset:', cart.length);
console.log('Vendor stats after reset:', vendorStats);
```

### Problème : Export ne fonctionne pas
```javascript
// Vérifier la génération du backup
const backupData = generateBackupData();
console.log('Backup data size:', JSON.stringify(backupData).length);
console.log('Backup structure:', Object.keys(backupData));
```

### Problème : localStorage non vidé
```javascript
// Vérifier le nettoyage localStorage
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('myconfort-')) {
    console.log(`LocalStorage key ${key}:`, localStorage.getItem(key));
  }
});
```

## 🛡️ Sécurités supplémentaires

### Limitation d'accès
```typescript
// Optionnel: Restriction par mot de passe admin
const [adminPassword, setAdminPassword] = useState('');
const ADMIN_PASSWORD = 'myconfort2024'; // À définir selon les besoins

const validateAdminAccess = () => {
  return adminPassword === ADMIN_PASSWORD;
};
```

### Logging des RAZ
```typescript
const logResetAction = (action: ResetAction) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    itemsDeleted: {
      sales: sales.length,
      cartItems: cart.length
    },
    operator: selectedVendor?.name || 'Non identifié'
  };
  
  // Sauvegarde du log (localStorage séparé ou API)
  const logs = JSON.parse(localStorage.getItem('myconfort-reset-logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('myconfort-reset-logs', JSON.stringify(logs));
};
```

## 📱 Responsive Design
- **Modales** : S'adaptent à la taille d'écran
- **Boutons critiques** : Taille minimale pour éviter les clics accidentels
- **Avertissements** : Visibles même sur petit écran

## 🔗 Dépendances
- **Icons** : `lucide-react` (RefreshCw, AlertTriangle, Download)
- **Hook personnalisé** : `useLocalStorage`
- **CSS Classes** : `btn-danger`, `btn-warning`, `modal-overlay`

## ✅ Tests de validation
1. **Processus 3 étapes** : Chaque étape obligatoire et fonctionnelle
2. **Confirmation textuelle** : "CONFIRMER RAZ" exact requis
3. **Export automatique** : Sauvegarde générée avant suppression
4. **RAZ sélective** : Seules les données ciblées sont supprimées
5. **RAZ complète** : Retour à l'état initial de l'application
6. **Persistence** : localStorage correctement nettoyé
7. **Feedback** : Message de succès après RAZ
8. **Sécurité** : Impossible d'exécuter sans validation complète
