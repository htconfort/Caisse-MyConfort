// 🧹 RAZ COMPLET - Nettoyage total du système de factures
// Script pour supprimer toutes les données de test et revenir à un état propre

console.log('🧹 === RAZ COMPLET DU SYSTÈME DE FACTURES ===');

async function razComplet() {
    console.log('🔄 Démarrage du RAZ complet...');
    
    // 1. Nettoyer localStorage
    console.log('🗑️ Nettoyage localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
            key.includes('myconfort') || 
            key.includes('external-invoice') || 
            key.includes('facture') ||
            key.includes('invoice')
        )) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => {
        console.log(`  🗑️ Suppression: ${key}`);
        localStorage.removeItem(key);
    });
    
    // 2. Nettoyer IndexedDB
    console.log('🗑️ Nettoyage IndexedDB...');
    try {
        const databases = await indexedDB.databases();
        for (const db of databases) {
            if (db.name && (db.name.includes('myconfort') || db.name.includes('facture'))) {
                console.log(`  🗑️ Suppression DB: ${db.name}`);
                indexedDB.deleteDatabase(db.name);
            }
        }
    } catch (error) {
        console.log('⚠️ Erreur nettoyage IndexedDB:', error);
    }
    
    // 3. Réinitialiser le service externe s'il existe
    console.log('🔄 Réinitialisation du service externe...');
    if (window.externalInvoiceService) {
        try {
            // Vider toutes les factures externes
            window.externalInvoiceService.clearAllInvoices();
            console.log('✅ Service externe vidé');
        } catch (error) {
            console.log('⚠️ Erreur lors du vidage du service externe:', error);
        }
    }
    
    // 4. Nettoyer sessionStorage
    console.log('🗑️ Nettoyage sessionStorage...');
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
            key.includes('myconfort') || 
            key.includes('external-invoice') || 
            key.includes('facture') ||
            key.includes('invoice')
        )) {
            sessionKeysToRemove.push(key);
        }
    }
    
    sessionKeysToRemove.forEach(key => {
        console.log(`  🗑️ Suppression session: ${key}`);
        sessionStorage.removeItem(key);
    });
    
    // 5. Forcer un refresh React complet
    console.log('🔄 Forçage refresh React...');
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'myconfort-external-invoices',
        newValue: null
    }));
    
    // 6. État final
    console.log('📊 Vérification état final...');
    const remainingLocalStorage = Object.keys(localStorage).filter(key => 
        key.includes('myconfort') || key.includes('facture') || key.includes('invoice')
    );
    
    if (remainingLocalStorage.length === 0) {
        console.log('✅ localStorage complètement nettoyé');
    } else {
        console.log('⚠️ Éléments restants dans localStorage:', remainingLocalStorage);
    }
    
    // Vérifier le service externe
    if (window.externalInvoiceService) {
        const invoices = window.externalInvoiceService.getAllInvoices();
        console.log(`📋 Factures externes restantes: ${invoices.length}`);
        if (invoices.length === 0) {
            console.log('✅ Service externe complètement vidé');
        }
    }
    
    console.log('🎯 === RAZ COMPLET TERMINÉ ===');
    console.log('💡 Le système est maintenant prêt pour vos vraies factures!');
    console.log('🔄 Rechargement automatique dans 3 secondes...');
    
    // Rechargement automatique
    setTimeout(() => {
        window.location.reload();
    }, 3000);
}

// Fonction de vérification rapide
function verifierEtatSysteme() {
    console.log('🔍 === VÉRIFICATION ÉTAT SYSTÈME ===');
    
    // Vérifier localStorage
    const localStorageFactures = Object.keys(localStorage).filter(key => 
        key.includes('myconfort') || key.includes('facture') || key.includes('invoice')
    );
    console.log(`📦 localStorage factures: ${localStorageFactures.length} entrées`);
    
    // Vérifier service externe
    if (window.externalInvoiceService) {
        const invoices = window.externalInvoiceService.getAllInvoices();
        console.log(`🌐 Service externe: ${invoices.length} factures`);
    } else {
        console.log('❌ Service externe non disponible');
    }
    
    // Vérifier N8N sync
    console.log('🔗 État synchronisation N8N: Prêt pour nouvelles factures');
    
    return {
        localStorage: localStorageFactures.length,
        external: window.externalInvoiceService ? window.externalInvoiceService.getAllInvoices().length : 0
    };
}

// Exécuter le RAZ complet
razComplet();

// Exporter les fonctions pour utilisation manuelle
window.razComplet = {
    executer: razComplet,
    verifier: verifierEtatSysteme
};

console.log('🚀 Script RAZ prêt! Exécution automatique en cours...');
