# 🚨 Guide de Dépannage - Système RAZ

## 🔍 Problèmes Courants et Solutions

### 1. Modal RAZ ne s'ouvre pas

#### Symptômes
- Clic sur "Démarrer la RAZ" sans effet
- Aucune modal ne s'affiche
- Console sans erreur apparente

#### Diagnostic
```typescript
// Vérifier l'état dans la console
console.log('showResetModal:', showResetModal);
console.log('resetStep:', resetStep);
```

#### Solutions
```typescript
// Solution 1: Reset manuel de l'état
setShowResetModal(false);
setTimeout(() => setShowResetModal(true), 100);

// Solution 2: Vérifier z-index CSS
.modal {
  z-index: 1000 !important;
}

// Solution 3: Nettoyer les états
const resetAllStates = () => {
  setShowResetModal(false);
  setResetStep('options');
  setShowResetSuccess(false);
};
```

### 2. Animations ne fonctionnent pas

#### Symptômes
- Modal apparaît instantanément
- Pas de transitions fluides
- Icônes ne tournent pas

#### Diagnostic
```javascript
// Vérifier l'injection CSS
const styles = document.querySelector('style');
console.log('Styles injectés:', styles?.textContent?.includes('fadeIn'));
```

#### Solutions
```typescript
// Solution 1: Re-injection des styles
const reinjectStyles = () => {
  const existingStyle = document.querySelector('style[data-raz-animations]');
  if (existingStyle) existingStyle.remove();
  
  const styleSheet = document.createElement('style');
  styleSheet.setAttribute('data-raz-animations', 'true');
  styleSheet.textContent = razAnimationStyles;
  document.head.appendChild(styleSheet);
};

// Solution 2: CSS inline en fallback
const animationStyle = {
  animation: 'fadeIn 0.3s ease',
  transition: 'all 0.3s ease'
};
```

### 3. Export JSON ne fonctionne pas

#### Symptômes
- Clic sans téléchargement
- Erreur de permission navigateur
- Fichier vide ou corrompu

#### Diagnostic
```typescript
// Test de la génération JSON
const testExport = () => {
  try {
    const data = { test: 'export' };
    const dataStr = JSON.stringify(data, null, 2);
    console.log('JSON valid:', dataStr);
    
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    console.log('Data URI:', dataUri.substring(0, 100) + '...');
  } catch (error) {
    console.error('Export error:', error);
  }
};
```

#### Solutions
```typescript
// Solution 1: Alternative avec Blob
const exportWithBlob = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Nettoyage
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Solution 2: Vérification permissions
const checkDownloadPermission = () => {
  if (!document.body) {
    console.error('Document body not ready');
    return false;
  }
  return true;
};
```

### 4. RAZ Partielle non Fonctionnelle

#### Symptômes
- Seulement certaines options fonctionnent
- Données non réinitialisées
- État incohérent après RAZ

#### Diagnostic
```typescript
// Vérifier l'état des options
const debugResetOptions = () => {
  console.log('Reset Options:', resetOptions);
  console.log('Before RAZ:', {
    salesCount: sales.length,
    cartItems: cart.length,
    selectedVendor: selectedVendor?.name,
    vendorDailySales: vendorStats.map(v => v.dailySales)
  });
};
```

#### Solutions
```typescript
// Solution 1: Validation avant exécution
const validateResetOptions = () => {
  const hasAnyOption = Object.values(resetOptions).some(Boolean);
  if (!hasAnyOption) {
    alert('⚠️ Sélectionnez au moins une option de RAZ');
    return false;
  }
  return true;
};

// Solution 2: RAZ par étapes avec validation
const executeResetWithValidation = async () => {
  try {
    if (resetOptions.dailySales) {
      const newVendorStats = vendorStats.map(v => ({ ...v, dailySales: 0 }));
      setVendorStats(newVendorStats);
      console.log('✅ Daily sales reset');
    }
    
    if (resetOptions.cart) {
      setCart([]);
      console.log('✅ Cart reset');
    }
    
    // Validation après chaque étape
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } catch (error) {
    console.error('❌ Reset error:', error);
    throw error;
  }
};
```

### 5. Interface Bloquée en Mode Exécution

#### Symptômes
- Animation infinie
- Modal reste en "executing"
- Impossible de fermer la modal

#### Diagnostic
```typescript
// Vérifier l'état coincé
console.log('Current resetStep:', resetStep);
console.log('Modal state:', showResetModal);
console.log('Success state:', showResetSuccess);
```

#### Solutions
```typescript
// Solution 1: Reset d'urgence
const emergencyReset = () => {
  setResetStep('options');
  setShowResetModal(false);
  setShowResetSuccess(false);
  console.log('🚨 Emergency reset applied');
};

// Solution 2: Timeout de sécurité
const executeResetWithTimeout = () => {
  setResetStep('executing');
  
  const timeoutId = setTimeout(() => {
    console.warn('⚠️ Reset timeout - forcing completion');
    setResetStep('options');
    setShowResetModal(false);
  }, 10000); // 10 secondes max
  
  // Exécution normale
  setTimeout(() => {
    clearTimeout(timeoutId);
    // Logique RAZ normale
    setResetStep('options');
    setShowResetSuccess(true);
  }, 2000);
};
```

