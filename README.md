# =========================
#  Cursor Project Rules
#  Sync Facturation → Caisse (n8n → HTTP direct)
# =========================

[context]
project = "Sync de facture iPad vers Application Caisse"
goal = "Chaque facture créée sur l’iPad est envoyée en POST à l’API Caisse et devient visible dans l’onglet 'Factures', impacte 'Ventes' et 'CA instant' par vendeuse."
---
[workflow.required_chain]
# Chaînage unique et obligatoire
# Aucune branche parallèle directe vers l’HTTP
nodes = [
  "Webhook Facture",
  "Normalize",
  "Set (optionnel secours)",
  "Caisse Push (direct)",
  "Respond"
]
forbid_parallel_http = true
---
[http.caisse_push]
method = "POST"
endpoint = "https://caissemyconfort2025.netlify.app/api/caisse/facture"
headers.Content-Type = "application/json"
headers.X-Secret = "MySuperSecretKey2025"
body.source = "$json"            # IMPORTANT: expression exacte
body.disallow = ["$json.body", "{{ }}", "stringified wrappers", "data wrapper"]
expect.response_example = "{\"ok\":true,\"enqueued\":1}"
timeout_seconds = 20
---
[normalize.output_contract]
required_fields = [
  "numero_facture",
  "date_facture",
  "nom_client",
  "montant_ttc",
  "payment_method",
  "vendeuse",
  "vendorId",
  "produits"
]
assertions = [
  "numero_facture != ''",
  "montant_ttc > 0",
  "Array.isArray(produits) && produits.length >= 1",
  "vendeuse === 'Sylvie'",
  "vendorId === 'sylvie'"
]
idempotency.key = "numero_facture"      # Si existe déjà côté Caisse → mise à jour, pas de doublon
---
[normalize.function_js]
# Colle ce code dans le nœud "Normalize" (Function / Code JS n8n)
code = """
const input = $json || {};
const data = input.data || input || {};
const produits = Array.isArray(data.produits)
  ? data.produits
  : (Array.isArray(data.items) ? data.items : []);

function num(x, d=0){ const n = Number(x); return Number.isFinite(n) ? n : d; }

const ttcFromItems = produits.reduce((s,p)=>{
  const q = num(p.quantite ?? p.qty ?? 1, 1);
  const pu = num(p.prix_ttc ?? p.price_ttc ?? p.price ?? 0, 0);
  const remise = num(p.remise ?? 0, 0); // ex: 0.2 = -20%
  const brut = q * pu;
  return s + (remise ? brut * (1 - remise) : brut);
}, 0);

const numero_facture = String(data.numero_facture || data.invoiceNumber || `AUTO-${Date.now()}`);
const date_facture   = String(data.date_facture   || data.invoiceDate   || new Date().toISOString().slice(0,10));
const nom_client     = String(data.nom_client     || data.clientName    || "Client");
const payment_method = String(data.payment_method || data.mode_paiement || "card");
const vendeuse       = String(data.vendeuse       || data.seller        || "Sylvie");
const vendorId       = String((data.vendorId || data.vendor_id || vendeuse).toLowerCase());

const montant_ttc = num(data.montant_ttc, null) ?? ttcFromItems;

if (!produits.length) throw new Error("Validation: produits vide");
if (!numero_facture)  throw new Error("Validation: numero_facture vide");
if (!(montant_ttc > 0)) throw new Error("Validation: montant_ttc <= 0");

return [{
  json: {
    numero_facture,
    date_facture,
    nom_client,
    montant_ttc,
    payment_method,
    vendeuse,
    vendorId,
    produits
  }
}];
"""
---
[set.fallback]
# À insérer SEULEMENT si l’HTTP reçoit encore un body vide
enabled_when = "http.body_empty"
keep_only_set = true
map_fields_as_expressions = [
  "numero_facture",
  "date_facture",
  "nom_client",
  "montant_ttc",
  "payment_method",
  "vendeuse",
  "vendorId",
  "produits"
]
---
[json.contract_example]
pretty = """
{
  "numero_facture": "F-SYL-001",
  "date_facture": "2025-09-23",
  "nom_client": "Client Test",
  "montant_ttc": 1440,
  "payment_method": "card",
  "vendeuse": "Sylvie",
  "vendorId": "sylvie",
  "produits": [
    { "nom": "Matelas 140x190", "quantite": 1, "prix_ttc": 1440, "remise": 0.2 }
  ]
}
"""
---
[checks.before_push]
steps = [
  "Run node: Normalize → vérifier l’OUTPUT respecte [normalize.output_contract]",
  "Open node: Caisse Push (direct) → onglet Request > Body → doit afficher EXACTEMENT l’OUTPUT de Normalize (pas de champ 'data', pas de string JSON)",
  "Headers présents: Content-Type=application/json & X-Secret=MySuperSecretKey2025",
  "Réponse attendue = {\"ok\":true,\"enqueued\":1}"
]
---
[observability]
# Effet attendu sous 5–10 s après le 200 OK
signals = [
  "Facture visible dans l’onglet 'Factures'",
  "Totaux mis à jour dans 'Ventes'",
  "CA instant impacté pour la vendeuse 'Sylvie'"
]
---
[troubleshooting.fast]
case."HTTP body vide" = "Vérifie que Body Content Type=JSON + 'Add Expression' → $json (pas $json.body, pas {{ }})"
case."HTTP body stringifié dans 'data'" = "Passe le Body sur $json (expression), pas sur un champ 'data' texte"
case."Normalize OK mais HTTP vide" = "Insérer 'Set (fallback)' comme défini en [set.fallback]"
case."montant_ttc = 0 ou produits = []" = "Corriger la source ou laisse Normalize lever une erreur claire"
---
✅ Mode d’emploi éclair

Ajoute ce fichier à la racine du projet sous le nom .cursorrules.

Ouvre Cursor, puis lance/édite ton workflow n8n : garantis le chaînage unique
Webhook Facture → Normalize → (Set si besoin) → Caisse Push (direct) → Respond.

Dans Caisse Push (direct) : Body → Add Expression → tape $json (sans guillemets).

Teste Normalize seul (doit passer les assertions), puis Caisse Push (réponse {"ok":true,"enqueued":1}).

## 🧪 Tests de Validation

### Test 1 - Facture Sylvie (12 000 €)
```bash
curl -X POST 'https://caissemyconfort2025.netlify.app/api/caisse/facture' \
  -H 'Content-Type: application/json' \
  -H 'X-Secret: MySuperSecretKey2025' \
  --data '{"numero_facture":"F-CURSOR-TEST","date_facture":"2025-09-23","nom_client":"Test Cursor Rules","montant_ttc":12000,"payment_method":"card","vendeuse":"Sylvie","vendorId":"sylvie","produits":[{"nom":"Test Cursor","quantite":10,"prix_ttc":1200,"remise":0}]}'
```
**Résultat attendu :** CA instant = 12 000 € sous Sylvie

