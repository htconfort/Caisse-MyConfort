/**
 * 🔍 SCRIPT DE DIAGNOSTIC POUR iPAD
 * 
 * À copier-coller dans la console de l'iPad (F12)
 * pour diagnostiquer l'état réel de l'application
 */

console.log('🔍 === DIAGNOSTIC CAISSE MYCONFORT iPAD ===');

// 1. Vérifier l'environnement
console.log('📍 Environnement:', {
  url: window.location.href,
  isDev: import.meta?.env?.DEV || false,
  mode: import.meta?.env?.MODE || 'production'
});

// 2. Vérifier le localStorage
console.log('💾 localStorage:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('myconfort') || key.includes('caisse') || key.includes('invoice')) {
    console.log(`  📦 ${key}:`, localStorage.getItem(key)?.substring(0, 100));
  }
});

// 3. Vérifier IndexedDB
console.log('🗄️ IndexedDB:');
if (window.indexedDB) {
  indexedDB.databases().then(databases => {
    console.log('  Bases de données:', databases.map(db => db.name));
  });
}

// 4. Vérifier le service externe de factures
console.log('🌐 Service externe de factures:');
if (window.externalInvoiceService) {
  const invoices = window.externalInvoiceService.getAllInvoices();
  console.log(`  📄 Nombre de factures: ${invoices.length}`);
  console.log('  📋 Factures:', invoices);
  
  const totalCA = invoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.totals?.ttc || 0), 0);
  console.log(`  💰 CA total calculé: ${totalCA}€`);
} else {
  console.log('  ❌ Service externe non disponible');
}

// 5. Vérifier la synchronisation N8N
console.log('🔗 Synchronisation N8N:');
if (window.syncService) {
  console.log('  ✅ Service de sync disponible');
} else {
  console.log('  ❌ Service de sync non disponible');
}

// 6. Vérifier les ventes locales
console.log('🛒 Ventes locales (App state):');
// Cette partie nécessite l'accès au state React, plus complexe

// 7. Résumé
console.log('📊 === RÉSUMÉ ===');
console.log('Si vous voyez:');
console.log('- 0 factures + 0€ = Normal pour un système propre');
console.log('- 12 factures + 0€ = Données corrompues ou de test');
console.log('- X factures + Y€ = Vraies données opérationnelles');

// 8. Actions recommandées
console.log('🔧 Actions si problème:');
console.log('1. localStorage.clear() - Vider le cache local');
console.log('2. indexedDB.deleteDatabase("MyConfortCaisseV2") - Reset DB');
console.log('3. location.reload() - Recharger la page');
