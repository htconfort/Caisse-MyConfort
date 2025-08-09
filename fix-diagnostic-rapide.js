// 🚨 DIAGNOSTIC RAPIDE - Correction IndexedDB + Test Factures
// Copiez ce script dans la console F12 pour résoudre le problème

console.log('🔧 DIAGNOSTIC RAPIDE - Démarrage...');

// 1. Nettoyer les erreurs IndexedDB
async function clearIndexedDBErrors() {
    try {
        console.log('🧹 Nettoyage IndexedDB...');
        const databases = await indexedDB.databases();
        for (const db of databases) {
            if (db.name?.includes('myconfort')) {
                console.log(`🗑️ Suppression DB: ${db.name}`);
                indexedDB.deleteDatabase(db.name);
            }
        }
        console.log('✅ IndexedDB nettoyé');
    } catch (error) {
        console.log('⚠️ Erreur nettoyage IndexedDB:', error);
    }
}

// 2. Vérifier les données externes
function checkExternalInvoices() {
    console.log('🔍 Vérification des factures externes...');
    
    const external = window.externalInvoiceService;
    if (!external) {
        console.error('❌ Service externe non disponible');
        return;
    }
    
    const invoices = external.getAllInvoices();
    console.log(`📊 ${invoices.length} factures trouvées:`, invoices);
    
    invoices.forEach(invoice => {
        console.log(`📋 ${invoice.invoiceNumber} - ${invoice.customerName} - ${invoice.totalAmount}€`);
    });
    
    return invoices;
}

// 3. Forcer rafraîchissement React
function forceReactRefresh() {
    console.log('🔄 Forçage du rafraîchissement React...');
    
    // Déclencher un événement de storage pour forcer le re-render
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'myconfort-external-invoices',
        newValue: localStorage.getItem('myconfort-external-invoices')
    }));
    
    // Forcer mise à jour des composants
    if (window.React) {
        const event = new CustomEvent('forceUpdate');
        window.dispatchEvent(event);
    }
    
    console.log('✅ Rafraîchissement déclenché');
}

// 4. Test complet
async function runFullDiagnostic() {
    console.log('🧪 === DIAGNOSTIC COMPLET ===');
    
    // Nettoyer IndexedDB
    await clearIndexedDBErrors();
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Vérifier les données
    const invoices = checkExternalInvoices();
    
    // Forcer refresh
    forceReactRefresh();
    
    // Rechargement complet si nécessaire
    setTimeout(() => {
        console.log('🔄 Rechargement de la page pour finaliser...');
        window.location.reload();
    }, 2000);
    
    return invoices;
}

// Exécution automatique
runFullDiagnostic();

// Export des fonctions pour utilisation manuelle
window.diagnosticRapide = {
    clearIndexedDB: clearIndexedDBErrors,
    checkInvoices: checkExternalInvoices,
    forceRefresh: forceReactRefresh,
    runFull: runFullDiagnostic
};

console.log('🎯 Script prêt ! Rechargement automatique dans 2 secondes...');