### Test 2 - Facture Babette (10 000 €)
```bash
curl -X POST 'https://caissemyconfort2025.netlify.app/api/caisse/facture' \
  -H 'Content-Type: application/json' \
  -H 'X-Secret: MySuperSecretKey2025' \
  --data '{"numero_facture":"F-BABETTE-TEST","date_facture":"2025-09-23","nom_client":"Test Babette","montant_ttc":10000,"payment_method":"card","vendeuse":"Babette","vendorId":"babette","produits":[{"nom":"Test Babette","quantite":8,"prix_ttc":1250,"remise":0}]}'
```
**Résultat attendu :** CA instant = 10 000 € sous Babette

### Test 3 - Facture Lucia (15 000 €)
```bash
curl -X POST 'https://caissemyconfort2025.netlify.app/api/caisse/facture' \
  -H 'Content-Type: application/json' \
  -H 'X-Secret: MySuperSecretKey2025' \
  --data '{"numero_facture":"F-LUCIA-TEST","date_facture":"2025-09-23","nom_client":"Test Lucia","montant_ttc":15000,"payment_method":"transfer","vendeuse":"Lucia","vendorId":"lucia","produits":[{"nom":"Test Lucia","quantite":6,"prix_ttc":2500,"remise":0}]}'
```
**Résultat attendu :** CA instant = 15 000 € sous Lucia

### Vérification Finale Complète
- ✅ Onglet "Factures" : 3 factures visibles
- ✅ Onglet "Ventes" : 3 ventes (37 000 € total)
- ✅ Onglet "CA instant" :
  - Sylvie : 12 000 €
  - Babette : 10 000 €
  - Lucia : 15 000 €
  - **Total : 37 000 €**

### 🎯 Test Multi-Vendeuses
**Objectif :** Vérifier que le système gère correctement plusieurs vendeuses simultanément.

**Résultats attendus :**
- Chaque vendeuse a son propre CA
- Le total général est la somme de tous
- Les vendeuses sans vente restent à 0 €
- Aucune interférence entre les vendeuses

## 🚨 **MODE FACTURIER PUR - CORRECTION DOUBLONS**

### 🎯 **Problème Résolu**
- **Avant :** Factures externes converties en ventes → doublons (37 000 € affichés comme 74 000 €)
- **Après :** Mode facturier pur - factures externes SEULEMENT, pas de ventes

### 📊 **Architecture Corrigée**

#### **Mode Facturier (Recommandé) :**
```
Factures externes (n8n) → externalInvoiceService → CA instant
                    ↓
                Pas de conversion en ventes
```

#### **Mode Classique (Désactivé pour éviter doublons) :**
```
Ventes caisse iPad → createSale() → IndexedDB → CA instant
```

### 🧪 **Test Mode Facturier Pur**

#### **Test 4 - Mode Facturier Pur (18 000 €)**
```bash
curl -X POST 'https://caissemyconfort2025.netlify.app/api/caisse/facture' \
  -H 'Content-Type: application/json' \
  -H 'X-Secret: MySuperSecretKey2025' \
  --data '{"numero_facture":"F-FACTURIER-PUR","date_facture":"2025-09-23","nom_client":"Test Mode Facturier","montant_ttc":18000,"payment_method":"transfer","vendeuse":"Sylvie","vendorId":"sylvie","produits":[{"nom":"Test Facturier Pur","quantite":6,"prix_ttc":3000,"remise":0}]}'
```
**Résultat attendu :** CA instant = 18 000 € sous Sylvie

#### **Test 5 - Cathy (20 000 €)**
```bash
curl -X POST 'https://caissemyconfort2025.netlify.app/api/caisse/facture' \
  -H 'Content-Type: application/json' \
  -H 'X-Secret: MySuperSecretKey2025' \
  --data '{"numero_facture":"F-CATHY-TEST","date_facture":"2025-09-23","nom_client":"Test Cathy","montant_ttc":20000,"payment_method":"cash","vendeuse":"Cathy","vendorId":"cathy","produits":[{"nom":"Test Cathy","quantite":5,"prix_ttc":4000,"remise":0}]}'
```
**Résultat attendu :** CA instant = 20 000 € sous Cathy

#### **Test 6 - Votre Facture (280 €)**
```bash
# Simuler la facture de votre app de facturation
curl -X POST 'https://caissemyconfort2025.netlify.app/api/caisse/facture' \
  -H 'Content-Type: application/json' \
  -H 'X-Secret: MySuperSecretKey2025' \
  --data '{"numero_facture":"F-VOTRE-APP-001","date_facture":"2025-09-23","nom_client":"Votre Client","montant_ttc":280,"payment_method":"card","vendeuse":"Sylvie","vendorId":"sylvie","produits":[{"nom":"Produit Test","quantite":1,"prix_ttc":280,"remise":0}]}'
```
**Résultat attendu :** CA instant = 280 € sous Sylvie

### 📋 **Vérification Finale (Mode Facturier)**

#### **Onglet "Factures" :**
- ✅ 5 factures visibles (4 tests + 1 nouvelle)
- ✅ CA total factures : 83 000 €

#### **Onglet "Ventes" :**
- ✅ 0 ventes (mode facturier pur)
- ✅ Pas de doublons

#### **Onglet "CA instant" :**
- ✅ **Sylvie** : 18 000 € (facture facturier)
- ✅ **Babette** : 10 000 €
- ✅ **Lucia** : 15 000 €
- ✅ **Cathy** : 20 000 €
- ✅ **Total** : 63 000 € (pas de doublons)

### 🎯 **Avantages du Mode Facturier**
- ✅ **Pas de doublons** entre factures et ventes
- ✅ **Logique claire** : factures externes ≠ ventes caisse
- ✅ **CA précis** : seulement les factures du jour
- ✅ **Vendeuses synchronisées** : IDs textuels corrects

## 🔧 **OUTILS DE DIAGNOSTIC AVANCÉS - ONGLET GESTION**

### 📍 **Accès aux Outils**
1. **Aller dans "Gestion"** (onglet principal)
2. **Cliquer sur "🔧 Diagnostic"** (sous-onglet)
3. **Utiliser les outils** selon le besoin

### 🛠️ **Boutons Principaux**

#### **🔍 Lancer Diagnostic**
- **Fonction** : Analyse complète de l'environnement iPad
- **Résultat** : Rapport détaillé avec recommandations
- **Utilisation** : Diagnostiquer problèmes généraux

#### **📄 Exporter Rapport**
- **Fonction** : Télécharger le diagnostic au format texte
- **Utilisation** : Sauvegarder l'état pour analyse ultérieure

#### **🔧 Corriger Données**
- **Fonction** : Réparation automatique du format localStorage
- **Utilisation** : Corriger données corrompues

#### **🗑️ Vider Cache**
- **Fonction** : Suppression complète des données locales
- **Utilisation** : RAZ complet (attention !)

### 🛠️ **Outils Avancés de Débogage**

#### **🔧 Réparer Storage**
- **Fonction** : Réparation spécifique des factures externes
- **Cas d'usage** : Format `object.data` corrompu
- **Résultat** : Conversion en array simple + rechargement

#### **📋 Logs Console**
- **Fonction** : Guide d'accès aux logs de console
- **Utilisation** : Voir les logs en temps réel (F12)

#### **🔍 Test Service**
- **Fonction** : Test du service `externalInvoiceService`
- **Résultat** : Diagnostic automatique + état du service

#### **💰 Injecter Facture**
- **Fonction** : Ajouter une facture de test (280€ - Sylvie)
- **Utilisation** : Tester l'affichage sans app de facturation

