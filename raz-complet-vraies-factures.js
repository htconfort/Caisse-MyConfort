// 🧹 SCRIPT RAZ COMPLET - Préparation Tests Factures Réelles
// Exécutez ce script dans la console F12 pour nettoyer complètement l'environnement

console.log('🧹 === RAZ COMPLET DÉMARRÉ ===');
console.log('📅 Date:', new Date().toLocaleString());

async function razComplet() {
    try {
        console.log('1️⃣ Nettoyage localStorage...');
        
        // Lister toutes les clés avant nettoyage
        const keys = Object.keys(localStorage);
        console.log(`🔍 Trouvé ${keys.length} clés localStorage:`, keys);
        
        // Nettoyer toutes les données MyConfort
        const mycomfortKeys = keys.filter(key => 
            key.includes('myconfort') || 
            key.includes('external') || 
            key.includes('invoice') ||
            key.includes('sync') ||
            key.includes('test')
        );
        
        mycomfortKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Supprimé: ${key}`);
        });
        
        console.log('2️⃣ Nettoyage sessionStorage...');
        sessionStorage.clear();
        
        console.log('3️⃣ Nettoyage IndexedDB...');
        if ('indexedDB' in window) {
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name && (db.name.includes('myconfort') || db.name.includes('dexie'))) {
                    console.log(`🗑️ Suppression DB: ${db.name}`);
                    indexedDB.deleteDatabase(db.name);
                }
            }
        }
        
        console.log('4️⃣ Reset service externe...');
        if (window.externalInvoiceService) {
            try {
                // Arrêter la synchronisation
                window.externalInvoiceService.stopSync();
                console.log('🔄 Synchronisation arrêtée');
                
                // Vider les données en mémoire
                if (window.externalInvoiceService.clearAll) {
                    window.externalInvoiceService.clearAll();
                    console.log('🧹 Données service nettoyées');
                }
            } catch (error) {
                console.log('⚠️ Erreur nettoyage service:', error);
            }
        }
        
        console.log('5️⃣ Nettoyage cache navigateur...');
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log(`🗑️ Cache supprimé: ${cacheName}`);
            }
        }
        
        console.log('6️⃣ Verification nettoyage...');
        const remainingKeys = Object.keys(localStorage);
        const mycomfortRemaining = remainingKeys.filter(key => 
            key.includes('myconfort') || key.includes('external') || key.includes('invoice')
        );
        
        if (mycomfortRemaining.length === 0) {
            console.log('✅ Nettoyage complet réussi !');
        } else {
            console.log('⚠️ Clés restantes:', mycomfortRemaining);
        }
        
        console.log('7️⃣ État final:');
        console.log(`📊 localStorage: ${Object.keys(localStorage).length} clés restantes`);
        console.log(`📊 sessionStorage: ${Object.keys(sessionStorage).length} clés`);
        
        console.log('🎯 === RAZ COMPLET TERMINÉ ===');
        console.log('✅ Environnement prêt pour vos vraies factures !');
        console.log('🔄 Rechargement de la page dans 3 secondes...');
        
        // Recharger la page après 3 secondes
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        
    } catch (error) {
        console.error('❌ Erreur durante le RAZ:', error);
    }
}

// Configuration pour tests avec vraies factures
function prepareRealEnvironment() {
    console.log('🏭 Configuration environnement de production...');
    
    // Marquer comme environnement de production
    localStorage.setItem('myconfort-env-mode', 'production');
    localStorage.setItem('myconfort-real-test', 'true');
    localStorage.setItem('myconfort-test-timestamp', Date.now().toString());
    
    console.log('✅ Configuration production appliquée');
}

// Exécution automatique
razComplet().then(() => {
    prepareRealEnvironment();
});

// Export pour utilisation manuelle
window.razComplet = {
    executeRaz: razComplet,
    prepareReal: prepareRealEnvironment,
    quickCheck: () => {
        console.log('🔍 État actuel:');
        console.log('localStorage:', Object.keys(localStorage).length, 'clés');
        console.log('sessionStorage:', Object.keys(sessionStorage).length, 'clés');
        console.log('Service externe:', !!window.externalInvoiceService);
        if (window.externalInvoiceService) {
            console.log('Factures externes:', window.externalInvoiceService.getAllInvoices().length);
        }
    }
};

console.log('🛠️ Fonctions disponibles:');
console.log('- window.razComplet.executeRaz() : RAZ complet');
console.log('- window.razComplet.quickCheck() : Vérification rapide');
console.log('- window.razComplet.prepareReal() : Config production');