### 6. Erreurs de Console

#### TypeError: Cannot read property 'length' of undefined
```typescript
// Solution: Validation des données
const safeArrayLength = (arr: any[]) => {
  return Array.isArray(arr) ? arr.length : 0;
};

// Usage
<small>Vide le panier en cours ({safeArrayLength(cart)} articles)</small>
```

#### ReferenceError: confirmPassword is not defined
```typescript
// Solution: Nettoyage des références
// Supprimer toutes les références à confirmPassword
// Utiliser une validation alternative si nécessaire
```

#### Memory Leak Warning
```typescript
// Solution: Nettoyage des timers
useEffect(() => {
  return () => {
    // Nettoyage à la destruction du composant
    clearTimeout(anyTimeoutId);
    clearInterval(anyIntervalId);
  };
}, []);
```

## 🛠️ Outils de Debug

### Console Debug Helper
```typescript
// Ajouter cette fonction pour debug
const debugRAZ = () => {
  console.group('🔍 RAZ Debug Info');
  console.log('📊 States:', {
    showResetModal,
    resetOptions,
    resetStep,
    showResetSuccess
  });
  console.log('💾 Data:', {
    salesCount: sales?.length || 0,
    cartItems: cart?.length || 0,
    selectedVendor: selectedVendor?.name || 'None',
    vendorStats: vendorStats?.length || 0
  });
  console.groupEnd();
};

// Usage: debugRAZ() dans la console
```

### Performance Monitor
```typescript
const performanceMonitor = () => {
  const start = performance.now();
  
  return {
    end: (operation: string) => {
      const duration = performance.now() - start;
      console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${operation}`);
      }
    }
  };
};

// Usage
const monitor = performanceMonitor();
executeReset();
monitor.end('RAZ Execution');
```

### Memory Monitor
```typescript
const checkMemoryUsage = () => {
  if (performance.memory) {
    const usage = performance.memory;
    console.log('💾 Memory Usage:', {
      used: Math.round(usage.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(usage.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(usage.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    });
  }
};
```

## 🔄 Procédures de Récupération

### Récupération Données Perdues
```typescript
// Si RAZ accidentelle, tenter la récupération
const attemptDataRecovery = () => {
  // 1. Vérifier localStorage
  const backup = localStorage.getItem('emergency-backup');
  if (backup) {
    try {
      const data = JSON.parse(backup);
      console.log('🔄 Backup found:', data);
      return data;
    } catch (e) {
      console.error('❌ Backup corrupted');
    }
  }
  
  // 2. Vérifier sessionStorage
  const sessionBackup = sessionStorage.getItem('raz-session-backup');
  // ... logique similaire
  
  return null;
};
```

### Backup Automatique
```typescript
// Créer un backup avant chaque RAZ
const createEmergencyBackup = () => {
  const backup = {
    timestamp: new Date().toISOString(),
    sales,
    vendorStats,
    selectedVendor,
    cart
  };
  
  localStorage.setItem('emergency-backup', JSON.stringify(backup));
  console.log('💾 Emergency backup created');
};
```

## 📞 Escalade Support

### Niveau 1: Auto-diagnostic
1. Vérifier la console pour erreurs
2. Utiliser `debugRAZ()` 
3. Tester `emergencyReset()`
4. Rafraîchir la page

### Niveau 2: Intervention Technique
1. Vérifier l'intégrité des états React
2. Valider les hooks IndexedDB
3. Contrôler l'injection CSS
4. Analyser les performances

### Niveau 3: Support Développeur
1. Créer un rapport de bug détaillé
2. Inclure les logs de console
3. Fournir les étapes de reproduction
4. Joindre l'export JSON de test

### Template Rapport Bug
```markdown
## 🐛 Rapport de Bug - Système RAZ

**Date**: [DATE]
**Version**: 4.0.0
**Navigateur**: [BROWSER + VERSION]
**OS**: [OPERATING SYSTEM]

### 🔍 Description
[Description détaillée du problème]

### 🔄 Étapes de Reproduction
1. [Étape 1]
2. [Étape 2]
3. [Résultat observé]

### 📊 État du Système
```javascript
// Coller le résultat de debugRAZ()
```

### 🔧 Solutions Tentées
- [ ] Rafraîchissement page
- [ ] Emergency reset
- [ ] Clear cache
- [ ] [Autres tentatives]

### 📎 Fichiers Joints
- [ ] Screenshot/Vidéo
- [ ] Export JSON
- [ ] Logs console
```

---

**📅 Dernière mise à jour** : 8 août 2025  
**🎯 Version** : 4.0.0  
**🔧 Support** : GitHub Copilot Technical Team