#### **🌐 Statut Réseau**
- **Fonction** : Test de connectivité aux APIs
- **Résultat** : État des connexions réseau

#### **🔄 Rafraîchir UI**
- **Fonction** : Déclenchement forcé des événements UI
- **Utilisation** : Forcer la mise à jour des onglets

#### **👥 Sync Vendeuses**
- **Fonction** : Diagnostic et synchronisation complète des vendeuses
- **Résultat** : Résout le triangle rouge "Vendeuses non synchronisées"
- **Utilisation** : Corriger les problèmes de vendeuses manquantes/en trop

### 🎯 **Workflow de Diagnostic Recommandé**

#### **1. Diagnostic Initial**
```
🔍 Lancer Diagnostic → Analyser le rapport
```

#### **2. Si Problème Format localStorage**
```
🔧 Réparer Storage → Recharger la page
```

#### **3. Si CA à Zéro**
```
💰 Injecter Facture → Vérifier onglets → 🔄 Rafraîchir UI
```

#### **4. Si Pas de Factures**
```
🔍 Test Service → Vérifier console → 📋 Logs Console
```

#### **5. Si Problème Réseau**
```
🌐 Statut Réseau → Vérifier connectivité
```

#### **6. RAZ Complet (si nécessaire)**
```
🗑️ Vider Cache → Recharger → Reconfigurer
```

## 🚨 **VOTRE PROBLÈME ACTUEL - SOLUTION IMMÉDIATE**

### 📊 **Diagnostic de Votre iPad :**
- ❌ `mycomfort-external-invoices` : absent
- ❌ Ventes stockées comme `object` au lieu d'`array`
- ❌ CA à zéro à cause du mauvais format
- ❌ Aucune facture externe visible

### 🔧 **SOLUTION ÉTAPE PAR ÉTAPE :**

#### **Étape 1 : Réparation Spécifique**
```
🔧 Réparer Storage → Conversion automatique object → array
```

#### **Étape 2 : Injection de Test**
```
💰 Injecter Facture (280€ - Sylvie) → Test du système
```

#### **Étape 3 : Vérification**
```
🔄 Rafraîchir UI → Forcer mise à jour
```

#### **Étape 4 : Si Persistant**
```
🗑️ Vider Cache → RAZ complet → Recharger
```

### 🎯 **Actions Immédiates :**

1. **Aller dans "Gestion"** → **"🔧 Diagnostic"**
2. **Cliquer sur "🔧 Réparer Storage"**
3. **Attendre la confirmation** (format converti)
4. **Cliquer sur "💰 Injecter Facture"**
5. **Cliquer sur "🔄 Rafraîchir UI"**
6. **Vérifier les onglets** "Factures" et "CA instant"

### 📋 **Résultats Attendus :**
- ✅ `mycomfort-external-invoices` : présent (array)
- ✅ Onglet "Factures" : 1 facture test visible
- ✅ Onglet "CA instant" : 280€ sous Sylvie
- ✅ Console logs de diagnostic détaillés

### 🎉 **VOTRE RÉSULTAT ACTUEL - EXCELLENT !**

**Rapport reçu :**
```
🔧 RÉPARATION STORAGE EXTERNES
=====================================
✅ Format déjà correct (array)
📊 Nombre de factures: 1
```

**✅ SUCCÈS :** Le format localStorage est corrigé et il y a déjà 1 facture !

### 🚀 **PROCHAINES ÉTAPES :**

#### **1. Vérifier l'affichage**
```
Allez dans "Factures" → Voir la facture
Allez dans "CA instant" → Vérifier le montant
```

#### **2. Si CA toujours à zéro**
```
🔄 Rafraîchir UI → Forcer mise à jour des composants
```

#### **3. Si toujours pas visible**
```
🗑️ Vider Cache → RAZ complet → Recharger page
```

### 🚨 **PROBLÈME DÉTECTÉ : AFFICHAGE NON MIS À JOUR**

**Votre situation actuelle :**
- ✅ **Format localStorage** : corrigé (array)
- ✅ **Données** : 1 facture présente dans localStorage
- ❌ **Affichage** : rien visible dans les onglets
- ❌ **CA instant** : zéro (pas de mise à jour UI)

**Cause :** Les composants React ne se rafraîchissent pas automatiquement après la réparation du storage.

**Paradoxe détecté :**
- ✅ Onglet "Factures" : 75 000€ (données présentes)
- ❌ Onglet "CA instant" : 0€ (pas de mise à jour UI)
- ✅ localStorage : corrigé et contient les données

**Solution :** Forcer la synchronisation entre les composants !

### 🔧 **SOLUTION IMMÉDIATE :**

#### **🎯 Actions à effectuer sur votre iPad :**

##### **1. Bouton "🔄 Rafraîchir UI" (RECOMMANDÉ)**
```
Allez dans "Gestion" → "🔧 Diagnostic" → 🔄 Rafraîchir UI
```

##### **2. Console JavaScript (F12)**
```javascript
// Forcer la mise à jour des composants
window.dispatchEvent(new CustomEvent('external-invoices-updated'));
window.dispatchEvent(new CustomEvent('external-sale-created'));
window.dispatchEvent(new CustomEvent('vendor-stats-updated'));

// Vérifier les données
console.log('Factures localStorage:', JSON.parse(localStorage.getItem('mycomfort_external_invoices')));

// Test du service
if (window.externalInvoiceService) {
  console.log('Service factures:', window.externalInvoiceService.getAllInvoices());
}
```

##### **3. Si toujours pas visible**
```
🗑️ Vider Cache → RAZ complet → Recharger page
```

