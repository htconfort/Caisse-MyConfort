// 🚨 NETTOYAGE URGENT - Suppression factures parasites du 8 août
// Script spécialisé pour éliminer les données N8N corrompues

console.log('🚨 === NETTOYAGE URGENT FACTURES PARASITES ===');
console.log('🎯 Objectif: Supprimer les factures du 8 août et garder seulement celle du 9 août');

async function nettoyageUrgent() {
    try {
        console.log('1️⃣ Analyse des données actuelles...');
        
        // Vérifier le service externe
        if (window.externalInvoiceService) {
            const invoices = window.externalInvoiceService.getAllInvoices();
            console.log(`📊 Trouvé ${invoices.length} factures:`, invoices);
            
            // Identifier les factures du 8 août (parasites)
            const factures8Aout = invoices.filter(invoice => {
                const date = new Date(invoice.date || invoice.createdAt || invoice.invoiceDate);
                return date.getDate() === 8 && date.getMonth() === 7; // 8 août
            });
            
            // Identifier les factures du 9 août (légitimes)
            const factures9Aout = invoices.filter(invoice => {
                const date = new Date(invoice.date || invoice.createdAt || invoice.invoiceDate);
                return date.getDate() === 9 && date.getMonth() === 7; // 9 août
            });
            
            console.log(`🗑️ Factures parasites (8 août): ${factures8Aout.length}`);
            console.log(`✅ Factures légitimes (9 août): ${factures9Aout.length}`);
            
            // Afficher les détails
            factures8Aout.forEach(f => {
                console.log(`❌ PARASITE: ${f.invoiceNumber} - ${f.customerName} - ${f.totalAmount}€`);
            });
            
            factures9Aout.forEach(f => {
                console.log(`✅ LEGITIME: ${f.invoiceNumber} - ${f.customerName} - ${f.totalAmount}€`);
            });
        }
        
        console.log('2️⃣ Nettoyage localStorage spécialisé...');
        
        // Supprimer spécifiquement les clés de sync N8N
        const keysToRemove = [
            'myconfort-external-invoices',
            'myconfort-sync-last-update',
            'myconfort-n8n-cache',
            'myconfort-processed-invoices',
            'myconfort-sync-status',
            'external-invoices',
            'n8n-invoices',
            'sync-invoices'
        ];
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ Supprimé: ${key}`);
            }
        });
        
        console.log('3️⃣ Reset complet service externe...');
        
        if (window.externalInvoiceService) {
            // Arrêter toute synchronisation
            if (window.externalInvoiceService.stopSync) {
                window.externalInvoiceService.stopSync();
            }
            
            // Vider complètement
            if (window.externalInvoiceService.clearAll) {
                window.externalInvoiceService.clearAll();
            }
            
            // Reset manuel des données en mémoire
            if (window.externalInvoiceService.invoices) {
                window.externalInvoiceService.invoices = [];
            }
            
            console.log('🧹 Service externe complètement nettoyé');
        }
        
        console.log('4️⃣ Nettoyage cache React/Vite...');
        
        // Supprimer toutes les données en cache
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log(`🗑️ Cache supprimé: ${cacheName}`);
            }
        }
        
        console.log('5️⃣ Forcer reset des hooks React...');
        
        // Déclencher un événement custom pour forcer le re-render
        window.dispatchEvent(new CustomEvent('forceInvoiceRefresh'));
        window.dispatchEvent(new Event('storage'));
        
        console.log('6️⃣ Vérification finale...');
        
        const remainingInvoices = window.externalInvoiceService ? 
            window.externalInvoiceService.getAllInvoices().length : 0;
        
        console.log(`📊 Factures restantes: ${remainingInvoices}`);
        
        if (remainingInvoices === 0) {
            console.log('✅ NETTOYAGE RÉUSSI ! Toutes les factures parasites supprimées');
        } else {
            console.log('⚠️ Des factures persistent, rechargement nécessaire');
        }
        
        console.log('🎯 === NETTOYAGE TERMINÉ ===');
        console.log('🔄 Rechargement automatique dans 2 secondes...');
        
        setTimeout(() => {
            console.log('🔄 Rechargement de la page...');
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur nettoyage urgent:', error);
        console.log('🔄 Rechargement forcé...');
        setTimeout(() => window.location.reload(), 1000);
    }
}

// Fonction de vérification post-nettoyage
function verifierEtatApresNettoyage() {
    console.log('🔍 === VÉRIFICATION POST-NETTOYAGE ===');
    
    const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.includes('invoice') || key.includes('sync') || key.includes('external')
    );
    
    console.log('📊 Clés localStorage restantes:', localStorageKeys);
    
    if (window.externalInvoiceService) {
        const invoices = window.externalInvoiceService.getAllInvoices();
        console.log(`📋 Factures actives: ${invoices.length}`);
        
        if (invoices.length > 0) {
            console.log('📋 Détail des factures:');
            invoices.forEach(invoice => {
                const date = new Date(invoice.date || invoice.createdAt);
                console.log(`- ${invoice.invoiceNumber}: ${invoice.customerName} - ${invoice.totalAmount}€ (${date.toLocaleDateString()})`);
            });
        }
    }
    
    // Calculer le CA réel
    const caInstant = window.externalInvoiceService ? 
        window.externalInvoiceService.getAllInvoices()
            .reduce((total, invoice) => total + (invoice.totalAmount || 0), 0) : 0;
    
    console.log(`💰 CA Instant calculé: ${caInstant}€`);
    console.log(caInstant === 2100 ? '✅ CA correct (2100€)' : '❌ CA incorrect, doit être 2100€');
}

// Exécution automatique
console.log('🚀 Démarrage du nettoyage urgent...');
nettoyageUrgent();

// Export pour usage manuel
window.nettoyageUrgent = {
    executer: nettoyageUrgent,
    verifier: verifierEtatApresNettoyage
};

console.log('🛠️ Commandes disponibles:');
console.log('- window.nettoyageUrgent.executer() : Relancer le nettoyage');
console.log('- window.nettoyageUrgent.verifier() : Vérifier l\'état actuel');
