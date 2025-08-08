# 🛠️ Guide d'Installation et Configuration - Système RAZ

## 📦 Prérequis Techniques

### Dépendances
- **React** : 18.3.1+
- **TypeScript** : 5.0+
- **Lucide React** : Icônes
- **IndexedDB** : Stockage local

### Icônes Requises
```typescript
import { 
  RefreshCw, 
  AlertTriangle, 
  Download, 
  Shield, 
  Clock, 
  BarChart3, 
  CheckCircle,
  X 
} from 'lucide-react';
```

## 🔧 Installation

### 1. Intégration dans App.tsx

#### États RAZ
```typescript
// États pour le système RAZ avancé
const [showResetModal, setShowResetModal] = useState(false);
const [resetOptions, setResetOptions] = useState({
  dailySales: true,
  cart: true,
  selectedVendor: false,
  vendorStats: false,
  allData: false
});
const [resetStep, setResetStep] = useState<'options' | 'executing'>('options');
const [showResetSuccess, setShowResetSuccess] = useState(false);
```

#### Fonctions de Gestion
```typescript
// Gestion des options RAZ
const handleResetOption = useCallback((option: string, value: boolean) => {
  // Logique de gestion des options
}, []);

// Export des données
const exportDataBeforeReset = useCallback(() => {
  // Logique d'export JSON
}, [sales, vendorStats, selectedVendor, cart]);

// Exécution de la RAZ
const executeReset = useCallback(() => {
  // Logique d'exécution
}, [resetOptions, vendorStats, setVendorStats, setCart, setSelectedVendor, setSales]);
```

### 2. Ajout de l'Onglet Navigation

#### Dans Navigation.tsx
```typescript
{
  id: 'raz',
  name: 'RAZ',
  icon: RefreshCw,
  color: '#ff6b6b'
}
```

### 3. Styles CSS

#### Animation Styles
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(-20px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slideInRight {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
```

## 🎨 Configuration de l'Interface

### Dashboard Principal
```typescript
{/* Statistiques actuelles */}
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '15px',
  marginBottom: '25px'
}}>
  {/* Cartes statistiques */}
</div>
```

### Modal de Configuration
```typescript
{/* Modal RAZ Avancée */}
{showResetModal && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    // ... styles modal
  }}>
    {/* Contenu modal */}
  </div>
)}
```

## 🔒 Configuration de Sécurité

### Export de Sauvegarde
```typescript
const exportDataBeforeReset = useCallback(() => {
  const dataToExport = {
    exportDate: new Date().toISOString(),
    sales: sales,
    vendorStats: vendorStats,
    selectedVendor: selectedVendor,
    cart: cart,
    metadata: {
      totalSales: sales.length,
      totalVendors: vendorStats.length,
      cartItems: cart.length,
      exportVersion: '1.0.0'
    }
  };
  
  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `myconfort-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}, [sales, vendorStats, selectedVendor, cart]);
```

### Journalisation
```typescript
const logRAZAction = useCallback((action: string, options: typeof resetOptions, success: boolean) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    options: options,
    success: success,
    user: selectedVendor?.name || 'System',
    dataState: {
      salesCount: sales.length,
      cartItems: cart.length,
      activeVendor: selectedVendor?.name || 'None'
    }
  };
  
  console.log('📊 RAZ Action:', logEntry);
}, [selectedVendor, sales, cart]);
```

## 🧪 Tests et Validation

### Tests Fonctionnels
1. **Test Export** : Vérifier la génération du fichier JSON
2. **Test Options** : Validation de chaque option RAZ
3. **Test Interface** : Animations et transitions
4. **Test Sécurité** : Confirmations et aperçus

### Validation des Données
```typescript
// Validation avant RAZ
if (resetOptions.dailySales) {
  const resetVendors = vendorStats.map(vendor => ({
    ...vendor,
    dailySales: 0
  }));
  setVendorStats(resetVendors);
  console.log('✅ RAZ ventes du jour effectuée');
}
```

## 📊 Monitoring et Logs

### Structure des Logs
```json
{
  "timestamp": "2025-08-08T14:35:09.426Z",
  "action": "RAZ_EXECUTED",
  "options": {
    "dailySales": true,
    "cart": true,
    "selectedVendor": false,
    "vendorStats": false,
    "allData": false
  },
  "success": true,
  "user": "System",
  "dataState": {
    "salesCount": 4,
    "cartItems": 0,
    "activeVendor": "None"
  }
}
```

### Actions Trackées
- **RAZ_EXECUTED** : Exécution réussie
- **RAZ_CANCELLED** : Annulation utilisateur
- **RAZ_ERROR** : Erreur d'exécution

## 🚀 Déploiement

### Checklist Pré-Déploiement
- [ ] Tests fonctionnels complets
- [ ] Validation de l'export JSON
- [ ] Vérification des animations
- [ ] Test de la journalisation
- [ ] Validation responsive

### Commandes Git
```bash
# Commit des modifications
git add .
git commit -m "✨ Système RAZ Avancé Intégré"

# Push vers le dépôt
git push origin main
```

## 🔄 Maintenance

### Mises à Jour Futures
1. **Nouvelles options RAZ** : Ajouter dans resetOptions
2. **Amélirations UX** : Nouvelles animations
3. **Sécurité renforcée** : Nouvelles validations
4. **Monitoring avancé** : Métriques détaillées

### Backup et Restauration
```typescript
// Format de sauvegarde standard
interface BackupData {
  exportDate: string;
  sales: Sale[];
  vendorStats: Vendor[];
  selectedVendor: Vendor | null;
  cart: ExtendedCartItem[];
  metadata: {
    totalSales: number;
    totalVendors: number;
    cartItems: number;
    exportVersion: string;
  };
}
```

## 📞 Support Technique

### Dépannage Courant
1. **Modal ne s'affiche pas** : Vérifier z-index et showResetModal
2. **Animations cassées** : Contrôler l'injection CSS
3. **Export ne fonctionne pas** : Vérifier les permissions navigateur
4. **Reset partiel** : Valider la logique des options

### Logs de Debug
```typescript
// Activer le debug
console.log('🔍 Reset Options:', resetOptions);
console.log('📊 Current State:', { sales, cart, selectedVendor });
```

---

**📅 Dernière mise à jour** : 8 août 2025  
**🎯 Version** : 4.0.0  
**👨‍💻 Développeur** : GitHub Copilot