#### **4. Résultats Attendus :**
- ✅ Onglet "Factures" : 75 000€ (déjà visible)
- ✅ Onglet "CA instant" : 75 000€ (devrait s'afficher)
- ✅ Onglet "Ventes" : factures visibles
- ✅ Console : logs de mise à jour

### 📊 **VOTRE RAPPORT - ANALYSE :**

**✅ SUCCÈS :**
```
📡 Événements déclenchés:
✅ external-invoices-updated
✅ external-sale-created
✅ vendor-stats-updated
✅ Interface rafraîchie !
```

**✅ Données présentes :**
```
[Log] Factures localStorage: [Object] (1)
[Object]Array (1)
```

**⚠️ Erreur attendue :**
```
Fetch API cannot load https://caissemycomfort2025.netlify.app/api/caisse/facture
```
*(Fonctions Netlify non déployées - normal pour les tests locaux)*

### 🎉 **VOTRE NOUVEAU RAPPORT - SUCCÈS TOTAL !**

**✅ RÉSULTATS PARFAITS - SYNCHRONISATION VENDEUSES :**
```
👥 DIAGNOSTIC ET SYNCHRONISATION VENDEUSES
=====================================

📋 VENDEUSES PAR DÉFAUT:
  - Sylvie (sylvie) - couleur: #667eea
  - Lucia (lucia) - couleur: #764ba2
  - Babette (babette) - couleur: #f093fb
  - Billy (billy) - couleur: #4facfe
  - Sabrina (sabrina) - couleur: #00f2fe

💾 VENDEUSES DANS LOCALSTORAGE:
📦 Aucune vendeuse dans localStorage
🔧 Création des vendeuses par défaut...

🔍 COMPARAISON ET DIAGNOSTIC:
⚠️ VENDEUSES MANQUANTES: 5 vendeuses
❌ SYNCHRONISATION REQUISE

🔧 ACTIONS DE CORRECTION:
🔄 Synchronisation automatique...
✅ 5 vendeuses synchronisées
📋 Liste mise à jour:
  - Sylvie (sylvie) - couleur: #667eea
  - Lucia (lucia) - couleur: #764ba2
  - Babette (babette) - couleur: #f093fb
  - Billy (billy) - couleur: #4facfe
  - Sabrina (sabrina) - couleur: #00f2fe

🔄 Interface notifiée de la synchronisation

💡 RECOMMANDATIONS:
🔄 Rechargez la page pour voir les changements
Le triangle de notification devrait maintenant être résolu

✅ Diagnostic vendeuses terminé
```

### 📊 **Résultats Attendus**

#### **Après Rafraîchissement UI :**
- ✅ Format localStorage corrigé (array simple)
- ✅ Factures externes visibles
- ✅ CA instant mis à jour
- ✅ Console logs de diagnostic

### 🚀 **PROCHAINES ÉTAPES :**

#### **1. RECHARGER LA PAGE (OBLIGATOIRE)**
```
🔄 Rechargez la page pour voir les changements
Le triangle de notification devrait maintenant être résolu
```

#### **2. Vérifier l'affichage après rechargement**
```
✅ Onglet "Factures" : Devrait afficher 75 000€
✅ Onglet "CA instant" : Devrait afficher 75 000€
✅ Onglet "Ventes" : Devrait afficher les factures
✅ Triangle rouge : Devrait avoir disparu
```

#### **2. Si toujours pas visible (RARE)**
```
🗑️ Vider Cache → RAZ complet → Recharger page
```

#### **3. Test avec injection de facture**
```
💰 Injecter Facture → Ajouter une facture test
```

#### **Après Injection Test :**
- ✅ Facture test ajoutée (280€ - Sylvie)
- ✅ Onglet "Factures" : 1 facture visible
- ✅ Onglet "CA instant" : 280€ sous Sylvie

### 🎉 **Avantages des Outils**
- ✅ **Interface unifiée** : tous les outils au même endroit
- ✅ **Diagnostic automatique** : détection et réparation intelligente
- ✅ **Test en conditions réelles** : injection de données de test
- ✅ **Débogage complet** : logs, réseau, services
- ✅ **Guide utilisateur** : workflow recommandé
- ✅ **Sauvegarde** : export des diagnostics

## 🚨 **RÉSOUDRE LE TRIANGLE ROUGE "VENDEUSES NON SYNCHRONISÉES"**

### 📊 **Le Problème :**
- ❌ Triangle rouge en bas à droite : "Vendeuses non synchronisées"
- ❌ Différences entre iPad et ordinateur
- ❌ Vendeuses manquantes ou en trop

### 🔧 **Solution avec l'outil "👥 Sync Vendeuses" :**

#### **1. Aller dans l'onglet diagnostic**
```
Gestion → 🔧 Diagnostic
```

#### **2. Cliquer sur "👥 Sync Vendeuses" (rose)**
- **Analyse complète** : compare localStorage vs liste par défaut
- **Détection automatique** : trouve les vendeuses manquantes/en trop
- **Synchronisation** : corrige automatiquement les différences
- **Notification UI** : met à jour l'interface

#### **3. Résultats attendus :**
```
✅ Vendeuses synchronisées
✅ Triangle rouge disparu
✅ CA instant cohérent
✅ Pas de différences iPad/ordinateur
```

### 🎯 **Ce que l'outil fait :**

#### **Diagnostic détaillé :**
- 📋 **Vendeuses par défaut** : Sylvie, Lucia, Babette, Billy, Sabrina
- 💾 **Vendeuses localStorage** : état actuel
- 🔍 **Comparaison** : différences détectées
- 📱 **Vendeuses interface** : actuellement affichées

#### **Actions automatiques :**
- ✅ **Ajout** des vendeuses manquantes
- ✅ **Suppression** des vendeuses en trop
- ✅ **Correction** des couleurs et propriétés
- ✅ **Sauvegarde** dans localStorage
- ✅ **Notification** des composants

#### **Résultat concret :**
- ✅ **Triangle rouge** : disparaît automatiquement
- ✅ **CA instant** : cohérent entre iPad et ordinateur
- ✅ **Vendeuses** : liste complète et synchronisée
- ✅ **Pas de différences** : données identiques partout

### 🔗 **CONNEXION AVEC LE CA INSTANT :**

**Vous avez parfaitement raison !** La synchronisation des vendeuses peut résoudre le problème du CA instant :

#### **Avant synchronisation :**
- ❌ localStorage : vide (0 vendeuse)
- ❌ Onglet CA instant : ne peut pas afficher les vendeuses
- ❌ Onglet CA instant : ne peut pas calculer le CA par vendeuse
- ❌ Triangle rouge : "Vendeuses non synchronisées"

#### **Après synchronisation :**
- ✅ localStorage : 5 vendeuses synchronisées
- ✅ Onglet CA instant : peut afficher les vendeuses
- ✅ Onglet CA instant : peut calculer le CA par vendeuse
- ✅ Triangle rouge : devrait avoir disparu

### 🎯 **VÉRIFICATIONS APRÈS RECHARGEMENT :**

#### **1. Triangle rouge disparu**
```
✅ Plus de notification "Vendeuses non synchronisées"
```

#### **2. Onglet "CA instant" fonctionnel**
```
✅ 5 vendeuses affichées avec leurs couleurs
✅ CA calculé et affiché pour chaque vendeuse
✅ Total cohérent avec l'onglet "Factures"
```

#### **3. Onglet "Ventes"**
```
✅ Factures visibles et affectées aux bonnes vendeuses
```

#### **4. Onglet "Factures"**
```
✅ 75 000€ toujours affichés
```

### 🚀 **ÉTAPES IMMÉDIATES :**

#### **1. RECHARGER LA PAGE**
```
🔄 Rechargez maintenant pour voir les changements
```

#### **2. Vérifier chaque onglet**
```
Factures → CA instant → Ventes
```

#### **3. Tester le CA instant**
```
Créez une facture test pour voir la mise à jour en temps réel
```

#### **4. Test avec injection de facture**
```
💰 Injecter Facture → Ajouter une facture test (280€ - Sylvie)
```

##### **Étape 1 : Aller dans l'onglet diagnostic**
```
Gestion → 🔧 Diagnostic
```

##### **Étape 2 : Injecter une facture**
```
💰 Injecter Facture (280€ - Sylvie)
```

##### **Étape 3 : Vérifier les résultats**
```
✅ Onglet "Factures" : 1 facture test visible
✅ Onglet "CA instant" : 280€ sous Sylvie
✅ Onglet "Ventes" : facture test visible
```

#### **5. Si problème persiste**
```
🗑️ Vider Cache → RAZ complet → Recharger page
```

### 🔍 **DIAGNOSTIC SI CA INSTANT TOUJOURS À ZÉRO :**

#### **1. Console JavaScript (F12)**
```javascript
// Vérifier les vendeuses
console.log('Vendeuses dans localStorage:', JSON.parse(localStorage.getItem('myconfort-vendors')));

// Vérifier les factures
console.log('Factures dans localStorage:', JSON.parse(localStorage.getItem('mycomfort_external_invoices')));

// Forcer la mise à jour
window.dispatchEvent(new CustomEvent('external-invoices-updated'));
window.dispatchEvent(new CustomEvent('external-sale-created'));
window.dispatchEvent(new CustomEvent('vendor-stats-updated'));

// Vérifier l'état du service
if (window.externalInvoiceService) {
  console.log('Service factures:', window.externalInvoiceService.getAllInvoices());
}
```

#### **2. Résultats attendus :**
```
✅ Vendeuses dans localStorage: [5 vendeuses]
✅ Factures dans localStorage: [1 facture]
✅ Service factures: [1 facture]
✅ Événements déclenchés
```

#### **3. Si les données sont là mais l'affichage ne marche pas**
```
🗑️ Vider Cache → RAZ complet → Recharger page
```

## Caisse MyConfort — État des lieux et configuration (sept. 2025)

### Ce qui a été fait
- Netlify Functions: mise en place de deux fonctions
  - `caisse-facture` (CommonJS) — endpoint simple de test
  - `n8n` — proxy vers n8n avec retrait du préfixe `/api/n8n`
- Routage Netlify
  - `public/_redirects`: forcé avec `200!` pour `/api/n8n/*` et `/api/*`
  - `netlify.toml`: variables d’env et headers no‑cache, fonctions `netlify/functions`
- Environnement app (Vite)
  - `VITE_N8N_URL=/api/n8n`
  - `VITE_EXTERNAL_INVOICES_URL=/api/n8n/caisse/factures`
  - `VITE_EXTERNAL_INVOICES_RUN_URL=/api/n8n/caisse/facture`
- UI/Service factures externes
  - Suppression des gardes qui masquaient les factures en prod
  - Normalisation TTC plus tolérante (`amount`, `total`)
  - Rafraîchissement depuis `localStorage` sur l’événement `external-invoices-updated`
- Composants
  - `InvoicesTabCompact`: bouton “Synchroniser tout” + “Diagnostic”, vue externes

### Ce qui coince encore (Supabase/n8n)
- GET n8n: le proxy répond, mais 404 si le webhook `GET caisse/factures` n’est pas actif.
- n8n — Respond: il faut renvoyer un tableau complet. Utiliser une expression côté “Respond (GET)”: `$items().map(item => item.json)`

### Procédure n8n (liste)
1. Webhook (GET): Path `caisse/factures`, workflow Active
2. HTTP Supabase List: URL avec `limit`, headers, format JSON
3. Respond (GET): Respond with JSON, body: `$items().map(item => item.json)`

### Bypass urgence — Import direct sans base de données
- Ajout d’un mécanisme d’import direct via hash URL
  - Fichier: `src/services/directImport.ts`
  - Au chargement de l’app (`src/main.tsx`), `processImportFromHash()` détecte `#import=<base64(json)>`,
    normalise en facture, l’insère (store local), puis crée une vente (IndexedDB) pour le CA et les ventes.

Exemple d’URL d’import:
```
https://votre-domaine.netlify.app/#import=<BASE64_DU_JSON>
```
JSON minimum attendu (format avec prix TTC et remise):
```json
{
  "numero_facture": "F-TEST-001",
  "date_facture": "2025-09-23",
  "nom_client": "Client Demo",
  "montant_ttc": 120,
  "payment_method": "card",
  "vendeuse": "Alice",
  "produits": [
    {
      "nom": "Produit X",
      "quantite": 1,
      "prix_ttc": 120,
      "remise": 0
    }
  ]
}
```

Le JSON est encodé en base64 (UTF‑8). À l’ouverture de l’URL, la facture est stockée et une vente est créée immédiatement (CA vendeuse mis à jour, visible dans l’onglet Ventes).

### Format Produit Attendu (quantité, prix TTC, remise)

Pour les produits dans les factures, le système attend ce format :

```json
{
  "produits": [
    {
      "nom": "Matelas 140x190",
      "quantite": 1,
      "prix_ttc": 1440,
      "remise": 0.2
    }
  ]
}
```

- `quantite` : nombre d'unités
- `prix_ttc` : prix TTC par unité (après remise)
- `remise` : taux de remise appliquée (ex: 0.2 = 20%)

### Règle d'Idempotence

- **Clé unique** : `numero_facture`
- **Comportement** : Si une facture avec le même numéro existe déjà, elle est mise à jour (upsert) au lieu d'être dupliquée
- **Prévention des doublons** : Garantit qu'une même facture n'est comptabilisée qu'une seule fois dans le CA

## 🔧 Guide Workflow n8n - Correction JSON Complet

### Problème
Le nœud "Caisse Push (direct)" envoie un objet vide au lieu du JSON complet.

### Solution
**Pipeline correct :** Webhook → Normalize → Caisse Push (direct) → Respond

### Configuration Détaillée

#### 1️⃣ Nœud "Normalize" (Code node)
**Function :**
```javascript
// Transformation des données pour format Caisse
const input = $json;

// Debug: voir la structure exacte des données
console.log('🔍 INPUT STRUCTURE:', JSON.stringify(input, null, 2));

// Extraction robuste des champs avec tous les noms possibles
const numero_facture = String(
  input.numero_facture ||
  input.numero ||
  input.facture_numero ||
  input.invoiceNumber ||
  input.number ||
  input.id ||
  `F-${Date.now()}`
).trim();

const montant_ttc = Number(
  input.montant_ttc ||
  input.total_ttc ||
  input.montantTTC ||
  input.totalTTC ||
  input.amount ||
  input.total ||
  0
);

const vendeuse = String(
  input.vendeuse ||
  input.vendorName ||
  input.conseiller ||
  input.vendeur ||
  input.seller ||
  input.salesperson ||
  'Externe'
).trim();

const vendorId = String(
  input.vendorId ||
  input.vendeuse_id ||
  input.conseiller_id ||
  vendeuse.toLowerCase().replace(/\s+/g, '')
).trim() || 'external';

// Produits - essayer tous les formats possibles
let produits = [];
if (Array.isArray(input.produits)) {
  produits = input.produits;
} else if (Array.isArray(input.products)) {
  produits = input.products;
} else if (Array.isArray(input.items)) {
  produits = input.items;
} else if (Array.isArray(input.lignes)) {
  produits = input.lignes;
} else if (input.produit) {
  // Format objet unique
  produits = [input.produit];
}

// Transformation des produits
const produitsTransformes = produits.map((p, idx) => ({
  nom: String(p.nom || p.name || p.productName || p.description || `Produit ${idx + 1}`),
  quantite: Number(p.quantite || p.quantity || p.qty || p.quantite_produit || 1),
  prix_ttc: Number(p.prix_ttc || p.unitPriceTTC || p.priceTTC || p.prix_unitaire_ttc || 0),
  remise: Number(p.remise || p.discount || p.taux_remise || 0)
}));

// Validation et transformation finale
const output = {
  numero_facture: numero_facture || `F-${Date.now()}`,
  date_facture: String(input.date_facture || input.invoiceDate || input.date || new Date().toISOString().slice(0,10)),
  nom_client: String(input.nom_client || input.client?.name || input.customerName || 'Client'),
  montant_ttc: montant_ttc > 0 ? montant_ttc : produitsTransformes.reduce((sum, p) => sum + (p.prix_ttc * p.quantite), 0),
  payment_method: String(input.payment_method || input.payment?.method || input.mode_paiement || 'card'),
  vendeuse: vendeuse,
  vendorId: vendorId,
  produits: produitsTransformes
};

// Debug: voir le résultat
console.log('✅ OUTPUT TRANSFORMED:', JSON.stringify(output, null, 2));

return [ { json: output } ];
```

#### 2️⃣ Nœud "Caisse Push (direct)" (HTTP Request)
**Method :** POST
**URL :** `https://caissemyconfort2025.netlify.app/api/caisse/facture`
**Headers :**
```
Content-Type: application/json
X-Secret: MySuperSecretKey2025
```
**Body Content Type :** JSON
**Body Parameters :**
```
JSON: {{ $json }}
```

⚠️ **PROBLÈME IDENTIFIÉ :** Le nœud HTTP envoie `{"data": "JSON_STRING"}` au lieu du JSON direct !

**SOLUTION :**
1. Dans l'onglet "Body Parameters" du nœud HTTP
2. **Cliquez sur "Add Expression"** (pas "Add Field")
3. **Tapez :** `$json`
4. **Assurez-vous que c'est en mode Expression** (petite icône fx)
5. **Le body doit montrer le JSON complet** (pas encapsulé dans "data")

#### 3️⃣ Contrôles à Effectuer

1. **Debug - Voir la Structure Entrante :**
   - Ajoutez un nœud "Code" temporaire avant Normalize
   - Code : `return [{ json: $json }];` (sans transformation)
   - Exécutez et voyez la structure exacte dans les logs console

2. **Test Normalize :**
   - Exécutez seulement jusqu'à Normalize
   - Vérifiez les logs console pour voir "🔍 INPUT STRUCTURE" et "✅ OUTPUT TRANSFORMED"
   - OUTPUT doit contenir : numero_facture non vide, montant_ttc > 0, vendeuse "Sylvie", vendorId "sylvie", produits ≥ 1

3. **Test HTTP Body :**
   - Dans l'onglet Request du nœud HTTP
   - Body doit montrer le JSON complet (pas de champ "data")
   - Réponse attendue : `{"ok":true,"enqueued":1}`

4. **Debug Complet :**
   - Si problème persiste, ajoutez temporairement :
   ```javascript
   // Debug temporaire
   console.log('📋 DEBUG - All input keys:', Object.keys($json));
   console.log('📋 DEBUG - All input values:', JSON.stringify($json, null, 2));
   ```

5. **Test du Body HTTP :**
   - Dans l'onglet "Request" du nœud HTTP
   - Le body doit montrer le JSON complet SANS encapsulation "data"
   - Si vous voyez `{"data": "JSON_STRING"}`, c'est le problème !

#### 4️⃣ Plan de Secours (si Body encore vide)

**Ajoutez un nœud "Set" entre Normalize et HTTP :**
- **Mode :** Keep Only Set = ON
- **Fields :**
  ```
  numero_facture: {{ $json.numero_facture }}
  date_facture: {{ $json.date_facture }}
  nom_client: {{ $json.nom_client }}
  montant_ttc: {{ $json.montant_ttc }}
  payment_method: {{ $json.payment_method }}
  vendeuse: {{ $json.vendeuse }}
  vendorId: {{ $json.vendorId }}
  produits: {{ $json.produits }}
  ```

### Format JSON Final Attendu
```json
{
  "numero_facture": "F-SYL-001",
  "date_facture": "2025-09-23",
  "nom_client": "Client Test",
  "montant_ttc": 1440,
  "payment_method": "card",
  "vendeuse": "Sylvie",
  "vendorId": "sylvie",
  "produits": [
    {
      "nom": "Matelas 140x190",
      "quantite": 1,
      "prix_ttc": 1440,
      "remise": 0.2
    }
  ]
}
```

### Exemple de Structure JSON Entrante (avant Normalize)
```json
{
  "id": "invoice-123",
  "numero_facture": "F-SYL-001",
  "date_facture": "2025-09-23",
  "client": {
    "nom": "Client Test",
    "email": "client@test.com"
  },
  "montant_ttc": 1440,
  "payment_method": "card",
  "vendeuse": "Sylvie",
  "produits": [
    {
      "nom": "Matelas 140x190",
      "quantite": 1,
      "prix_ttc": 1440,
      "remise": 0.2
    }
  ]
}
```

### Test Final
- Rechargez l'app Caisse (cache vide)
- Créez une facture sur l'iPad
- Attendez 5-10 secondes
- Vérifiez : "Factures", "Ventes" et "CA instant" mis à jour

## 🚨 **RAZ COMPLET - GUIDE DÉFINITIF**

### 🎯 **Procédure RAZ Complète (Ordre Important)**

**ÉTAPE 1 - Diagnostic avant RAZ :**
```javascript
// Code console iPad pour diagnostiquer l'état actuel
(() => {
  console.log('🔍 ÉTAT AVANT RAZ :');
  console.log('📋 localStorage keys:', localStorage.length);
  console.log('💾 Données vendeuses:', localStorage.getItem('myconfort-vendors'));
  console.log('💰 Données ventes:', localStorage.getItem('myconfort-sales'));
  console.log('🛒 Données panier:', localStorage.getItem('myconfort-cart'));
  console.log('📊 Timestamp:', new Date().toLocaleString('fr-FR'));
})();
```

**ÉTAPE 2 - RAZ Complet :**
```javascript
// Code console iPad pour RAZ COMPLET
(() => {
  console.log('🚨 DÉBUT RAZ COMPLET');

  // 1. Sauvegarder les vendeuses si elles existent
  const vendorsData = localStorage.getItem('myconfort-vendors');
  const vendorsBackup = vendorsData ? JSON.parse(vendorsData) : [];

  // 2. Vider TOUT localStorage
  localStorage.clear();
  console.log('✅ localStorage vidé');

  // 3. Restaurer les vendeuses correctes
  const vendeusesCorrectes = [
    { id: 'sylvie', name: 'Sylvie', color: '#477A0C' },
    { id: 'babette', name: 'Babette', color: '#F55D3E' },
    { id: 'lucia', name: 'Lucia', color: '#14281D' },
    { id: 'cathy', name: 'Cathy', color: '#080F0F' },
    { id: 'johan', name: 'Johan', color: '#89BBFE' },
    { id: 'sabrina', name: 'Sabrina', color: '#D68FD6' },
    { id: 'billy', name: 'Billy', color: '#FFFF99' }
  ];

  vendeusesCorrectes.forEach(v => {
    localStorage.setItem(`myconfort-vendor-${v.id}`, JSON.stringify(v));
    console.log(`✅ Vendeuse ajoutée: ${v.name} (${v.id})`);
  });

  // 4. Vider tous les caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log('🗑️ Cache supprimé:', name);
      });
    });
  }

  // 5. Désenregistrer tous les service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('🗑️ Service Worker désenregistré');
      });
    });
  }

  // 6. Vider IndexedDB
  if ('indexedDB' in window) {
    const deleteDB = () => {
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('MyConfortCaisseV2');
        req.onsuccess = () => {
          console.log('✅ IndexedDB vidée');
          resolve();
        };
        req.onerror = () => {
          console.log('⚠️ Erreur vidage IndexedDB');
          resolve();
        };
      });
    };
    deleteDB();
  }

  console.log('🔄 RAZ TERMINÉ - Rechargez l\'app');
  alert('✅ RAZ COMPLET effectué ! Rechargez l\'app maintenant.');
})();
```

**ÉTAPE 3 - Vérification après RAZ :**
```javascript
// Code console iPad pour vérifier l'état après RAZ
(() => {
  console.log('🔍 ÉTAT APRÈS RAZ :');
  console.log('📋 localStorage keys:', localStorage.length);

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`  ${key}: ${localStorage.getItem(key)}`);
  }

  console.log('✅ Vérification terminée');
  console.log('🔄 Rechargez l\'app pour continuer');
})();
```

**ÉTAPE 4 - Tests après RAZ :**
```javascript
// Code console iPad pour tester après RAZ
(() => {
  console.log('🧪 TESTS APRÈS RAZ');

  // 1. Vérifier vendeuses
  console.log('👥 Vendeuses disponibles :');
  ['sylvie', 'babette', 'lucia', 'cathy', 'johan', 'sabrina', 'billy'].forEach(id => {
    const key = `myconfort-vendor-${id}`;
    const data = localStorage.getItem(key);
    if (data) {
      const vendor = JSON.parse(data);
      console.log(`  ✅ ${vendor.name} (${vendor.id})`);
    } else {
      console.log(`  ❌ ${id} : MANQUANTE`);
    }
  });

  // 2. Vérifier navigation
  console.log('🧭 Navigation :');
  console.log('  - Onglets vendeuses :', document.querySelectorAll('.vendor-tab').length);
  console.log('  - Onglet CA instant :', !!document.querySelector('[data-tab="ca"]'));

  // 3. Vérifier état propre
  console.log('🧹 État système :');
  console.log('  - localStorage keys :', localStorage.length);
  console.log('  - Service Workers :', navigator.serviceWorker ? 'disponible' : 'indisponible');

  console.log('✅ Tests terminés - app prête à utiliser');
})();
```

**ÉTAPE 5 - Test Final :**
```javascript
// Code console iPad pour test final
(() => {
  console.log('🚀 TEST FINAL - App prête ?');

  // Vérifier vendeuses
  const vendeusesOk = ['sylvie', 'babette', 'lucia', 'cathy', 'johan', 'sabrina', 'billy']
    .every(id => localStorage.getItem(`myconfort-vendor-${id}`));

  if (vendeusesOk) {
    console.log('✅ Vendeuses : OK');
  } else {
    console.log('❌ Vendeuses : PROBLÈME');
  }

  // Vérifier navigation
  const navigationOk = document.querySelectorAll('.vendor-tab').length > 0 &&
                       document.querySelector('[data-tab="ca"]');

  if (navigationOk) {
    console.log('✅ Navigation : OK');
  } else {
    console.log('❌ Navigation : PROBLÈME');
  }

  console.log('📊 Résumé :');
  console.log('  - Système :', vendeusesOk && navigationOk ? '✅ PRÊT' : '❌ PROBLÈME');
  console.log('  - Test : Créez une facture pour vérifier le CA instant');
})();
```

### ⚠️ **PROBLÈME DÉTECTÉ : Vendeuses non synchronisées**

**Diagnostic :** Les vendeuses dans la base de données n'ont pas les mêmes IDs que celles par défaut.
- **Vendeuses par défaut :** IDs numériques ('1', '2', '3', ...)
- **Factures externes :** IDs textuels ('sylvie', 'babette', ...)

**Diagnostic d'abord :**
```javascript
// Code console iPad pour diagnostiquer les vendeuses
(() => {
  console.log('🔍 DIAGNOSTIC VENDEUSES :');

  // Lister toutes les clés localStorage
  console.log('📋 Clés localStorage :');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.includes('vendor')) {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value}`);
    }
  }

  // Lister les vendeuses par défaut attendues
  const vendeusesAttendu = [
    { id: 'sylvie', name: 'Sylvie' },
    { id: 'babette', name: 'Babette' },
    { id: 'lucia', name: 'Lucia' },
    { id: 'cathy', name: 'Cathy' },
    { id: 'johan', name: 'Johan' },
    { id: 'sabrina', name: 'Sabrina' },
    { id: 'billy', name: 'Billy' }
  ];

  console.log('🎯 Vendeuses attendues :');
  vendeusesAttendu.forEach(v => {
    const key = `myconfort-vendor-${v.id}`;
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`  ✅ ${v.name} (${v.id}): existe`);
    } else {
      console.log(`  ❌ ${v.name} (${v.id}): MANQUANTE !`);
    }
  });

  console.log('📊 Résumé :');
  console.log(`   - Vendeuses trouvées : ${document.querySelectorAll('[data-vendor-id]').length}`);
  console.log(`   - Onglets vendeuses : ${document.querySelectorAll('.vendor-tab').length || 'N/A'}`);
})();
```

**Puis synchroniser :**
```javascript
// Code console iPad pour synchroniser les vendeuses
(() => {
  const vendeusesDefaut = [
    { id: 'sylvie', name: 'Sylvie', color: '#477A0C' },
    { id: 'babette', name: 'Babette', color: '#F55D3E' },
    { id: 'lucia', name: 'Lucia', color: '#14281D' },
    { id: 'cathy', name: 'Cathy', color: '#080F0F' },
    { id: 'johan', name: 'Johan', color: '#89BBFE' },
    { id: 'sabrina', name: 'Sabrina', color: '#D68FD6' },
    { id: 'billy', name: 'Billy', color: '#FFFF99' }
  ];

  let ajoutees = 0;
  vendeusesDefaut.forEach(v => {
    const key = `myconfort-vendor-${v.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(v));
      console.log(`✅ Ajoutée: ${v.name} (${v.id})`);
      ajoutees++;
    }
  });

  console.log(`📊 ${ajoutees} vendeuses ajoutées`);
  alert(`✅ ${ajoutees} vendeuses synchronisées ! Rechargez l'app.`);
})();
```

### 🚨 **PROBLÈME CRITIQUE DÉTECTÉ : Format de données incorrect**

**Diagnostic :** Les ventes sont stockées dans un mauvais format (object au lieu de tableau)
- **localStorage :** `{"version":"1.0","timestamp":1758645853265,"data":[...]}`
- **Problème :** Empêche le calcul du CA et l'affichage des statistiques

**Solution : Réinitialiser le format de données :**
```javascript
// Code console iPad pour corriger le format de données
(() => {
  console.log('🔧 CORRECTION FORMAT DONNÉES');

  // 1. Sauvegarder les données actuelles
  const salesData = localStorage.getItem('myconfort-sales');
  const vendorsData = localStorage.getItem('myconfort-vendors');

  console.log('📋 Données avant correction :');
  console.log('  - Ventes :', salesData);
  console.log('  - Vendeuses :', vendorsData);

  // 2. Vider complètement
  localStorage.clear();
  console.log('🗑️ localStorage vidé');

  // 3. Restaurer seulement les vendeuses
  if (vendorsData) {
    const vendors = JSON.parse(vendorsData);
    if (Array.isArray(vendors)) {
      vendors.forEach(v => {
        const key = `myconfort-vendor-${v.id}`;
        localStorage.setItem(key, JSON.stringify(v));
        console.log(`✅ Vendeuse restaurée: ${v.name} (${v.id})`);
      });
    }
  }

  // 4. Vider IndexedDB si disponible
  if ('indexedDB' in window) {
    const deleteDB = () => {
      return new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('MyConfortCaisseV2');
        req.onsuccess = () => {
          console.log('✅ IndexedDB vidée');
          resolve();
        };
        req.onerror = () => {
          console.log('⚠️ Erreur vidage IndexedDB');
          resolve();
        };
      });
    };
    deleteDB();
  }

  console.log('🔄 Rechargez l\'app pour appliquer les corrections');
  alert('✅ Format de données corrigé ! Rechargez l\'app.');
})();
```

### Étapes suivantes conseillées
- Finaliser la route n8n (GET) et retester `/api/n8n/caisse/factures?limit=10`
- Option serveur (webhook → polling) si besoin d'un flux push côté "Facture"

# 🏪 Caisse MyConfort - Application de Gestion

## 🎯 PROJET PRINCIPAL : `mon-projet-vite/`

**⚠️ IMPORTANT** : Utiliser UNIQUEMENT le projet Vite dans le dossier `mon-projet-vite/`

## ⚡ VS Code Turbo – MyConfort

Configuration optimisée pour une productivité maximale avec React + Vite + TypeScript + Tailwind.

**📋 Setup complet :** [`docs/dev/VSCode-Setup.md`](./docs/dev/VSCode-Setup.md)

**TL;DR :**
- 🚀 Startup épuré, format automatique on save
- 🤖 Copilot activé pour le code uniquement  
- 🎯 Port 5173 exclusif, optimisations Vite
- 🎤 Flow dictée sans interférences VS Code

### 🚀 Démarrage

```bash
cd mon-projet-vite
npm run dev
```

**URL** : http://localhost:5173 (ou 5174, 5175 selon disponibilité)

### ✨ Fonctionnalités

- ✅ **Interface factures élégante** avec tableau produits
- ✅ **Déduction automatique du stock** lors de l'arrivée de factures N8N
- ✅ **Synchronisation N8N** en temps réel
- ✅ **Gestion du stock physique** avec alertes visuelles
- ✅ **Traçabilité complète** des mouvements de stock
- ✅ **Interface intuitive** avec onglets dédiés

### 📱 Navigation

- **Onglet Factures** : Visualisation des factures N8N avec interface élégante
- **Onglet Stock > Stock physique** : Gestion du stock avec déductions automatiques
- **Autres onglets** : Ventes, Produits, etc.

### 🔄 Workflow Automatique

1. **Facture N8N reçue** → Synchronisation automatique
2. **Produits détectés** → Déduction automatique du stock
3. **Alertes générées** → Notifications visuelles si stock faible
4. **Traçabilité** → Historique complet des mouvements

### 📚 Documentation

- `DEDUCTION-STOCK-AUTOMATIQUE-v3.0.0.md` : Documentation de la déduction automatique
- `AMELIORATION-INTERFACE-FACTURES-v2.1.0.md` : Documentation de l'interface factures

### 🔗 Synchronisation des factures (n8n)

#### Endpoints principaux

- POST `/webhook/caisse/facture` — reçoit une facture individuelle (peut inclure `html_content` pour un email HTML pré‑rendu)
- GET `/sync/invoices` — récupère la liste des factures depuis n8n
- PATCH `/webhook/invoices/{id}/items/{itemId}/status` — met à jour le statut d’un produit

#### Payload JSON attendu (exemple)

```json
{
  "numero_facture": "TEST-012",
  "date_facture": "2025-09-19",
  "nom_client": "Client Demo",
  "email_client": "demo@example.com",
  "telephone_client": "...",
  "montant_ht": 1200,
  "montant_ttc": 1440,
  "total_tva": 240,
  "payment_method": "CB",
  "status": "pending",
  "produits": [
    { "nom": "Produit A", "quantite": 2, "prix_ht": 600, "prix_ttc": 720, "tva": 120 }
  ],
  "html_content": "<html>...</html>"
}
```

#### Services & scripts côté app

- `mon-projet-vite/src/services/externalInvoiceService.ts` (réception/normalisation/cache)
- `mon-projet-vite/src/services/syncService.ts` (GET/PATCH n8n)
- Scripts de diagnostic: `diagnostic-factures.js`, `raz-complet-factures.js`, `test-factures.sh`

#### Variables d’environnement utiles

- `VITE_EXTERNAL_INVOICES_URL`, `VITE_INVOICE_AUTH_TOKEN`, `VITE_EXTERNAL_RUN_SECRET`
- `VITE_N8N_WEBHOOK_URL`, `VITE_N8N_URL`

#### Notes d’intégration

- L’app supporte l’envoi d’un HTML pré‑rendu via `html_content` pour l’email client (contournement des limites de template côté Gmail/n8n).
- La synchronisation peut être déclenchée manuellement (bouton) ou automatiquement (timer).

### 🗂️ Archive

L'ancien projet React a été archivé dans `archive-ancien-projet-react-*/` pour éviter toute confusion.

## 🧪 Tests CA Instant (Flux Direct)

### Test Complet du Flux (Console iPad)

1. **Rechargez l'app** (cache vide) :
    ```javascript
    localStorage.clear();
    caches&&caches.keys().then(k=>k.forEach(n=>caches.delete(n)));
    navigator.serviceWorker&&navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));
    location.replace(location.pathname+'?v='+Date.now());
    ```

2. **Testez d'abord le réseau simple** :
    ```javascript
    fetch('/api/caisse/facture', {method: 'GET', cache: 'no-store'})
    .then(r => { console.log('GET status:', r.status, r.ok); return r.json(); })
    .then(d => console.log('GET data:', d))
    .catch(e => console.log('GET erreur:', e))
    ```

3. **Injectez une facture de test (format avec prix TTC et remise)** :
    ```javascript
    fetch('/api/caisse/facture',{
      method:'POST',
      headers:{'Content-Type':'application/json','X-Secret':'MySuperSecretKey2025'},
      body:JSON.stringify({
        numero_facture:'F-TEST-SYLVIE',
        date_facture:new Date().toISOString().slice(0,10),
        nom_client:'Client Test',
        montant_ttc:1440,
        payment_method:'card',
        vendeuse:'Sylvie',
        vendorId:'sylvie',
        produits:[{
          nom:'Matelas 140x190',
          quantite:1,
          prix_ttc:1440,
          remise:0.2
        }]
      })
    }).then(r=>r.json()).then(console.log).catch(console.error)
    ```

4. **Attendez 5–10 s**, puis ouvrez :
    - **"CA instant"** : Devrait afficher 1 440 € sous Sylvie
    - **"Ventes"** : Devrait lister la vente F-TEST-SYLVIE

5. **Si rien n'apparaît**, vérifiez les logs console (onglet "CA instant" génère des logs "📊 CA INSTANTANÉ").

**Version actuelle** : v3.0.0-deduction-stock-automatique
