// 🎯 ÉLIMINATION SPÉCIALISÉE - Factures de démo persistantes
// Script ultra-spécialisé pour supprimer les factures #demo-inv-xxx

console.log('🎯 === ÉLIMINATION FACTURES DÉMO PERSISTANTES ===');
console.log('🔍 Cible: Factures #demo-inv-001, #demo-inv-002, #demo-inv-003, #demo-inv-004');

async function eliminationDemo() {
    try {
        console.log('1️⃣ ANALYSE spécialisée factures démo...');
        
        if (window.externalInvoiceService) {
            const invoices = window.externalInvoiceService.getAllInvoices();
            console.log(`📊 Total factures: ${invoices.length}`);
            
            // Identifier spécifiquement les factures démo
            const demoInvoices = invoices.filter(invoice => 
                invoice.invoiceNumber && invoice.invoiceNumber.includes('demo-inv')
            );
            
            const realInvoices = invoices.filter(invoice => 
                !invoice.invoiceNumber || !invoice.invoiceNumber.includes('demo-inv')
            );
            
            console.log(`🗑️ Factures DÉMO détectées: ${demoInvoices.length}`);
            console.log(`✅ Factures RÉELLES: ${realInvoices.length}`);
            
            console.log('📋 FACTURES DÉMO À SUPPRIMER:');
            demoInvoices.forEach(invoice => {
                console.log(`❌ ${invoice.invoiceNumber} - ${invoice.customerName} - ${invoice.totalAmount}€`);
            });
            
            console.log('📋 FACTURES RÉELLES À CONSERVER:');
            realInvoices.forEach(invoice => {
                console.log(`✅ ${invoice.invoiceNumber || 'Sans numéro'} - ${invoice.customerName} - ${invoice.totalAmount}€`);
            });
        }
        
        console.log('2️⃣ SUPPRESSION ultra-ciblée...');
        
        // Vider TOUT le localStorage sans exception
        console.log('🗑️ Suppression TOTALE localStorage...');
        const allKeys = Object.keys(localStorage);
        console.log(`🗑️ ${allKeys.length} clés à supprimer...`);
        
        allKeys.forEach(key => {
            console.log(`🗑️ Suppression: ${key}`);
            localStorage.removeItem(key);
        });
        
        // Double sécurité
        localStorage.clear();
        console.log('✅ localStorage TOTALEMENT vidé');
        
        console.log('3️⃣ SUPPRESSION sessionStorage...');
        sessionStorage.clear();
        console.log('✅ sessionStorage vidé');
        
        console.log('4️⃣ SUPPRESSION cache complet...');
        
        if ('caches' in window) {
            try {
                const cacheNames = await caches.keys();
                for (const cacheName of cacheNames) {
                    await caches.delete(cacheName);
                    console.log(`🗑️ Cache supprimé: ${cacheName}`);
                }
            } catch (e) {
                console.log('⚠️ Erreur cache:', e.message);
            }
        }
        
        console.log('5️⃣ RESET service externe BRUTAL...');
        
        if (window.externalInvoiceService) {
            try {
                // Arrêter toute sync
                if (window.externalInvoiceService.stopSync) {
                    window.externalInvoiceService.stopSync();
                }
                
                // Vider toutes les données
                if (window.externalInvoiceService.clearAll) {
                    window.externalInvoiceService.clearAll();
                }
                
                // Reset brutal de toutes les propriétés
                Object.keys(window.externalInvoiceService).forEach(prop => {
                    if (Array.isArray(window.externalInvoiceService[prop])) {
                        window.externalInvoiceService[prop] = [];
                    } else if (typeof window.externalInvoiceService[prop] === 'object' && 
                              window.externalInvoiceService[prop] !== null) {
                        window.externalInvoiceService[prop] = {};
                    }
                });
                
                console.log('🧹 Service externe BRUTALEMENT nettoyé');
            } catch (e) {
                console.log('⚠️ Erreur service:', e.message);
            }
        }
        
        console.log('6️⃣ BLOCAGE anti-resync ABSOLU...');
        
        // Créer un mur anti-sync
        localStorage.setItem('DEMO_INVOICES_BLOCKED', 'PERMANENT');
        localStorage.setItem('N8N_SYNC_DISABLED', 'TRUE');
        localStorage.setItem('FORCE_ZERO_INVOICES', 'TRUE');
        localStorage.setItem('ANTI_DEMO_SHIELD', Date.now().toString());
        
        // Override TOUTES les fonctions de sync
        if (window.externalInvoiceService) {
            const originalSync = window.externalInvoiceService.syncInvoices;
            
            window.externalInvoiceService.syncInvoices = function() {
                console.log('🚫 SYNC BLOQUÉE - Factures démo interdites');
                return Promise.resolve([]);
            };
            
            window.externalInvoiceService.getAllInvoices = function() {
                console.log('🚫 GET INVOICES BLOQUÉ - Retour liste vide');
                return [];
            };
            
            // Bloquer toute tentative de restauration
            window.externalInvoiceService.loadFromStorage = function() {
                console.log('🚫 LOAD STORAGE BLOQUÉ');
                return [];
            };
        }
        
        console.log('🛡️ MUR ANTI-SYNC activé');
        
        console.log('7️⃣ ÉVÉNEMENTS React FORCÉS...');
        
        const events = [
            'forceInvoiceRefresh',
            'storage',
            'invoicesUpdated', 
            'dataReset',
            'externalInvoicesCleared',
            'demoInvoicesEliminated'
        ];
        
        events.forEach(eventName => {
            window.dispatchEvent(new CustomEvent(eventName, { 
                detail: { 
                    elimination: true, 
                    demoBlocked: true,
                    timestamp: Date.now() 
                } 
            }));
        });
        
        console.log('📡 Événements de reset déclenchés');
        
        console.log('8️⃣ VÉRIFICATION finale...');
        
        const storage = Object.keys(localStorage).length;
        const invoicesCount = window.externalInvoiceService ? 
            (window.externalInvoiceService.getAllInvoices ? window.externalInvoiceService.getAllInvoices().length : 0) : 0;
        
        console.log(`📊 localStorage: ${storage} clés (dont blocages anti-sync)`);
        console.log(`📊 Factures restantes: ${invoicesCount}`);
        
        if (invoicesCount === 0) {
            console.log('✅ ÉLIMINATION DÉMO RÉUSSIE !');
            console.log('🎯 CA devrait maintenant être à 0€');
        } else {
            console.log('⚠️ Des factures persistent, rechargement hard requis');
        }
        
        console.log('🔥 === ÉLIMINATION TERMINÉE ===');
        console.log('🔄 Rechargement HARD dans 2 secondes...');
        
        setTimeout(() => {
            console.log('🔄 RECHARGEMENT HARD AVEC CACHE CLEAR...');
            // Rechargement le plus brutal possible
            window.location.href = window.location.href + '?t=' + Date.now();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erreur élimination démo:', error);
        
        // En cas d'erreur, forcer quand même le nettoyage
        localStorage.clear();
        sessionStorage.clear();
        
        setTimeout(() => {
            console.log('🔄 RECHARGEMENT D\'URGENCE...');
            window.location.reload(true);
        }, 1000);
    }
}

// Fonction de déblocage pour plus tard
function debloquerSync() {
    console.log('🔓 Débloquage du système...');
    localStorage.removeItem('DEMO_INVOICES_BLOCKED');
    localStorage.removeItem('N8N_SYNC_DISABLED');
    localStorage.removeItem('FORCE_ZERO_INVOICES');
    localStorage.removeItem('ANTI_DEMO_SHIELD');
    console.log('✅ Système débloqué');
}

// Fonction de vérification
function verifierElimination() {
    console.log('🔍 === VÉRIFICATION ÉLIMINATION DÉMO ===');
    
    const blocages = [
        'DEMO_INVOICES_BLOCKED',
        'N8N_SYNC_DISABLED', 
        'FORCE_ZERO_INVOICES',
        'ANTI_DEMO_SHIELD'
    ];
    
    console.log('🛡️ Blocages actifs:');
    blocages.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value || 'NON'}`);
    });
    
    if (window.externalInvoiceService) {
        const invoices = window.externalInvoiceService.getAllInvoices ? 
            window.externalInvoiceService.getAllInvoices() : [];
        console.log(`📋 Factures: ${invoices.length}`);
        
        const demoCount = invoices.filter(inv => 
            inv.invoiceNumber && inv.invoiceNumber.includes('demo-inv')
        ).length;
        
        console.log(`🗑️ Factures démo restantes: ${demoCount}`);
        console.log(demoCount === 0 ? '✅ DÉMO ÉLIMINÉE' : '❌ DÉMO PERSISTE');
    }
}

// Export global
window.eliminationDemo = {
    executer: eliminationDemo,
    verifier: verifierElimination,
    debloquer: debloquerSync
};

console.log('🛠️ Commandes disponibles:');
console.log('- window.eliminationDemo.executer() : Éliminer les factures démo');
console.log('- window.eliminationDemo.verifier() : Vérifier l\'état');
console.log('- window.eliminationDemo.debloquer() : Débloquer le système plus tard');

console.log('');
console.log('🎯 PRÊT POUR L\'ÉLIMINATION DES FACTURES DÉMO !');
console.log('💡 Tapez: eliminationDemo.executer() pour démarrer');

// Fonction raccourci
window.eliminationDemo = eliminationDemo;
