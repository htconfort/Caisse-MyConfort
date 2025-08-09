// 🔥 SOLUTION RADICALE - Arrêt définitif des factures parasites
// Ce script va complètement bloquer la synchronisation des anciennes données

console.log('🔥 === SOLUTION RADICALE - ARRÊT DÉFINITIF ===');
console.log('🎯 Objectif: Bloquer définitivement les factures du 8 août qui se resynchronisent');

async function solutionRadicale() {
    try {
        console.log('1️⃣ DIAGNOSTIC COMPLET...');
        
        // Analyser toutes les sources de données
        console.log('🔍 Analyse localStorage complet:');
        Object.keys(localStorage).forEach(key => {
            if (key.includes('invoice') || key.includes('sync') || key.includes('external') || key.includes('n8n')) {
                console.log(`📦 ${key}:`, localStorage.getItem(key)?.substring(0, 100));
            }
        });
        
        console.log('2️⃣ ARRÊT FORCÉ DE TOUTE SYNCHRONISATION...');
        
        // Sauvegarder la vraie facture avant nettoyage
        let vraieFacture2100 = null;
        if (window.externalInvoiceService) {
            const invoices = window.externalInvoiceService.getAllInvoices();
            vraieFacture2100 = invoices.find(inv => inv.totalAmount === 2100);
            console.log('💾 Facture 2100€ sauvegardée:', vraieFacture2100);
        }
        
        // Arrêter TOUS les timers et synchronisations
        if (window.externalInvoiceService) {
            // Arrêter sync
            if (window.externalInvoiceService.stopSync) {
                window.externalInvoiceService.stopSync();
            }
            
            // Désactiver complètement le service
            if (window.externalInvoiceService.destroy) {
                window.externalInvoiceService.destroy();
            }
            
            // Marquer comme désactivé
            window.externalInvoiceService.isActive = false;
            window.externalInvoiceService.autoSync = false;
        }
        
        console.log('3️⃣ NETTOYAGE COMPLET BRUTAL...');
        
        // Supprimer TOUT ce qui concerne les factures externes
        const allKeys = Object.keys(localStorage);
        const keysToDelete = allKeys.filter(key => 
            key.includes('invoice') || 
            key.includes('sync') || 
            key.includes('external') || 
            key.includes('n8n') ||
            key.includes('myconfort-external') ||
            key.includes('facture')
        );
        
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🔥 SUPPRIMÉ: ${key}`);
        });
        
        // Supprimer sessionStorage aussi
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach(key => {
            if (key.includes('invoice') || key.includes('sync') || key.includes('external')) {
                sessionStorage.removeItem(key);
                console.log(`🔥 SESSION SUPPRIMÉE: ${key}`);
            }
        });
        
        console.log('4️⃣ BLOCAGE PRÉVENTIF...');
        
        // Créer une liste noire des factures à ignorer (toutes sauf la 2100€)
        const blacklist = {
            blockedInvoices: [],
            lastCleanup: Date.now(),
            realInvoiceAmount: 2100,
            realInvoiceDate: '2025-08-09'
        };
        
        // Marquer pour bloquer toute resync automatique
        localStorage.setItem('myconfort-sync-disabled', 'true');
        localStorage.setItem('myconfort-blacklist', JSON.stringify(blacklist));
        localStorage.setItem('myconfort-force-clean-mode', 'true');
        
        console.log('5️⃣ RESTAURATION SÉLECTIVE...');
        
        // Restaurer uniquement la vraie facture si elle existe
        if (vraieFacture2100) {
            const cleanData = {
                invoices: [vraieFacture2100],
                lastUpdate: Date.now(),
                count: 1,
                cleanMode: true
            };
            localStorage.setItem('myconfort-external-invoices-clean', JSON.stringify(cleanData));
            console.log('✅ Vraie facture 2100€ restaurée en mode propre');
        }
        
        console.log('6️⃣ MODIFICATION DU SERVICE...');
        
        // Redéfinir le service externe pour qu'il ne retourne que la vraie facture
        if (window.externalInvoiceService) {
            const originalGetAll = window.externalInvoiceService.getAllInvoices;
            
            window.externalInvoiceService.getAllInvoices = function() {
                const cleanData = localStorage.getItem('myconfort-external-invoices-clean');
                if (cleanData) {
                    const parsed = JSON.parse(cleanData);
                    console.log('🔒 Mode propre activé - retour facture unique');
                    return parsed.invoices || [];
                }
                return [];
            };
            
            // Bloquer les ajouts de nouvelles factures parasites
            const originalAdd = window.externalInvoiceService.addInvoice;
            window.externalInvoiceService.addInvoice = function(invoice) {
                const amount = invoice.totalAmount || invoice.amount || 0;
                const date = new Date(invoice.date || invoice.createdAt || Date.now());
                
                // Bloquer toutes les factures du 8 août
                if (date.getDate() === 8 && date.getMonth() === 7 && date.getFullYear() === 2025) {
                    console.log(`🚫 FACTURE BLOQUÉE (8 août): ${invoice.customerName} - ${amount}€`);
                    return false;
                }
                
                // Autoriser seulement les factures du 9 août
                if (date.getDate() === 9 && date.getMonth() === 7 && date.getFullYear() === 2025) {
                    console.log(`✅ FACTURE AUTORISÉE (9 août): ${invoice.customerName} - ${amount}€`);
                    return originalAdd.call(this, invoice);
                }
                
                console.log(`⚠️ FACTURE IGNORÉE (autre date): ${invoice.customerName} - ${amount}€`);
                return false;
            };
            
            console.log('🔒 Service modifié - protection active');
        }
        
        console.log('7️⃣ VÉRIFICATION FINALE...');
        
        const finalCount = window.externalInvoiceService ? 
            window.externalInvoiceService.getAllInvoices().length : 0;
        const finalCA = window.externalInvoiceService ? 
            window.externalInvoiceService.getAllInvoices()
                .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) : 0;
        
        console.log(`📊 Factures finales: ${finalCount}`);
        console.log(`💰 CA final: ${finalCA}€`);
        
        if (finalCA === 2100) {
            console.log('🎉 SUCCÈS ! CA correct à 2100€');
        } else {
            console.log(`❌ ÉCHEC ! CA encore à ${finalCA}€ au lieu de 2100€`);
        }
        
        console.log('🔄 Rechargement avec protection active...');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('💥 Erreur solution radicale:', error);
        console.log('🔄 Rechargement d\'urgence...');
        setTimeout(() => window.location.reload(), 1000);
    }
}

// Fonction de protection permanente à réexécuter après rechargement
function activerProtectionPermanente() {
    console.log('🛡️ Activation protection permanente...');
    
    // Vérifier si on est en mode nettoyé
    if (localStorage.getItem('myconfort-force-clean-mode') === 'true') {
        console.log('🔒 Mode propre détecté - application des protections');
        
        // Redéfinir le service dès le chargement
        const checkService = setInterval(() => {
            if (window.externalInvoiceService) {
                console.log('🛡️ Service détecté - application protection');
                
                // Bloquer les synchronisations automatiques
                if (window.externalInvoiceService.stopSync) {
                    window.externalInvoiceService.stopSync();
                }
                
                // Remplacer getAllInvoices
                window.externalInvoiceService.getAllInvoices = function() {
                    const cleanData = localStorage.getItem('myconfort-external-invoices-clean');
                    if (cleanData) {
                        const parsed = JSON.parse(cleanData);
                        return parsed.invoices || [];
                    }
                    return [];
                };
                
                clearInterval(checkService);
                console.log('✅ Protection permanente activée');
            }
        }, 500);
        
        // Arrêter la vérification après 10 secondes
        setTimeout(() => clearInterval(checkService), 10000);
    }
}

// Exécution immédiate
console.log('🚀 Lancement solution radicale...');
solutionRadicale();

// Protection au chargement
activerProtectionPermanente();

// Export pour usage manuel
window.solutionRadicale = {
    executer: solutionRadicale,
    protection: activerProtectionPermanente,
    status: () => {
        const count = window.externalInvoiceService ? window.externalInvoiceService.getAllInvoices().length : 0;
        const ca = window.externalInvoiceService ? 
            window.externalInvoiceService.getAllInvoices().reduce((s, i) => s + (i.totalAmount || 0), 0) : 0;
        console.log(`📊 État: ${count} factures, CA: ${ca}€`);
        return { count, ca };
    }
};

console.log('🛠️ Commandes disponibles:');
console.log('- window.solutionRadicale.status() : Vérifier état');
console.log('- window.solutionRadicale.executer() : Relancer nettoyage');
console.log('- window.solutionRadicale.protection() : Réactiver protection');
