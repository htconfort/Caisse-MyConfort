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

// Validation et transformation
const output = {
  numero_facture: String(input.numero_facture || input.id || ''),
  date_facture: String(input.date_facture || input.invoiceDate || new Date().toISOString().slice(0,10)),
  nom_client: input.nom_client || input.client?.name || 'Client',
  montant_ttc: Number(input.montant_ttc || input.totalTTC || input.amount || 0),
  payment_method: input.payment_method || input.payment?.method || 'card',
  vendeuse: input.vendeuse || input.vendorName || 'Externe',
  vendorId: input.vendorId || 'external',
  produits: Array.isArray(input.produits) ? input.produits.map(p => ({
    nom: p.nom || p.name || 'Produit',
    quantite: Number(p.quantite || p.quantity || p.qty || 1),
    prix_ttc: Number(p.prix_ttc || p.unitPriceTTC || p.priceTTC || 0),
    remise: Number(p.remise || p.discount || 0)
  })) : []
};

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

⚠️ **IMPORTANT :** Utilisez `{{ $json }}` et PAS `{{ $json.body }}` ou `{{ $json.data }}`

#### 3️⃣ Contrôles à Effectuer

1. **Test Normalize :**
   - Executez seulement jusqu'à Normalize
   - OUTPUT doit contenir : numero_facture non vide, montant_ttc > 0, vendeuse "Sylvie", vendorId "sylvie", produits ≥ 1

2. **Test HTTP Body :**
   - Dans l'onglet Request du nœud HTTP
   - Body doit montrer le JSON complet (pas de champ "data")
   - Réponse attendue : `{"ok":true,"enqueued":1}`

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

### Test Final
- Rechargez l'app Caisse (cache vide)
- Créez une facture sur l'iPad
- Attendez 5-10 secondes
- Vérifiez : "Factures", "Ventes" et "CA instant" mis à jour

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
